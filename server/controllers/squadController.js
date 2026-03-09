const Squad = require('../models/Squad');
const crypto = require('crypto');

// @desc  Create a new squad room
// @route POST /api/squad
const createSquad = async (req, res) => {
    try {
        const { name } = req.body;
        const inviteCode = crypto.randomBytes(3).toString('hex').toUpperCase();

        const squad = await Squad.create({
            name,
            owner: req.user._id,
            members: [req.user._id],
            inviteCode,
            tripData: {
                place: '',
                numberOfDays: '',
                travelDate: '',
                budget: '',
                currency: 'USD',
                interests: [],
                itinerary: {}
            }
        });

        res.status(201).json(squad);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Join a squad room via invite code
// @route POST /api/squad/join
const joinSquad = async (req, res) => {
    try {
        const { inviteCode } = req.body;
        const squad = await Squad.findOne({ inviteCode, isActive: true });

        if (!squad) {
            return res.status(404).json({ message: 'Squad room not found or inactive' });
        }

        if (!squad.members.includes(req.user._id)) {
            squad.members.push(req.user._id);
            await squad.save();
        }

        await squad.populate('members', 'name email');
        res.json(squad);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Get squad room details
// @route GET /api/squad/:id
const getSquadById = async (req, res) => {
    try {
        const squad = await Squad.findById(req.params.id)
            .populate('owner', 'name email')
            .populate('members', 'name email');

        if (!squad) {
            return res.status(404).json({ message: 'Squad room not found' });
        }

        res.json(squad);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Update squad trip data
// @route PATCH /api/squad/:id
const updateSquadTrip = async (req, res) => {
    try {
        const { tripData } = req.body;
        const squad = await Squad.findByIdAndUpdate(
            req.params.id,
            { $set: { tripData } },
            { new: true }
        ).populate('members', 'name email');

        res.json(squad);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const { callGroq } = require('../utils/ai');

// ... (previous functions: createSquad, joinSquad, getSquadById, updateSquadTrip)

// @desc  Generate AI itinerary for the squad
// @route POST /api/squad/:id/generate
const generateSquadPlan = async (req, res) => {
    try {
        const squad = await Squad.findById(req.params.id);
        if (!squad) return res.status(404).json({ message: 'Squad not found' });

        const { place, budget, currency, numberOfDays, numberOfMembers, travelDate, interests } = squad.tripData;
        const finalDays = numberOfDays || 3;
        const finalMembers = numberOfMembers || 1;
        const finalInterests = (interests || []).join(', ') || 'General Sightseeing';

        const prompt = `Create a detailed ${finalDays}-day travel plan for ${place} for a group of ${finalMembers} members.
Trip Style/Interests: ${finalInterests}
Starting Date: ${travelDate || 'flexible dates'}
Current Squad Budget: ${budget} ${currency}.
        
Return ONLY a JSON object with this exact structure. YOU MUST PROVIDE EXACTLY 3 ACTIVITIES PER DAY (Morning, Afternoon, Evening). Do not skip any time period!
{
  "itinerary_days": [
    {
      "day": 1,
      "activities": [
        { "id": "act1", "title": "...", "description": "...", "time": "Morning" },
        { "id": "act2", "title": "...", "description": "...", "time": "Afternoon" },
        { "id": "act3", "title": "...", "description": "...", "time": "Evening" }
      ]
    }
  ],
  "budget_breakdown": [
    { "category": "Accommodation", "amount": "...", "note": "Estimated total cost for ${finalMembers} members" },
    { "category": "Food & Dining", "amount": "...", "note": "Total meal budget for ${finalMembers} members" },
    { "category": "Sightseeing", "amount": "...", "note": "Entry fees/tours for ${finalMembers} people" },
    { "category": "Local Transport", "amount": "...", "note": "Total transport for ${finalMembers} people" }
  ],
  "total_estimated_cost": "...",
  "budget_advisor": "FINANCIAL EVALUATION: Be brutally honest. Is ${budget} ${currency} enough for ${finalMembers} members in ${place} for ${finalDays} days considering their interest in '${finalInterests}'? If low, explain why and state exactly how much more is needed.",
  "required_total_for_comfort": "Provide a numeric total (e.g. 5000) that would be sufficient for this specific trip"
}
IMPORTANT: The budget_advisor MUST analyze the specific interests. If interests include 'Luxury', the budget check must be much stricter. Ensure all breakdown amounts are TOTALS for the group. ALL DAYS MUST HAVE MORNING, AFTERNOON, AND EVENING activities regardless of the input constraint parameters.`.trim();

        const text = await callGroq([{ role: 'user', content: prompt }]);
        // Improved JSON extraction
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("AI failed to return valid JSON");
        const data = JSON.parse(jsonMatch[0]);

        squad.tripData.itinerary = data;
        await squad.save();
        await squad.populate('members', 'name email');

        res.json(squad);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Toggle vote on an activity
// @route POST /api/squad/:id/vote
const toggleVote = async (req, res) => {
    try {
        const { dayIndex, activityId, isUpvote } = req.body;

        // 1. Atomically pull any existing vote by this user for this activity
        // findOneAndUpdate returns the document BEFORE the update by default
        const oldSquad = await Squad.findOneAndUpdate(
            { _id: req.params.id },
            { $pull: { votes: { userId: req.user._id, activityId: activityId } } }
        );

        if (!oldSquad) {
            return res.status(404).json({ message: 'Squad not found' });
        }

        // 2. Check what the previous vote was (if any)
        const oldVote = oldSquad.votes.find(v =>
            v.userId && v.userId.toString() === req.user._id.toString() && v.activityId === activityId
        );

        // 3. If they are clicking the SAME vote button, it means they want to "un-vote" (toggle off).
        // Since we already pulled it, we just do nothing and return.
        // If it's a DIFFERENT vote or a NEW vote, we push the new vote atomically.
        if (!oldVote || oldVote.isUpvote !== isUpvote) {
            await Squad.updateOne(
                { _id: req.params.id },
                {
                    $push: {
                        votes: { userId: req.user._id, dayIndex, activityId, isUpvote }
                    }
                }
            );
        }

        // 4. Fetch the fully updated squad to return
        const updatedSquad = await Squad.findById(req.params.id).populate('members', 'name email');

        res.json(updatedSquad);
    } catch (err) {
        console.error("Vote Error:", err);
        res.status(500).json({ message: err.message });
    }
};

const TravelPlan = require('../models/TravelPlan');

// @desc  Save squad itinerary to user's personal history
// @route POST /api/squad/:id/save
const saveSquadPlan = async (req, res) => {
    console.log(`💾 [SQUAD] Save attempt for squad: ${req.params.id} by user: ${req.user._id}`);
    try {
        const squad = await Squad.findById(req.params.id);
        if (!squad) return res.status(404).json({ message: 'Squad not found' });

        if (!squad.members.includes(req.user._id)) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (!squad.tripData.itinerary || !squad.tripData.itinerary.itinerary_days) {
            return res.status(400).json({ message: 'No itinerary generated to save yet' });
        }

        // Check for duplicates
        const existingPlan = await TravelPlan.findOne({
            user: req.user._id,
            place: squad.tripData.place,
            days: squad.tripData.numberOfDays,
            travelDate: squad.tripData.travelDate ? new Date(squad.tripData.travelDate) : undefined
        });

        if (existingPlan) {
            return res.status(400).json({ message: 'This plan is already in your history.' });
        }

        // Enrich itinerary with squad votes
        const itinerary = JSON.parse(JSON.stringify(squad.tripData.itinerary));
        if (itinerary.itinerary_days) {
            itinerary.itinerary_days = itinerary.itinerary_days.map(day => {
                if (day.activities) {
                    day.activities = day.activities.map(act => {
                        // Match by ID OR Title (fallback) for robustness
                        const likes = squad.votes.filter(v =>
                            (v.activityId === act.id) ||
                            (v.activityId && act.title && v.activityId.toLowerCase().includes(act.title.toLowerCase()))
                        ).filter(v => v.isUpvote === true).length;

                        const dislikes = squad.votes.filter(v =>
                            (v.activityId === act.id) ||
                            (v.activityId && act.title && v.activityId.toLowerCase().includes(act.title.toLowerCase()))
                        ).filter(v => v.isUpvote === false).length;

                        return { ...act, likes, dislikes };
                    });
                }
                return day;
            });
        }

        const newPlan = await TravelPlan.create({
            user: req.user._id,
            place: squad.tripData.place,
            days: squad.tripData.numberOfDays,
            budget: Number(squad.tripData.budget) || 0,
            currency: squad.tripData.currency,
            travelDate: squad.tripData.travelDate ? new Date(squad.tripData.travelDate) : undefined,
            itineraryData: {
                ...itinerary,
                isSquadPlan: true,
                introduction: `Shared squad trip from "${squad.name}"`,
                rating: "4.9",
                travel_tips: [
                    { category: "Squad Trip", text: `This plan was created collaboratively in the ${squad.name} room.` },
                    { category: "Community", text: "Saved with all collective votes from your squad." }
                ],
                safety_awareness: "Standard safety precautions apply for group travel."
            }
        });

        res.status(201).json(newPlan);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { createSquad, joinSquad, getSquadById, updateSquadTrip, generateSquadPlan, toggleVote, saveSquadPlan };
