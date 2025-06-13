import { DecodedToken } from '../types';
/**
 * Firestore database instance
 * Used for all database operations
 */
export declare const db: any;
/**
 * Firebase Auth instance
 * Used for token verification
 */
export declare const auth: any;
/**
 * Verify Firebase Auth token
 * This function validates the JWT token sent from the frontend
 * and returns the decoded user information
 *
 * @param token - The Firebase ID token from the frontend
 * @returns Promise<DecodedToken | null> - Decoded user info or null if invalid
 */
export declare const verifyFirebaseToken: (token: string) => Promise<DecodedToken | null>;
/**
 * Helper function to get a user document from Firestore by UID
 * @param uid - Firebase user UID
 * @returns Promise<admin.firestore.DocumentSnapshot>
 */
export declare const getUserDoc: (uid: string) => Promise<any>;
/**
 * Helper function to get a house document from Firestore by house ID
 * @param houseId - House ID
 * @returns Promise<admin.firestore.DocumentSnapshot>
 */
export declare const getHouseDoc: (houseId: string) => Promise<any>;
//# sourceMappingURL=firebase.d.ts.map