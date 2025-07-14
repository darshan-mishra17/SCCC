import mongoose from 'mongoose';
import ChatSession from './models/ChatSession.js';
import ChatMessage from './models/ChatMessage.js';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

async function testChatSessionFunctionality() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clean up any existing test data
    await ChatSession.deleteMany({ sessionId: /^test_/ });
    await ChatMessage.deleteMany({ sessionId: /^test_/ });

    // Create a test user if needed
    let testUser = await User.findOne({ email: 'test@example.com' });
    if (!testUser) {
      testUser = new User({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'testpassword123'
      });
      await testUser.save();
      console.log('✅ Created test user');
    }

    // Test creating a chat session
    const testSession = new ChatSession({
      sessionId: 'test_session_123',
      userId: testUser._id,
      title: 'Test ECS Configuration',
      status: 'in-progress'
    });
    await testSession.save();
    console.log('✅ Created test chat session:', testSession.sessionId);

    // Test adding messages
    const userMessage = new ChatMessage({
      sessionId: 'test_session_123',
      userId: testUser._id,
      messageType: 'user',
      content: 'I need help setting up ECS instances'
    });
    await userMessage.save();

    const aiMessage = new ChatMessage({
      sessionId: 'test_session_123',
      userId: testUser._id,
      messageType: 'ai',
      content: 'I can help you set up ECS instances. What type of workload will you be running?',
      metadata: {
        promptType: 'service_inquiry',
        processingTimeMs: 150
      }
    });
    await aiMessage.save();

    console.log('✅ Added test messages');

    // Update session with services and pricing
    const updatedSession = await ChatSession.findById(testSession._id);
    updatedSession.services.push({
      name: 'Elastic Compute Service (ECS)',
      type: 'ecs',
      config: { instanceType: 'ecs.g6.large', count: 2, diskSize: 100 },
      monthlyCost: 450,
      selected: true
    });
    updatedSession.pricing = {
      subtotal: 450,
      vat: 67.5,
      total: 517.5,
      currency: 'SAR'
    };
    updatedSession.status = 'completed';
    updatedSession.messageCount = 2;
    updatedSession.lastMessage = 'Configuration complete! Total monthly cost: SAR 517.50';
    await updatedSession.save();

    console.log('✅ Updated session with services and pricing');

    // Test retrieving chat sessions for user
    const userSessions = await ChatSession.find({ userId: testUser._id, isActive: true })
      .sort({ updatedAt: -1 });
    
    console.log('📋 User chat sessions:', userSessions.length);
    userSessions.forEach(session => {
      console.log(`  - ${session.title} (${session.status}) - ${session.estimatedCost}`);
    });

    // Test retrieving messages for a session
    const sessionMessages = await ChatMessage.find({ 
      sessionId: 'test_session_123',
      isDeleted: false 
    }).sort({ sequenceNumber: 1 });

    console.log('💬 Session messages:', sessionMessages.length);
    sessionMessages.forEach(message => {
      console.log(`  ${message.sequenceNumber}. [${message.messageType.toUpperCase()}] ${message.content}`);
    });

    console.log('🎉 All chat session tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

testChatSessionFunctionality();
