const fs = require('fs');
const path = require('path');

// Manually parse .env
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

const API_KEY = env['GROQ_API_KEY'];

async function discover() {
    console.log('Discovering Groq models for key:', API_KEY.substring(0, 10) + '...');
    try {
        const response = await fetch('https://api.groq.com/openai/v1/models', {
            headers: {
                'Authorization': `Bearer ${API_KEY}`
            }
        });
        const data = await response.json();

        if (data.error) {
            console.error('Groq API Error:', JSON.stringify(data.error, null, 2));
            return;
        }

        console.log('Available Groq Models:');
        if (data.data) {
            const list = data.data.map(m => m.id).join('\n');
            fs.writeFileSync(path.join(__dirname, 'groq_models.txt'), list);
            console.log('Saved models to groq_models.txt');
        } else {
            console.log('No models returned in list.');
        }
    } catch (err) {
        console.error('Fetch Error:', err);
    }
}

discover();
