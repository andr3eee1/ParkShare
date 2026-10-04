import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRouter from './auth';

dotenv.config();

const app = express();
const port = process.env.PORT || 8745;

app.use(cors());
app.use(express.json());

app.use('/auth', authRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
});
