import connectDB from './server/db.js';
import Service from './server/models/Service.js';

async function updateCDNService() {
  try {
    await connectDB();
    
    const cdnService = await Service.findOne({ name: 'cdn' });
    if (cdnService) {
      cdnService.displayName = 'Content Delivery Network';
      cdnService.exampleConfig = {
        bandwidth: 100,
        regions: 3,
        cacheSize: 50
      };
      await cdnService.save();
      console.log('✅ CDN service updated with displayName and exampleConfig');
    } else {
      console.log('❌ CDN service not found');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updateCDNService();
