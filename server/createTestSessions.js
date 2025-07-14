import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './models/User.js';
import ChatSession from './models/ChatSession.js';

// Load environment variables
dotenv.config({ path: '../.env' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sccc-ai-advisor';

async function createTestSessions() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find Darshan user
    const user = await User.findOne({ email: 'darshanmishra2623@gmail.com' });
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('👤 Found user:', user.firstName, user.lastName);

    // Delete existing test sessions for this user
    await ChatSession.deleteMany({ userId: user._id });
    console.log('🧹 Cleaned up existing sessions');

    // Create test session 1: ECS Configuration
    const session1 = new ChatSession({
      userId: user._id,
      title: 'ECS Configuration',
      status: 'completed',
      services: [
        {
          name: 'ECS',
          type: 'compute',
          config: {
            instanceType: 'ecs.g6.large',
            instanceCount: 2,
            region: 'riyadh'
          }
        }
      ],
      pricing: {
        subtotal: 450,
        vat: 67.5,
        total: 517.5,
        currency: 'SAR'
      },
      lastMessage: 'Your ECS configuration is ready. You can download the quote.',
      messageCount: 5
    });

    // Create test session 2: TDSQL Database Setup
    const session2 = new ChatSession({
      userId: user._id,
      title: 'TDSQL Database Setup',
      status: 'in-progress',
      services: [
        {
          name: 'TDSQL',
          type: 'database',
          config: {
            engine: 'MySQL 5.7',
            instanceSize: 'small',
            storageSize: '200',
            backupRetention: '14 days'
          }
        }
      ],
      pricing: {
        subtotal: 732,
        vat: 110,
        total: 842,
        currency: 'SAR'
      },
      lastMessage: 'Configuring your TDSQL database instance...',
      messageCount: 3
    });

    // Create test session 3: Multi-service setup
    const session3 = new ChatSession({
      userId: user._id,
      title: 'Complete Cloud Infrastructure',
      status: 'draft',
      services: [
        {
          name: 'ECS',
          type: 'compute'
        },
        {
          name: 'OSS',
          type: 'storage'
        },
        {
          name: 'TDSQL',
          type: 'database'
        }
      ],
      pricing: {
        subtotal: 1200,
        vat: 180,
        total: 1380,
        currency: 'SAR'
      },
      lastMessage: 'Planning your complete cloud infrastructure...',
      messageCount: 8
    });

    await session1.save();
    await session2.save();
    await session3.save();

    console.log('✅ Created test sessions:');
    console.log(`  - ${session1.title} (${session1.status}) - ${session1.pricing.total} SAR`);
    console.log(`  - ${session2.title} (${session2.status}) - ${session2.pricing.total} SAR`);
    console.log(`  - ${session3.title} (${session3.status}) - ${session3.pricing.total} SAR`);

    // Verify the sessions
    const userSessions = await ChatSession.find({ userId: user._id });
    console.log(`\n📊 Total sessions for user: ${userSessions.length}`);
    
    userSessions.forEach(session => {
      console.log(`  - ${session.title}: Services = ${session.services.map(s => s.name).join(', ')}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

createTestSessions();
