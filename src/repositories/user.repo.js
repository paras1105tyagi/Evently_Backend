'use strict';

const User = require('../models/user.model');
const { DatabaseError, ValidationError, NotFoundError } = require('../middlewares/error');
const logger = require('../utils/logger');

async function findById(id) {
	try {
		if (!id) {
			throw new ValidationError('User ID is required');
		}
		const user = await User.findById(id).lean();
		return user;
	} catch (error) {
		logger.error('User repository - findById error', { error: error.message, id });
		if (error instanceof ValidationError) throw error;
		throw new DatabaseError('Failed to find user', { originalError: error.message });
	}
}

async function findByEmail(email) {
	try {
		if (!email) {
			throw new ValidationError('Email is required');
		}
		if (typeof email !== 'string' || !email.includes('@')) {
			throw new ValidationError('Valid email is required');
		}
		const user = await User.findOne({ email }).lean();
		return user;
	} catch (error) {
		logger.error('User repository - findByEmail error', { error: error.message, email });
		if (error instanceof ValidationError) throw error;
		throw new DatabaseError('Failed to find user by email', { originalError: error.message });
	}
}

async function create(data) {
	try {
		if (!data || typeof data !== 'object') {
			throw new ValidationError('User data is required');
		}
		const user = await User.create(data);
		return user;
	} catch (error) {
		logger.error('User repository - create error', { error: error.message, data });
		if (error.name === 'ValidationError') {
			throw new ValidationError('Invalid user data', Object.values(error.errors).map(err => ({
				field: err.path,
				message: err.message,
				value: err.value
			})));
		}
		throw new DatabaseError('Failed to create user', { originalError: error.message });
	}
}

module.exports = {
	findById,
	findByEmail,
	create
};
