import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { authenticateUser, AuthenticatedRequest } from './middleware/auth';
import { db } from './config/firebase';
import { 
  HouseCreateRequest, 
  HouseJoinRequest, 
  ChoreRequest, 
  NudgeRequest, 
  UpdateBalanceRequest,
  ApiResponse,
  House,
  User,
  Chore
} from './types';
import { v4 as uuidv4 } from 'uuid';
import nodemailer from 'nodemailer';

// Import route modules
import choreRoutes from './routes/chores';
import userRoutes from './routes/user';
import expenseRoutes from './routes/expenses';
import groceryRoutes from './routes/groceries';
import calendarRoutes from './routes/calendar';

// Load environment variables
dotenv.config();

/**
 * Express App Configuration
 * This creates and configures our Express.js server
 */
const app = express();
const PORT = process.env.PORT || 8000;

/**
 * Middleware Configuration
 */
// Parse JSON requests
app.use(express.json());

// Enable CORS for frontend requests
app.use(cors({
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
const emailTransporter = nodemailer.createTransport({
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
app.get('/', (req: Request, res: Response) => {
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
app.post('/nudge/send', async (req: Request, res: Response): Promise<void> => {
  try {
    const { recipient_email }: NudgeRequest = req.body;
    
    if (!recipient_email) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'recipient_email is required'
      });
      return;
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
    
  } catch (error) {
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
app.get('/user/info/:email', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { email } = req.params;
    
    if (!email) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Email parameter is required'
      });
      return;
    }

    // Query Firestore for user by email
    const usersRef = db.collection('users');
    const query = await usersRef.where('email', '==', email).limit(1).get();

    if (query.empty) {
      res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
      return;
    }

    const userData = query.docs[0].data();
    
    res.json({
      message: 'User found',
      data: userData
    });
    
  } catch (error) {
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
app.post('/house/create', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { house_name }: HouseCreateRequest = req.body;
    const user = req.user!; // We know user exists due to auth middleware
    
    if (!house_name || house_name.trim().length === 0) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'house_name is required and cannot be empty'
      });
      return;
    }

    // Generate unique identifiers
    const houseId = uuidv4();
    const joinCode = uuidv4().substring(0, 6).toUpperCase(); // 6-character join code
    
    const houseData: House = {
      house_id: houseId,
      house_name: house_name.trim(),
      join_code: joinCode,
      owner_uid: user.uid,
      owner_email: user.email,
      members: [user.email], // Creator is the first member
      created_at: new Date()
    };

    // Save house to Firestore
    await db.collection('houses').doc(houseId).set(houseData);
    
    // Update user document with house_id
    await db.collection('users').doc(user.uid).set({ house_id: houseId }, { merge: true });

    console.log(`🏠 House "${house_name}" created by ${user.email} with join code: ${joinCode}`);
    
    res.status(201).json({
      message: 'House created successfully!',
      data: {
        house_id: houseId,
        join_code: joinCode,
        house_name: house_name
      }
    });
    
  } catch (error) {
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
app.post('/house/join', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { join_code }: HouseJoinRequest = req.body;
    const user = req.user!;
    
    if (!join_code || join_code.trim().length === 0) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'join_code is required'
      });
      return;
    }

    // Find house by join code
    const housesRef = db.collection('houses');
    const query = await housesRef.where('join_code', '==', join_code.trim().toUpperCase()).limit(1).get();

    if (query.empty) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Invalid join code. Please check the code and try again.'
      });
      return;
    }

    const houseDoc = query.docs[0];
    const houseData = houseDoc.data() as House;

    // Check if user is already a member
    if (houseData.members.includes(user.email)) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'You are already a member of this house'
      });
      return;
    }

    // Add user to house members
    const updatedMembers = [...houseData.members, user.email];
    
    await db.collection('houses').doc(houseDoc.id).update({ 
      members: updatedMembers 
    });
    
    // Update user document with house_id
    await db.collection('users').doc(user.uid).set({ house_id: houseDoc.id }, { merge: true });

    console.log(`🚪 User ${user.email} joined house: ${houseData.house_name}`);
    
    res.json({
      message: 'Successfully joined house!',
      data: {
        house_id: houseDoc.id,
        house_name: houseData.house_name,
        join_code: houseData.join_code,
        members: updatedMembers
      }
    });
    
  } catch (error) {
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
app.get('/house/my-house', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    
    // Get user document to find house_id
    const userDoc = await db.collection('users').doc(user.uid).get();
    
    if (!userDoc.exists) {
      res.status(404).json({
        error: 'Not Found',
        message: 'User not found in database'
      });
      return;
    }

    const userData = userDoc.data();
    const houseId = userData?.house_id;
    
    if (!houseId) {
      res.status(404).json({
        error: 'Not Found',
        message: 'User is not in a house. Please create or join a house first.'
      });
      return;
    }

    // Get house document
    const houseDoc = await db.collection('houses').doc(houseId).get();
    
    if (!houseDoc.exists) {
      res.status(404).json({
        error: 'Not Found',
        message: 'House not found'
      });
      return;
    }

    const houseData = houseDoc.data() as House;
    
    // Fetch detailed information for each member
    const memberDetails: User[] = [];

    
    for (const email of houseData.members) {
      // Get user details
      const userQuery = await db.collection('users').where('email', '==', email).limit(1).get();
      
      if (!userQuery.empty) {
        const userDetails = userQuery.docs[0].data() as User;
        
        // Fetch chores assigned to this user
        const choresQuery = await db.collection('chores')
          .where('user_email', '==', email)
          .get();
        
        const userChores: Chore[] = choresQuery.docs.map(doc => ({
          ...doc.data() as Chore,
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

    console.log(responseData);
    
    res.json({
      message: 'House details retrieved successfully',
      data: responseData
    });
    
  } catch (error) {
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
app.use('/chores', choreRoutes);
app.use('/user', userRoutes);
app.use('/expense', expenseRoutes);
app.use('/grocery', groceryRoutes);
app.use('/calendar', calendarRoutes);
/**
 * Start the Express server
 */
app.listen(PORT, () => {
  console.log(`🚀 Roomiez TypeScript Backend running on port ${PORT}`);
  console.log(`📝 API documentation available at http://localhost:${PORT}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
}); 