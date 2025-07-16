import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { buildPrompt } from './server/logic/promptBuilder.js';

dotenv.config();

async function testPromptBuilder() {
    try {
        console.log('🧪 Testing Prompt Builder for CDN recommendations...');
        
        // Connect to MongoDB first
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB connected successfully');
        
        // Test CDN-specific prompt
        const cdnPrompt = await buildPrompt('ai_suggestion', 'I need a content delivery network for my website to serve static files faster');
        console.log('\n📝 Generated Prompt for CDN request:');
        console.log(cdnPrompt);
        
        // Test streaming platform prompt
        const streamPrompt = await buildPrompt('ai_suggestion', 'live streaming platform with 100 concurrent users');
        console.log('\n📝 Generated Prompt for streaming platform:');
        console.log(streamPrompt);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

testPromptBuilder();
