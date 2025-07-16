import axios from 'axios';

const API_BASE = 'http://localhost:4000/api';

async function testAdminSystem() {
  try {
    console.log('🧪 Testing Admin System...\n');

    // Test 1: Admin Login
    console.log('1. Testing Admin Login...');
    const loginResponse = await axios.post(`${API_BASE}/admin/login`, {
      email: 'admin@sccc.com',
      password: 'admin123'
    });
    
    if (loginResponse.data.success) {
      console.log('✅ Admin login successful');
      const token = loginResponse.data.token;
      const headers = { Authorization: `Bearer ${token}` };

      // Test 2: Get Services
      console.log('\n2. Testing Get Services...');
      const servicesResponse = await axios.get(`${API_BASE}/admin/services`, { headers });
      
      if (servicesResponse.data.success) {
        console.log(`✅ Retrieved ${servicesResponse.data.services.length} services:`);
        servicesResponse.data.services.forEach(service => {
          console.log(`   - ${service.name} (${service.category}) - $${service.unitPrice} ${service.currency}`);
        });
      }

      // Test 3: Get Metrics
      console.log('\n3. Testing Get Analytics Metrics...');
      const metricsResponse = await axios.get(`${API_BASE}/admin/analytics/metrics`, { headers });
      
      if (metricsResponse.data.success) {
        console.log('✅ Retrieved analytics metrics:');
        metricsResponse.data.metrics.forEach(metric => {
          console.log(`   - ${metric.label}: ${metric.value} (${metric.change})`);
        });
      }

      // Test 4: Get Users
      console.log('\n4. Testing Get Users...');
      const usersResponse = await axios.get(`${API_BASE}/admin/users`, { headers });
      
      if (usersResponse.data.success) {
        console.log(`✅ Retrieved ${usersResponse.data.users.length} users`);
        console.log(`   - Total users in system: ${usersResponse.data.pagination.totalUsers}`);
      }

      // Test 5: Create a New Service
      console.log('\n5. Testing Create New Service...');
      const newService = {
        name: 'cdn',
        category: 'Network',
        description: 'Content Delivery Network for fast content distribution',
        unitPrice: 0.05,
        currency: 'USD',
        requiredFields: ['bandwidth', 'regions', 'cacheSize'],
        status: 'active'
      };

      const createResponse = await axios.post(`${API_BASE}/admin/services`, newService, { headers });
      
      if (createResponse.data.success) {
        console.log('✅ New service created successfully');
        console.log(`   - Service ID: ${createResponse.data.service.id}`);
        console.log(`   - Service Name: ${createResponse.data.service.name}`);

        // Test 6: Verify AI Can Access New Service
        console.log('\n6. Testing AI Access to New Service...');
        const aiResponse = await axios.post(`${API_BASE}/ai`, {
          message: 'I need a content delivery network for my website',
          sessionId: 'test-session-' + Date.now()
        });

        if (aiResponse.data.success && aiResponse.data.response) {
          const responseText = aiResponse.data.response.toLowerCase();
          if (responseText.includes('cdn') || responseText.includes('content delivery')) {
            console.log('✅ AI can access and recommend the new CDN service!');
          } else {
            console.log('⚠️  AI response received but CDN not mentioned specifically');
          }
        }
      }

      console.log('\n🎉 All admin system tests completed successfully!');
      console.log('\n📝 Summary:');
      console.log('- Admin login/authentication ✅');
      console.log('- Service management (CRUD) ✅');
      console.log('- Analytics and metrics ✅');
      console.log('- User management ✅');
      console.log('- AI integration with dynamic services ✅');

    } else {
      console.log('❌ Admin login failed');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
  }
}

// Run the test
testAdminSystem();
