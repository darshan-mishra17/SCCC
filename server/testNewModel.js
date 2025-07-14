import mongoose from 'mongoose';
import NewChatSession from './testNewChatSession.js';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

async function testNewSessionModel() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Test the new model
    const sessionWithService = await NewChatSession.create({
      sessionId: 'new_test_123',
      userId: new mongoose.Types.ObjectId(),
      title: 'New Session Test',
      status: 'draft',
      servicesData: [
        {
          name: 'Test Service',
          type: 'test',
          config: { instanceType: 'test.medium', count: 1 },
          monthlyCost: 100,
          selected: true
        }
      ],
      pricing: {
        subtotal: 100,
        vat: 15,
        total: 115,
        currency: 'SAR'
      }
    });
    
    console.log('✅ Created new session with services successfully!');
    console.log('Session ID:', sessionWithService.sessionId);
    console.log('Services:', sessionWithService.servicesData);
    console.log('Pricing:', sessionWithService.pricing);

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

testNewSessionModel();
