import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest, requireAdmin, requireAuth } from './middleware';

const router = Router();
const prisma = new PrismaClient();

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
  res.json({ available: false, reports: [], reason: 'Reports are not persisted in the current database schema.' });
});

export default router;