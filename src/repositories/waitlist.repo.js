'use strict';

const Waitlist = require('../models/waitlist.model');
const { DatabaseError, ValidationError, NotFoundError } = require('../middlewares/error');
const logger = require('../utils/logger');

async function enqueue(eventId, userId, requestedSeat, bookingId) {
	try {
		if (!eventId) {
			throw new ValidationError('Event ID is required');
		}
		if (!userId) {
			throw new ValidationError('User ID is required');
		}
		if (!bookingId) {
			throw new ValidationError('Booking ID is required');
		}
		
		const waitlistEntry = await Waitlist.create({ eventId, userId, requestedSeat, bookingId });
		return waitlistEntry;
	} catch (error) {
		logger.error('Waitlist repository - enqueue error', { error: error.message, eventId, userId, requestedSeat, bookingId });
		if (error instanceof ValidationError) throw error;
		if (error.name === 'ValidationError') {
			throw new ValidationError('Invalid waitlist data', Object.values(error.errors).map(err => ({
				field: err.path,
				message: err.message,
				value: err.value
			})));
		}
		throw new DatabaseError('Failed to enqueue user', { originalError: error.message });
	}
}

async function peekNext(eventId) {
	try {
		if (!eventId) {
			throw new ValidationError('Event ID is required');
		}
		
		const entry = await Waitlist.findOneAndUpdate(
			{ eventId, status: 'pending' }, 
			{ $set: { status: 'processing' } }, 
			{ sort: { createdAt: 1 }, new: true }
		);
		return entry;
	} catch (error) {
		logger.error('Waitlist repository - peekNext error', { error: error.message, eventId });
		if (error instanceof ValidationError) throw error;
		throw new DatabaseError('Failed to peek next waitlist entry', { originalError: error.message });
	}
}

async function complete(id) {
	try {
		if (!id) {
			throw new ValidationError('Waitlist entry ID is required');
		}
		
		const entry = await Waitlist.findByIdAndUpdate(id, { $set: { status: 'completed' } }, { new: true });
		if (!entry) {
			throw new NotFoundError('Waitlist entry', id);
		}
		return entry;
	} catch (error) {
		logger.error('Waitlist repository - complete error', { error: error.message, id });
		if (error instanceof ValidationError || error instanceof NotFoundError) throw error;
		throw new DatabaseError('Failed to complete waitlist entry', { originalError: error.message });
	}
}

async function cancelAllForEvent(eventId) {
	try {
		if (!eventId) {
			throw new ValidationError('Event ID is required');
		}
		
		const result = await Waitlist.updateMany(
			{ eventId, status: { $in: ['pending', 'processing'] } }, 
			{ $set: { status: 'cancelled' } }
		);
		return result;
	} catch (error) {
		logger.error('Waitlist repository - cancelAllForEvent error', { error: error.message, eventId });
		if (error instanceof ValidationError) throw error;
		throw new DatabaseError('Failed to cancel waitlist entries for event', { originalError: error.message });
	}
}

async function listByEvent(eventId) {
	try {
		if (!eventId) {
			throw new ValidationError('Event ID is required');
		}
		
		const entries = await Waitlist.find({ eventId }).sort({ createdAt: 1 }).lean();
		return entries;
	} catch (error) {
		logger.error('Waitlist repository - listByEvent error', { error: error.message, eventId });
		if (error instanceof ValidationError) throw error;
		throw new DatabaseError('Failed to list waitlist entries for event', { originalError: error.message });
	}
}

async function cancelByBookingId(bookingId) {
	try {
		if (!bookingId) {
			throw new ValidationError('Booking ID is required');
		}
		
		const entry = await Waitlist.findOneAndUpdate(
			{ bookingId, status: { $in: ['pending', 'processing'] } }, 
			{ $set: { status: 'cancelled' } }, 
			{ new: true }
		);
		return entry;
	} catch (error) {
		logger.error('Waitlist repository - cancelByBookingId error', { error: error.message, bookingId });
		if (error instanceof ValidationError) throw error;
		throw new DatabaseError('Failed to cancel waitlist entry by booking ID', { originalError: error.message });
	}
}

module.exports = {
	enqueue,
	peekNext,
	complete,
	cancelAllForEvent,
	listByEvent,
	cancelByBookingId
};
