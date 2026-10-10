import { Router, Request } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { requireAuth, AuthRequest } from './middleware';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

/**
 * Bayesian prior for a user's trust score. New users start at PRIOR_MEAN and a
 * single bad review can't instantly destroy (or a single good one inflate) a score.
 */
const PRIOR_MEAN = 5.0;
const PRIOR_WEIGHT = 2;

/** Reviews can only be submitted within this window after the booking ended. */
const REVIEW_WINDOW_DAYS = 14;

const CreateReviewSchema = z.object({
  reservationId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(500).optional(),
});

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/**
 * POST /reviews
 * - Driver reviewing a booking -> rates the parking SPOT (updates spot.rating).
 * - Spot owner reviewing a booking -> rates the DRIVER (updates user.trustScore,
 *   which drives the dynamic security deposit).
 */
router.post('/', requireAuth, async (req: AuthRequest, res: any): Promise<any> => {
  try {
    const reviewerId = req.user?.userId;
    if (!reviewerId) return res.status(401).json({ error: 'Unauthorized' });

    const data = CreateReviewSchema.parse(req.body);

    const review = await prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.findUnique({
        where: { id: data.reservationId },
        include: { spot: true },
      });
      if (!reservation) throw new HttpError(404, 'Reservation not found');
      if (reservation.status !== 'COMPLETED') {
        throw new HttpError(400, 'You can only review completed bookings');
      }
      if (reservation.endTime) {
        const ageMs = Date.now() - reservation.endTime.getTime();
        if (ageMs > REVIEW_WINDOW_DAYS * 24 * 60 * 60 * 1000) {
          throw new HttpError(400, `Reviews must be submitted within ${REVIEW_WINDOW_DAYS} days`);
        }
      }

      const isDriver = reservation.userId === reviewerId;
      const isOwner = reservation.spot.ownerId === reviewerId;
      if (!isDriver && !isOwner) throw new HttpError(403, 'You were not part of this booking');
      if (isDriver && isOwner) throw new HttpError(400, 'You cannot review your own spot');

      const newReview = await tx.review.create({
        data: {
          reviewerId,
          reservationId: reservation.id,
          rating: data.rating,
          comment: data.comment || null,
          ...(isDriver
            ? { targetSpotId: reservation.spotId }
            : { targetUserId: reservation.userId }),
        },
      });

      if (isDriver) {
        const agg = await tx.review.aggregate({
          where: { targetSpotId: reservation.spotId },
          _avg: { rating: true },
          _count: { rating: true },
        });
        await tx.parkingSpot.update({
          where: { id: reservation.spotId },
          data: {
            rating: Math.round((agg._avg.rating ?? 5) * 10) / 10,
            reviewsCount: agg._count.rating,
          },
        });
      } else {
        const agg = await tx.review.aggregate({
          where: { targetUserId: reservation.userId },
          _sum: { rating: true },
          _count: { rating: true },
        });
        const n = agg._count.rating;
        const sum = agg._sum.rating ?? 0;
        const score = (PRIOR_MEAN * PRIOR_WEIGHT + sum) / (PRIOR_WEIGHT + n);
        await tx.user.update({
          where: { id: reservation.userId },
          data: { trustScore: Math.round(score * 100) / 100 },
        });
      }

      return newReview;
    });

    res.status(201).json({ message: 'Review submitted successfully', review });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.issues });
    if (error instanceof HttpError) return res.status(error.status).json({ error: error.message });
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return res.status(409).json({ error: 'You have already reviewed this booking' });
    }
    console.error('Review submission error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /reviews/pending
 * Completed bookings (as driver or as spot owner) within the review window
 * that the current user has not reviewed yet.
 */
router.get('/pending', requireAuth, async (req: AuthRequest, res: any): Promise<any> => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const since = new Date(Date.now() - REVIEW_WINDOW_DAYS * 24 * 60 * 60 * 1000);

    const reservations = await prisma.reservation.findMany({
      where: {
        status: 'COMPLETED',
        endTime: { gte: since },
        OR: [{ userId }, { spot: { ownerId: userId } }],
        reviews: { none: { reviewerId: userId } },
      },
      include: {
        spot: { select: { id: true, name: true, ownerId: true, imageUrl: true } },
        user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
      orderBy: { endTime: 'desc' },
      take: 20,
    });

    const pending = reservations
      .filter((r) => !(r.userId === userId && r.spot.ownerId === userId))
      .map((r) => ({
        reservationId: r.id,
        endTime: r.endTime,
        role: r.userId === userId ? 'DRIVER' : 'OWNER',
        spot: r.spot,
        driver: r.user,
      }));

    res.json({ pending });
  } catch (error) {
    console.error('Error fetching pending reviews:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /reviews?spotId=...  or  /reviews?userId=...
 * Public list of reviews for a spot or user (paginated).
 */
router.get('/', async (req: Request, res: any): Promise<any> => {
  const { spotId, userId } = req.query;
  if (!spotId && !userId) {
    return res.status(400).json({ error: 'spotId or userId query parameter is required' });
  }
  const take = Math.min(Math.max(parseInt(String(req.query.limit ?? '20'), 10) || 20, 1), 50);
  const skip = Math.max(parseInt(String(req.query.offset ?? '0'), 10) || 0, 0);

  try {
    const where = {
      ...(spotId ? { targetSpotId: String(spotId) } : {}),
      ...(userId ? { targetUserId: String(userId) } : {}),
    };
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          reviewer: { select: { firstName: true, lastName: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
      prisma.review.count({ where }),
    ]);
    // Only expose last-name initial for privacy
    const sanitized = reviews.map((r) => ({
      ...r,
      reviewer: {
        firstName: r.reviewer.firstName,
        lastName: r.reviewer.lastName ? `${r.reviewer.lastName.charAt(0)}.` : '',
        avatarUrl: r.reviewer.avatarUrl,
      },
    }));
    res.json({ reviews: sanitized, total });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
