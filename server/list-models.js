const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

// Manually parse .env to be sure
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const lines = envContent.split(/\r?\n/);
const env = {};
lines.forEach(line => {
    const [key, ...value] = line.split('=');
    if (key && value) {
        env[key.trim()] = value.join('=').trim();
    }
});

const API_KEY = env['GEMINI_API_KEY'];

async function testModels() {
    console.log('Testing Key:', API_KEY ? API_KEY.substring(0, 10) + '...' : 'MISSING');
    if (!API_KEY) return;

    const genAI = new GoogleGenerativeAI(API_KEY);
    const modelsToTry = [
        'gemini-1.5-flash',
        'gemini-1.5-pro',
        'gemini-pro',
        'gemini-1.0-pro'
    ];

    for (const modelName of modelsToTry) {
        console.log(`\nTrying model: ${modelName}...`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hello!");
            const response = await result.response;
            console.log(`✅ SUCCESS with ${modelName}: ${response.text().substring(0, 20)}...`);
        } catch (err) {
            console.log(`❌ FAILED with ${modelName}: ${err.message}`);
            if (err.status) console.log(`   Status: ${err.status}`);
        }
    }
}

testModels();
