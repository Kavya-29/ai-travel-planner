const axios = require('axios');

const API_URL = 'http://localhost:5000/api/auth';

const tests = [
    {
        name: 'Invalid Email Format',
        data: { name: 'Test', email: 'not-an-email', password: 'password123', role: 'guest' },
        expectedStatus: 400,
        expectedMessage: 'Please provide a valid email address'
    },
    {
        name: 'Non-Existent Domain',
        data: { name: 'Test', email: 'test@thisdomaindoesnotexist12345.com', password: 'password123', role: 'guest' },
        expectedStatus: 400,
        expectedMessage: 'Invalid email domain'
    },
    {
        name: 'Valid Email Registration',
        data: { name: 'Test User', email: `test_${Date.now()}@gmail.com`, password: 'password123', role: 'guest' },
        expectedStatus: 201
    }
];

async function runTests() {
    console.log('🚀 Starting Authentication Validation Tests...\n');

    for (const test of tests) {
        try {
            console.log(`Testing: ${test.name}...`);
            const res = await axios.post(`${API_URL}/register`, test.data);

            if (res.status === test.expectedStatus) {
                console.log(`✅ Passed! (Status: ${res.status})\n`);
            } else {
                console.log(`❌ Failed! Expected ${test.expectedStatus}, got ${res.status}\n`);
            }
        } catch (err) {
            const status = err.response?.status;
            const message = err.response?.data?.message;

            if (status === test.expectedStatus && (!test.expectedMessage || message === test.expectedMessage)) {
                console.log(`✅ Passed! (Status: ${status}, Message: "${message}")\n`);
            } else {
                console.log(`❌ Failed! Expected ${test.expectedStatus} "${test.expectedMessage}", got ${status} "${message}"\n`);
            }
        }
    }
}

runTests();
