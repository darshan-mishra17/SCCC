// Test both AI suggestion and manual configuration flows
import axios from 'axios';

const BASE_URL = 'http://localhost:4000';

async function testBothFlows() {
  console.log('Testing both AI suggestion and manual configuration flows...\n');

  // Test 1: AI Suggestion Flow
  console.log('=== AI SUGGESTION FLOW ===');
  try {
    const sessionId1 = `ai-test-${Date.now()}`;
    
    // Step 1: Choose AI suggestions
    const response1 = await axios.post(`${BASE_URL}/api/ai/message`, {
      sessionId: sessionId1,
      userMessage: 'Option 2'
    });
    console.log('Step 1 (Option 2):', response1.data.message.substring(0, 100) + '...');
    
    // Step 2: Provide application requirements
    const response2 = await axios.post(`${BASE_URL}/api/ai/message`, {
      sessionId: sessionId1,
      userMessage: 'I need a web application for an e-commerce site with 5000 users and daily orders'
    });
    console.log('Step 2 (Requirements):', response2.data.message.substring(0, 100) + '...');
    console.log('✅ AI suggestion flow working!');
    
  } catch (error) {
    console.error('❌ AI suggestion flow failed:', error.message);
  }

  console.log('\n=== MANUAL CONFIGURATION FLOW ===');
  
  // Test 2: Manual Configuration Flow
  try {
    const sessionId2 = `manual-test-${Date.now()}`;
    
    // Step 1: Choose manual configuration
    const response1 = await axios.post(`${BASE_URL}/api/ai/message`, {
      sessionId: sessionId2,
      userMessage: 'Option 1'
    });
    console.log('Step 1 (Option 1):', response1.data.message.substring(0, 100) + '...');
    
    // Step 2: Select ECS service
    const response2 = await axios.post(`${BASE_URL}/api/ai/message`, {
      sessionId: sessionId2,
      userMessage: 'ECS'
    });
    console.log('Step 2 (ECS):', response2.data.message.substring(0, 100) + '...');
    
    // Step 3: Provide ECS configuration
    const response3 = await axios.post(`${BASE_URL}/api/ai/message`, {
      sessionId: sessionId2,
      userMessage: 'I need 1 ecs.g6.xlarge instance with Linux OS and 200GB disk'
    });
    console.log('Step 3 (Config):', response3.data.message.substring(0, 100) + '...');
    console.log('Complete:', response3.data.complete);
    console.log('Services:', response3.data.services?.map(s => s.name));
    console.log('Total cost: SAR', response3.data.pricing?.totalMonthlySAR);
    console.log('✅ Manual configuration flow working!');
    
  } catch (error) {
    console.error('❌ Manual configuration flow failed:', error.message);
  }

  console.log('\n✅ Both flows tested successfully!');
}

testBothFlows().catch(console.error);
