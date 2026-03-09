// In-memory conversation history per user session
const chatSessions = {};

// AI Service Helper (OpenAI-compatible)
const callGroq = async (messages, retries = 5, temperature = 0.8, model = 'llama-3.3-70b-versatile') => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        throw new Error('AI Service API Key missing');
    }

    for (let i = 0; i < retries; i++) {
        try {
            console.log(`--- CHATBOT CALLING AI SERVICE (${model}) - Attempt ${i + 1} | Temp: ${temperature} ---`);
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: model,
                    messages: messages,
                    temperature: temperature,
                    max_completion_tokens: 1024
                })
            });

            const data = await response.json();
            if (!response.ok) {
                // DETECT TPD (Tokens Per Day) LIMIT - Fallback to 8B model instantly
                if (response.status === 429 && data.error?.message?.toLowerCase().includes('tokens per day') && model !== 'llama-3.1-8b-instant') {
                    console.warn("⚠️ AI Service Token Quota Expired. Falling back to smaller model...");
                    return await callGroq(messages, retries, temperature, 'llama-3.1-8b-instant');
                }

                if (response.status === 429 && i < retries - 1) {
                    const delay = Math.pow(2, i + 1) * 2000;
                    console.warn(`💬 Chat AI Service Rate Limited. Retrying in ${delay / 1000}s...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }
                throw new Error(data.error?.message || `AI Service Error: ${response.status}`);
            }

            return data.choices[0].message.content;
        } catch (err) {
            if (i === retries - 1) throw err;
            const delay = Math.pow(2, i + 1) * 2000;
            console.warn(`⚠️ Chat Request failed: ${err.message}. Retrying...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
};

// @desc  Send chat message
// @route POST /api/chat/message
const chat = async (req, res) => {
    const { message, sessionId, propertyId, screenContext } = req.body;
    try {
        const id = sessionId || 'anonymous';
        if (!chatSessions[id]) {
            chatSessions[id] = [];
        }
        const history = chatSessions[id];

        let contextPrompt = '';
        if (screenContext && Object.keys(screenContext).length > 0) {
            contextPrompt = `\n\nCURRENT USER CONTEXT: The user is currently viewing: ${JSON.stringify(screenContext)}. 
            Use this information to provide personalized advice if they ask about 'this trip', 'this place', or 'my itinerary'.`;
        }

        const agenticInstructions = `
            You are a helpful and friendly "AI Travel Guide".
            - Help users plan their trips, suggest destinations, and answer travel-related questions.
            - Keep your responses conversational, concise, and professional.
            - Respond strictly in English.
            - IMPORTANT: You ARE NOT ALLOWED to use any action tags like [ACTION: ...] or [NAVIGATE: ...]. 
            - You cannot control the user's browser. If they ask to navigate or logout, explain that you are a guide and they should use the manual menus.
            ${contextPrompt}
        `;

        // SANITIZATION: Remove old action tags from history so the AI doesn't pattern-match them
        const sanitizedHistory = history.map(h => ({
            role: h.role,
            content: h.role === 'assistant'
                ? h.content.replace(/\[ACTION:\s*[^\]]*\]/gi, '').replace(/\[NAVIGATE:\s*[^\]]*\]/gi, '').trim()
                : h.content
        }));

        const messages = [
            {
                role: 'system',
                content: agenticInstructions
            },
            ...sanitizedHistory,
            { role: 'user', content: message }
        ];

        // Reset temperature to 0.7 for natural conversation variety
        const reply = await callGroq(messages, 5, 0.7);

        console.log("------------------- AI RAW REPLY -------------------");
        console.log(reply);
        console.log("-----------------------------------------------------");

        // Store message in history (limit to last 20 exchanges)
        history.push({ role: 'user', content: message });
        history.push({ role: 'assistant', content: reply });
        if (history.length > 40) history.splice(0, 2);

        res.json({ reply, sessionId });
    } catch (err) {
        console.error('CHATBOT ERROR:', err);
        res.status(500).json({ message: 'Chat service unavailable', error: err.message });
    }
};

module.exports = { chat };