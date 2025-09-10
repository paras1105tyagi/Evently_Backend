'use strict';

const { Schema, model, Types } = require('mongoose');

const bookingHistorySchema = new Schema(
	{
		userId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
		eventId: { type: Types.ObjectId, ref: 'Event', required: true, index: true },
		action: { type: String, enum: ['book', 'cancel', 'waitlist', 'notify'], required: true, index: true },
		bookingId: { type: String, index: true },
		meta: { type: Object }
	},
	{ timestamps: true }
);

bookingHistorySchema.index({ createdAt: -1 });

module.exports = model('BookingHistory', bookingHistorySchema);
