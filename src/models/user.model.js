'use strict';

const { Schema, model } = require('mongoose');

const userSchema = new Schema(
	{
		name: { type: String, required: true },
		email: { type: String, required: true, unique: true, index: true },
		passwordHash: { type: String, required: true },
		role: { type: String, enum: ['user', 'admin'], default: 'user', index: true }
	},
	{ timestamps: true }
);

userSchema.index({ createdAt: -1 });

module.exports = model('User', userSchema);
