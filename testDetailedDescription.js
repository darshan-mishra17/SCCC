import axios from 'axios';

async function testDetailedDescription() {
  try {
    console.log('🧪 Testing with more detailed description...\n');
    
    const sessionId = 'detailed-test-' + Date.now();
    
    // Test with a more detailed description that should match the pattern
    const response = await axios.post('http://localhost:4000/api/ai/message', {
      sessionId,
      userMessage: 'I need a web application for 1000 users with database and authentication'
    });
    
    console.log('✅ Detailed Description Response:');
    console.log('Message preview:', response.data.message.substring(0, 300) + '...\n');
    
    if (response.data.services) {
      console.log('📊 Services with individual costs:');
      response.data.services.forEach((service, index) => {
        console.log(`${index + 1}. ${service.name}: SAR ${service.monthlyCost.toFixed(2)}/month`);
      });
      console.log();
    }
    
    if (response.data.pricing) {
      console.log('💰 Total Pricing:');
      console.log(`- Subtotal: SAR ${response.data.pricing.subtotal.toFixed(2)}`);
      console.log(`- VAT: SAR ${response.data.pricing.vat.toFixed(2)}`);
      console.log(`- Total: SAR ${response.data.pricing.totalMonthlySAR.toFixed(2)}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testDetailedDescription();
