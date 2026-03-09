// AI Service Helper (OpenAI-compatible)
const callGroq = async (messages, retries = 5, model = 'llama-3.3-70b-versatile') => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        console.error('CRITICAL: AI_API_KEY IS MISSING IN .ENV');
        throw new Error('AI Service API Key missing');
    }

    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: model,
                    messages: messages,
                    temperature: 0.7,
                    max_completion_tokens: model.includes('70b') ? 4096 : 8192,
                    response_format: { type: "text" }
                })
            });

            const data = await response.json();
            if (!response.ok) {
                // DETECT TPD (Tokens Per Day) LIMIT - Fallback to 8B model instantly
                if (response.status === 429 && data.error?.message?.toLowerCase().includes('tokens per day') && model !== 'llama-3.1-8b-instant') {
                    console.warn("⚠️ AI Service Token Quota Expired. Falling back to smaller model...");
                    return await callGroq(messages, retries, 'llama-3.1-8b-instant');
                }

                const isRetryable = response.status === 429 || response.status >= 500;
                if (isRetryable && i < retries - 1) {
                    const delay = Math.pow(2, i + 1) * 2000;
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }
                throw new Error(data.error?.message || `AI Service Error: ${response.status}`);
            }

            return data.choices[0].message.content;
        } catch (err) {
            if (i === retries - 1) throw err;
            const delay = Math.pow(2, i + 1) * 2000;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
};

module.exports = { callGroq };
