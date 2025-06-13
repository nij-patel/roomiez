"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const firebase_1 = require("../config/firebase");
const router = express_1.default.Router();
/**
 * Get House Chores
 * GET /chores/my-house
 * Fetch all chores for the logged-in user's house
 */
router.get("/my-house", auth_1.authenticateUser, async (req, res) => {
    try {
        const user = req.user;
        // Get user's house_id
        const userDoc = await firebase_1.db.collection("users").doc(user.uid).get();
        if (!userDoc.exists) {
            return res.status(404).json({
                error: "Not Found",
                message: "User not found in database",
            });
        }
        const userData = userDoc.data();
        const houseId = userData?.house_id;
        if (!houseId) {
            return res.status(404).json({
                error: "Not Found",
                message: "User is not in a house",
            });
        }
        // Fetch all chores for the house
        const choresQuery = await firebase_1.db
            .collection("chores")
            .where("house_id", "==", houseId)
            .orderBy("assigned_at", "desc")
            .get();
        const chores = choresQuery.docs.map((doc) => ({
            chore_id: doc.id,
            ...doc.data(),
        }));
        res.json({
            message: "House chores retrieved successfully",
            data: chores,
        });
    }
    catch (error) {
        console.error("❌ Error fetching chores:", error);
        res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to fetch chores",
        });
    }
});
/**
 * Add New Chore
 * POST /chores/add
 * Create a new chore and assign it to a specific user
 */
router.post("/add", auth_1.authenticateUser, async (req, res) => {
    try {
        const { chore_name, user_email } = req.body;
        const user = req.user;
        if (!chore_name || !user_email) {
            return res.status(400).json({
                error: "Bad Request",
                message: "chore_name and user_email are required",
            });
        }
        // Get user's house_id
        const userDoc = await firebase_1.db.collection("users").doc(user.uid).get();
        const userData = userDoc.data();
        const houseId = userData?.house_id;
        if (!houseId) {
            return res.status(404).json({
                error: "Not Found",
                message: "User is not in a house",
            });
        }
        // Verify that the assigned user is in the same house
        const assignedUserQuery = await firebase_1.db
            .collection("users")
            .where("email", "==", user_email)
            .where("house_id", "==", houseId)
            .limit(1)
            .get();
        if (assignedUserQuery.empty) {
            return res.status(400).json({
                error: "Bad Request",
                message: "Assigned user is not in your house",
            });
        }
        const choreData = {
            chore_name: chore_name.trim(),
            user_email: user_email,
            house_id: houseId,
            status: "Pending",
            assigned_at: new Date(),
        };
        // Add chore to Firestore
        const choreRef = await firebase_1.db.collection("chores").add(choreData);
        console.log(`✅ Chore "${chore_name}" assigned to ${user_email} by ${user.email}`);
        res.status(201).json({
            message: "Chore added successfully",
            data: {
                chore_id: choreRef.id,
                ...choreData,
            },
        });
    }
    catch (error) {
        console.error("❌ Error adding chore:", error);
        res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to add chore",
        });
    }
});
/**
 * Update Chore Status
 * PUT /chores/:chore_id/status
 * Mark a chore as completed or pending
 */
router.put("/:chore_id/status", auth_1.authenticateUser, async (req, res) => {
    try {
        const { chore_id } = req.params;
        const { status } = req.body;
        const user = req.user;
        if (!chore_id) {
            return res.status(400).json({
                error: "Bad Request",
                message: "chore_id is required",
            });
        }
        if (!status || !["Pending", "Completed"].includes(status)) {
            return res.status(400).json({
                error: "Bad Request",
                message: 'status must be either "Pending" or "Completed"',
            });
        }
        // Get chore document
        const choreDoc = await firebase_1.db.collection("chores").doc(chore_id).get();
        if (!choreDoc.exists) {
            return res.status(404).json({
                error: "Not Found",
                message: "Chore not found",
            });
        }
        const choreData = choreDoc.data();
        // Verify user can update this chore (either assigned to them or house member)
        const userDoc = await firebase_1.db.collection("users").doc(user.uid).get();
        const userData = userDoc.data();
        if (choreData.house_id !== userData?.house_id) {
            return res.status(403).json({
                error: "Forbidden",
                message: "You can only update chores in your house",
            });
        }
        // Update chore status
        const updateData = {
            status: status,
        };
        if (status === "Completed") {
            updateData.completed_at = new Date();
        }
        await firebase_1.db.collection("chores").doc(chore_id).update(updateData);
        console.log(`📝 Chore ${chore_id} status updated to ${status} by ${user.email}`);
        res.json({
            message: "Chore status updated successfully",
            data: {
                chore_id,
                status,
                updated_at: new Date().toISOString(),
            },
        });
    }
    catch (error) {
        console.error("❌ Error updating chore status:", error);
        res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to update chore status",
        });
    }
});
/**
 * Delete Chore
 * DELETE /chores/:chore_id
 * Remove a chore from the system
 */
router.delete("/:chore_id", auth_1.authenticateUser, async (req, res) => {
    try {
        const { chore_id } = req.params;
        const user = req.user;
        if (!chore_id) {
            return res.status(400).json({
                error: "Bad Request",
                message: "chore_id is required",
            });
        }
        // Get chore document
        const choreDoc = await firebase_1.db.collection("chores").doc(chore_id).get();
        if (!choreDoc.exists) {
            return res.status(404).json({
                error: "Not Found",
                message: "Chore not found",
            });
        }
        const choreData = choreDoc.data();
        // Verify user can delete this chore (house member)
        const userDoc = await firebase_1.db.collection("users").doc(user.uid).get();
        const userData = userDoc.data();
        if (choreData.house_id !== userData?.house_id) {
            return res.status(403).json({
                error: "Forbidden",
                message: "You can only delete chores in your house",
            });
        }
        // Delete chore
        await firebase_1.db.collection("chores").doc(chore_id).delete();
        console.log(`🗑️ Chore ${chore_id} deleted by ${user.email}`);
        res.json({
            message: "Chore deleted successfully",
            data: {
                chore_id,
                deleted_at: new Date().toISOString(),
            },
        });
    }
    catch (error) {
        console.error("❌ Error deleting chore:", error);
        res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to delete chore",
        });
    }
});
exports.default = router;
