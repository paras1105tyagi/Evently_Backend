'use strict';

const { Schema, model, Types } = require('mongoose');

const waitlistSchema = new Schema(
	{
		eventId: { type: Types.ObjectId, ref: 'Event', required: true, index: true },
		userId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
		requestedSeat: { type: Number },
		bookingId: { type: String, index: true },
		status: { type: String, enum: ['pending', 'processing', 'completed', 'cancelled'], default: 'pending', index: true }
	},
	{ timestamps: true }
);

waitlistSchema.index({ eventId: 1, status: 1, createdAt: 1 });
waitlistSchema.index({ userId: 1, eventId: 1 });
module.exports = model('Waitlist', waitlistSchema);
