import { Router } from 'express';
import { prisma } from './prisma';
import { requireAuth, AuthRequest } from './middleware';
import { z } from 'zod';

const router = Router();

// Get all active passes for the user
router.get('/', requireAuth, async (req: AuthRequest, res: any): Promise<any> => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const passes = await prisma.userPass.findMany({
      where: { userId }
    });

    res.json({ passes });
  } catch (error) {
    console.error('Get passes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Toggle a pass for the user (in a real app, this would involve Stripe/payment verification)
const TogglePassSchema = z.object({
  passKind: z.string()
});

router.post('/toggle', requireAuth, async (req: AuthRequest, res: any): Promise<any> => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { passKind } = TogglePassSchema.parse(req.body);

    const existingPass = await prisma.userPass.findUnique({
      where: {
        userId_passKind: {
          userId,
          passKind
        }
      }
    });

    if (existingPass) {
      // User has it, so "toggle" means remove it
      await prisma.userPass.delete({
        where: { id: existingPass.id }
      });
      res.json({ message: 'Pass removed successfully', status: 'removed' });
    } else {
      // User doesn't have it, so add it
      await prisma.userPass.create({
        data: {
          userId,
          passKind,
          // activeUntil could be set to 1 month from now
          activeUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      });
      res.json({ message: 'Pass added successfully', status: 'added' });
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    console.error('Toggle pass error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
