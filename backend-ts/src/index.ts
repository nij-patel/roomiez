import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import compression from 'compression';
import { authenticateUser, AuthenticatedRequest } from './middleware/auth';
import { db } from './config/firebase';
import { logSystem, logAPI, logAuth, logBusiness } from './utils/logger';
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
import { 
  HouseCreateSchema, 
  HouseJoinSchema, 
  NudgeSchema, 
  validateRequest 
} from './utils/validation';
import { globalErrorHandler, notFoundHandler } from './middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';
import nodemailer from 'nodemailer';

// Import route modules
import choreRoutes from './routes/chores';
import userRoutes from './routes/user';
import expenseRoutes from './routes/expenses';
import groceryRoutes from './routes/groceries';
import calendarRoutes from './routes/calendar';

// Load environment variables from root directory
dotenv.config({ path: '../.env' });

/**
 * Express App Configuration
 * This creates and configures our Express.js server
 */
const app = express();
const PORT = process.env.PORT || 8000;

/**
 * Middleware Configuration
 */
// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for Firebase compatibility
}));

// Compression middleware for better performance
app.use(compression());

// Parse JSON requests with size limit
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Enable CORS for frontend requests
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? [process.env.FRONTEND_URL || 'https://your-domain.com']
  : ['http://localhost:3000', 'http://localhost:8000'];

app.use(cors({
  origin: allowedOrigins,
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
 * Request logging middleware
 */
app.use((req: Request, res: Response, next) => {
  const start = Date.now();
  
  // Log the request
  logAPI.request(req.method, req.path, (req as any).user?.email);
  
  // Override res.json to log response
  const originalJson = res.json;
  res.json = function(body) {
    const duration = Date.now() - start;
    logAPI.response(req.method, req.path, res.statusCode, duration);
    return originalJson.call(this, body);
  };
  
  next();
});

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
app.post('/nudge/send', validateRequest(NudgeSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { recipient_email }: NudgeRequest = req.body;
    // Validation is now handled by middleware, so we can trust the data

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

    logBusiness.nudgeSent(recipient_email);
    
    res.json({ 
      message: 'Nudge sent successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logAPI.error('POST', '/nudge/send', error instanceof Error ? error.message : String(error));
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
    logAPI.error('GET', `/user/info/${req.params.email}`, error instanceof Error ? error.message : String(error));
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
app.post('/house/create', authenticateUser, validateRequest(HouseCreateSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { house_name }: HouseCreateRequest = req.body;
    const user = req.user!; // We know user exists due to auth middleware
    // Validation is now handled by middleware, so we can trust the data

    // Check if user is already in a house
    const userDoc = await db.collection('users').doc(user.uid).get();
    const userData = userDoc.data();
    
    if (userData?.house_id) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'You are already in a house. Leave your current house before creating a new one.'
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

    logBusiness.houseCreated(house_name, user.email, joinCode);
    
    res.status(201).json({
      message: 'House created successfully!',
      data: {
        house_id: houseId,
        join_code: joinCode,
        house_name: house_name
      }
    });
    
  } catch (error) {
    logAPI.error('POST', '/house/create', error instanceof Error ? error.message : String(error));
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
app.post('/house/join', authenticateUser, validateRequest(HouseJoinSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { join_code }: HouseJoinRequest = req.body;
    const user = req.user!;
    // Validation is now handled by middleware, so we can trust the data

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

    logBusiness.houseJoined(houseData.house_name, user.email);
    
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
    logAPI.error('POST', '/house/join', error instanceof Error ? error.message : String(error));
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

    res.json({
      message: 'House details retrieved successfully',
      data: responseData
    });
    
  } catch (error) {
    logAPI.error('GET', '/house/my-house', error instanceof Error ? error.message : String(error));
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
 * Error Handling Middleware
 * These must be last!
 */
app.use(notFoundHandler);
app.use(globalErrorHandler);

/**
 * Start the Express server
 */
app.listen(PORT, () => {
  const env = process.env.NODE_ENV || 'development';
  logSystem.startup(Number(PORT), env);
}); 