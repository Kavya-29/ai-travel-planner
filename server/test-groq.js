require('dotenv').config({ path: require('path').join(__dirname, '.env') });

async function testGroq() {
    const apiKey = process.env.GROQ_API_KEY;
    console.log('Testing Groq with key:', apiKey ? apiKey.substring(0, 10) + '...' : 'MISSING');

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [{ role: 'user', content: 'Say hello' }],
                max_completion_tokens: 10
            })
        });

        const data = await response.json();
        if (response.ok) {
            console.log('SUCCESS! Groq responded:', data.choices[0].message.content);
        } else {
            console.error('FAILURE! Groq Error:', data.error);
        }
    } catch (err) {
        console.error('ERROR during fetch:', err.message);
    }
}

testGroq();
