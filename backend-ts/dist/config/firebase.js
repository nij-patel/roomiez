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
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../.env') });
const initializeFirebase = () => {
    const firebaseSecret = process.env.FIREBASE_ADMIN_SDK;
    if (!firebaseSecret) {
        throw new Error('FIREBASE_ADMIN_SDK is not set in .env file');
    }
    try {
        const firebaseConfig = JSON.parse(firebaseSecret);
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
initializeFirebase();
exports.db = (0, firestore_1.getFirestore)();
exports.auth = (0, auth_1.getAuth)();
const verifyFirebaseToken = async (token) => {
    try {
        const decodedToken = await exports.auth.verifyIdToken(token);
        console.log(`✅ Token verified for user: ${decodedToken.email}`);
        return {
            uid: decodedToken.uid,
            email: decodedToken.email,
            name: decodedToken.name,
            ...decodedToken
        };
    }
    catch (error) {
        console.error('❌ Token verification failed:', error);
        return null;
    }
};
exports.verifyFirebaseToken = verifyFirebaseToken;
const getUserDoc = async (uid) => {
    return await exports.db.collection('users').doc(uid).get();
};
exports.getUserDoc = getUserDoc;
const getHouseDoc = async (houseId) => {
    return await exports.db.collection('houses').doc(houseId).get();
};
exports.getHouseDoc = getHouseDoc;
//# sourceMappingURL=firebase.js.map