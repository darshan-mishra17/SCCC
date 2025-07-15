// Test the new AI suggestion feature
import axios from 'axios';

const API_BASE = 'http://localhost:4000';

async function testAISuggestion() {
  try {
    console.log('🧪 Testing AI Suggestion Feature...\n');
    
    // Step 1: Start new chat session
    const sessionId = `test_ai_suggestion_${Date.now()}`;
    console.log(`📱 Session ID: ${sessionId}\n`);
    
    // Step 2: Send initial message asking for suggestions
    console.log('👤 User: "I want AI suggestions for my application"');
    let response = await axios.post(`${API_BASE}/api/ai/message`, {
      sessionId,
      userMessage: "I want AI suggestions for my application"
    });
    
    console.log('🤖 AI:', response.data.message);
    console.log('\n' + '='.repeat(80) + '\n');
    
    // Step 3: Provide application requirements
    console.log('👤 User: "A web application with database for 1000 users"');
    response = await axios.post(`${API_BASE}/api/ai/message`, {
      sessionId,
      userMessage: "A web application with database for 1000 users"
    });
    
    console.log('🤖 AI:', response.data.message);
    console.log('\n' + '='.repeat(80) + '\n');
    
    // Step 4: Confirm the suggestion
    console.log('👤 User: "Yes, proceed with this configuration"');
    response = await axios.post(`${API_BASE}/api/ai/message`, {
      sessionId,
      userMessage: "Yes, proceed with this configuration"
    });
    
    console.log('🤖 AI:', response.data.message);
    console.log('\n' + '='.repeat(80) + '\n');
    
    // Step 5: Wait a moment and send another message to get the final pricing
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('👤 User: "Show me the final configuration"');
    response = await axios.post(`${API_BASE}/api/ai/message`, {
      sessionId,
      userMessage: "Show me the final configuration"
    });
    
    console.log('🤖 AI:', response.data.message);
    
    console.log('\n✅ AI Suggestion test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testAISuggestion();
