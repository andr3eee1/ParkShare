import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRouter from './auth';
import passesRouter from './passes';
import walletRouter from './wallet';
import spotsRouter from './spots';
import bookingsRouter from './bookings';

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

app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
});
