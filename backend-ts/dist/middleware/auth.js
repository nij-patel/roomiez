"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.authenticateUser = void 0;
const firebase_1 = require("../config/firebase");
const authenticateUser = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(403).json({
                error: 'Unauthorized',
                message: 'Missing or invalid Authorization header. Expected format: "Bearer <token>"'
            });
            return;
        }
        const token = authHeader.split(' ')[1];
        if (!token) {
            res.status(403).json({
                error: 'Unauthorized',
                message: 'No token provided'
            });
            return;
        }
        const decodedToken = await (0, firebase_1.verifyFirebaseToken)(token);
        if (!decodedToken) {
            res.status(401).json({
                error: 'Invalid token',
                message: 'The provided token is invalid or expired'
            });
            return;
        }
        req.user = decodedToken;
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
        next();
    }
    catch (error) {
        console.error('⚠️ Optional auth error:', error);
        next();
    }
};
exports.optionalAuth = optionalAuth;
//# sourceMappingURL=auth.js.map