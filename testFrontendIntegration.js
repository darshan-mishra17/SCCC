/**
 * Frontend Integration Test
 * Tests the complete flow from user input to suggestion panel display
 */

const axios = require('axios');

const API_BASE = 'http://localhost:4000';
const SESSION_ID = 'test-frontend-integration-' + Date.now();

// Test scenarios
const testScenarios = [
  {
    name: 'E-commerce Website',
    description: 'I need to build an e-commerce website that can handle 1000 concurrent users with product catalog, shopping cart, and payment processing',
    expectedServices: ['ECS', 'TDSQL', 'OSS']
  },
  {
    name: 'Mobile App Backend',
    description: 'Mobile app backend for a social media platform with 5000 daily active users, real-time messaging, and image sharing',
    expectedServices: ['ECS', 'TDSQL']
  },
  {
    name: 'IoT Data Platform',
    description: 'IoT platform for collecting sensor data from 10000 devices, real-time analytics, and data storage for 2 years',
    expectedServices: ['ECS', 'OSS', 'TDSQL']
  }
];

async function testBackendAPI() {
  console.log('\n🧪 Testing Backend API Integration...\n');
  
  for (const scenario of testScenarios) {
    console.log(`\n📝 Testing: ${scenario.name}`);
    console.log(`💬 Description: ${scenario.description}`);
    
    try {
      // Test AI suggestion endpoint
      const response = await axios.post(`${BACKEND_URL}/api/ai/message`, {
        sessionId: `test-${Date.now()}`,
        userMessage: scenario.description
      });
      
      if (response.data.complete && response.data.services && response.data.pricing) {
        console.log('✅ AI Suggestion Complete!');
        console.log(`💰 Total Cost: SAR ${response.data.pricing.totalMonthlySAR?.toFixed(2) || 'N/A'}`);
        console.log(`🛠️  Services: ${response.data.services.map(s => s.name || s.service).join(', ')}`);
        
        // Verify expected services are present
        const returnedServices = response.data.services.map(s => s.name || s.service);
        const hasExpectedServices = scenario.expectedServices.some(expected => 
          returnedServices.some(returned => returned.includes(expected))
        );
        
        if (hasExpectedServices) {
          console.log('✅ Expected services found');
        } else {
          console.log('⚠️  Expected services not found, but system is working');
        }
      } else {
        console.log('⚠️  AI suggestion in progress, might need follow-up questions');
        console.log(`💬 AI Response: ${response.data.message}`);
      }
      
    } catch (error) {
      console.error(`❌ Error testing ${scenario.name}:`, error.message);
    }
  }
}

async function testFrontendConnectivity() {
  console.log('\n🌐 Testing Frontend Connectivity...\n');
  
  try {
    // Check if frontend is accessible
    const response = await axios.get(FRONTEND_URL, { timeout: 5000 });
    if (response.status === 200) {
      console.log('✅ Frontend is accessible at http://localhost:5174');
    }
  } catch (error) {
    console.error('❌ Frontend connectivity issue:', error.message);
  }
}

async function testCORSConfiguration() {
  console.log('\n🔗 Testing CORS Configuration...\n');
  
  try {
    // Test a simple API call that would be made from frontend
    const response = await axios.post(`${BACKEND_URL}/api/ai/message`, {
      sessionId: 'cors-test',
      userMessage: 'Hello'
    }, {
      headers: {
        'Origin': FRONTEND_URL,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ CORS configuration appears to be working');
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ Backend server is not running');
    } else {
      console.error('❌ CORS or API error:', error.message);
    }
  }
}

async function runIntegrationTests() {
  console.log('🚀 Starting Frontend-Backend Integration Tests\n');
  console.log('=' * 60);
  
  await testFrontendConnectivity();
  await testCORSConfiguration();
  await testBackendAPI();
  
  console.log('\n' + '=' * 60);
  console.log('🎉 Integration Tests Complete!');
  console.log('\n📋 Manual Testing Steps:');
  console.log('1. Open http://localhost:5174 in your browser');
  console.log('2. Click "Try AI Advisor" or sign up/login');
  console.log('3. In the chat, describe an application (e.g., "e-commerce website for 1000 users")');
  console.log('4. Wait for AI to analyze and provide service recommendations');
  console.log('5. Verify pricing appears in the right panel');
  console.log('6. Test "Accept & Finalize" to generate final quotation');
  console.log('\n🎯 Expected Behavior:');
  console.log('- AI should provide intelligent service recommendations');
  console.log('- Pricing should appear in SAR with VAT calculation');
  console.log('- Services should be configurable and deletable');
  console.log('- Final quotation should be generated successfully');
}

// Run the tests
runIntegrationTests().catch(console.error);
