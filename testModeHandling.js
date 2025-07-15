import axios from 'axios';

async function testModeHandling() {
  try {
    console.log('🧪 Testing Manual vs AI mode handling...\n');
    
    // Test 1: Manual Configuration (Option 1)
    const manualSessionId = 'manual-test-' + Date.now();
    let response = await axios.post('http://localhost:4000/api/ai/message', { 
      sessionId: manualSessionId, 
      userMessage: 'option 1' 
    });
    console.log('✅ Option 1 (Manual) Response:');
    console.log(response.data.message.substring(0, 150) + '...\n');
    
    // Test 2: AI Suggestion (Option 2)
    const aiSessionId = 'ai-test-' + Date.now();
    response = await axios.post('http://localhost:4000/api/ai/message', { 
      sessionId: aiSessionId, 
      userMessage: 'option 2' 
    });
    console.log('✅ Option 2 (AI) Response:');
    console.log(response.data.message.substring(0, 150) + '...\n');
    
    // Test 3: Manual configuration with invalid input
    response = await axios.post('http://localhost:4000/api/ai/message', { 
      sessionId: manualSessionId, 
      userMessage: 'invalid random input' 
    });
    console.log('🔍 Manual mode with invalid input:');
    console.log(response.data.message.substring(0, 150) + '...');
    
    const hasAIKeywords = /recommend|analysis|suggested.*services/i.test(response.data.message);
    console.log('❓ Falls back to AI suggestions:', hasAIKeywords ? '❌ YES (PROBLEM)' : '✅ NO (GOOD)');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testModeHandling();
