// db.js (ESM)
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { seedDatabase } from './seedDatabase.js';
import Service from './models/Service.js';
dotenv.config();

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    await mongoose.connect(uri);
    console.log('✅ MongoDB connected successfully');
    
    // Check if database has services, if not, seed it
    const serviceCount = await Service.countDocuments();
    if (serviceCount === 0) {
      console.log('🌱 Database is empty, seeding with initial services...');
      await seedDatabase();
    } else {
      console.log(`📊 Database contains ${serviceCount} services`);
    }
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

export default connectDB;
