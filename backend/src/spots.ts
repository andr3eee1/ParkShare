import { Router } from 'express';
import { prisma } from './prisma';
import { requireAuth, requireActiveUser, AuthRequest } from './middleware';
import { z } from 'zod';

const router = Router();

const SpotSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  latitude: z.number(),
  longitude: z.number(),
  price: z.number().positive(),
  imageUrl: z.string().url().optional()
});

// GET all spots (for map)
router.get('/', async (req, res): Promise<any> => {
  try {
    const spots = await prisma.parkingSpot.findMany({
      where: { isAvailable: true },
      include: { 
        owner: { select: { firstName: true, lastName: true } },
        reservations: {
          where: { status: 'ACTIVE' },
          select: { userId: true, endTime: true }
        }
      }
    });
    res.json({ spots });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET my spots (for providers)
router.get('/me', requireAuth, async (req: AuthRequest, res: any): Promise<any> => {
  try {
    const userId = req.user?.userId;
    const spots = await prisma.parkingSpot.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ spots });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST create a new spot
router.post('/', requireAuth, requireActiveUser, async (req: AuthRequest, res: any): Promise<any> => {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });


    const data = SpotSchema.parse(req.body);

    const spot = await prisma.parkingSpot.create({
      data: {
        ownerId: userId,
        name: data.name,
        description: data.description,
        latitude: data.latitude,
        longitude: data.longitude,
        price: data.price,
        imageUrl: data.imageUrl
      }
    });

    res.json({ message: 'Spot created', spot });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.issues });
    res.status(500).json({ error: 'Internal server error' });
  }
});// DELETE a spot
router.delete('/:id', requireAuth, async (req: AuthRequest, res: any): Promise<any> => {
  try {
    const userId = req.user?.userId;
    const spotId = req.params.id as string;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const spot = await prisma.parkingSpot.findUnique({ where: { id: spotId } });
    if (!spot) return res.status(404).json({ error: 'Spot not found' });
    if (spot.ownerId !== userId) return res.status(403).json({ error: 'Forbidden' });

    await prisma.parkingSpot.delete({ where: { id: spotId } });
    res.json({ message: 'Spot deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
