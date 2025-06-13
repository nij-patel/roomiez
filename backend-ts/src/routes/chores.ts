import express, { Response } from "express";
import { authenticateUser, AuthenticatedRequest } from "../middleware/auth";
import { db } from "../config/firebase";
import { ChoreRequest, Chore } from "../types";
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

/**
 * Get House Chores
 * GET /chores/my-house
 * Fetch all chores for the logged-in user's house
 */
router.get(
  "/my-house",
  authenticateUser,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      
      // Get user's house_id
      const userDoc = await db.collection("users").doc(user.uid).get();
      
      if (!userDoc.exists) {
        res.status(404).json({
          error: "Not Found",
          message: "User not found in database"
        });
        return;
      }

      const userData = userDoc.data();
      const houseId = userData?.house_id;
      
      if (!houseId) {
        res.status(404).json({
          error: "Not Found",
          message: "User is not in a house"
        });
        return;
      }

      // Fetch all chores for the house (remove orderBy to avoid index requirement)
      const choresQuery = await db
        .collection("chores")
        .where("house_id", "==", houseId)
        .get();
      
      const chores: Chore[] = choresQuery.docs
        .map((doc) => ({
          chore_id: doc.id,
          ...(doc.data() as Omit<Chore, "chore_id">),
        }))
        .sort((a, b) => new Date(b.assigned_at).getTime() - new Date(a.assigned_at).getTime()); // Sort by newest first
      
      res.json({
        message: "House chores retrieved successfully",
        chores: chores
      });
      
    } catch (error) {
      console.error("❌ Error fetching chores:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to fetch chores"
      });
    }
  }
);

/**
 * Add New Chore
 * POST /chores/add
 * Create a new chore and assign it to a specific user
 */
router.post(
  "/add",
  authenticateUser,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { chore_name, user_email, username }: ChoreRequest = req.body;
      const user = req.user!;
      
      if (!chore_name || !user_email) {
        res.status(400).json({
          error: "Bad Request",
          message: "chore_name and user_email are required"
        });
        return;
      }

      // Get user's house_id
      const userDoc = await db.collection("users").doc(user.uid).get();
      const userData = userDoc.data();
      const houseId = userData?.house_id;
      
      if (!houseId) {
        res.status(404).json({
          error: "Not Found",
          message: "User is not in a house"
        });
        return;
      }

      // Verify that the assigned user is in the same house
      const assignedUserQuery = await db
        .collection("users")
        .where("email", "==", user_email)
        .where("house_id", "==", houseId)
        .limit(1)
        .get();
      
      if (assignedUserQuery.empty) {
        res.status(400).json({
          error: "Bad Request",
          message: "Assigned user is not in your house"
        });
        return;
      }

      const choreData: Omit<Chore, "chore_id"> = {
        chore_name: chore_name.trim(),
        user_email: user_email,
        username: username,
        house_id: houseId,
        status: "Pending",
        assigned_at: new Date(),
      };

      // Add chore to Firestore
      const choreRef = await db.collection("chores").add(choreData);
      
      console.log(`✅ Chore "${chore_name}" assigned to ${user_email} by ${user.email}`);
      
      res.status(201).json({
        message: "Chore added successfully",
        data: {
          chore_id: choreRef.id,
          ...choreData
        }
      });
      
    } catch (error) {
      console.error("❌ Error adding chore:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to add chore"
      });
    }
  }
);

/**
 * Update Chore Status
 * PUT /chores/:chore_id/status
 * Mark a chore as completed or pending
 */
router.put(
  "/:chore_id/status",
  authenticateUser,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { chore_id } = req.params;
      const { status } = req.body;
      const user = req.user!;
      
      if (!chore_id) {
        res.status(400).json({
          error: "Bad Request",
          message: "chore_id is required"
        });
        return;
      }

      if (!status || !["Pending", "Completed"].includes(status)) {
        res.status(400).json({
          error: "Bad Request",
          message: 'status must be either "Pending" or "Completed"'
        });
        return;
      }

      // Get chore document
      const choreDoc = await db.collection("chores").doc(chore_id).get();
      
      if (!choreDoc.exists) {
        res.status(404).json({
          error: "Not Found",
          message: "Chore not found"
        });
        return;
      }

      const choreData = choreDoc.data() as Chore;
      
      // Verify user can update this chore (either assigned to them or house member)
      const userDoc = await db.collection("users").doc(user.uid).get();
      const userData = userDoc.data();
      
      if (choreData.house_id !== userData?.house_id) {
        res.status(403).json({
          error: "Forbidden",
          message: "You can only update chores in your house"
        });
        return;
      }

      // Update chore status
      const updateData: Partial<Chore> = {
        status: status as "Pending" | "Completed"
      };
      
      if (status === "Completed") {
        updateData.completed_at = new Date();
      }
      
      await db.collection("chores").doc(chore_id).update(updateData);
      
      console.log(`📝 Chore ${chore_id} status updated to ${status} by ${user.email}`);
      
      res.json({
        message: "Chore status updated successfully",
        data: {
          chore_id,
          status,
          updated_at: new Date().toISOString()
        }
      });
      
    } catch (error) {
      console.error("❌ Error updating chore status:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to update chore status"
      });
    }
  }
);

/**
 * Delete Chore
 * DELETE /chores/:chore_id
 * Remove a chore from the system
 */
router.delete(
  "/:chore_id",
  authenticateUser,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { chore_id } = req.params;
      const user = req.user!;
      
      if (!chore_id) {
        res.status(400).json({
          error: "Bad Request",
          message: "chore_id is required"
        });
        return;
      }

      // Get chore document
      const choreDoc = await db.collection("chores").doc(chore_id).get();
      
      if (!choreDoc.exists) {
        res.status(404).json({
          error: "Not Found",
          message: "Chore not found"
        });
        return;
      }

      const choreData = choreDoc.data() as Chore;
      
      // Verify user can delete this chore (house member)
      const userDoc = await db.collection("users").doc(user.uid).get();
      const userData = userDoc.data();
      
      if (choreData.house_id !== userData?.house_id) {
        res.status(403).json({
          error: "Forbidden",
          message: "You can only delete chores in your house"
        });
        return;
      }

      // Delete chore
      await db.collection("chores").doc(chore_id).delete();
      
      console.log(`🗑️ Chore ${chore_id} deleted by ${user.email}`);
      
      res.json({
        message: "Chore deleted successfully",
        data: {
          chore_id,
          deleted_at: new Date().toISOString()
        }
      });
      
    } catch (error) {
      console.error("❌ Error deleting chore:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to delete chore"
      });
    }
  }
);

export default router; 