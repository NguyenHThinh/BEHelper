import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.route';
import openaiRoutes from './routes/openai.route';
import timetableRoutes from './routes/timetable.route';

const app = express();

app.use(cors({
    origin: process.env.FRONTEND_URL?.split(','),
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRoutes);
app.use('/api/openai', openaiRoutes);
app.use('/api/timetable', timetableRoutes);

export default app;