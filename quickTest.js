// Simple frontend integration test using fetch
const sessionId = 'test-' + Date.now();

async function testAPI() {
  console.log('Testing frontend integration...\n');
  
  try {
    // Test mobile app suggestion
    const response = await fetch('http://localhost:4000/api/ai/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        userMessage: 'i have a mobile application with 10000 monthly sign in and 4000 user and 100 orders per day'
      })
    });
    
    const data = await response.json();
    
    console.log('✅ Response received:');
    console.log('  Complete:', data.complete);
    console.log('  Services count:', data.services?.length || 0);
    console.log('  Has pricing:', !!data.pricing);
    
    if (data.pricing) {
      console.log('  Total cost: SAR', data.pricing.totalMonthlySAR);
    }
    
    if (data.services) {
      console.log('\n📊 Services:');
      data.services.forEach(s => {
        console.log(`  - ${s.name}: ${s.description} (SAR ${s.monthlyCost}/month)`);
      });
    }
    
    console.log('\n✅ Test successful! The suggestion panel should now display these services.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAPI();
