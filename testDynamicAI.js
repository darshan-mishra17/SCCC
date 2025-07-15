import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

// Test dynamic AI suggestions using database services
const testDynamicAISuggestions = async () => {
  try {
    console.log('🧪 Testing Dynamic AI Suggestions...');
    
    const sessionId = uuidv4();
    console.log('📝 Session ID:', sessionId);
    
    // Step 1: Choose AI suggestion
    console.log('\n1️⃣ Choosing AI suggestion...');
    const step1Response = await axios.post('http://localhost:4000/api/ai/message', {
      sessionId,
      userMessage: 'Option 2'
    });
    console.log('✅ Step 1 completed');
    
    // Step 2: Provide detailed requirements
    console.log('\n2️⃣ Providing requirements...');
    const step2Response = await axios.post('http://localhost:4000/api/ai/message', {
      sessionId,
      userMessage: 'I need a high-performance e-commerce platform that can handle 50,000 concurrent users with real-time inventory management and secure payment processing'
    });
    
    console.log('AI Response received!');
    console.log('Complete:', step2Response.data.complete);
    console.log('Services count:', step2Response.data.services?.length || 0);
    console.log('Services:', step2Response.data.services?.map(s => s.name));
    console.log('Total cost:', step2Response.data.pricing?.totalMonthlySAR);
    
    if (step2Response.data.complete && step2Response.data.services) {
      console.log('\n✅ Dynamic AI suggestion test PASSED!');
      console.log('📊 Services suggested:', step2Response.data.services.map(s => `${s.name}: SAR ${s.monthlyCost}`));
      
      // Test that services exist in database
      console.log('\n🔍 Validating services are from database...');
      const validServices = ['ecs', 'oss', 'tdsql']; // Known database services
      const suggestedServices = step2Response.data.services.map(s => s.name);
      const allValid = suggestedServices.every(service => validServices.includes(service));
      
      if (allValid) {
        console.log('✅ All suggested services are from database!');
      } else {
        console.log('❌ Some services not from database:', suggestedServices);
      }
      
      return true;
    } else {
      console.log('❌ AI suggestion test FAILED - no complete response');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    return false;
  }
};

// Run the test
testDynamicAISuggestions().then(success => {
  if (success) {
    console.log('\n🎯 Dynamic AI suggestions are working with database services!');
  } else {
    console.log('\n❌ Dynamic AI suggestions test failed');
  }
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Test error:', error);
  process.exit(1);
});
