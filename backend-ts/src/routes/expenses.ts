import express, { Response } from "express";
import { authenticateUser, AuthenticatedRequest } from "../middleware/auth";
import { db } from "../config/firebase";
import { Expense, CreateExpenseRequest, SettleExpenseRequest } from "../types";
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

/**
 * Create a Shared Expense
 * POST /expense/create
 * Creates a new expense and automatically calculates balances for all participants
 */
router.post(
  "/create",
  authenticateUser,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const { amount, description, split_between }: CreateExpenseRequest = req.body;

      // Validation
      if (!amount || amount <= 0) {
        res.status(400).json({
          error: "Bad Request",
          message: "amount must be a positive number",
        });
        return;
      }

      if (!description || description.trim().length === 0) {
        res.status(400).json({
          error: "Bad Request",
          message: "description is required",
        });
        return;
      }

      if (!split_between || split_between.length === 0) {
        res.status(400).json({
          error: "Bad Request",
          message: "split_between must contain at least one user email",
        });
        return;
      }

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

      for (const participantEmail of split_between) {
        if (participantEmail === user.email) {
          // Payer gets positive balance (others owe them)
          const payerAmount = amount - amountPerPerson; // They paid full amount but only owe their share
          
          // Find payer's uid
          const payerQuery = await db.collection("users").where("email", "==", participantEmail).limit(1).get();
          if (!payerQuery.empty) {
            const payerDoc = payerQuery.docs[0];
            const payerData = payerDoc.data();
            const currentBalance = payerData.balance || 0;
            
            batch.update(payerDoc.ref, {
              balance: currentBalance + payerAmount,
              last_updated: new Date()
            });
          }
        } else {
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

      console.log(`💰 Expense created: ${description} for $${amount} split ${split_between.length} ways`);

      res.json({
        message: "Expense created successfully",
        data: {
          expense: expense,
          amount_per_person: amountPerPerson,
          total_participants: split_between.length
        }
      });

    } catch (error) {
      console.error("❌ Error creating expense:", error);
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
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      res.json({
        message: "Expenses retrieved successfully",
        data: {
          expenses: expenses,
          count: expenses.length
        }
      });

    } catch (error) {
      console.error("❌ Error fetching expenses:", error);
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
      console.log("---------------------------");
      console.log("Getting balances for house members");
      console.log(houseData);

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

      console.log("💰 House balances requested successfully")

    } catch (error) {
      console.error("❌ Error fetching house balances:", error);
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
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const { amount, to_email, description }: SettleExpenseRequest = req.body;

      // Validation
      if (!amount || amount <= 0) {
        res.status(400).json({
          error: "Bad Request",
          message: "amount must be a positive number",
        });
        return;
      }

      if (!to_email) {
        res.status(400).json({
          error: "Bad Request",
          message: "to_email is required",
        });
        return;
      }

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

      // Payer loses money (negative balance change)
      const payerCurrentBalance = payerData?.balance || 0;
      batch.update(payerDoc.ref, {
        balance: payerCurrentBalance - amount,
        last_updated: new Date()
      });

      // Recipient gains money (positive balance change)
      const recipientCurrentBalance = recipientData.balance || 0;
      batch.update(recipientDoc.ref, {
        balance: recipientCurrentBalance + amount,
        last_updated: new Date()
      });

      await batch.commit();

      console.log(`💸 Settlement: ${user.email} paid $${amount} to ${to_email}`);

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
      console.error("❌ Error settling payment:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to settle payment",
      });
    }
  }
);

export default router; 