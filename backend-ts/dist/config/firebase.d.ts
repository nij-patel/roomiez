import * as admin from 'firebase-admin';
import { DecodedToken } from '../types';
export declare const db: admin.firestore.Firestore;
export declare const auth: import("firebase-admin/auth").Auth;
export declare const verifyFirebaseToken: (token: string) => Promise<DecodedToken | null>;
export declare const getUserDoc: (uid: string) => Promise<admin.firestore.DocumentSnapshot<admin.firestore.DocumentData, admin.firestore.DocumentData>>;
export declare const getHouseDoc: (houseId: string) => Promise<admin.firestore.DocumentSnapshot<admin.firestore.DocumentData, admin.firestore.DocumentData>>;
//# sourceMappingURL=firebase.d.ts.map