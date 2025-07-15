// Test script to verify AI suggestion flow
import axios from 'axios';

const BASE_URL = 'http://localhost:4000';

async function testAISuggestionFlow() {
  try {
    console.log('🧪 Testing AI Suggestion Flow...\n');

    // Step 1: Register a new test user with unique email
    console.log('1. Registering test user...');
    const uniqueEmail = `test${Date.now()}@example.com`;
    
    const registerResponse = await axios.post(`${BASE_URL}/api/auth/signup`, {
      firstName: 'Test',
      lastName: 'User',
      email: uniqueEmail,
      company: 'Test Company',
      password: 'test12345'
    });
    
    const token = registerResponse.data.token;
    const userId = registerResponse.data.user.id;
    console.log(`✅ User registered: ${userId}\n`);

    // Step 2: Start a new chat session
    console.log('2. Starting new chat session...');
    const sessionResponse = await axios.post(`${BASE_URL}/api/chat/sessions`, {
      userId
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const sessionId = sessionResponse.data.session.sessionId;
    console.log(`✅ Session started: ${sessionId}\n`);

    // Step 3: Get initial greeting
    console.log('3. Getting initial greeting...');
    const greetingResponse = await axios.post(`${BASE_URL}/api/ai/message`, {
      sessionId,
      userMessage: 'Hi'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('🤖 AI Response:');
    console.log(greetingResponse.data.message);
    console.log('');

    // Step 4: User describes their application (the exact scenario from user)
    console.log('4. User describes streaming platform...');
    const descriptionResponse = await axios.post(`${BASE_URL}/api/ai/message`, {
      sessionId,
      userMessage: 'i have a live streaming platform with has 100 user using per hour at one go'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('🤖 AI Response:');
    console.log('Full response:', JSON.stringify(descriptionResponse.data, null, 2));
    console.log('');

    // Step 5: User says "option 2"
    console.log('5. User selects option 2...');
    const optionResponse = await axios.post(`${BASE_URL}/api/ai/message`, {
      sessionId,
      userMessage: 'option 2'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('🤖 AI Response:');
    console.log('Full response:', JSON.stringify(optionResponse.data, null, 2));
    console.log('');

    // Check if we have proper suggestion data - the response might be in different formats
    if (optionResponse.data.recommendations || 
        optionResponse.data.suggestedServices || 
        (optionResponse.data.message && optionResponse.data.message.includes('recommend'))) {
      console.log('✅ AI suggestions generated successfully!');
      console.log('📊 Response data available');
    } else {
      console.log('❌ No suggestions generated');
      console.log('Response keys:', Object.keys(optionResponse.data));
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testAISuggestionFlow();
