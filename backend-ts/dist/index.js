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
const chores_1 = __importDefault(require("./routes/chores"));
const user_1 = __importDefault(require("./routes/user"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 8000;
app.use(express_1.default.json());
app.use((0, cors_1.default)({
    origin: ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
const SMTP_SERVER = 'smtp.gmail.com';
const SMTP_PORT = 587;
const SMTP_EMAIL = process.env.ROOMIEZ_SMTP_EMAIL;
const SMTP_PASSWORD = process.env.ROOMIEZ_SMTP_PASSWORD;
const ANONYMOUS_SENDERS = [
    'anon1@nudgebot.com',
    'anon2@nudgebot.com',
    'anon3@nudgebot.com'
];
const emailTransporter = nodemailer_1.default.createTransporter({
    host: SMTP_SERVER,
    port: SMTP_PORT,
    secure: false,
    auth: {
        user: SMTP_EMAIL,
        pass: SMTP_PASSWORD,
    },
});
app.get('/', (req, res) => {
    res.json({
        message: 'Roomiez TypeScript Backend Running',
        timestamp: new Date().toISOString(),
        version: '2.0.0'
    });
});
app.post('/nudge/send', async (req, res) => {
    try {
        const { recipient_email } = req.body;
        if (!recipient_email) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'recipient_email is required'
            });
        }
        const senderEmail = ANONYMOUS_SENDERS[Math.floor(Math.random() * ANONYMOUS_SENDERS.length)];
        const subject = "You've been nudged by a roommate!";
        const body = "Hey! You've been anonymously nudged to do your chores by one of your roommates. Quit slacking! 😉";
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
app.get('/user/info/:email', auth_1.authenticateUser, async (req, res) => {
    try {
        const { email } = req.params;
        if (!email) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Email parameter is required'
            });
        }
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
app.post('/house/create', auth_1.authenticateUser, async (req, res) => {
    try {
        const { house_name } = req.body;
        const user = req.user;
        if (!house_name || house_name.trim().length === 0) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'house_name is required and cannot be empty'
            });
        }
        const houseId = (0, uuid_1.v4)();
        const joinCode = (0, uuid_1.v4)().substring(0, 6).toUpperCase();
        const houseData = {
            house_id: houseId,
            house_name: house_name.trim(),
            join_code: joinCode,
            owner_uid: user.uid,
            owner_email: user.email,
            members: [user.email],
            created_at: new Date()
        };
        await firebase_1.db.collection('houses').doc(houseId).set(houseData);
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
        if (houseData.members.includes(user.email)) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'You are already a member of this house'
            });
        }
        const updatedMembers = [...houseData.members, user.email];
        await firebase_1.db.collection('houses').doc(houseDoc.id).update({
            members: updatedMembers
        });
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
app.get('/house/my-house', auth_1.authenticateUser, async (req, res) => {
    try {
        const user = req.user;
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
        const houseDoc = await firebase_1.db.collection('houses').doc(houseId).get();
        if (!houseDoc.exists) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'House not found'
            });
        }
        const houseData = houseDoc.data();
        const memberDetails = [];
        for (const email of houseData.members) {
            const userQuery = await firebase_1.db.collection('users').where('email', '==', email).limit(1).get();
            if (!userQuery.empty) {
                const userDetails = userQuery.docs[0].data();
                const choresQuery = await firebase_1.db.collection('chores')
                    .where('user_email', '==', email)
                    .get();
                const userChores = choresQuery.docs.map(doc => ({
                    ...doc.data(),
                    chore_id: doc.id
                }));
                userDetails.chores = userChores;
                memberDetails.push(userDetails);
            }
        }
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
app.use('/chores', chores_1.default);
app.use('/user', user_1.default);
app.listen(PORT, () => {
    console.log(`🚀 Roomiez TypeScript Backend running on port ${PORT}`);
    console.log(`📝 API documentation available at http://localhost:${PORT}`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
});
//# sourceMappingURL=index.js.map