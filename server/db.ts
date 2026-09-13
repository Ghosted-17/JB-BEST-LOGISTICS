import mongoose from 'mongoose';
import { config } from './config';

let connection: Promise<typeof mongoose> | undefined;

export const connectDatabase = () => {
  if (!connection) {
    connection = mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 20,
      autoIndex: process.env.NODE_ENV !== 'production',
    });
  }
  return connection;
};
