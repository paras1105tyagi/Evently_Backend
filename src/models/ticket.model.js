'use strict';

const { Schema, model, Types } = require('mongoose');

const ticketSchema = new Schema(
	{
		eventId: { type: Types.ObjectId, ref: 'Event', required: true, index: true },
		seatNumber: { type: Number, required: true },
		userId: { type: Types.ObjectId, ref: 'User', index: true },
		status: { type: String, enum: ['available', 'reserved', 'booked'], default: 'available', index: true },
		bookingId: { type: String, index: true }
	},
	{ timestamps: true }
);

ticketSchema.index({ eventId: 1, seatNumber: 1 }, { unique: true });

ticketSchema.index({ eventId: 1, status: 1 });
ticketSchema.index({ userId: 1, eventId: 1 });
ticketSchema.index({ createdAt: -1 });

module.exports = model('Ticket', ticketSchema);
