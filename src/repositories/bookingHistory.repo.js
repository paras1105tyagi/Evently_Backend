'use strict';

const BookingHistory = require('../models/bookingHistory.model');
const { DatabaseError, ValidationError, NotFoundError } = require('../middlewares/error');
const logger = require('../utils/logger');

async function create(data) {
	try {
		if (!data || typeof data !== 'object') {
			throw new ValidationError('Booking history data is required');
		}
		
		const historyEntry = await BookingHistory.create(data);
		return historyEntry;
	} catch (error) {
		logger.error('BookingHistory repository - create error', { error: error.message, data });
		if (error instanceof ValidationError) throw error;
		if (error.name === 'ValidationError') {
			throw new ValidationError('Invalid booking history data', Object.values(error.errors).map(err => ({
				field: err.path,
				message: err.message,
				value: err.value
			})));
		}
		throw new DatabaseError('Failed to create booking history entry', { originalError: error.message });
	}
}

async function findByUser(userId) {
	try {
		if (!userId) {
			throw new ValidationError('User ID is required');
		}
		
		const history = await BookingHistory.find({ userId }).sort({ createdAt: -1 }).lean();
		return history;
	} catch (error) {
		logger.error('BookingHistory repository - findByUser error', { error: error.message, userId });
		if (error instanceof ValidationError) throw error;
		throw new DatabaseError('Failed to find booking history for user', { originalError: error.message });
	}
}

module.exports = {
	create,
	findByUser
};
