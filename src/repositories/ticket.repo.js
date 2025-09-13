'use strict';

const Ticket = require('../models/ticket.model');
const { DatabaseError, ValidationError, NotFoundError } = require('../middlewares/error');
const logger = require('../utils/logger');

async function reserveSeat(eventId, seatNumber, userId, bookingId) {
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
		
		const ticket = await Ticket.findOneAndUpdate(
			{ eventId, status: 'available', ...(seatNumber != null ? { seatNumber } : {}) },
			{ $set: { status: 'booked', userId, bookingId } },
			{ new: true }
		);
		return ticket;
	} catch (error) {
		logger.error('Ticket repository - reserveSeat error', { error: error.message, eventId, seatNumber, userId, bookingId });
		if (error instanceof ValidationError) throw error;
		throw new DatabaseError('Failed to reserve seat', { originalError: error.message });
	}
}

async function releaseSeat(query) {
	try {
		if (!query || typeof query !== 'object') {
			throw new ValidationError('Query object is required');
		}
		
		const ticket = await Ticket.findOneAndUpdate(
			query,
			{ $set: { status: 'available' }, $unset: { userId: '', bookingId: '' } },
			{ new: false }
		);
		return ticket;
	} catch (error) {
		logger.error('Ticket repository - releaseSeat error', { error: error.message, query });
		if (error instanceof ValidationError) throw error;
		throw new DatabaseError('Failed to release seat', { originalError: error.message });
	}
}

async function countByStatus(eventId, status) {
	try {
		if (!eventId) {
			throw new ValidationError('Event ID is required');
		}
		if (!status) {
			throw new ValidationError('Status is required');
		}
		
		const count = await Ticket.countDocuments({ eventId, status });
		return count;
	} catch (error) {
		logger.error('Ticket repository - countByStatus error', { error: error.message, eventId, status });
		if (error instanceof ValidationError) throw error;
		throw new DatabaseError('Failed to count tickets by status', { originalError: error.message });
	}
}

async function listSeats(eventId) {
	try {
		if (!eventId) {
			throw new ValidationError('Event ID is required');
		}
		
		const seats = await Ticket.find({ eventId })
			.select('seatNumber status userId bookingId')
			.sort({ seatNumber: 1 })
			.lean();
		return seats;
	} catch (error) {
		logger.error('Ticket repository - listSeats error', { error: error.message, eventId });
		if (error instanceof ValidationError) throw error;
		throw new DatabaseError('Failed to list seats', { originalError: error.message });
	}
}

async function listSeatsUpTo(eventId, maxSeatNumber) {
	try {
		if (!eventId) {
			throw new ValidationError('Event ID is required');
		}
		if (maxSeatNumber == null || !Number.isInteger(maxSeatNumber)) {
			throw new ValidationError('Valid max seat number is required');
		}
		
		const seats = await Ticket.find({ eventId, seatNumber: { $lte: maxSeatNumber } })
			.select('seatNumber status userId bookingId')
			.sort({ seatNumber: 1 })
			.lean();
		return seats;
	} catch (error) {
		logger.error('Ticket repository - listSeatsUpTo error', { error: error.message, eventId, maxSeatNumber });
		if (error instanceof ValidationError) throw error;
		throw new DatabaseError('Failed to list seats up to number', { originalError: error.message });
	}
}

async function createSeatRange(eventId, fromSeatIncl, toSeatIncl) {
	try {
		if (!eventId) {
			throw new ValidationError('Event ID is required');
		}
		if (!Number.isInteger(fromSeatIncl) || !Number.isInteger(toSeatIncl)) {
			throw new ValidationError('Valid seat numbers are required');
		}
		if (fromSeatIncl > toSeatIncl) {
			throw new ValidationError('From seat number must be less than or equal to to seat number');
		}
		
		const docs = [];
		for (let s = fromSeatIncl; s <= toSeatIncl; s++) {
			docs.push({ eventId, seatNumber: s });
		}
		
		if (docs.length === 0) return [];
		
		const tickets = await Ticket.insertMany(docs, { ordered: false });
		return tickets;
	} catch (error) {
		logger.error('Ticket repository - createSeatRange error', { error: error.message, eventId, fromSeatIncl, toSeatIncl });
		if (error instanceof ValidationError) throw error;
		throw new DatabaseError('Failed to create seat range', { originalError: error.message });
	}
}

async function deleteAvailableAboveSeat(eventId, maxSeatNumber) {
	try {
		if (!eventId) {
			throw new ValidationError('Event ID is required');
		}
		if (maxSeatNumber == null || !Number.isInteger(maxSeatNumber)) {
			throw new ValidationError('Valid max seat number is required');
		}
		
		const result = await Ticket.deleteMany({ 
			eventId, 
			seatNumber: { $gt: maxSeatNumber }, 
			status: 'available' 
		});
		return result;
	} catch (error) {
		logger.error('Ticket repository - deleteAvailableAboveSeat error', { error: error.message, eventId, maxSeatNumber });
		if (error instanceof ValidationError) throw error;
		throw new DatabaseError('Failed to delete available seats above number', { originalError: error.message });
	}
}

module.exports = {
	reserveSeat,
	releaseSeat,
	countByStatus,
	listSeats,
	listSeatsUpTo,
	createSeatRange,
	deleteAvailableAboveSeat
};
