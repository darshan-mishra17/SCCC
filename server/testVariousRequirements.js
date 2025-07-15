// Test different types of AI suggestions
import axios from 'axios';

const API_BASE = 'http://localhost:4000';

async function testVariousRequirements() {
  try {
    console.log('🧪 Testing Various AI Suggestions...\n');
    
    const testCases = [
      "E-commerce platform with file storage for 5000 customers",
      "Simple blog website for 100 users",
      "Real-time analytics dashboard with machine learning for enterprise",
      "Mobile app backend with authentication and payments for 10000 users",
      "IoT sensor data collection platform"
    ];
    
    for (let i = 0; i < testCases.length; i++) {
      const sessionId = `test_various_${Date.now()}_${i}`;
      const requirement = testCases[i];
      
      console.log(`\n${'='.repeat(80)}`);
      console.log(`📋 Test Case ${i + 1}: ${requirement}`);
      console.log('='.repeat(80));
      
      // Step 1: Request suggestions
      console.log('👤 User: "I want AI suggestions"');
      let response = await axios.post(`${API_BASE}/api/ai/message`, {
        sessionId,
        userMessage: "I want AI suggestions"
      });
      
      console.log('🤖 AI: [Initial greeting received]');
      
      // Step 2: Provide requirements
      console.log(`👤 User: "${requirement}"`);
      response = await axios.post(`${API_BASE}/api/ai/message`, {
        sessionId,
        userMessage: requirement
      });
      
      console.log('🤖 AI Response:');
      console.log(response.data.message);
      
      await new Promise(resolve => setTimeout(resolve, 1000)); // Pause between tests
    }
    
    console.log('\n✅ All test cases completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testVariousRequirements();
