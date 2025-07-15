import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

// Test session saving functionality
const testSessionSaving = async () => {
  try {
    console.log('🧪 Testing session saving functionality...');
    
    // Create a session ID
    const sessionId = uuidv4();
    console.log('📝 Session ID:', sessionId);
    
    // Step 1: Choose AI suggestion
    console.log('\n1️⃣ Choosing AI suggestion...');
    const step1Response = await axios.post('http://localhost:4000/api/ai/message', {
      sessionId,
      userMessage: 'Option 2'
    });
    console.log('Response:', step1Response.data.message.substring(0, 100) + '...');
    
    // Step 2: Provide requirements
    console.log('\n2️⃣ Providing requirements...');
    const step2Response = await axios.post('http://localhost:4000/api/ai/message', {
      sessionId,
      userMessage: 'I need a video-sharing platform for 10,000 daily uploads with fast storage and API access'
    });
    
    console.log('Complete:', step2Response.data.complete);
    console.log('Services count:', step2Response.data.services?.length || 0);
    console.log('Total cost:', step2Response.data.pricing?.totalMonthlySAR);
    
    if (step2Response.data.complete && step2Response.data.services) {
      console.log('\n✅ AI suggestion generated successfully!');
      console.log('Services:', step2Response.data.services.map(s => `${s.name}: SAR ${s.monthlyCost}`));
      
      // Step 3: Confirm configuration
      console.log('\n3️⃣ Confirming configuration...');
      const step3Response = await axios.post('http://localhost:4000/api/ai/message', {
        sessionId,
        userMessage: 'Yes'
      });
      
      console.log('Confirmation complete:', step3Response.data.complete);
      console.log('Session should now be saved with services and pricing!');
      
      return sessionId;
    } else {
      console.log('❌ AI suggestion not generated');
      return null;
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    return null;
  }
};

// Run the test
testSessionSaving().then(sessionId => {
  if (sessionId) {
    console.log(`\n🎯 Test completed! Session ${sessionId} should be saved with complete data.`);
    console.log('You can now test reopening this session in the dashboard.');
  } else {
    console.log('\n❌ Test failed to create a complete session.');
  }
  process.exit(0);
}).catch(error => {
  console.error('Test error:', error);
  process.exit(1);
});
