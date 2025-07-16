import connectDB from './server/db.js';
import Service from './server/models/Service.js';

async function checkServices() {
  try {
    await connectDB();
    const services = await Service.find();
    
    console.log('Services in database:');
    services.forEach(service => {
      console.log(`- ${service.name} (${service.category}) - Status: ${service.status} - Price: $${service.unitPrice}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkServices();
