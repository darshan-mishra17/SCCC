import dotenv from 'dotenv';
import axios from 'axios';
dotenv.config({ path: '.env' });

const SERVER_URL = 'http://localhost:4000';

async function testCDNFlow() {
    console.log('🧪 Testing CDN-specific AI Flow...');
    
    try {
        // Simple AI test without authentication
        console.log('1. Testing direct AI request for CDN...');
        const cdnResponse = await axios.post(`${SERVER_URL}/api/ai/message`, {
            userMessage: 'I need a content delivery network (CDN) for my website to serve static files faster to users globally',
            sessionId: 'test-cdn-session-' + Date.now()
        });

        console.log('🤖 AI Response:');
        console.log('Full response:', JSON.stringify(cdnResponse.data, null, 2));
        
        if (cdnResponse.data.message) {
            const responseText = cdnResponse.data.message.toLowerCase();
            if (responseText.includes('cdn') || responseText.includes('content delivery')) {
                console.log('✅ AI can access and recommend CDN service!');
            } else {
                console.log('⚠️  AI response received but CDN not mentioned specifically');
            }
        }
        
        // Test with streaming platform request
        console.log('\n2. Testing AI request for streaming platform...');
        const streamResponse = await axios.post(`${SERVER_URL}/api/ai/message`, {
            userMessage: 'I have a live streaming platform with 100 concurrent users per hour',
            sessionId: 'test-stream-session-' + Date.now()
        });
        
        console.log('🤖 Streaming Response:');
        console.log('Full response:', JSON.stringify(streamResponse.data, null, 2));

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

testCDNFlow();
