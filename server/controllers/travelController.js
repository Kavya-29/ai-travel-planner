const fs = require('fs');
const path = require('path');
const TravelPlan = require('../models/TravelPlan');

const { callGroq } = require('../utils/ai');

// ─── Generate full travel itinerary ───────────────────────────────────────────
// @route POST /api/travel/itinerary
const generateItinerary = async (req, res) => {
    console.log('--- GENERATE ITINERARY REQUEST RECEIVED ---');
    const { place, numberOfDays, days, budget, currency, travelDate, interests, preferences } = req.body;
    const finalDays = numberOfDays || days || 3;

    try {
        const prompt = `
You are an expert travel planner. Create a highly detailed, professional travel plan for ${place} in JSON format.
- Duration: ${finalDays} days
- Total Budget: ${budget} ${currency}
- Travel Date: ${travelDate}
- Interests: ${Array.isArray(interests) ? interests.join(', ') : (interests || 'General exploration')}
- Style: ${preferences || 'Standard'}

CRITICAL INSTRUCTION: First, strictly verify if "${place}" is a real, existing city, state, country, or recognized tourist destination AND that it is spelled correctly. 
If "${place}" is misspelled (like "duabi" instead of "Dubai" or "americ" instead of "America"), completely fictional, non-existent, or gibberish (e.g., "asdfgasdf", "Neverland", "Gotham"), you MUST NOT generate a travel plan. Instead, return EXACTLY this JSON object:
{
  "error": "The location '${place}' could not be found or is misspelled. Did you mean [Suggested Correct Spelling]? Please check the spelling and try again."
}

If the place is valid and spelled correctly, return ONLY a JSON object with this exact structure (no markdown, no extra text):
{
  "introduction": "A captivating 3-4 sentence introduction about ${place} matching the user's interests.",
  "rating": 4.8,
  "itinerary_days": [
    {
      "day": 1,
      "title": "...",
      "map_query": "...",
      "morning": "...",
      "afternoon": "...",
      "evening": "..."
    }
  ],
  "travel_tips": [
    { "category": "...", "text": "..." }
  ],
  "safety_awareness": "...",
  "budget_breakdown": {
    "accommodation": 0,
    "food": 0,
    "activities": 0,
    "transportation": 0,
    "miscellaneous": 0,
    "total": 0
  },
  "mood_data": {
    "mood": "Adventurous/Relaxed/etc",
    "emoji": "✨",
    "description": "Short personality blurb"
  },
  "carbon_data": {
    "totalCO2kg": 450,
    "footprintLevel": "low/medium/high"
  },
  "packing_data": {
    "items": ["Item 1", "Item 2", "Item 3", "Item 4", "Item 5"]
  },
  "ai_advisor": "Provide 2-3 sentences of expert, 'God-Tier' travel wisdom for this specific trip (e.g., a hidden local spot, a specific timing tip to avoid crowds, or a cultural etiquette nuance that most tourists miss).",
  "budget_advisor": "FINANCIAL EVALUATION: Analysis of whether the budget (${budget} ${currency}) is sufficient for ${finalDays} days in ${place} for the traveler's interests. Be honest and provide a comfort estimate if the current budget is tight."
}
        `.trim();

        const text = await callGroq([{ role: 'user', content: prompt }]);

        // Clean and parse JSON
        let data;
        try {
            const cleanedJson = text.replace(/```json|```/g, '').trim();
            data = JSON.parse(cleanedJson);
        } catch (parseErr) {
            console.error('JSON PARSE ERROR. Raw text:', text);
            throw new Error('AI returned invalid JSON format. Please try again.');
        }

        if (data.error) {
            return res.status(400).json({ message: data.error });
        }

        res.json(data);
    } catch (err) {
        const errorLog = `[${new Date().toISOString()}] GENERATE ITINERARY ERROR: ${err.stack || err}\n`;
        fs.appendFileSync(path.join(__dirname, '../server_error.log'), errorLog);
        console.error('❌ GENERATE ITINERARY ERROR:', err.message || err);
        res.status(500).json({ message: 'Failed to generate itinerary. AI service error.', error: err.message });
    }
};

// ─── Save Itinerary ──────────────────────────────────────────────────────────
const savePlan = async (req, res) => {
    try {
        const { place, days, budget, currency, travelDate, itineraryData, innovationData } = req.body;

        // Prevent duplicates: Check if user already has this exact plan saved
        const existingPlan = await TravelPlan.findOne({
            user: req.user._id,
            place,
            days,
            travelDate: travelDate ? new Date(travelDate) : undefined
        });

        if (existingPlan) {
            return res.status(400).json({ message: "This plan is already in your history." });
        }

        const newPlan = await TravelPlan.create({
            user: req.user._id,
            place,
            days,
            budget,
            currency,
            travelDate,
            itineraryData,
            innovationData
        });
        res.status(201).json(newPlan);
    } catch (err) {
        res.status(500).json({ message: "Failed to save plan", error: err.message });
    }
};

// ─── Check Saved Status ──────────────────────────────────────────────────────
const checkSavedStatus = async (req, res) => {
    try {
        const { place, days, travelDate } = req.body;
        const existingPlan = await TravelPlan.findOne({
            user: req.user._id,
            place,
            days,
            travelDate: travelDate ? new Date(travelDate) : undefined
        });
        res.json({ isSaved: !!existingPlan });
    } catch (err) {
        res.status(500).json({ message: "Failed to check status", error: err.message });
    }
};

// ─── Get My Plans ────────────────────────────────────────────────────────────
const getMyPlans = async (req, res) => {
    try {
        const plans = await TravelPlan.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.json(plans);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch plans", error: err.message });
    }
};

// ─── Delete Plan ─────────────────────────────────────────────────────────────
const deletePlan = async (req, res) => {
    try {
        await TravelPlan.findOneAndDelete({ _id: req.params.id, user: req.user._id });
        res.json({ message: "Plan deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Failed to delete plan", error: err.message });
    }
};

// ─── AI Mood Detection ─────────────────────────────────────────────────────────
const detectMood = async (req, res) => {
    const { interests, preferences } = req.body;
    try {
        const prompt = `Based on travel interests: "${interests}" and style: "${preferences}", detect the traveler's mood. 
        Return ONLY a JSON: { "mood": "...", "personalityType": "...", "emoji": "...", "description": "...", "suggestedActivities": [] }`;

        const text = await callGroq([{ role: 'user', content: prompt }]);
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const data = jsonMatch ? JSON.parse(jsonMatch[0]) : { mood: 'Adventurous', emoji: '🗺️' };
        res.json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ─── Carbon Footprint Estimator ────────────────────────────────────────────────
const estimateCarbon = async (req, res) => {
    const { place, numberOfDays, days, transportMode, groupSize } = req.body;
    const finalDays = numberOfDays || days || 1;
    try {
        const prompt = `Estimate CO2 for ${place} for ${finalDays} days. Transport: ${transportMode || 'flight'}. Group: ${groupSize || 1}.
        Return ONLY a JSON: { "totalCO2kg": 0, "perPersonCO2kg": 0, "breakdown": { "flight": 0, "accommodation": 0 }, "offsetTips": [], "footprintLevel": "medium" }`;

        const text = await callGroq([{ role: 'user', content: prompt }]);
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const data = jsonMatch ? JSON.parse(jsonMatch[0]) : { totalCO2kg: 500 };
        res.json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ─── Smart Budget Optimizer ────────────────────────────────────────────────────
const optimizeBudget = async (req, res) => {
    const { place, numberOfDays, days, budget, currency, preferences } = req.body;
    const finalDays = numberOfDays || days || 3;
    try {
        const prompt = `Optimize budget for ${place}, ${finalDays} days, ${budget} ${currency}.
        Return ONLY a JSON: { "optimizedBreakdown": { "accommodation": 0, "food": 0, "activities": 0, "transportation": 0 }, "savingTips": [], "budgetScore": "good" }`;

        const text = await callGroq([{ role: 'user', content: prompt }]);
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const data = jsonMatch ? JSON.parse(jsonMatch[0]) : { optimizedBreakdown: {} };
        res.json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ─── AI Packing List Generator ─────────────────────────────────────────────────
const generatePackingList = async (req, res) => {
    const { place, numberOfDays, days, interests, travelDate, preferences } = req.body;
    const finalDays = numberOfDays || days || 3;
    try {
        const prompt = `Generate a packing list for ${place} for ${finalDays} days in ${travelDate}. Style: ${preferences}.
        Return ONLY a JSON: { "categories": [ { "name": "...", "emoji": "...", "items": [] } ] }`;

        const text = await callGroq([{ role: 'user', content: prompt }]);
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const data = jsonMatch ? JSON.parse(jsonMatch[0]) : { categories: [] };
        res.json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


// ─── Get Single Plan by ID ────────────────────────────────────────────────────
const getPlanById = async (req, res) => {
    try {
        const plan = await TravelPlan.findOne({ _id: req.params.id, user: req.user._id });
        if (!plan) return res.status(404).json({ message: "Plan not found" });
        res.json(plan);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch plan", error: err.message });
    }
};

// ─── Vision-Based Image Analysis ──────────────────────────────────────────────
const analyzeTravelImage = async (req, res) => {
    const { image, mimeType } = req.body; // Expecting base64 image and its mime type

    if (!image || !mimeType) {
        return res.status(400).json({ message: "Image data and MIME type are required" });
    }

    try {
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            throw new Error("AI_API_KEY is missing in .env");
        }

        console.log("--- CALLING AI VISION SERVICE ---");

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "meta-llama/llama-4-scout-17b-16e-instruct",
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: `Identify the exact geographical location in this image.
                                
                                ### VISUAL REASONING STEPS:
                                1. DESCRIBE the geological features: Are there specific mountain silhouettes, water clarity patterns, or unique rock colors in the foreground? (e.g., Lake McDonald is famous for multicolored pebbles).
                                2. EVALUATE text overlays: Identify if any text (like "11/10 lake" or account handles) provides a clue, but do not let it override visual evidence if it's generic.
                                3. FILTER UI: Completely ignore heart icons, share buttons, and Instagram-style interface elements.
                                4. CROSS-REFERENCE: Compare the scenery against known landmarks (e.g., Glacier National Park, Lake Tahoe, Lake Louise).
                                
                                ### OUTPUT REQUIREMENTS:
                                Return ONLY a JSON object:
                                {
                                    "place": "City, Country or Landmark, State, Country",
                                    "suggestedDays": 5,
                                    "suggestedBudget": "Value",
                                    "interests": ["Interest 1", "Interest 2"],
                                    "reasoning": "Briefly explain why you identified this specific location based on visual cues."
                                }`
                            },
                            {
                                type: "image_url",
                                image_url: {
                                    url: `data:${mimeType};base64,${image}`
                                }
                            }
                        ]
                    }
                ],
                temperature: 0.1,
                response_format: { type: "json_object" }
            })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error?.message || `AI Vision Error: ${response.status}`);
        }

        const content = data.choices[0].message.content;
        const result = typeof content === 'string' ? JSON.parse(content) : content;

        res.json(result);
    } catch (err) {
        const errorLog = `[${new Date().toISOString()}] GROQ VISION ERROR: ${err.message}\n${err.stack}\n`;
        fs.appendFileSync(path.join(__dirname, '../server_error.log'), errorLog);
        console.error("GROQ VISION ANALYSIS ERROR:", err);
        res.status(500).json({ message: "AI failed to analyze image", error: err.message });
    }
};

module.exports = {
    generateItinerary,
    detectMood,
    estimateCarbon,
    optimizeBudget,
    generatePackingList,
    savePlan,
    checkSavedStatus,
    getMyPlans,
    deletePlan,
    getPlanById,
    analyzeTravelImage
};
