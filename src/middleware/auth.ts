import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin';
import { DecodedIdToken } from 'firebase-admin/auth';
import { getOrCreateUser } from '../db/users';

export interface AuthRequest extends Request {
  user?: DecodedIdToken;
  dbUserId?: number;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;

    // Synchronize to Cloud SQL user record lazily
    if (decodedToken.email) {
      try {
        const dbUser = await getOrCreateUser(
          decodedToken.uid,
          decodedToken.email,
          decodedToken.name || (decodedToken as any).displayName,
          decodedToken.picture || (decodedToken as any).photoURL
        );
        if (dbUser) {
          req.dbUserId = dbUser.id;
        }
      } catch (dbErr) {
        console.warn('Cloud SQL user sync warning:', dbErr);
      }
    }

    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
};

// Optional auth helper that doesn't fail if no token
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1];
    try {
      const decodedToken = await adminAuth.verifyIdToken(token);
      req.user = decodedToken;
      if (decodedToken.email) {
        const dbUser = await getOrCreateUser(
          decodedToken.uid,
          decodedToken.email,
          decodedToken.name || (decodedToken as any).displayName,
          decodedToken.picture || (decodedToken as any).photoURL
        );
        if (dbUser) {
          req.dbUserId = dbUser.id;
        }
      }
    } catch (err) {
      // Ignored for optional
    }
  }
  next();
};
