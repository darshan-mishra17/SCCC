import axios from 'axios';

const BASE_URL = 'http://localhost:4000';
const sessionId = `simple-multi-test-${Date.now()}`;

async function sendMessage(message) {
  try {
    const response = await axios.post(`${BASE_URL}/api/ai/message`, {
      sessionId,
      userMessage: message
    });
    return response.data;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    return null;
  }
}

async function testSimpleMultiService() {
  console.log('🧪 Testing Simple Multi-Service Configuration...\n');
  
  // Step 1: Start manual configuration
  console.log('Step 1: Starting manual configuration...');
  let response = await sendMessage('Option 1');
  console.log('✅ Started\n');
  
  // Step 2: Configure ECS
  console.log('Step 2: Configuring ECS...');
  response = await sendMessage('ECS');
  response = await sendMessage('ecs.g6.large');
  response = await sendMessage('2');
  response = await sendMessage('100');
  response = await sendMessage('10');
  response = await sendMessage('Ubuntu 20.04');
  console.log('✅ ECS configured, services:', response.services?.length || 0);
  
  // Step 3: Confirm ECS
  console.log('Step 3: Confirming ECS...');
  response = await sendMessage('Yes');
  console.log('✅ ECS confirmed');
  
  // Step 4: Test "Add more services"
  console.log('Step 4: Testing "Add more services"...');
  response = await sendMessage('Add more services');
  console.log('Response message preview:', response.message?.substring(0, 150) + '...');
  
  console.log('\n🎯 RESULT:');
  if (response.message?.includes('Which additional service') || response.message?.includes('service would you like')) {
    console.log('✅ SUCCESS: "Add more services" worked correctly!');
  } else {
    console.log('❌ FAILURE: "Add more services" fell through to AI suggestions');
  }
}

testSimpleMultiService().catch(console.error);
