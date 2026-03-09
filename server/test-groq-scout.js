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

async function test() {
    console.log('Testing Llama 4 Scout...');
    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "meta-llama/llama-4-scout-17b-16e-instruct",
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: "What is in this image?" },
                            {
                                type: "image_url",
                                image_url: {
                                    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Eiffel_Tower_at_Night.jpg/800px-Eiffel_Tower_at_Night.jpg"
                                }
                            }
                        ]
                    }
                ],
                max_completion_tokens: 1024
            })
        });
        const data = await response.json();
        if (data.error) {
            console.error('Groq Error:', JSON.stringify(data.error, null, 2));
        } else {
            console.log('Success:', data.choices[0].message.content);
        }
    } catch (err) {
        console.error('Fetch Error:', err);
    }
}

test();
