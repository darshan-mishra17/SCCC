import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  console.log('✅ Connected to MongoDB');
  
  const userCount = await User.countDocuments();
  console.log(`👥 Total users in database: ${userCount}`);
  
  if (userCount > 0) {
    const users = await User.find({}, 'firstName lastName email createdAt');
    console.log('\n📋 Users in database:');
    users.forEach(user => {
      console.log(`- ${user.firstName} ${user.lastName} (${user.email}) - Created: ${user.createdAt}`);
    });
  } else {
    console.log('🔍 No users found yet. The users collection will be created when the first user signs up.');
  }
  
  mongoose.disconnect();
  console.log('✅ Database check complete');
}).catch(error => {
  console.error('❌ Database connection error:', error.message);
});
