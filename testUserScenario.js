import axios from 'axios';

async function testUserScenario() {
  try {
    console.log('🧪 Testing user scenario from screenshot...\n');
    
    const sessionId = 'user-scenario-' + Date.now();
    
    // Test with the exact input from user's screenshot
    const response = await axios.post('http://localhost:4000/api/ai/message', {
      sessionId,
      userMessage: 'The client is launching a video-sharing platform. They expect 10,000 daily uploads, need fast storage, compute for video processing, and secure API access. They also want automated backups and protection from web attacks.'
    });
    
    console.log('✅ User Scenario Response:');
    console.log('Message preview:', response.data.message.substring(0, 300) + '...\n');
    
    if (response.data.services) {
      console.log('📊 Services for Suggestion Panel:');
      response.data.services.forEach((service, index) => {
        console.log(`${index + 1}. ${service.name.toUpperCase()}`);
        console.log(`   Description: ${service.description}`);
        console.log(`   Monthly Cost: SAR ${service.monthlyCost.toFixed(2)}/month`);
        console.log();
      });
    }
    
    if (response.data.pricing) {
      console.log('💰 Total Pricing for Suggestion Panel:');
      console.log(`- Subtotal: SAR ${response.data.pricing.subtotal.toFixed(2)}`);
      console.log(`- VAT (15%): SAR ${response.data.pricing.vat.toFixed(2)}`);
      console.log(`- Total: SAR ${response.data.pricing.totalMonthlySAR.toFixed(2)}/month`);
    }
    
    console.log('\n🎯 RESULT: Suggestion panel should now show these exact values!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testUserScenario();
