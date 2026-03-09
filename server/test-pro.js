const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function test() {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        const result = await model.generateContent("Hello!");
        console.log('✅ gemini-pro SUCCESS:', result.response.text().substring(0, 50));
    } catch (err) {
        console.log('❌ gemini-pro FAILED:', err.message);
    }
}
test();
