import express, { Response } from "express";
import { authenticateUser, AuthenticatedRequest } from "../middleware/auth";
import { db } from "../config/firebase";
import { Expense, CreateExpenseRequest, SettleExpenseRequest } from "../types";
import { v4 as uuidv4 } from 'uuid';
import { ExpenseCreateSchema, ExpenseSettleSchema, validateRequest } from '../utils/validation';
import { logAPI, logBusiness, logDatabase } from '../utils/logger';

const router = express.Router();

/**
 * Create a Shared Expense
 * POST /expense/create
 * Creates a new expense and automatically calculates balances for all participants
 */
router.post(
  "/create",
  authenticateUser,
  validateRequest(ExpenseCreateSchema),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const { amount, description, split_between }: CreateExpenseRequest = req.body;
      // Validation is now handled by middleware, so we can trust the data

      // Get user's house
      const userDoc = await db.collection("users").doc(user.uid).get();
      if (!userDoc.exists) {
        res.status(404).json({
          error: "Not Found",
          message: "User not found",
        });
        return;
      }

      const userData = userDoc.data();
      const house_id = userData?.house_id;

      if (!house_id) {
        res.status(400).json({
          error: "Bad Request",
          message: "User must be in a house to create expenses",
        });
        return;
      }

      // Calculate amount per person
      const amountPerPerson = amount / split_between.length;

      // Create expense document
      const expense: Expense = {
        expense_id: uuidv4(),
        amount: amount,
        description: description,
        paid_by: user.email!,
        house_id: house_id,
        split_between: split_between,
        amount_per_person: amountPerPerson,
        created_at: new Date(),
        settled: false
      };

      // Save expense to Firestore
      await db.collection("expenses").doc(expense.expense_id).set(expense);

      // Update balances for all participants
      const batch = db.batch();

      // First, update the payer's balance (they are owed money)
      const payerDoc = await db.collection("users").doc(user.uid).get();
      const payerData = payerDoc.data();
      const payerCurrentBalance = payerData?.balance || 0;
      
      // Calculate how much the payer should be owed
      let payerOwedAmount = 0;
      if (split_between.includes(user.email!)) {
        // Payer is included in split - they paid full amount but only owe their share
        payerOwedAmount = amount - amountPerPerson;
      } else {
        // Payer is NOT in split - they paid full amount and owe nothing
        payerOwedAmount = amount;
      }
      
      // Update payer's balance
      batch.update(payerDoc.ref, {
        balance: payerCurrentBalance + payerOwedAmount,
        last_updated: new Date()
      });

      // Then, update all participants who owe money
      for (const participantEmail of split_between) {
        if (participantEmail !== user.email) {
          // Other participants get negative balance (they owe money)
          const participantQuery = await db.collection("users").where("email", "==", participantEmail).limit(1).get();
          if (!participantQuery.empty) {
            const participantDoc = participantQuery.docs[0];
            const participantData = participantDoc.data();
            const currentBalance = participantData.balance || 0;
            
            batch.update(participantDoc.ref, {
              balance: currentBalance - amountPerPerson,
              last_updated: new Date()
            });
          }
        }
      }

      // Commit all balance updates
      await batch.commit();

      logBusiness.expenseCreated(description, amount, split_between.length);

      res.json({
        message: "Expense created successfully",
        data: {
          expense: expense,
          amount_per_person: amountPerPerson,
          total_participants: split_between.length
        }
      });

    } catch (error) {
      logAPI.error('POST', '/expense/create', error instanceof Error ? error.message : String(error));
      res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to create expense",
      });
    }
  }
);

/**
 * List House Expenses
 * GET /expense/list
 * Get all expenses for the user's house
 */
router.get(
  "/list",
  authenticateUser,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;

      // Get user's house
      const userDoc = await db.collection("users").doc(user.uid).get();
      if (!userDoc.exists) {
        res.status(404).json({
          error: "Not Found",
          message: "User not found",
        });
        return;
      }

      const userData = userDoc.data();
      const house_id = userData?.house_id;

      if (!house_id) {
        res.status(400).json({
          error: "Bad Request",
          message: "User must be in a house to view expenses",
        });
        return;
      }

      // Get all expenses for the house
      const expensesQuery = await db
        .collection("expenses")
        .where("house_id", "==", house_id)
        .get();

      const expenses = expensesQuery.docs
        .map(doc => doc.data())
        .sort((a, b) => {
          // Handle Firestore Timestamps properly - most recent first
          const aTime = a.created_at?.toDate ? a.created_at.toDate().getTime() : new Date(a.created_at).getTime();
          const bTime = b.created_at?.toDate ? b.created_at.toDate().getTime() : new Date(b.created_at).getTime();
          return bTime - aTime;
        });

      res.json({
        message: "Expenses retrieved successfully",
        data: {
          expenses: expenses,
          count: expenses.length
        }
      });

    } catch (error) {
      logAPI.error('GET', '/expense/list', error instanceof Error ? error.message : String(error));
      res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to fetch expenses",
      });
    }
  }
);

/**
 * Get House Member Balances
 * GET /expense/balances
 * Get all house member balances
 */
router.get(
  "/balances",
  authenticateUser,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;

      // Get user's house
      const userDoc = await db.collection("users").doc(user.uid).get();
      if (!userDoc.exists) {
        res.status(404).json({
          error: "Not Found",
          message: "User not found",
        });
        return;
      }

      const userData = userDoc.data();
      const house_id = userData?.house_id;

      if (!house_id) {
        res.status(400).json({
          error: "Bad Request",
          message: "User must be in a house to view balances",
        });
        return;
      }

      // Get house document to find all members
      const houseDoc = await db.collection("houses").doc(house_id).get();
      if (!houseDoc.exists) {
        res.status(404).json({
          error: "Not Found",
          message: "House not found",
        });
        return;
      }

      const houseData = houseDoc.data();
      const memberEmails = houseData?.members || [];
      logDatabase.query('houses', 'get_members', user.email);

      // Get balances for all house members
      const memberBalances = [];
      
      for (const memberEmail of memberEmails) {
        const memberQuery = await db.collection("users").where("email", "==", memberEmail).limit(1).get();
        if (!memberQuery.empty) {
          const memberData = memberQuery.docs[0].data();
          memberBalances.push({
            uid: memberData.uid,
            email: memberData.email,
            firstName: memberData.firstName || "Unknown",
            lastName: memberData.lastName || "",
            balance: memberData.balance || 0
          });
        }
      }

      res.json({
        message: "House balances retrieved successfully",
        data: {
          house_id: house_id,
          members: memberBalances
        }
      });

    } catch (error) {
      logAPI.error('GET', '/expense/balances', error instanceof Error ? error.message : String(error));
      res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to fetch house balances",
      });
    }
  }
);

/**
 * Settle Expense Payment
 * POST /expense/settle
 * Mark a payment between roommates (updates balances)
 */
router.post(
  "/settle",
  authenticateUser,
  validateRequest(ExpenseSettleSchema),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const { amount, to_email, description }: SettleExpenseRequest = req.body;
      // Validation is now handled by middleware, so we can trust the data

      if (to_email === user.email) {
        res.status(400).json({
          error: "Bad Request",
          message: "Cannot settle payment to yourself",
        });
        return;
      }

      // Find recipient user
      const recipientQuery = await db.collection("users").where("email", "==", to_email).limit(1).get();
      if (recipientQuery.empty) {
        res.status(404).json({
          error: "Not Found",
          message: "Recipient user not found",
        });
        return;
      }

      const recipientDoc = recipientQuery.docs[0];
      const recipientData = recipientDoc.data();

      // Get payer (current user) data
      const payerDoc = await db.collection("users").doc(user.uid).get();
      const payerData = payerDoc.data();

      // Update balances
      const batch = db.batch();

      // Payer's balance increases (they owe less money)
      const payerCurrentBalance = payerData?.balance || 0;
      batch.update(payerDoc.ref, {
        balance: payerCurrentBalance + amount,
        last_updated: new Date()
      });

      // Recipient's balance decreases (they are owed less money)
      const recipientCurrentBalance = recipientData.balance || 0;
      batch.update(recipientDoc.ref, {
        balance: recipientCurrentBalance - amount,
        last_updated: new Date()
      });

      await batch.commit();

      logBusiness.paymentSettled(user.email!, to_email, amount);

      res.json({
        message: "Payment settled successfully",
        data: {
          amount: amount,
          from: user.email,
          to: to_email,
          description: description || "Payment settlement",
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      logAPI.error('POST', '/expense/settle', error instanceof Error ? error.message : String(error));
      res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to settle payment",
      });
    }
  }
);

export default router; 