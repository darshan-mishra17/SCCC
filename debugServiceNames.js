import axios from 'axios';

async function debugServiceNames() {
  try {
    const sessionId = 'debug-' + Date.now();
    const response = await axios.post('http://localhost:4000/api/ai/message', {
      sessionId,
      userMessage: 'I need a simple web app'
    });
    
    console.log('🔍 Debugging service names...\n');
    if (response.data.services) {
      response.data.services.forEach((service, index) => {
        console.log(`Service ${index + 1}:`);
        console.log(`  Name: '${service.name}'`);
        console.log(`  Name toLowerCase: '${service.name.toLowerCase()}'`);
        console.log(`  Config:`, JSON.stringify(service.config, null, 2));
        console.log();
      });
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

debugServiceNames();
