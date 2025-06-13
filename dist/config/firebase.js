"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHouseDoc = exports.getUserDoc = exports.verifyFirebaseToken = exports.auth = exports.db = void 0;
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-admin/firestore");
const auth_1 = require("firebase-admin/auth");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load environment variables
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../.env') });
/**
 * Initialize Firebase Admin SDK
 * This handles authentication and Firestore database access
 */
const initializeFirebase = () => {
    const firebaseSecret = process.env.FIREBASE_ADMIN_SDK;
    if (!firebaseSecret) {
        throw new Error('FIREBASE_ADMIN_SDK is not set in .env file');
    }
    try {
        // Parse the Firebase service account JSON
        const firebaseConfig = JSON.parse(firebaseSecret);
        // Initialize Firebase only if it hasn't been initialized yet
        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert(firebaseConfig),
            });
            console.log('✅ Firebase Admin SDK initialized successfully');
        }
    }
    catch (error) {
        if (error instanceof SyntaxError) {
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
exports.db = (0, firestore_1.getFirestore)();
/**
 * Firebase Auth instance
 * Used for token verification
 */
exports.auth = (0, auth_1.getAuth)();
/**
 * Verify Firebase Auth token
 * This function validates the JWT token sent from the frontend
 * and returns the decoded user information
 *
 * @param token - The Firebase ID token from the frontend
 * @returns Promise<DecodedToken | null> - Decoded user info or null if invalid
 */
const verifyFirebaseToken = async (token) => {
    try {
        // Verify the ID token using Firebase Admin SDK
        const decodedToken = await exports.auth.verifyIdToken(token);
        console.log(`✅ Token verified for user: ${decodedToken.email}`);
        return {
            uid: decodedToken.uid,
            email: decodedToken.email,
            name: decodedToken.name,
            ...decodedToken // Include any additional claims
        };
    }
    catch (error) {
        console.error('❌ Token verification failed:', error);
        return null;
    }
};
exports.verifyFirebaseToken = verifyFirebaseToken;
/**
 * Helper function to get a user document from Firestore by UID
 * @param uid - Firebase user UID
 * @returns Promise<admin.firestore.DocumentSnapshot>
 */
const getUserDoc = async (uid) => {
    return await exports.db.collection('users').doc(uid).get();
};
exports.getUserDoc = getUserDoc;
/**
 * Helper function to get a house document from Firestore by house ID
 * @param houseId - House ID
 * @returns Promise<admin.firestore.DocumentSnapshot>
 */
const getHouseDoc = async (houseId) => {
    return await exports.db.collection('houses').doc(houseId).get();
};
exports.getHouseDoc = getHouseDoc;
