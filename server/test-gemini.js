const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: 'c:/Users/VICTUS/Desktop/FINAL YR PROJECT[1]/server/.env' });

async function test() {
    try {
        console.log('Using Key:', process.env.GEMINI_API_KEY.substring(0, 5) + '...');
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent("Say hello!");
        console.log('Response:', result.response.text());
    } catch (err) {
        console.error('Gemini Test Error:', err);
    }
}
test();
