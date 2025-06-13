import express, { Response, NextFunction } from 'express';
import { DecodedToken } from '../types';
export interface AuthenticatedRequest extends express.Request {
    user?: DecodedToken;
}
export declare const authenticateUser: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const optionalAuth: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=auth.d.ts.map