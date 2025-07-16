import axios from 'axios';

async function testAI() {
  try {
    const response = await axios.post('http://localhost:4000/api/ai/message', {
      userMessage: 'I need a content delivery network for my website',
      sessionId: 'test-session-' + Date.now()
    });
    
    console.log('AI Response:', response.data);
    
    if (response.data.success && response.data.response) {
      const responseText = response.data.response.toLowerCase();
      if (responseText.includes('cdn') || responseText.includes('content delivery')) {
        console.log('✅ AI can access and recommend CDN service!');
      } else {
        console.log('⚠️  AI response received but CDN not mentioned specifically');
        console.log('Response:', response.data.response);
      }
    }
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testAI();
