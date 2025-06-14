import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { DecodedToken } from '../types';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables - only needed for local development
// Railway provides environment variables directly, so this is ignored in production
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: path.join(__dirname, '../../../.env') });
  console.log('🔧 Loading .env file for local development');
} else {
  console.log('🚂 Running on Railway - using environment variables from dashboard');
}

/**
 * Initialize Firebase Admin SDK
 * This handles authentication and Firestore database access
 */
const initializeFirebase = (): void => {
  console.log('🔥 Initializing Firebase Admin SDK...');
  console.log('📊 Environment check:');
  console.log('   NODE_ENV:', process.env.NODE_ENV);
  console.log('   FIREBASE_ADMIN_SDK exists:', !!process.env.FIREBASE_ADMIN_SDK);
  
  const firebaseSecret = process.env.FIREBASE_ADMIN_SDK;
  
  if (!firebaseSecret) {
    console.error('❌ No Firebase configuration found!');
    console.error('💡 Set FIREBASE_ADMIN_SDK environment variable with your service account JSON');
    console.error('🚂 For Railway: Set this in your Railway project dashboard');
    throw new Error('Firebase configuration not found. Set FIREBASE_ADMIN_SDK environment variable');
  }

  try {
    console.log('🔄 Attempting to parse FIREBASE_ADMIN_SDK JSON...');
    // Parse the Firebase service account JSON
    const firebaseConfig = JSON.parse(firebaseSecret);
    
    // Initialize Firebase only if it hasn't been initialized yet
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(firebaseConfig),
      });
      console.log('✅ Firebase Admin SDK initialized successfully');
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.error('❌ Invalid JSON format for FIREBASE_ADMIN_SDK');
      console.error('🔍 JSON parsing error:', error.message);
      console.error('📝 First 100 chars of FIREBASE_ADMIN_SDK:', firebaseSecret.substring(0, 100));
      throw new Error('Invalid JSON format for FIREBASE_ADMIN_SDK');
    }
    throw new Error(`Failed to initialize Firebase: ${error}`);
  }
};

// Initialize Firebase
initializeFirebase();

/**
 * Firestore database instance
 * Used for all database operations
 */
export const db = getFirestore();

/**
 * Firebase Auth instance
 * Used for token verification
 */
export const auth = getAuth();

/**
 * Verify Firebase Auth token
 * This function validates the JWT token sent from the frontend
 * and returns the decoded user information
 * 
 * @param token - The Firebase ID token from the frontend
 * @returns Promise<DecodedToken | null> - Decoded user info or null if invalid
 */
export const verifyFirebaseToken = async (token: string): Promise<DecodedToken | null> => {
  try {
    // Verify the ID token using Firebase Admin SDK
    const decodedToken = await auth.verifyIdToken(token);
    
    console.log(`✅ Token verified for user: ${decodedToken.email}`);
    
    return {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      name: decodedToken.name,
    };
  } catch (error) {
    console.error('❌ Token verification failed:', error);
    return null;
  }
};

/**
 * Helper function to get a user document from Firestore by UID
 * @param uid - Firebase user UID
 * @returns Promise<admin.firestore.DocumentSnapshot>
 */
export const getUserDoc = async (uid: string) => {
  return await db.collection('users').doc(uid).get();
};

/**
 * Helper function to get a house document from Firestore by house ID
 * @param houseId - House ID
 * @returns Promise<admin.firestore.DocumentSnapshot>
 */
export const getHouseDoc = async (houseId: string) => {
  return await db.collection('houses').doc(houseId).get();
}; 