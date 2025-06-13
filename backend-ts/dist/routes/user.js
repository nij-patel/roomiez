"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const firebase_1 = require("../config/firebase");
const router = express_1.default.Router();
router.get("/balance", auth_1.authenticateUser, async (req, res) => {
    try {
        const user = req.user;
        const userDoc = await firebase_1.db.collection("users").doc(user.uid).get();
        if (!userDoc.exists) {
            await firebase_1.db
                .collection("users")
                .doc(user.uid)
                .set({
                uid: user.uid,
                email: user.email,
                balance: 0,
            }, { merge: true });
            return res.json({
                message: "User balance retrieved successfully",
                balance: 0,
            });
        }
        const userData = userDoc.data();
        const balance = userData?.balance || 0;
        res.json({
            message: "User balance retrieved successfully",
            balance: balance,
        });
    }
    catch (error) {
        console.error("❌ Error fetching user balance:", error);
        res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to fetch user balance",
        });
    }
});
router.post("/update-balance", auth_1.authenticateUser, async (req, res) => {
    try {
        const { amount } = req.body;
        const user = req.user;
        if (typeof amount !== "number") {
            return res.status(400).json({
                error: "Bad Request",
                message: "amount must be a number",
            });
        }
        const userDoc = await firebase_1.db.collection("users").doc(user.uid).get();
        let currentBalance = 0;
        if (userDoc.exists) {
            const userData = userDoc.data();
            currentBalance = userData?.balance || 0;
        }
        const newBalance = currentBalance + amount;
        await firebase_1.db
            .collection("users")
            .doc(user.uid)
            .set({
            uid: user.uid,
            email: user.email,
            balance: newBalance,
            last_updated: new Date(),
        }, { merge: true });
        console.log(`💰 User ${user.email} balance updated: ${currentBalance} → ${newBalance} (${amount >= 0 ? "+" : ""}${amount})`);
        res.json({
            message: "Balance updated successfully",
            data: {
                previous_balance: currentBalance,
                amount_changed: amount,
                new_balance: newBalance,
                updated_at: new Date().toISOString(),
            },
        });
    }
    catch (error) {
        console.error("❌ Error updating user balance:", error);
        res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to update user balance",
        });
    }
});
router.get("/profile", auth_1.authenticateUser, async (req, res) => {
    try {
        const user = req.user;
        const userDoc = await firebase_1.db.collection("users").doc(user.uid).get();
        if (!userDoc.exists) {
            const newUserData = {
                uid: user.uid,
                email: user.email,
                balance: 0,
                created_at: new Date(),
            };
            await firebase_1.db.collection("users").doc(user.uid).set(newUserData);
            return res.json({
                message: "User profile retrieved successfully",
                data: newUserData,
            });
        }
        const userData = userDoc.data();
        res.json({
            message: "User profile retrieved successfully",
            data: userData,
        });
    }
    catch (error) {
        console.error("❌ Error fetching user profile:", error);
        res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to fetch user profile",
        });
    }
});
router.put("/profile", auth_1.authenticateUser, async (req, res) => {
    try {
        const user = req.user;
        const { firstName, lastName } = req.body;
        if (firstName !== undefined && typeof firstName !== "string") {
            return res.status(400).json({
                error: "Bad Request",
                message: "firstName must be a string",
            });
        }
        if (lastName !== undefined && typeof lastName !== "string") {
            return res.status(400).json({
                error: "Bad Request",
                message: "lastName must be a string",
            });
        }
        const updateData = {
            last_updated: new Date(),
        };
        if (firstName !== undefined) {
            updateData.firstName = firstName.trim();
        }
        if (lastName !== undefined) {
            updateData.lastName = lastName.trim();
        }
        await firebase_1.db.collection("users").doc(user.uid).update(updateData);
        console.log(`👤 User ${user.email} profile updated`);
        res.json({
            message: "Profile updated successfully",
            data: {
                updated_fields: Object.keys(updateData).filter((key) => key !== "last_updated"),
                updated_at: new Date().toISOString(),
            },
        });
    }
    catch (error) {
        console.error("❌ Error updating user profile:", error);
        res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to update user profile",
        });
    }
});
router.get("/protected", auth_1.authenticateUser, async (req, res) => {
    try {
        const user = req.user;
        res.json({
            message: "Protected route accessed successfully",
            data: {
                user_id: user.uid,
                email: user.email,
                timestamp: new Date().toISOString(),
            },
        });
    }
    catch (error) {
        console.error("❌ Error in protected route:", error);
        res.status(500).json({
            error: "Internal Server Error",
            message: "Protected route failed",
        });
    }
});
exports.default = router;
//# sourceMappingURL=user.js.map