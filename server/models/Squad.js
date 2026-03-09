const mongoose = require('mongoose');

const squadSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        inviteCode: { type: String, unique: true, required: true },
        tripData: {
            place: String,
            numberOfDays: { type: Number },
            numberOfMembers: { type: Number },
            travelDate: String,
            budget: String,
            currency: { type: String, default: 'USD' },
            interests: [String],
            itinerary: { type: Object, default: {} }
        },
        votes: [{
            userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            dayIndex: Number,
            activityId: String,
            isUpvote: Boolean
        }],
        isActive: { type: Boolean, default: true }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Squad', squadSchema);
