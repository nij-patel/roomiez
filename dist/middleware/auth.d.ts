import { Request, Response, NextFunction } from 'express';
import { DecodedToken } from '../types';
/**
 * Extended Request interface that includes the authenticated user
 * This allows us to access user data in route handlers after authentication
 */
export interface AuthenticatedRequest extends Request {
    user?: DecodedToken;
}
/**
 * Authentication middleware for Express routes
 * This middleware:
 * 1. Extracts the Authorization header
 * 2. Verifies the Firebase token
 * 3. Attaches user info to the request object
 * 4. Allows the request to continue if valid, or returns 401/403 if invalid
 *
 * Usage: app.get('/protected-route', authenticateUser, (req, res) => { ... })
 */
export declare const authenticateUser: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Optional authentication middleware
 * This middleware attempts to authenticate the user but doesn't block the request if auth fails
 * Useful for routes that work differently for authenticated vs anonymous users
 */
export declare const optionalAuth: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=auth.d.ts.map