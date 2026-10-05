import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest } from './middleware';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

const DepositSchema = z.object({
  amount: z.number().positive()
});

router.post('/deposit', requireAuth, async (req: AuthRequest, res: any): Promise<any> => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { amount } = DepositSchema.parse(req.body);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        walletBalance: {
          increment: amount
        }
      }
    });

    res.json({
      message: 'Deposit successful',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        avatarUrl: updatedUser.avatarUrl,
        role: updatedUser.role,
        walletBalance: updatedUser.walletBalance
      }
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    console.error('Deposit error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PaySchema = z.object({
  amount: z.number().positive()
});

router.post('/pay', requireAuth, async (req: AuthRequest, res: any): Promise<any> => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { amount } = PaySchema.parse(req.body);

    // We must ensure atomic check and decrement
    // Since Prisma doesn't support conditional updates directly inside update easily without finding first,
    // we use a transaction.
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error('User not found');
      if (user.walletBalance < amount) throw new Error('Insufficient wallet balance');

      return tx.user.update({
        where: { id: userId },
        data: {
          walletBalance: {
            decrement: amount
          }
        }
      });
    });

    res.json({
      message: 'Payment successful',
      user: {
        id: result.id,
        email: result.email,
        firstName: result.firstName,
        lastName: result.lastName,
        avatarUrl: result.avatarUrl,
        role: result.role,
        walletBalance: result.walletBalance
      }
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    if (error.message === 'Insufficient wallet balance') {
      return res.status(400).json({ error: error.message });
    }
    console.error('Payment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
