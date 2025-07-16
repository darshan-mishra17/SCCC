import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Service from './server/models/Service.js';

dotenv.config();

async function checkCDNService() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB connected successfully');
        
        // Find CDN service specifically
        const cdnService = await Service.findOne({ name: 'cdn' });
        
        if (cdnService) {
            console.log('📦 CDN Service Details:');
            console.log(JSON.stringify(cdnService.toObject(), null, 2));
        } else {
            console.log('❌ CDN service not found');
        }
        
        // Also check all services for completeness
        const allServices = await Service.find({});
        console.log('\n📊 All Services Summary:');
        allServices.forEach(service => {
            console.log(`- ${service.name}: displayName=${service.displayName}, exampleConfig=${!!service.exampleConfig}`);
        });
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkCDNService();
