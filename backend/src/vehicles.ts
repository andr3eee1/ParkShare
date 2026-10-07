import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from './middleware';

const router = Router();
const prisma = new PrismaClient();

// Get user's vehicles
router.get('/', requireAuth, async (req: any, res: any) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ vehicles });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
});

// Add a vehicle
router.post('/', requireAuth, async (req: any, res: any) => {
  try {
    const { name, plate, isDefault } = req.body;
    if (!name || !plate) {
      return res.status(400).json({ error: 'Name and plate are required' });
    }

    if (isDefault) {
      await prisma.vehicle.updateMany({
        where: { userId: req.user.userId },
        data: { isDefault: false }
      });
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        name,
        plate,
        isDefault: isDefault || false,
        userId: req.user.userId
      }
    });

    res.status(201).json({ vehicle });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add vehicle' });
  }
});

// Update a vehicle
router.put('/:id', requireAuth, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { name, plate, isDefault } = req.body;

    const existing = await prisma.vehicle.findUnique({ where: { id } });
    if (!existing || existing.userId !== req.user.userId) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    if (isDefault) {
      await prisma.vehicle.updateMany({
        where: { userId: req.user.userId, id: { not: id } },
        data: { isDefault: false }
      });
    }

    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: { name, plate, isDefault }
    });

    res.json({ vehicle });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update vehicle' });
  }
});

// Delete a vehicle
router.delete('/:id', requireAuth, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const existing = await prisma.vehicle.findUnique({ where: { id } });
    if (!existing || existing.userId !== req.user.userId) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    await prisma.vehicle.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete vehicle' });
  }
});

export default router;
