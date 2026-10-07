import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest } from './middleware';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

const CreateBookingSchema = z.object({
  spotId: z.string(),
  startTime: z.string().datetime(),
  paymentMethod: z.enum(['wallet', 'card']), // for logging/logic
  securityDeposit: z.number().optional().default(50.0)
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
      if (!spot) {
        if (data.spotId.startsWith('spot-')) {
          throw new Error('This is a demo spot! Please add a real spot to the map using the "My Spots" tab to test the booking engine.');
        }
        throw new Error('Spot not found');
      }

      // Verify availability: any active reservation means it's occupied
      const overlapping = await tx.reservation.findFirst({
        where: {
          spotId: data.spotId,
          status: 'ACTIVE'
        }
      });
      if (overlapping) throw new Error('Spot is currently occupied by an active reservation');

      // Deduct security deposit if paying with wallet
      if (data.paymentMethod === 'wallet') {
        const user = await tx.user.findUnique({ where: { id: userId } });
        if (!user || user.walletBalance < data.securityDeposit) {
          throw new Error('Insufficient wallet balance for security deposit');
        }

        // Deduct deposit from buyer
        await tx.user.update({
          where: { id: userId },
          data: { walletBalance: { decrement: data.securityDeposit } }
        });
        
        // We do not add to provider yet. That happens at completion.
      }

      // Create reservation
      const reservation = await tx.reservation.create({
        data: {
          spotId: data.spotId,
          userId,
          startTime: new Date(data.startTime),
          securityDeposit: data.securityDeposit,
          status: 'ACTIVE'
        },
        include: { spot: true }
      });

      return reservation;
    });

    res.json({ message: 'Booking successful', reservation: result });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.issues });
    if (error.message === 'Insufficient wallet balance for security deposit' || error.message === 'Spot is currently occupied by an active reservation' || error.message === 'Spot not found') {
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


// Cancel or End a booking
router.put('/:id/status', requireAuth, async (req: AuthRequest, res: any): Promise<any> => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    
    const { status } = req.body;
    if (!['COMPLETED', 'CANCELLED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.findUnique({ 
        where: { id: req.params.id as string },
        include: { spot: true }
      });
      if (!reservation) throw new Error('Reservation not found');
      if (reservation.userId !== userId) throw new Error('Forbidden');
      if (reservation.status !== 'ACTIVE') throw new Error('Reservation is not active');
      
      let finalPrice = 0;
      let endTime = new Date();
      
      if (status === 'COMPLETED') {
        const spot = reservation.spot;
        // Calculate duration in hours
        const durationMs = Math.max(0, endTime.getTime() - reservation.startTime.getTime());
        const durationHours = durationMs / (1000 * 60 * 60);
        finalPrice = durationHours * spot.price;
        
        const user = await tx.user.findUnique({ where: { id: userId } });
        if (!user) throw new Error('User not found');
        
        // Add back the security deposit, then subtract final cost
        let newBalance = user.walletBalance + reservation.securityDeposit - finalPrice;
        
        // If they don't have enough, we'd normally charge the card here
        // We'll just update the balance (it can go negative as debt if no card)
        // We could also check if they have a default card.
        const defaultCard = await tx.creditCard.findFirst({ where: { userId, isDefault: true } });
        if (newBalance < 0 && defaultCard) {
           // Simulate charging the card to cover the difference
           // Then balance goes back to what it was before finalPrice, up to 0.
           // Actually, simpler: we just charge the card the missing amount.
           newBalance = 0; 
        }

        await tx.user.update({
          where: { id: userId },
          data: { walletBalance: newBalance }
        });
        
        // Give provider their 90% cut
        const providerCut = finalPrice * 0.9;
        await tx.user.update({
          where: { id: spot.ownerId },
          data: { walletBalance: { increment: providerCut } }
        });
      } else if (status === 'CANCELLED') {
        // Refund the deposit entirely
        await tx.user.update({
          where: { id: userId },
          data: { walletBalance: { increment: reservation.securityDeposit } }
        });
      }

      return await tx.reservation.update({
        where: { id: req.params.id as string },
        data: { 
          status, 
          endTime, 
          totalPrice: finalPrice 
        }
      });
    });
    
    res.json({ message: 'Reservation updated', reservation: updated });
  } catch (error: any) {
    console.error('Update booking error:', error);
    if (error.message === 'Reservation not found') return res.status(404).json({ error: error.message });
    if (error.message === 'Forbidden') return res.status(403).json({ error: error.message });
    if (error.message === 'Reservation is not active') return res.status(400).json({ error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});
export default router;
