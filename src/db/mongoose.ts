import mongoose from 'mongoose';
import logger from '../utils/logger';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/nest-iq';


export default async function connectDB(): Promise<void> {
  try {
    mongoose.set('strictQuery', true);

    logger.info('🟡 Connecting to MongoDB...');

    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of hanging
      connectTimeoutMS: 10000,
    });

    logger.info('✅ MongoDB connection established successfully');
    console.log('✅ MongoDB connected successfully at:', MONGO_URI);

    mongoose.connection.on('connected', () => {
      logger.info('🟢 Mongoose connected to database');
      console.log('🟢 Mongoose connected to database');
    });

    mongoose.connection.on('error', (err) => {
      logger.error('🔴 Mongoose connection error:', err);
      console.error('🔴 Mongoose connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('🟠 Mongoose disconnected');
      console.warn('🟠 Mongoose disconnected');
    });

    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('🔵 Mongoose connection closed due to app termination');
      console.log('🔵 MongoDB connection closed. Exiting app...');
      process.exit(0);
    });
  } catch (err: any) {
    logger.error('❌ MongoDB connection failed', err);
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1); // Exit on fatal DB connection failure
  }
}
