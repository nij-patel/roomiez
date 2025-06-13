"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.authenticateUser = void 0;
const firebase_1 = require("../config/firebase");
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
const authenticateUser = async (req, res, next) => {
    try {
        // Extract Authorization header
        const authHeader = req.headers.authorization;
        // Check if Authorization header exists and follows Bearer format
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(403).json({
                error: 'Unauthorized',
                message: 'Missing or invalid Authorization header. Expected format: "Bearer <token>"'
            });
            return;
        }
        // Extract the token (remove "Bearer " prefix)
        const token = authHeader.split(' ')[1];
        if (!token) {
            res.status(403).json({
                error: 'Unauthorized',
                message: 'No token provided'
            });
            return;
        }
        // Verify the Firebase token
        const decodedToken = await (0, firebase_1.verifyFirebaseToken)(token);
        if (!decodedToken) {
            res.status(401).json({
                error: 'Invalid token',
                message: 'The provided token is invalid or expired'
            });
            return;
        }
        // Attach user information to request object
        req.user = decodedToken;
        // Continue to the next middleware/route handler
        next();
    }
    catch (error) {
        console.error('❌ Authentication error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Authentication failed due to server error'
        });
    }
};
exports.authenticateUser = authenticateUser;
/**
 * Optional authentication middleware
 * This middleware attempts to authenticate the user but doesn't block the request if auth fails
 * Useful for routes that work differently for authenticated vs anonymous users
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const decodedToken = await (0, firebase_1.verifyFirebaseToken)(token);
            if (decodedToken) {
                req.user = decodedToken;
            }
        }
        // Always continue regardless of auth status
        next();
    }
    catch (error) {
        console.error('⚠️ Optional auth error:', error);
        // Continue even if there's an error
        next();
    }
};
exports.optionalAuth = optionalAuth;
