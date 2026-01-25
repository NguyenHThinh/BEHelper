import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.route';
import openaiRoutes from './routes/openai.route';

const app = express();

app.use(cors({
    origin: process.env.FRONTEND_URL as string,
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRoutes);
app.use('/api/openai', openaiRoutes);

export default app;