import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from './prisma';
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_change_in_production';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction): any => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
    };
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction): any => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  next();
};

/**
 * Use AFTER requireAuth. Loads the user's trust & safety status from the
 * database (JWTs are stateless and valid for 7 days, so a ban must be enforced
 * per request, not just at login) and blocks suspended/banned accounts from
 * taking any new action.
 */
export const requireActiveUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<any> => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { accountStatus: true, suspendedUntil: true },
    });
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    if (user.accountStatus === 'BANNED') {
      return res.status(403).json({
        error: 'Your account has been banned. You can submit an appeal from the app.',
        code: 'ACCOUNT_BANNED',
      });
    }

    if (user.accountStatus === 'SUSPENDED') {
      if (!user.suspendedUntil || user.suspendedUntil > new Date()) {
        return res.status(403).json({
          error: 'Your account is temporarily suspended. You cannot start new activity right now.',
          code: 'ACCOUNT_SUSPENDED',
          suspendedUntil: user.suspendedUntil,
        });
      }
      // Suspension expired – lift it lazily so the user isn't stuck.
      await prisma.user.update({
        where: { id: userId },
        data: { accountStatus: 'ACTIVE', suspendedUntil: null, standingUpdatedAt: new Date() },
      });
    }

    next();
  } catch (error) {
    console.error('requireActiveUser error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
