import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.route';
import openaiRoutes from './routes/openai.route';
import timetableRoutes from './routes/timetable.route';

const app = express();

app.use(cors({
    origin: (origin, callback) => {
        const allowedOrigins = process.env.FRONTEND_URL?.split(',').map(url => url.trim()) || [];
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));
app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRoutes);
app.use('/api/openai', openaiRoutes);
app.use('/api/timetable', timetableRoutes);

export default app;