import dotenv from 'dotenv';
import app from './app';
import connectDB from './config/db';

dotenv.config();
connectDB();

app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});