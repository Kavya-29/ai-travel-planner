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

const API_KEY = env['GEMINI_API_KEY'];

async function discover() {
    console.log('Discovering models for key:', API_KEY.substring(0, 10) + '...');
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
        const data = await response.json();

        if (data.error) {
            console.error('API Error:', JSON.stringify(data.error, null, 2));
            return;
        }

        console.log('Available Models:');
        if (data.models) {
            const list = data.models.map(m => `- ${m.name} (${m.supportedGenerationMethods.join(', ')})`).join('\n');
            fs.writeFileSync(path.join(__dirname, 'available_models.txt'), list);
            console.log('Saved models to available_models.txt');
        } else {
            console.log('No models returned in list.');
        }
    } catch (err) {
        console.error('Fetch Error:', err);
    }
}

discover();
