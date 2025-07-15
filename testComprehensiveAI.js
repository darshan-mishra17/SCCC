// Comprehensive test script for AI suggestion system
import axios from 'axios';

const BASE_URL = 'http://localhost:4000';

async function testScenario(scenarioName, userRequirement) {
  console.log(`\n🧪 Testing: ${scenarioName}`);
  console.log(`📝 Requirement: "${userRequirement}"`);
  
  try {
    // Create unique user for each test
    const uniqueEmail = `test${Date.now()}@example.com`;
    const registerResponse = await axios.post(`${BASE_URL}/api/auth/signup`, {
      firstName: 'Test',
      lastName: 'User',
      email: uniqueEmail,
      company: 'Test Company',
      password: 'test12345'
    });
    
    const token = registerResponse.data.token;
    const userId = registerResponse.data.user.id;

    // Start chat session
    const sessionResponse = await axios.post(`${BASE_URL}/api/chat/sessions`, {
      userId
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const sessionId = sessionResponse.data.session.sessionId;

    // Get initial greeting
    const greetingResponse = await axios.post(`${BASE_URL}/api/ai/message`, {
      sessionId,
      userMessage: 'Hi'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    // Test the user requirement
    const requirementResponse = await axios.post(`${BASE_URL}/api/ai/message`, {
      sessionId,
      userMessage: userRequirement
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log(`✅ Result:`);
    console.log(`📊 Suggestions: ${requirementResponse.data.suggestions ? requirementResponse.data.suggestions.length : 0} services`);
    
    if (requirementResponse.data.suggestions && requirementResponse.data.suggestions.length > 0) {
      requirementResponse.data.suggestions.forEach(service => {
        console.log(`   - ${service.name.toUpperCase()}: ${service.reason}`);
      });
    }
    
    if (requirementResponse.data.pricing) {
      console.log(`💰 Pricing: ${requirementResponse.data.pricing.total.toFixed(2)} SAR/month`);
    }
    
    return {
      success: true,
      suggestions: requirementResponse.data.suggestions || [],
      pricing: requirementResponse.data.pricing
    };

  } catch (error) {
    console.log(`❌ Error: ${error.response?.data?.error || error.message}`);
    return { success: false, error: error.message };
  }
}

async function runComprehensiveTests() {
  console.log('🚀 Starting Comprehensive AI Suggestion Tests\n');
  
  const testScenarios = [
    {
      name: "Live Streaming Platform", 
      requirement: "i have a live streaming platform with 100 users using per hour at one go"
    },
    {
      name: "E-commerce Website",
      requirement: "I need a web application for e-commerce with database for 5000 customers and file storage"
    },
    {
      name: "Mobile App Backend",
      requirement: "API backend with analytics for mobile app expecting 10000 users daily"
    },
    {
      name: "Corporate Website",
      requirement: "simple company website with contact forms and about 500 visitors per day"
    },
    {
      name: "Social Media Platform",
      requirement: "social media platform with user profiles, posts, and real-time chat for 2000 concurrent users"
    },
    {
      name: "IoT Data Platform",
      requirement: "IoT data collection platform receiving sensor data from 1000 devices every minute"
    },
    {
      name: "Educational Platform",
      requirement: "online learning platform with video streaming and student progress tracking for 3000 students"
    },
    {
      name: "Option 2 Selection",
      requirement: "option 2"
    },
    {
      name: "AI Suggestion Request",
      requirement: "I want AI suggestions for my cloud setup"
    },
    {
      name: "Gaming Backend",
      requirement: "multiplayer game backend with real-time synchronization for 500 concurrent players"
    }
  ];

  const results = [];
  
  for (const scenario of testScenarios) {
    const result = await testScenario(scenario.name, scenario.requirement);
    results.push({ scenario: scenario.name, ...result });
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Summary
  console.log('\n📊 Test Summary:');
  console.log('================');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successful: ${successful.length}/${results.length}`);
  console.log(`❌ Failed: ${failed.length}/${results.length}`);
  
  if (failed.length > 0) {
    console.log('\n❌ Failed Tests:');
    failed.forEach(f => console.log(`   - ${f.scenario}: ${f.error}`));
  }
  
  if (successful.length > 0) {
    console.log('\n✅ Successful Tests:');
    successful.forEach(s => {
      const serviceCount = s.suggestions ? s.suggestions.length : 0;
      const pricing = s.pricing ? `${s.pricing.total.toFixed(2)} SAR` : 'No pricing';
      console.log(`   - ${s.scenario}: ${serviceCount} services, ${pricing}`);
    });
  }
  
  // Analysis
  console.log('\n🔍 Analysis:');
  const servicesUsed = {};
  successful.forEach(s => {
    if (s.suggestions) {
      s.suggestions.forEach(service => {
        servicesUsed[service.name] = (servicesUsed[service.name] || 0) + 1;
      });
    }
  });
  
  console.log('📈 Service Usage:');
  Object.entries(servicesUsed).forEach(([service, count]) => {
    console.log(`   - ${service.toUpperCase()}: ${count} times`);
  });
}

runComprehensiveTests().catch(console.error);
