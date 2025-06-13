"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const firebase_1 = require("../config/firebase");
const uuid_1 = require("uuid");
const nodemailer_1 = __importDefault(require("nodemailer"));
const router = express_1.default.Router();
/**
 * Get User Info by Email (Public endpoint for house creation)
 * GET /user/info/:email
 * Used to verify if a user exists before creating a house
 */
router.get("/info/:email", async (req, res) => {
    try {
        const { email } = req.params;
        if (!email) {
            return res.status(400).json({
                error: "Bad Request",
                message: "Email parameter is required",
            });
        }
        // Query Firestore for user with this email
        const userQuery = await firebase_1.db
            .collection("users")
            .where("email", "==", email)
            .limit(1)
            .get();
        if (userQuery.empty) {
            return res.status(404).json({
                error: "Not Found",
                message: "User with this email not found",
            });
        }
        const userDoc = userQuery.docs[0];
        const userData = userDoc.data();
        res.json({
            message: "User found",
            data: {
                uid: userData.uid,
                email: userData.email,
                firstName: userData.firstName,
                lastName: userData.lastName,
                house_id: userData.house_id,
            },
        });
    }
    catch (error) {
        console.error("❌ Error fetching user info:", error);
        res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to fetch user information",
        });
    }
});
/**
 * Get User Balance
 * GET /user/balance
 * Fetch the balance for the authenticated user
 */
router.get("/balance", auth_1.authenticateUser, async (req, res) => {
    try {
        const user = req.user;
        const userDoc = await firebase_1.db.collection("users").doc(user.uid).get();
        if (!userDoc.exists) {
            return res.status(404).json({
                error: "Not Found",
                message: "User not found in database",
            });
        }
        const userData = userDoc.data();
        const balance = userData.balance || 0;
        res.json({
            message: "Balance retrieved successfully",
            data: { balance },
        });
    }
    catch (error) {
        console.error("❌ Error fetching balance:", error);
        res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to fetch user balance",
        });
    }
});
/**
 * Update User Balance
 * POST /user/update-balance
 * Add or subtract amount from user's balance
 */
router.post("/update-balance", auth_1.authenticateUser, async (req, res) => {
    try {
        const { amount } = req.body;
        const user = req.user;
        if (typeof amount !== "number") {
            return res.status(400).json({
                error: "Bad Request",
                message: "Amount must be a number",
            });
        }
        const userRef = firebase_1.db.collection("users").doc(user.uid);
        const userDoc = await userRef.get();
        if (!userDoc.exists) {
            return res.status(404).json({
                error: "Not Found",
                message: "User not found in database",
            });
        }
        const userData = userDoc.data();
        const currentBalance = userData.balance || 0;
        const newBalance = currentBalance + amount;
        // Update balance in Firestore
        await userRef.update({ balance: newBalance });
        console.log(`💰 Balance updated for ${user.email}: ${currentBalance} → ${newBalance} (${amount > 0 ? "+" : ""}${amount})`);
        res.json({
            message: "Balance updated successfully",
            data: {
                balance: newBalance,
                change: amount,
            },
        });
    }
    catch (error) {
        console.error("❌ Error updating balance:", error);
        res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to update balance",
        });
    }
});
/**
 * Get User Profile
 * GET /user/profile
 * Get detailed profile information for authenticated user
 */
router.get("/profile", auth_1.authenticateUser, async (req, res) => {
    try {
        const user = req.user;
        const userDoc = await firebase_1.db.collection("users").doc(user.uid).get();
        if (!userDoc.exists) {
            return res.status(404).json({
                error: "Not Found",
                message: "User profile not found",
            });
        }
        const userData = userDoc.data();
        // Get house information if user is in a house
        let houseData = null;
        if (userData.house_id) {
            const houseDoc = await firebase_1.db
                .collection("houses")
                .doc(userData.house_id)
                .get();
            if (houseDoc.exists) {
                houseData = houseDoc.data();
            }
        }
        res.json({
            message: "Profile retrieved successfully",
            data: {
                user: userData,
                house: houseData,
            },
        });
    }
    catch (error) {
        console.error("❌ Error fetching profile:", error);
        res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to fetch user profile",
        });
    }
});
/**
 * Update User Profile
 * PUT /user/profile
 * Update user profile information
 */
router.put("/profile", auth_1.authenticateUser, async (req, res) => {
    try {
        const user = req.user;
        const { firstName, lastName } = req.body;
        const updateData = {};
        if (firstName !== undefined) {
            updateData.firstName = firstName.trim();
        }
        if (lastName !== undefined) {
            updateData.lastName = lastName.trim();
        }
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                error: "Bad Request",
                message: "No valid fields to update",
            });
        }
        await firebase_1.db.collection("users").doc(user.uid).update(updateData);
        console.log(`👤 Profile updated for ${user.email}:`, updateData);
        res.json({
            message: "Profile updated successfully",
            data: updateData,
        });
    }
    catch (error) {
        console.error("❌ Error updating profile:", error);
        res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to update profile",
        });
    }
});
/**
 * Protected Route Test
 * GET /user/protected
 * Test endpoint to verify authentication is working
 */
router.get("/protected", auth_1.authenticateUser, async (req, res) => {
    const user = req.user;
    res.json({
        message: "Access granted to protected route",
        data: {
            uid: user.uid,
            email: user.email,
            timestamp: new Date().toISOString(),
        },
    });
});
/**
 * Send Nudge Email
 * POST /nudge/send
 * Send a nudge email to another house member
 */
router.post("/nudge/send", auth_1.authenticateUser, async (req, res) => {
    try {
        const { recipient_email } = req.body;
        const user = req.user;
        if (!recipient_email) {
            return res.status(400).json({
                error: "Bad Request",
                message: "recipient_email is required",
            });
        }
        // Get sender's house_id
        const senderDoc = await firebase_1.db.collection("users").doc(user.uid).get();
        const senderData = senderDoc.data();
        const houseId = senderData?.house_id;
        if (!houseId) {
            return res.status(400).json({
                error: "Bad Request",
                message: "You must be in a house to send nudges",
            });
        }
        // Verify recipient is in the same house
        const recipientQuery = await firebase_1.db
            .collection("users")
            .where("email", "==", recipient_email)
            .where("house_id", "==", houseId)
            .limit(1)
            .get();
        if (recipientQuery.empty) {
            return res.status(404).json({
                error: "Not Found",
                message: "Recipient not found in your house",
            });
        }
        // Configure nodemailer (using environment variables)
        const transporter = nodemailer_1.default.createTransporter({
            service: "gmail", // or your email service
            auth: {
                user: process.env.SMTP_EMAIL,
                pass: process.env.SMTP_PASSWORD,
            },
        });
        // Send nudge email
        const mailOptions = {
            from: process.env.SMTP_EMAIL,
            to: recipient_email,
            subject: `👋 Nudge from ${user.email}`,
            html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>👋 You got a nudge!</h2>
            <p><strong>${user.email}</strong> sent you a friendly nudge from your Roomiez house.</p>
            <p>This might be a reminder about:</p>
            <ul>
              <li>🧹 Completing your chores</li>
              <li>💰 Settling expenses</li>
              <li>🏠 General house duties</li>
            </ul>
            <p>Check your Roomiez dashboard for more details!</p>
            <hr>
            <p style="color: #666; font-size: 12px;">
              This nudge was sent through the Roomiez platform.
            </p>
          </div>
        `,
        };
        await transporter.sendMail(mailOptions);
        console.log(`📧 Nudge sent from ${user.email} to ${recipient_email}`);
        res.json({
            message: "Nudge sent successfully",
            data: {
                sender: user.email,
                recipient: recipient_email,
                sent_at: new Date().toISOString(),
            },
        });
    }
    catch (error) {
        console.error("❌ Error sending nudge:", error);
        res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to send nudge",
        });
    }
});
/**
 * Create House
 * POST /house/create
 * Create a new house with the authenticated user as owner
 */
router.post("/house/create", auth_1.authenticateUser, async (req, res) => {
    try {
        const { house_name } = req.body;
        const user = req.user;
        if (!house_name || house_name.trim().length === 0) {
            return res.status(400).json({
                error: "Bad Request",
                message: "house_name is required and cannot be empty",
            });
        }
        // Check if user is already in a house
        const userDoc = await firebase_1.db.collection("users").doc(user.uid).get();
        const userData = userDoc.data();
        if (userData?.house_id) {
            return res.status(400).json({
                error: "Bad Request",
                message: "You are already in a house",
            });
        }
        // Generate unique join code
        const joinCode = (0, uuid_1.v4)().substring(0, 8).toUpperCase();
        const houseData = {
            house_name: house_name.trim(),
            join_code: joinCode,
            owner_uid: user.uid,
            owner_email: user.email,
            members: [user.email],
            created_at: new Date(),
        };
        // Create house in Firestore
        const houseRef = await firebase_1.db.collection("houses").add(houseData);
        const houseId = houseRef.id;
        // Update user with house_id
        await firebase_1.db.collection("users").doc(user.uid).update({
            house_id: houseId,
        });
        console.log(`🏠 House "${house_name}" created by ${user.email} with join code: ${joinCode}`);
        res.status(201).json({
            message: "House created successfully",
            data: {
                house_id: houseId,
                ...houseData,
            },
        });
    }
    catch (error) {
        console.error("❌ Error creating house:", error);
        res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to create house",
        });
    }
});
/**
 * Join House
 * POST /house/join
 * Join an existing house using a join code
 */
router.post("/house/join", auth_1.authenticateUser, async (req, res) => {
    try {
        const { join_code } = req.body;
        const user = req.user;
        if (!join_code) {
            return res.status(400).json({
                error: "Bad Request",
                message: "join_code is required",
            });
        }
        // Check if user is already in a house
        const userDoc = await firebase_1.db.collection("users").doc(user.uid).get();
        const userData = userDoc.data();
        if (userData?.house_id) {
            return res.status(400).json({
                error: "Bad Request",
                message: "You are already in a house",
            });
        }
        // Find house with matching join code
        const houseQuery = await firebase_1.db
            .collection("houses")
            .where("join_code", "==", join_code.toUpperCase())
            .limit(1)
            .get();
        if (houseQuery.empty) {
            return res.status(404).json({
                error: "Not Found",
                message: "Invalid join code",
            });
        }
        const houseDoc = houseQuery.docs[0];
        const houseData = houseDoc.data();
        const houseId = houseDoc.id;
        // Check if user is already a member
        if (houseData.members.includes(user.email)) {
            return res.status(400).json({
                error: "Bad Request",
                message: "You are already a member of this house",
            });
        }
        // Add user to house members
        const updatedMembers = [...houseData.members, user.email];
        // Update house with new member
        await firebase_1.db.collection("houses").doc(houseId).update({
            members: updatedMembers,
        });
        // Update user with house_id
        await firebase_1.db.collection("users").doc(user.uid).update({
            house_id: houseId,
        });
        console.log(`🚪 ${user.email} joined house "${houseData.house_name}" (${join_code})`);
        res.json({
            message: "Successfully joined house",
            data: {
                house_id: houseId,
                house_name: houseData.house_name,
                join_code: houseData.join_code,
                members: updatedMembers,
            },
        });
    }
    catch (error) {
        console.error("❌ Error joining house:", error);
        res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to join house",
        });
    }
});
/**
 * Get My House
 * GET /house/my-house
 * Get details of the house the authenticated user belongs to
 */
router.get("/house/my-house", auth_1.authenticateUser, async (req, res) => {
    try {
        const user = req.user;
        // Get user's house_id
        const userDoc = await firebase_1.db.collection("users").doc(user.uid).get();
        const userData = userDoc.data();
        const houseId = userData?.house_id;
        if (!houseId) {
            return res.status(404).json({
                error: "Not Found",
                message: "You are not in a house",
            });
        }
        // Get house details
        const houseDoc = await firebase_1.db.collection("houses").doc(houseId).get();
        if (!houseDoc.exists) {
            return res.status(404).json({
                error: "Not Found",
                message: "House not found",
            });
        }
        const houseData = houseDoc.data();
        // Get member details
        const memberDetails = [];
        for (const memberEmail of houseData.members) {
            const memberQuery = await firebase_1.db
                .collection("users")
                .where("email", "==", memberEmail)
                .limit(1)
                .get();
            if (!memberQuery.empty) {
                const memberData = memberQuery.docs[0].data();
                memberDetails.push(memberData);
            }
        }
        res.json({
            message: "House details retrieved successfully",
            data: {
                house_id: houseDoc.id,
                ...houseData,
                member_details: memberDetails,
            },
        });
    }
    catch (error) {
        console.error("❌ Error fetching house details:", error);
        res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to fetch house details",
        });
    }
});
exports.default = router;
