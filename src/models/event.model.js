'use strict';

const { Schema, model, Types } = require('mongoose');

const eventSchema = new Schema(
	{
		name: { type: String, required: true, index: true },
		venue: { type: String, required: true },
		startTime: { type: Date, required: true, index: true },
		capacity: { type: Number, required: true },
		seats: { type: Number, required: true },
		isActive: { type: Boolean, default: true, index: true }
	},
	{ timestamps: true }
);

eventSchema.index({ createdAt: -1 });

eventSchema.index({ name: 1, startTime: 1 });

module.exports = model('Event', eventSchema);
