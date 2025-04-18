import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';

// Load env vars
dotenv.config();

// Connect to DB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/appraisal-tracker');

const createAdmin = async () => {
  try {
    // Check if admin already exists
    const adminExists = await User.findOne({ email: 'admin@example.com' });
    
    if (adminExists) {
      console.log('Admin already exists');
      mongoose.disconnect();
      return;
    }

    // Create admin user
    const admin = await User.create({
      name: 'Administrator',
      email: 'admin@example.com',
      password: 'admin123',
      role: 'admin',
      status: 'active'
    });

    console.log('Admin user created:', admin.name);
    console.log('Email: admin@example.com');
    console.log('Password: admin123');
    mongoose.disconnect();
  } catch (error) {
    console.error('Error creating admin:', error);
    mongoose.disconnect();
    process.exit(1);
  }
};

// Run the function and handle any unhandled promise rejections
createAdmin().catch(err => {
  console.error('Unhandled Promise Rejection:', err);
  mongoose.disconnect();
  process.exit(1);
}); 