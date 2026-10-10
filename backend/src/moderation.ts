import { Router } from 'express';
import { prisma } from './prisma';
import { z } from 'zod';
import { requireAuth, AuthRequest } from './middleware';
import { getStandingSnapshot, evaluateStanding } from './standing';

const router = Router();

const AppealSchema = z.object({
  message: z.string().trim().min(10).max(1000),
});

/**
 * GET /moderation/standing
 * The current user's trust & safety snapshot plus recent decisions against them.
 */
router.get('/standing', requireAuth, async (req: AuthRequest, res: any): Promise<any> => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    // Refresh standing first so an expired suspension is lifted and freshly
    // breached thresholds surface immediately.
    await evaluateStanding(prisma, userId);
    const standing = await getStandingSnapshot(prisma, userId);
    if (!standing) return res.status(404).json({ error: 'User not found' });

    const [recentActions, pendingAppeal] = await Promise.all([
      prisma.moderationAction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, action: true, reason: true, createdAt: true },
      }),
      prisma.appeal.findFirst({ where: { userId, status: 'OPEN' }, select: { id: true, message: true, createdAt: true } }),
    ]);

    res.json({ standing, recentActions, pendingAppeal });
  } catch (error) {
    console.error('Get standing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /moderation/notifications
 */
router.get('/notifications', requireAuth, async (req: AuthRequest, res: any): Promise<any> => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    const unread = notifications.filter((n) => !n.read).length;
    res.json({ notifications, unread });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /moderation/notifications/:id/read
 */
router.post('/notifications/:id/read', requireAuth, async (req: AuthRequest, res: any): Promise<any> => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const notification = await prisma.notification.findUnique({ where: { id: req.params.id as string } });
    if (!notification || notification.userId !== userId) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    await prisma.notification.update({ where: { id: notification.id }, data: { read: true } });
    res.json({ message: 'Marked as read' });
  } catch (error) {
    console.error('Read notification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /moderation/notifications/read-all
 */
router.post('/notifications/read-all', requireAuth, async (req: AuthRequest, res: any): Promise<any> => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    await prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Read all notifications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /moderation/appeals
 * A user (even banned) can appeal. Only one open appeal at a time.
 * Note: intentionally does NOT require an active account.
 */
router.post('/appeals', requireAuth, async (req: AuthRequest, res: any): Promise<any> => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const data = AppealSchema.parse(req.body);

    const existing = await prisma.appeal.findFirst({ where: { userId, status: 'OPEN' } });
    if (existing) {
      return res.status(409).json({ error: 'You already have an open appeal under review.' });
    }

    const appeal = await prisma.appeal.create({ data: { userId, message: data.message } });

    // Let admins know there's something to review.
    await prisma.notification.create({
      data: {
        userId,
        type: 'APPEAL',
        title: 'Appeal submitted',
        body: 'Thanks — our team will review your appeal and get back to you.',
      },
    });

    res.status(201).json({ message: 'Appeal submitted', appeal: { id: appeal.id, status: appeal.status, createdAt: appeal.createdAt } });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.issues });
    console.error('Submit appeal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /moderation/appeals/me
 */
router.get('/appeals/me', requireAuth, async (req: AuthRequest, res: any): Promise<any> => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const appeals = await prisma.appeal.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
    res.json({ appeals });
  } catch (error) {
    console.error('Get appeals error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;