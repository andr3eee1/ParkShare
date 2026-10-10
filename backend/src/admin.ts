import { Router } from 'express';
import { prisma } from './prisma';
import { z } from 'zod';
import { AuthRequest, requireAdmin, requireAuth } from './middleware';
import { applySanction, evaluateStanding, getStandingSnapshot } from './standing';

const router = Router();

router.use(requireAuth, requireAdmin);

const percentageChange = (current: number, previous: number): number => {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Math.round(((current - previous) / previous) * 1000) / 10;
};

const startOfDay = (date: Date): Date => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

router.get('/overview', async (req: AuthRequest, res: any): Promise<any> => {
  try {
    const now = new Date();
    const today = startOfDay(now);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [
      totalUsers,
      usersByRole,
      liveSpaces,
      unavailableSpaces,
      totalSpaces,
      todayBookings,
      reservationCounts,
      grossVolume,
      newUsersThisMonth,
      newUsersPreviousMonth,
      newSpacesThisMonth,
      newSpacesPreviousMonth,
      activePasses,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.groupBy({ by: ['role'], _count: { _all: true } }),
      prisma.parkingSpot.count({ where: { isAvailable: true } }),
      prisma.parkingSpot.count({ where: { isAvailable: false } }),
      prisma.parkingSpot.count(),
      prisma.reservation.count({ where: { startTime: { gte: today, lt: tomorrow } } }),
      prisma.reservation.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.reservation.aggregate({ _sum: { totalPrice: true } }),
      prisma.user.count({ where: { createdAt: { gte: monthStart } } }),
      prisma.user.count({ where: { createdAt: { gte: previousMonthStart, lt: monthStart } } }),
      prisma.parkingSpot.count({ where: { createdAt: { gte: monthStart } } }),
      prisma.parkingSpot.count({ where: { createdAt: { gte: previousMonthStart, lt: monthStart } } }),
      prisma.userPass.count({ where: { OR: [{ activeUntil: null }, { activeUntil: { gt: now } }] } }),
    ]);

    const byRole = usersByRole.reduce<Record<string, number>>((result, item) => {
      result[item.role] = item._count._all;
      return result;
    }, {});
    const byStatus = reservationCounts.reduce<Record<string, number>>((result, item) => {
      result[item.status] = item._count._all;
      return result;
    }, {});

    res.json({
      generatedAt: now.toISOString(),
      users: {
        total: totalUsers,
        byRole,
        changePercent: percentageChange(newUsersThisMonth, newUsersPreviousMonth),
      },
      spaces: {
        total: totalSpaces,
        live: liveSpaces,
        unavailable: unavailableSpaces,
        change: newSpacesThisMonth - newSpacesPreviousMonth,
      },
      reservations: {
        total: Object.values(byStatus).reduce((sum, count) => sum + count, 0),
        today: todayBookings,
        byStatus,
        grossVolume: grossVolume._sum.totalPrice || 0,
      },
      passes: { active: activePasses },
      limitations: {
        reports: false,
        paymentReviews: false,
        moderation: false,
      },
    });
  } catch (error) {
    console.error('Admin overview error:', error);
    res.status(500).json({ error: 'Failed to load admin overview' });
  }
});

router.get('/users', async (req: AuthRequest, res: any): Promise<any> => {
  try {
    const role = typeof req.query.role === 'string' ? req.query.role.toUpperCase() : undefined;
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const where: any = {};

    if (role && ['USER', 'PROVIDER', 'ADMIN'].includes(role)) where.role = role;
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        role: true,
        walletBalance: true,
        createdAt: true,
        trustScore: true,
        hostRating: true,
        accountStatus: true,
        suspendedUntil: true,
        warningCount: true,
        driverReviewsCount: true,
        hostReviewsCount: true,
        _count: { select: { ownedSpots: true, reservations: true, passes: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ users });
  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).json({ error: 'Failed to load users' });
  }
});

router.get('/spaces', async (req: AuthRequest, res: any): Promise<any> => {
  try {
    const availability = typeof req.query.availability === 'string' ? req.query.availability : 'all';
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const where: any = {};

    if (availability === 'live') where.isAvailable = true;
    if (availability === 'unavailable') where.isAvailable = false;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { owner: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const spaces = await prisma.parkingSpot.findMany({
      where,
      include: {
        owner: { select: { id: true, firstName: true, lastName: true, email: true } },
        _count: { select: { reservations: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ spaces });
  } catch (error) {
    console.error('Admin spaces error:', error);
    res.status(500).json({ error: 'Failed to load parking spaces' });
  }
});

router.get('/bookings', async (req: AuthRequest, res: any): Promise<any> => {
  try {
    const status = typeof req.query.status === 'string' ? req.query.status.toUpperCase() : undefined;
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const where: any = {};

    if (status && ['ACTIVE', 'COMPLETED', 'CANCELLED'].includes(status)) where.status = status;
    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { spot: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const bookings = await prisma.reservation.findMany({
      where,
      include: {
        spot: { select: { id: true, name: true, price: true, owner: { select: { id: true, firstName: true, lastName: true } } } },
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
      orderBy: { startTime: 'desc' },
    });

    res.json({ bookings });
  } catch (error) {
    console.error('Admin bookings error:', error);
    res.status(500).json({ error: 'Failed to load bookings' });
  }
});

router.get('/reports', async (_req, res) => {
  try {
    const reports = await prisma.report.findMany({
      include: {
        reporter: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    const formatted = reports.map(r => ({
      id: r.id,
      title: r.title,
      description: r.description,
      status: r.status,
      reporterName: `${r.reporter.firstName} ${r.reporter.lastName}`,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));

    res.json({ available: true, reports: formatted });
  } catch (error) {
    console.error('Fetch reports error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const SanctionSchema = z.object({
  action: z.enum(['WARN', 'SUSPEND', 'BAN', 'REINSTATE']),
  reason: z.string().trim().max(500).optional(),
  durationDays: z.number().int().min(1).max(365).optional(),
});

/**
 * GET /admin/users/:id/standing
 * Full trust & safety picture for a user (refreshes standing first).
 */
router.get('/users/:id/standing', async (req: AuthRequest, res: any): Promise<any> => {
  try {
    const userId = req.params.id as string;
    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, firstName: true, lastName: true, email: true, role: true },
    });
    if (!target) return res.status(404).json({ error: 'User not found' });

    await evaluateStanding(prisma, userId);
    const [standing, actions, appeals] = await Promise.all([
      getStandingSnapshot(prisma, userId),
      prisma.moderationAction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: { actor: { select: { firstName: true, lastName: true } } },
      }),
      prisma.appeal.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
    ]);

    res.json({ user: target, standing, actions, appeals });
  } catch (error) {
    console.error('Admin standing error:', error);
    res.status(500).json({ error: 'Failed to load standing' });
  }
});

/**
 * POST /admin/users/:id/sanction
 * Manual moderation: WARN || SUSPEND || BAN || REINSTATE.
 */
router.post('/users/:id/sanction', async (req: AuthRequest, res: any): Promise<any> => {
  try {
    const userId = req.params.id as string;
    const data = SanctionSchema.parse(req.body);

    const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!target) return res.status(404).json({ error: 'User not found' });

    await applySanction(prisma, {
      userId,
      action: data.action,
      reason: data.reason,
      actorId: req.user?.userId,
      durationDays: data.durationDays,
      automated: false,
    });

    const standing = await getStandingSnapshot(prisma, userId);
    res.json({ message: `Action ${data.action} applied`, standing });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.issues });
    console.error('Admin sanction error:', error);
    res.status(500).json({ error: 'Failed to apply sanction' });
  }
});

/**
 * GET /admin/appeals?status=OPEN
 */
router.get('/appeals', async (req: AuthRequest, res: any): Promise<any> => {
  try {
    const status = typeof req.query.status === 'string' ? req.query.status.toUpperCase() : undefined;
    const appeals = await prisma.appeal.findMany({
      where: status && ['OPEN', 'APPROVED', 'REJECTED'].includes(status) ? { status } : {},
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, accountStatus: true },
        },
      },
    });
    res.json({ appeals });
  } catch (error) {
    console.error('Admin appeals error:', error);
    res.status(500).json({ error: 'Failed to load appeals' });
  }
});

const ResolveAppealSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  note: z.string().trim().max(500).optional(),
});

/**
 * POST /admin/appeals/:id/resolve
 * Approving an appeal reinstates the user; rejecting it keeps the sanction.
 */
router.post('/appeals/:id/resolve', async (req: AuthRequest, res: any): Promise<any> => {
  try {
    const data = ResolveAppealSchema.parse(req.body);
    const appeal = await prisma.appeal.findUnique({ where: { id: req.params.id as string } });
    if (!appeal) return res.status(404).json({ error: 'Appeal not found' });
    if (appeal.status !== 'OPEN') return res.status(400).json({ error: 'Appeal already resolved' });

    const updated = await prisma.appeal.update({
      where: { id: appeal.id },
      data: {
        status: data.status,
        resolutionNote: data.note ?? null,
        resolvedById: req.user?.userId ?? null,
        resolvedAt: new Date(),
      },
    });

    if (data.status === 'APPROVED') {
      await applySanction(prisma, {
        userId: appeal.userId,
        action: 'REINSTATE',
        reason: data.note || 'Your appeal was approved.',
        actorId: req.user?.userId,
        automated: false,
      });
    } else {
      await prisma.notification.create({
        data: {
          userId: appeal.userId,
          type: 'APPEAL',
          title: 'Appeal reviewed',
          body: data.note || 'After review, your appeal was not approved. The original decision stands.',
        },
      });
    }

    res.json({ message: `Appeal ${data.status.toLowerCase()}`, appeal: updated });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.issues });
    console.error('Resolve appeal error:', error);
    res.status(500).json({ error: 'Failed to resolve appeal' });
  }
});

/**
 * GET /admin/moderation
 * Recent trust & safety audit trail.
 */
router.get('/moderation', async (_req, res) => {
  try {
    const actions = await prisma.moderationAction.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        actor: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    res.json({ actions });
  } catch (error) {
    console.error('Admin moderation log error:', error);
    res.status(500).json({ error: 'Failed to load moderation log' });
  }
});

export default router;