// Test manual configuration flow
const sessionId = 'manual-test-' + Date.now();

async function testManualFlow() {
  console.log('Testing manual configuration flow...\n');
  
  try {
    // Step 1: Choose Option 1
    console.log('Step 1: Choosing manual configuration (Option 1)');
    let response = await fetch('http://localhost:4000/api/ai/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        userMessage: 'Option 1'
      })
    });
    
    let data = await response.json();
    console.log('✅ Response 1:', data.message.substring(0, 100) + '...');
    
    // Step 2: Select ECS
    console.log('\nStep 2: Selecting ECS service');
    response = await fetch('http://localhost:4000/api/ai/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        userMessage: 'ecs'
      })
    });
    
    data = await response.json();
    console.log('✅ Response 2:', data.message.substring(0, 100) + '...');
    
    // Step 3: Provide ECS configuration
    console.log('\nStep 3: Providing ECS configuration');
    response = await fetch('http://localhost:4000/api/ai/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        userMessage: 'i want 2 virtual machines one with linux os and windows os the first must have 100 gb diskspace and 200 gb storage for both'
      })
    });
    
    data = await response.json();
    console.log('✅ Response 3:');
    console.log('  Complete:', data.complete);
    console.log('  Has services:', !!data.services);
    console.log('  Has pricing:', !!data.pricing);
    console.log('  Message preview:', data.message.substring(0, 150) + '...');
    
    if (data.services) {
      console.log('  Services:', data.services.map(s => s.name));
    }
    
    if (data.pricing) {
      console.log('  Total cost: SAR', data.pricing.totalMonthlySAR);
    }
    
    console.log('\n✅ Manual configuration flow test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testManualFlow();
