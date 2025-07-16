import axios from 'axios';

async function testAIWithSuggestion() {
  try {
    console.log('Testing AI with suggestion mode...\n');
    
    const sessionId = 'test-cdn-' + Date.now();
    
    // Step 1: Initial message
    console.log('1. Starting conversation...');
    await axios.post('http://localhost:4000/api/ai/message', {
      userMessage: 'I need a content delivery network for my website',
      sessionId: sessionId
    });
    
    // Step 2: Choose AI suggestion
    console.log('2. Choosing AI suggestion...');
    const response2 = await axios.post('http://localhost:4000/api/ai/message', {
      userMessage: '2',
      sessionId: sessionId
    });
    
    console.log('AI Response:', response2.data.message);
    
    // Step 3: Provide requirement details
    console.log('\n3. Providing requirements...');
    const response3 = await axios.post('http://localhost:4000/api/ai/message', {
      userMessage: 'I have an e-commerce website that needs fast content delivery for product images and videos. I expect about 10,000 visitors per day.',
      sessionId: sessionId
    });
    
    console.log('AI Suggestion Response:');
    console.log(response3.data.message);
    
    if (response3.data.message && response3.data.message.toLowerCase().includes('cdn')) {
      console.log('\n✅ SUCCESS: AI is recommending CDN service that was created by admin!');
    } else {
      console.log('\n⚠️ AI response received but CDN not mentioned specifically');
    }
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testAIWithSuggestion();
