import express, { Response } from "express";
import { authenticateUser, AuthenticatedRequest } from "../middleware/auth";
import { db } from "../config/firebase";
import { UpdateBalanceRequest } from "../types";

const router = express.Router();

/**
 * Get User Balance
 * GET /user/balance
 * Fetch the current balance for the authenticated user
 */
router.get(
  "/balance",
  authenticateUser,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;

      // Get user document
      const userDoc = await db.collection("users").doc(user.uid).get();

      if (!userDoc.exists) {
        // Create user document if it doesn't exist
        await db
          .collection("users")
          .doc(user.uid)
          .set(
            {
              uid: user.uid,
              email: user.email,
              balance: 0,
            },
            { merge: true }
          );

        res.json({
          message: "User balance retrieved successfully",
          balance: 0,
        });
        return;
      }

      const userData = userDoc.data();
      const balance = userData?.balance || 0;

      res.json({
        message: "User balance retrieved successfully",
        balance: balance,
      });
    } catch (error) {
      console.error("❌ Error fetching user balance:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to fetch user balance",
      });
    }
  }
);

/**
 * Update User Balance
 * POST /user/update-balance
 * Add or subtract from the user's balance
 */
router.post(
  "/update-balance",
  authenticateUser,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { amount }: UpdateBalanceRequest = req.body;
      const user = req.user!;

      if (typeof amount !== "number") {
        res.status(400).json({
          error: "Bad Request",
          message: "amount must be a number",
        });
        return;
      }

      // Get current user balance
      const userDoc = await db.collection("users").doc(user.uid).get();
      let currentBalance = 0;

      if (userDoc.exists) {
        const userData = userDoc.data();
        currentBalance = userData?.balance || 0;
      }

      // Calculate new balance
      const newBalance = currentBalance + amount;

      // Update user balance
      await db
        .collection("users")
        .doc(user.uid)
        .set(
          {
            uid: user.uid,
            email: user.email,
            balance: newBalance,
            last_updated: new Date(),
          },
          { merge: true }
        );

      console.log(
        `💰 User ${user.email} balance updated: ${currentBalance} → ${newBalance} (${
          amount >= 0 ? "+" : ""
        }${amount})`
      );

      res.json({
        message: "Balance updated successfully",
        data: {
          previous_balance: currentBalance,
          amount_changed: amount,
          new_balance: newBalance,
          updated_at: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("❌ Error updating user balance:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to update user balance",
      });
    }
  }
);

/**
 * Get User Profile
 * GET /user/profile
 * Get complete user profile information
 */
router.get(
  "/profile",
  authenticateUser,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;

      // Get user document
      const userDoc = await db.collection("users").doc(user.uid).get();

      if (!userDoc.exists) {
        // Create basic user document if it doesn't exist
        const newUserData = {
          uid: user.uid,
          email: user.email,
          balance: 0,
          created_at: new Date(),
        };

        await db.collection("users").doc(user.uid).set(newUserData);

        res.json({
          message: "User profile retrieved successfully",
          data: newUserData,
        });
        return;
      }

      const userData = userDoc.data();

      res.json({
        message: "User profile retrieved successfully",
        data: userData,
      });
    } catch (error) {
      console.error("❌ Error fetching user profile:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to fetch user profile",
      });
    }
  }
);

/**
 * Update User Profile
 * PUT /user/profile
 * Update user profile information
 */
router.put(
  "/profile",
  authenticateUser,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const { firstName, lastName } = req.body;

      // Validate input
      if (firstName !== undefined && typeof firstName !== "string") {
        res.status(400).json({
          error: "Bad Request",
          message: "firstName must be a string",
        });
        return;
      }

      if (lastName !== undefined && typeof lastName !== "string") {
        res.status(400).json({
          error: "Bad Request",
          message: "lastName must be a string",
        });
        return;
      }

      // Build update object
      const updateData: any = {
        last_updated: new Date(),
      };

      if (firstName !== undefined) {
        updateData.firstName = firstName.trim();
      }

      if (lastName !== undefined) {
        updateData.lastName = lastName.trim();
      }

      // Update user document
      await db.collection("users").doc(user.uid).update(updateData);

      console.log(`👤 User ${user.email} profile updated`);

      res.json({
        message: "Profile updated successfully",
        data: {
          updated_fields: Object.keys(updateData).filter(
            (key) => key !== "last_updated"
          ),
          updated_at: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("❌ Error updating user profile:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to update user profile",
      });
    }
  }
);

/**
 * Protected Route Test
 * GET /user/protected
 * Test endpoint to verify authentication is working
 */
router.get(
  "/protected",
  authenticateUser,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;

      res.json({
        message: "Protected route accessed successfully",
        data: {
          user_id: user.uid,
          email: user.email,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("❌ Error in protected route:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message: "Protected route failed",
      });
    }
  }
);

export default router; 