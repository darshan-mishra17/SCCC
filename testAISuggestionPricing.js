import axios from 'axios';

async function testAISuggestionPricing() {
  try {
    console.log('🧪 Testing AI Suggestion with Pricing...\n');
    
    const sessionId = 'ai-pricing-test-' + Date.now();
    
    // Test AI suggestion
    const response = await axios.post('http://localhost:4000/api/ai/message', {
      sessionId,
      userMessage: 'I need a web application for 1000 users with database'
    });
    
    console.log('✅ AI Suggestion Response:');
    console.log('Message preview:', response.data.message.substring(0, 200) + '...\n');
    
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
    
    // Check if costs are properly calculated
    const hasValidCosts = response.data.services && response.data.services.some(s => s.monthlyCost > 0);
    console.log('\n🎯 Individual service costs calculated:', hasValidCosts ? '✅ YES' : '❌ NO');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAISuggestionPricing();
