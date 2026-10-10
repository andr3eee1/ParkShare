import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRouter from './auth';
import passesRouter from './passes';
import walletRouter from './wallet';
import spotsRouter from './spots';
import bookingsRouter from './bookings';
import adminRouter from './admin';
import reviewsRouter from './reviews';
import moderationRouter from './moderation';
import { prisma } from './prisma';

import vehiclesRouter from './vehicles';

dotenv.config();

const app = express();
const port = process.env.PORT || 8745;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.use('/auth', authRouter);
app.use('/passes', passesRouter);
app.use('/wallet', walletRouter);
app.use('/spots', spotsRouter);
app.use('/bookings', bookingsRouter);
app.use('/vehicles', vehiclesRouter);
app.use('/admin', adminRouter);
app.use('/reviews', reviewsRouter);
app.use('/moderation', moderationRouter);

app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: 'connected', time: new Date().toISOString() });
  } catch (error) {
    console.error('Health check database error:', error);
    res.status(503).json({ status: 'degraded', database: 'unavailable', time: new Date().toISOString() });
  }
});

app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
});
