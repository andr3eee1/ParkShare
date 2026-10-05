import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest } from './middleware';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

const CreateBookingSchema = z.object({
  spotId: z.string().uuid(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  totalPrice: z.number().positive(),
  paymentMethod: z.enum(['wallet', 'card']) // for logging/logic
});

// Create a new booking
router.post('/', requireAuth, async (req: AuthRequest, res: any): Promise<any> => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const data = CreateBookingSchema.parse(req.body);

    const result = await prisma.$transaction(async (tx) => {
      // Verify spot exists
      const spot = await tx.parkingSpot.findUnique({ where: { id: data.spotId } });
      if (!spot) throw new Error('Spot not found');

      // Verify availability (simplistic check for overlapping reservations)
      const overlapping = await tx.reservation.findFirst({
        where: {
          spotId: data.spotId,
          status: 'ACTIVE',
          AND: [
            { startTime: { lt: new Date(data.endTime) } },
            { endTime: { gt: new Date(data.startTime) } }
          ]
        }
      });
      if (overlapping) throw new Error('Spot is already booked for this time period');

      // If paying with wallet, deduct from user and add to provider
      if (data.paymentMethod === 'wallet') {
        const user = await tx.user.findUnique({ where: { id: userId } });
        if (!user || user.walletBalance < data.totalPrice) {
          throw new Error('Insufficient wallet balance');
        }

        // Deduct from buyer
        await tx.user.update({
          where: { id: userId },
          data: { walletBalance: { decrement: data.totalPrice } }
        });

        // Add to provider (assuming 10% platform fee)
        const providerCut = data.totalPrice * 0.9;
        await tx.user.update({
          where: { id: spot.ownerId },
          data: { walletBalance: { increment: providerCut } }
        });
      }

      // Create reservation
      const reservation = await tx.reservation.create({
        data: {
          spotId: data.spotId,
          userId,
          startTime: new Date(data.startTime),
          endTime: new Date(data.endTime),
          totalPrice: data.totalPrice,
          status: 'ACTIVE'
        },
        include: { spot: true }
      });

      return reservation;
    });

    res.json({ message: 'Booking successful', reservation: result });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.issues });
    if (error.message === 'Insufficient wallet balance' || error.message === 'Spot is already booked for this time period' || error.message === 'Spot not found') {
      return res.status(400).json({ error: error.message });
    }
    console.error('Booking error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's bookings
router.get('/me', requireAuth, async (req: AuthRequest, res: any): Promise<any> => {
  try {
    const userId = req.user?.userId;
    const bookings = await prisma.reservation.findMany({
      where: { userId },
      include: { spot: true },
      orderBy: { startTime: 'desc' }
    });
    res.json({ bookings });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get provider's spot bookings
router.get('/provider', requireAuth, async (req: AuthRequest, res: any): Promise<any> => {
  try {
    const userId = req.user?.userId;


    const bookings = await prisma.reservation.findMany({
      where: { spot: { ownerId: userId } },
      include: { spot: true, user: { select: { firstName: true, lastName: true, avatarUrl: true } } },
      orderBy: { startTime: 'desc' }
    });
    res.json({ bookings });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
