import mongoose from 'mongoose';
import ChatSession from './models/ChatSession.js';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

async function testSimpleSession() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clean up any existing test data
    await ChatSession.deleteMany({ sessionId: /^simple_test_/ });

    // Create a simple session without services first
    const simpleSession = new ChatSession({
      sessionId: 'simple_test_456',
      userId: new mongoose.Types.ObjectId(), // Create a dummy ObjectId
      title: 'Simple Test Session',
      status: 'draft'
    });
    
    await simpleSession.save();
    console.log('✅ Created simple session successfully');

    // Now try to add one service manually
    console.log('Services field type:', typeof simpleSession.services);
    console.log('Services initial value:', simpleSession.services);
    
    // Try using create method instead
    const sessionWithService = await ChatSession.create({
      sessionId: 'simple_test_789',
      userId: new mongoose.Types.ObjectId(),
      title: 'Session with Service',
      status: 'draft',
      services: [
        {
          name: 'Test Service',
          type: 'test',
          config: { test: true },
          monthlyCost: 100,
          selected: true
        }
      ]
    });
    
    console.log('✅ Created session with service using create method');
    console.log('Services:', sessionWithService.services);

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

testSimpleSession();
