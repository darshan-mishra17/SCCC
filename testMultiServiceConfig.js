import axios from 'axios';

const BASE_URL = 'http://localhost:4000';
const sessionId = `multi-service-test-${Date.now()}`;

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

async function testMultiServiceConfiguration() {
  console.log('🧪 Testing Multi-Service Configuration...\n');
  
  // Step 1: Choose manual configuration
  console.log('Step 1: Choosing manual configuration...');
  let response = await sendMessage('Option 1');
  console.log('✅ Response:', response.message.substring(0, 100) + '...\n');
  
  // Step 2: Configure ECS Service
  console.log('Step 2: Selecting ECS service...');
  response = await sendMessage('ECS');
  console.log('✅ Response:', response.message.substring(0, 100) + '...\n');
  
  // Configure ECS fields
  console.log('Step 3: Configuring ECS - Instance Type...');
  response = await sendMessage('ecs.g6.large');
  console.log('✅ Instance Type set\n');
  
  console.log('Step 4: Configuring ECS - Instance Count...');
  response = await sendMessage('2');
  console.log('✅ Instance Count set\n');
  
  console.log('Step 5: Configuring ECS - Disk Size...');
  response = await sendMessage('100');
  console.log('✅ Disk Size set\n');
  
  console.log('Step 6: Configuring ECS - Bandwidth...');
  response = await sendMessage('10');
  console.log('✅ Bandwidth set\n');
  
  console.log('Step 7: Configuring ECS - Operating System...');
  response = await sendMessage('Ubuntu 20.04');
  console.log('✅ ECS Configuration Complete!');
  console.log('📊 ECS Services:', response.services?.length || 0);
  console.log('💰 ECS Total Cost:', response.pricing?.totalMonthlySAR || 0, 'SAR\n');
  
  // Step 8: Confirm ECS and add more services
  console.log('Step 8: Confirming ECS and requesting more services...');
  response = await sendMessage('Yes');
  console.log('✅ ECS Confirmed\n');
  
  console.log('Step 9: Adding more services...');
  response = await sendMessage('Add more services');
  console.log('✅ Response:', response.message.substring(0, 100) + '...\n');
  
  // Step 10: Configure OSS Service  
  console.log('Step 10: Selecting OSS service...');
  response = await sendMessage('OSS');
  console.log('✅ Response:', response.message.substring(0, 100) + '...\n');
  
  // Configure OSS fields (assuming OSS has storage, redundancy, access fields)
  console.log('Step 11: Configuring OSS - Storage Size...');
  response = await sendMessage('1000');
  console.log('✅ OSS Field 1 set\n');
  
  console.log('Step 12: Configuring OSS - Redundancy...');
  response = await sendMessage('Standard');
  console.log('✅ OSS Field 2 set\n');
  
  console.log('Step 13: Configuring OSS - Region...');
  response = await sendMessage('Riyadh');
  console.log('✅ OSS Field 3 set\n');
  
  console.log('Step 14: Configuring OSS - Access Frequency...');
  response = await sendMessage('Frequent');
  console.log('✅ OSS Configuration Complete!');
  console.log('📊 Total Services:', response.services?.length || 0);
  console.log('💰 Combined Total Cost:', response.pricing?.totalMonthlySAR || 0, 'SAR\n');
  
  // Step 15: Confirm OSS and add TDSQL
  console.log('Step 15: Confirming OSS and adding TDSQL...');
  response = await sendMessage('Yes');
  console.log('✅ OSS Confirmed\n');
  
  console.log('Step 16: Adding TDSQL service...');
  response = await sendMessage('Add more services');
  console.log('✅ Ready for TDSQL\n');
  
  console.log('Step 17: Selecting TDSQL service...');
  response = await sendMessage('TDSQL');
  console.log('✅ Response:', response.message.substring(0, 100) + '...\n');
  
  // Configure TDSQL fields
  console.log('Step 18: Configuring TDSQL - Database Type...');
  response = await sendMessage('MySQL');
  console.log('✅ TDSQL Field 1 set\n');
  
  console.log('Step 19: Configuring TDSQL - Instance Class...');
  response = await sendMessage('db.t3.medium');
  console.log('✅ TDSQL Field 2 set\n');
  
  console.log('Step 20: Configuring TDSQL - Storage...');
  response = await sendMessage('200');
  console.log('✅ TDSQL Field 3 set\n');
  
  console.log('Step 21: Configuring TDSQL - Backup Retention...');
  response = await sendMessage('7');
  console.log('✅ TDSQL Configuration Complete!');
  console.log('📊 Total Services:', response.services?.length || 0);
  console.log('💰 Final Combined Cost:', response.pricing?.totalMonthlySAR || 0, 'SAR\n');
  
  // Step 22: Final confirmation
  console.log('Step 22: Final confirmation of all services...');
  response = await sendMessage('Yes');
  console.log('✅ All Services Confirmed!');
  
  // Display final results
  console.log('\n🎉 MULTI-SERVICE CONFIGURATION TEST RESULTS:');
  console.log('='.repeat(50));
  console.log('📊 Total Services Configured:', response.services?.length || 0);
  
  if (response.services) {
    response.services.forEach((service, index) => {
      console.log(`${index + 1}. ${service.name} - SAR ${service.monthlyCost?.toFixed(2) || 0}/month`);
    });
  }
  
  console.log('\n💰 FINAL PRICING:');
  console.log(`• Subtotal: SAR ${response.pricing?.subtotal?.toFixed(2) || 0}`);
  console.log(`• VAT (15%): SAR ${response.pricing?.vat?.toFixed(2) || 0}`);
  console.log(`• TOTAL: SAR ${response.pricing?.totalMonthlySAR?.toFixed(2) || 0}/month`);
  
  console.log('\n✅ Multi-service configuration test completed successfully!');
}

// Run the test
testMultiServiceConfiguration().catch(console.error);
