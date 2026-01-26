import dotenv from 'dotenv';

dotenv.config();

import app from './app';
import connectDB from './config/db';

connectDB();

app.listen(parseInt(process.env.PORT as string), '0.0.0.0', () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});