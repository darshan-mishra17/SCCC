// Test the new database-driven manual configuration
import axios from 'axios';

const BASE_URL = 'http://localhost:4000';

async function testNewManualConfig() {
  console.log('Testing new database-driven manual configuration...\n');

  try {
    const sessionId = `manual-db-test-${Date.now()}`;
    
    // Step 1: Choose manual configuration
    console.log('Step 1: Choosing manual configuration (Option 1)');
    const response1 = await axios.post(`${BASE_URL}/api/ai/message`, {
      sessionId: sessionId,
      userMessage: 'Option 1'
    });
    console.log('✅ Response 1:', response1.data.message.substring(0, 100) + '...\n');
    
    // Step 2: Select ECS service
    console.log('Step 2: Selecting ECS service');
    const response2 = await axios.post(`${BASE_URL}/api/ai/message`, {
      sessionId: sessionId,
      userMessage: 'ECS'
    });
    console.log('✅ Response 2:', response2.data.message.substring(0, 100) + '...\n');
    
    // Step 3: Answer first question (instance type)
    console.log('Step 3: Answering instance type question');
    const response3 = await axios.post(`${BASE_URL}/api/ai/message`, {
      sessionId: sessionId,
      userMessage: 'ecs.g6.large'
    });
    console.log('✅ Response 3:', response3.data.message.substring(0, 100) + '...\n');
    
    // Step 4: Answer second question (number of instances)
    console.log('Step 4: Answering instance count question');
    const response4 = await axios.post(`${BASE_URL}/api/ai/message`, {
      sessionId: sessionId,
      userMessage: '2'
    });
    console.log('✅ Response 4:', response4.data.message.substring(0, 100) + '...\n');
    
    // Step 5: Answer third question (disk size)
    console.log('Step 5: Answering disk size question');
    const response5 = await axios.post(`${BASE_URL}/api/ai/message`, {
      sessionId: sessionId,
      userMessage: '100'
    });
    console.log('✅ Response 5:', response5.data.message.substring(0, 100) + '...\n');
    
    // Step 6: Answer fourth question (bandwidth)
    console.log('Step 6: Answering bandwidth question');
    const response6 = await axios.post(`${BASE_URL}/api/ai/message`, {
      sessionId: sessionId,
      userMessage: '10'
    });
    console.log('✅ Response 6:', response6.data.message.substring(0, 100) + '...\n');
    
    // Step 7: Answer fifth question (operating system)
    console.log('Step 7: Answering OS question');
    const response7 = await axios.post(`${BASE_URL}/api/ai/message`, {
      sessionId: sessionId,
      userMessage: 'Ubuntu 20.04'
    });
    console.log('✅ Response 7:', response7.data.message.substring(0, 100) + '...');
    console.log('Complete:', response7.data.complete);
    console.log('Services:', response7.data.services?.map(s => s.name));
    console.log('Total cost: SAR', response7.data.pricing?.totalMonthlySAR);
    
    console.log('\n✅ New database-driven manual configuration test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testNewManualConfig().catch(console.error);
