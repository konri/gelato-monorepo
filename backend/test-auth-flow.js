const axios = require('axios')

const BASE_URL = 'http://localhost:4000/authorization'

// Test scenarios
const testScenarios = [
  {
    name: '1. Register new user in WEB_MERCHANT',
    action: 'register',
    data: {
      email: 'test-web@example.com',
      password: 'password123',
      name: 'Test Web User',
      registrationSource: 'WEB_MERCHANT',
    },
  },
  {
    name: '2. Register new user in MOBILE_CLIENT',
    action: 'register',
    data: {
      email: 'test-mobile@example.com',
      password: 'password123',
      name: 'Test Mobile User',
      registrationSource: 'MOBILE_CLIENT',
    },
  },
  {
    name: '3. Check if user exists',
    action: 'check',
    email: 'test-web@example.com',
  },
  {
    name: '4. Try login NEW_USER (WEB_MERCHANT source) to WEB_MERCHANT',
    action: 'login',
    data: {
      email: 'test-web@example.com',
      password: 'password123',
      loginContext: 'WEB_MERCHANT',
    },
  },
  {
    name: '5. Try login NEW_USER (MOBILE_CLIENT source) to MOBILE_CLIENT',
    action: 'login',
    data: {
      email: 'test-mobile@example.com',
      password: 'password123',
      loginContext: 'MOBILE_CLIENT',
    },
  },
  {
    name: '6. Try login NEW_USER (MOBILE_CLIENT source) to WEB_MERCHANT',
    action: 'login',
    data: {
      email: 'test-mobile@example.com',
      password: 'password123',
      loginContext: 'WEB_MERCHANT',
    },
  },
]

async function runTest(scenario) {
  console.log(`\n🧪 ${scenario.name}`)
  console.log('='.repeat(50))

  try {
    let response

    switch (scenario.action) {
      case 'register':
        response = await axios.post(`${BASE_URL}/signup`, scenario.data)
        console.log('✅ Registration successful')
        console.log('Response:', response.data)
        break

      case 'check':
        response = await axios.get(`${BASE_URL}/check-user/${scenario.email}`)
        console.log('✅ User check successful')
        console.log('Response:', response.data)
        break

      case 'login':
        response = await axios.post(`${BASE_URL}/login`, scenario.data)
        console.log('✅ Login response received')
        console.log('Status:', response.status)
        console.log('Response:', response.data)
        break
    }
  } catch (error) {
    if (error.response) {
      console.log('❌ Error response:')
      console.log('Status:', error.response.status)
      console.log('Data:', error.response.data)
    } else {
      console.log('❌ Network error:', error.message)
    }
  }
}

async function runAllTests() {
  console.log('🚀 Starting Auth Flow Tests')
  console.log('Server should be running on http://localhost:4000')

  for (const scenario of testScenarios) {
    await runTest(scenario)
    await new Promise((resolve) => setTimeout(resolve, 1000)) // Wait 1s between tests
  }

  console.log('\n🏁 All tests completed!')
}

// Run tests
runAllTests().catch(console.error)
