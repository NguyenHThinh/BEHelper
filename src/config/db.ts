import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI as string);

        console.log('Connected to MongoDB');
        console.log('DB name: ', mongoose.connection.db?.databaseName);
        console.log('DB host: ', mongoose.connection.host);

    } catch (error) {
        console.error('Error connecting to MongoDB', error);
        process.exit(1);
    }
};

export default connectDB;