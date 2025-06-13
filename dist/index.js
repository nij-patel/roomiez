"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_1 = require("./middleware/auth");
const firebase_1 = require("./config/firebase");
const uuid_1 = require("uuid");
const nodemailer_1 = __importDefault(require("nodemailer"));
// Import route modules
const chores_1 = __importDefault(require("./routes/chores"));
const user_1 = __importDefault(require("./routes/user"));
// Load environment variables
dotenv_1.default.config();
/**
 * Express App Configuration
 * This creates and configures our Express.js server
 */
const app = (0, express_1.default)();
const PORT = process.env.PORT || 8000;
/**
 * Middleware Configuration
 */
// Parse JSON requests
app.use(express_1.default.json());
// Enable CORS for frontend requests
app.use((0, cors_1.default)({
    origin: ['http://localhost:3000'], // Frontend URL
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
/**
 * Email Configuration for Nudge System
 * Using nodemailer to send anonymous nudge emails
 */
const SMTP_SERVER = 'smtp.gmail.com';
const SMTP_PORT = 587;
const SMTP_EMAIL = process.env.ROOMIEZ_SMTP_EMAIL;
const SMTP_PASSWORD = process.env.ROOMIEZ_SMTP_PASSWORD;
// Anonymous sender emails for nudges
const ANONYMOUS_SENDERS = [
    'anon1@nudgebot.com',
    'anon2@nudgebot.com',
    'anon3@nudgebot.com'
];
/**
 * Email transporter configuration
 */
const emailTransporter = nodemailer_1.default.createTransporter({
    host: SMTP_SERVER,
    port: SMTP_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
        user: SMTP_EMAIL,
        pass: SMTP_PASSWORD,
    },
});
/**
 * API Routes
 */
/**
 * Health check endpoint
 * GET /
 */
app.get('/', (req, res) => {
    res.json({
        message: 'Roomiez TypeScript Backend Running',
        timestamp: new Date().toISOString(),
        version: '2.0.0'
    });
});
/**
 * Send Nudge Email
 * POST /nudge/send
 * Sends an anonymous nudge email to a roommate
 */
app.post('/nudge/send', async (req, res) => {
    try {
        const { recipient_email } = req.body;
        if (!recipient_email) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'recipient_email is required'
            });
        }
        // Select random anonymous sender
        const senderEmail = ANONYMOUS_SENDERS[Math.floor(Math.random() * ANONYMOUS_SENDERS.length)];
        const subject = "You've been nudged by a roommate!";
        const body = "Hey! You've been anonymously nudged to do your chores by one of your roommates. Quit slacking! 😉";
        // Send email
        await emailTransporter.sendMail({
            from: senderEmail,
            to: recipient_email,
            subject: subject,
            text: body,
        });
        console.log(`📧 Nudge sent to ${recipient_email}`);
        res.json({
            message: 'Nudge sent successfully',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('❌ Error sending nudge:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to send nudge email'
        });
    }
});
/**
 * Get User Info by Email
 * GET /user/info/:email
 * Fetch user details from Firestore by email (authenticated)
 */
app.get('/user/info/:email', auth_1.authenticateUser, async (req, res) => {
    try {
        const { email } = req.params;
        if (!email) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Email parameter is required'
            });
        }
        // Query Firestore for user by email
        const usersRef = firebase_1.db.collection('users');
        const query = await usersRef.where('email', '==', email).limit(1).get();
        if (query.empty) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'User not found'
            });
        }
        const userData = query.docs[0].data();
        res.json({
            message: 'User found',
            data: userData
        });
    }
    catch (error) {
        console.error('❌ Error fetching user:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch user information'
        });
    }
});
/**
 * Create a House
 * POST /house/create
 * Creates a new house with unique ID and join code (authenticated)
 */
app.post('/house/create', auth_1.authenticateUser, async (req, res) => {
    try {
        const { house_name } = req.body;
        const user = req.user; // We know user exists due to auth middleware
        if (!house_name || house_name.trim().length === 0) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'house_name is required and cannot be empty'
            });
        }
        // Generate unique identifiers
        const houseId = (0, uuid_1.v4)();
        const joinCode = (0, uuid_1.v4)().substring(0, 6).toUpperCase(); // 6-character join code
        const houseData = {
            house_id: houseId,
            house_name: house_name.trim(),
            join_code: joinCode,
            owner_uid: user.uid,
            owner_email: user.email,
            members: [user.email], // Creator is the first member
            created_at: new Date()
        };
        // Save house to Firestore
        await firebase_1.db.collection('houses').doc(houseId).set(houseData);
        // Update user document with house_id
        await firebase_1.db.collection('users').doc(user.uid).set({ house_id: houseId }, { merge: true });
        console.log(`🏠 House "${house_name}" created by ${user.email} with join code: ${joinCode}`);
        res.status(201).json({
            message: 'House created successfully!',
            data: {
                house_id: houseId,
                join_code: joinCode,
                house_name: house_name
            }
        });
    }
    catch (error) {
        console.error('❌ Error creating house:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to create house'
        });
    }
});
/**
 * Join a House
 * POST /house/join
 * Join an existing house using a join code (authenticated)
 */
app.post('/house/join', auth_1.authenticateUser, async (req, res) => {
    try {
        const { join_code } = req.body;
        const user = req.user;
        if (!join_code || join_code.trim().length === 0) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'join_code is required'
            });
        }
        // Find house by join code
        const housesRef = firebase_1.db.collection('houses');
        const query = await housesRef.where('join_code', '==', join_code.trim().toUpperCase()).limit(1).get();
        if (query.empty) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Invalid join code. Please check the code and try again.'
            });
        }
        const houseDoc = query.docs[0];
        const houseData = houseDoc.data();
        // Check if user is already a member
        if (houseData.members.includes(user.email)) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'You are already a member of this house'
            });
        }
        // Add user to house members
        const updatedMembers = [...houseData.members, user.email];
        await firebase_1.db.collection('houses').doc(houseDoc.id).update({
            members: updatedMembers
        });
        // Update user document with house_id
        await firebase_1.db.collection('users').doc(user.uid).set({ house_id: houseDoc.id }, { merge: true });
        console.log(`🚪 User ${user.email} joined house: ${houseData.house_name}`);
        res.json({
            message: 'Joined house successfully!',
            data: {
                house_id: houseDoc.id,
                house_name: houseData.house_name
            }
        });
    }
    catch (error) {
        console.error('❌ Error joining house:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to join house'
        });
    }
});
/**
 * Get My House
 * GET /house/my-house
 * Fetch house details for the currently logged-in user, including member details and chores
 */
app.get('/house/my-house', auth_1.authenticateUser, async (req, res) => {
    try {
        const user = req.user;
        // Get user document to find house_id
        const userDoc = await firebase_1.db.collection('users').doc(user.uid).get();
        if (!userDoc.exists) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'User not found in database'
            });
        }
        const userData = userDoc.data();
        const houseId = userData?.house_id;
        if (!houseId) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'User is not in a house. Please create or join a house first.'
            });
        }
        // Get house document
        const houseDoc = await firebase_1.db.collection('houses').doc(houseId).get();
        if (!houseDoc.exists) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'House not found'
            });
        }
        const houseData = houseDoc.data();
        // Fetch detailed information for each member
        const memberDetails = [];
        for (const email of houseData.members) {
            // Get user details
            const userQuery = await firebase_1.db.collection('users').where('email', '==', email).limit(1).get();
            if (!userQuery.empty) {
                const userDetails = userQuery.docs[0].data();
                // Fetch chores assigned to this user
                const choresQuery = await firebase_1.db.collection('chores')
                    .where('user_email', '==', email)
                    .get();
                const userChores = choresQuery.docs.map(doc => ({
                    ...doc.data(),
                    chore_id: doc.id
                }));
                // Attach chores to user
                userDetails.chores = userChores;
                memberDetails.push(userDetails);
            }
        }
        // Attach member details to house data
        const responseData = {
            ...houseData,
            member_details: memberDetails
        };
        res.json({
            message: 'House details retrieved successfully',
            data: responseData
        });
    }
    catch (error) {
        console.error('❌ Error fetching house details:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch house details'
        });
    }
});
/**
 * Mount route modules
 */
app.use('/chores', chores_1.default);
app.use('/user', user_1.default);
/**
 * Start the Express server
 */
app.listen(PORT, () => {
    console.log(`🚀 Roomiez TypeScript Backend running on port ${PORT}`);
    console.log(`📝 API documentation available at http://localhost:${PORT}`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
});
