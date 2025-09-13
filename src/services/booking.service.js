'use strict';

const { v4: uuidv4 } = require('uuid');
const { publishToQueue, startRabbit, subscribe } = require('../queues/rabbit');
const config = require('../config');
const ticketRepo = require('../repositories/ticket.repo');
const eventRepo = require('../repositories/event.repo');
const historyRepo = require('../repositories/bookingHistory.repo');
const waitlistRepo = require('../repositories/waitlist.repo');
const redisClient = require('../config/redis');
const logger = require('../utils/logger');
const { 
	ApiError, 
	ValidationError, 
	NotFoundError, 
	ExternalServiceError, 
	DatabaseError 
} = require('../middlewares/error');

async function invalidateAnalyticsCache() {
	try {
		await redisClient.delPattern('admin:analytics:*');
		logger.info('Analytics cache invalidated');
	} catch (error) {
		logger.error('Failed to invalidate analytics cache:', error);
	}
}

async function enqueueBooking({ userId, eventId, seatNumber }) {
	try {
		if (!userId) {
			throw new ValidationError('User ID is required');
		}
		if (!eventId) {
			throw new ValidationError('Event ID is required');
		}
		
		const bookingId = uuidv4();
		await publishToQueue(config.queues.booking, { type: 'BOOK', bookingId, userId, eventId, seatNumber });
		return { bookingId };
	} catch (error) {
		logger.error('enqueueBooking failed', { error: error.message, userId, eventId, seatNumber });
		if (error instanceof ValidationError) throw error;
		throw new ExternalServiceError('RabbitMQ', 'Failed to enqueue booking', { originalError: error.message });
	}
}

async function enqueueCancellation({ bookingId }) {
	try {
		if (!bookingId) {
			throw new ValidationError('Booking ID is required');
		}
		
		await publishToQueue(config.queues.booking, { type: 'CANCEL', bookingId });
		return { bookingId };
	} catch (error) {
		logger.error('enqueueCancellation failed', { error: error.message, bookingId });
		if (error instanceof ValidationError) throw error;
		throw new ExternalServiceError('RabbitMQ', 'Failed to enqueue cancellation', { originalError: error.message });
	}
}

async function processBookingMessage(message) {
	try {
		if (!message || typeof message !== 'object') {
			throw new ValidationError('Invalid message format');
		}
		
		const { type } = message;
		if (type === 'BOOK') {
			return await handleBook(message);
		}
		if (type === 'CANCEL') {
			return await handleCancel(message);
		}
		
		throw new ValidationError(`Unknown message type: ${type}`);
	} catch (error) {
		logger.error('processBookingMessage error', { error: error.message, message });
		throw error;
	}
}

async function handleBook({ bookingId, userId, eventId, seatNumber }) {
	try {
		if (!bookingId) {
			throw new ValidationError('Booking ID is required');
		}
		if (!userId) {
			throw new ValidationError('User ID is required');
		}
		if (!eventId) {
			throw new ValidationError('Event ID is required');
		}
		
		// Guard against invalid ObjectIds reaching DB layer
		const { Types } = require('mongoose');
		if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(eventId)) {
			throw new ValidationError('Invalid ObjectId in message');
		}
		
		// Enforce seat bounds when specified
		if (seatNumber != null) {
			const ev = await eventRepo.findActiveById(eventId);
			if (!ev) {
				throw new NotFoundError('Event', eventId);
			}
			if (!Number.isInteger(seatNumber) || seatNumber < 1 || seatNumber > ev.seats) {
				throw new ValidationError(`Invalid seatNumber ${seatNumber} for event with ${ev.seats} seats`);
			}
		}
		
		const ticket = await ticketRepo.reserveSeat(eventId, seatNumber, userId, bookingId);
		if (ticket) {
			await historyRepo.create({ userId, eventId, action: 'book', bookingId, meta: { seatNumber: ticket.seatNumber } });
			await publishToQueue(config.queues.notify, { type: 'BOOK_CONFIRMED', userId, eventId, bookingId, seatNumber: ticket.seatNumber });
			await invalidateAnalyticsCache();
			return { ok: true, seatNumber: ticket.seatNumber };
		}
		
		await historyRepo.create({ userId, eventId, action: 'waitlist', bookingId, meta: { requestedSeat: seatNumber } });
		await waitlistRepo.enqueue(eventId, userId, seatNumber, bookingId);
		await publishToQueue(config.queues.notify, { type: 'WAITLISTED', userId, eventId, bookingId, requestedSeat: seatNumber });
		return { ok: false, waitlisted: true };
	} catch (error) {
		logger.error('handleBook error', { error: error.message, bookingId, userId, eventId, seatNumber });
		if (error instanceof ValidationError || error instanceof NotFoundError) throw error;
		throw new DatabaseError('Failed to process booking', { originalError: error.message });
	}
}

async function tryPromoteWaitlist(eventId, freedSeatNumber) {
	try {
		if (!eventId) {
			throw new ValidationError('Event ID is required');
		}
		
		const entry = await waitlistRepo.peekNext(eventId);
		if (!entry) return false;
		
		// Reuse bookingId and prefer requested, then freed seat, then any
		let ticket = null;
		if (entry.requestedSeat != null) {
			ticket = await ticketRepo.reserveSeat(eventId, entry.requestedSeat, entry.userId, entry.bookingId);
		}
		if (!ticket && freedSeatNumber != null) {
			ticket = await ticketRepo.reserveSeat(eventId, freedSeatNumber, entry.userId, entry.bookingId);
		}
		if (!ticket) {
			ticket = await ticketRepo.reserveSeat(eventId, null, entry.userId, entry.bookingId);
		}
		
		if (ticket) {
			await waitlistRepo.complete(entry._id);
			await historyRepo.create({ userId: entry.userId, eventId, action: 'book', bookingId: ticket.bookingId, meta: { seatNumber: ticket.seatNumber, promoted: true } });
			await publishToQueue(config.queues.notify, { type: 'BOOK_CONFIRMED', userId: entry.userId, eventId, bookingId: ticket.bookingId, seatNumber: ticket.seatNumber });
			await invalidateAnalyticsCache();
			return true;
		}
		return false;
	} catch (error) {
		logger.error('tryPromoteWaitlist error', { error: error.message, eventId, freedSeatNumber });
		if (error instanceof ValidationError) throw error;
		throw new DatabaseError('Failed to promote waitlist entry', { originalError: error.message });
	}
}

async function handleCancel({ bookingId }) {
	try {
		if (!bookingId) {
			throw new ValidationError('Booking ID is required');
		}
		
		// Try booked ticket cancel first
		const query = { bookingId, status: 'booked' };
		const ticket = await ticketRepo.releaseSeat(query);
		if (ticket) {
			await historyRepo.create({ userId: ticket.userId, eventId: ticket.eventId, action: 'cancel', bookingId, meta: { seatNumber: ticket.seatNumber } });
			await publishToQueue(config.queues.notify, { type: 'CANCELLED', userId: ticket.userId, eventId: ticket.eventId, bookingId, seatNumber: ticket.seatNumber });
			await tryPromoteWaitlist(ticket.eventId, ticket.seatNumber);
			await invalidateAnalyticsCache();
			return { ok: true, seatNumber: ticket.seatNumber };
		}
		
		// If not booked, try cancel a waitlisted entry
		const wl = await waitlistRepo.cancelByBookingId(bookingId);
		if (wl) {
			await historyRepo.create({ userId: wl.userId, eventId: wl.eventId, action: 'cancel', bookingId, meta: { waitlisted: true, requestedSeat: wl.requestedSeat } });
			await publishToQueue(config.queues.notify, { type: 'CANCELLED', userId: wl.userId, eventId: wl.eventId, bookingId, requestedSeat: wl.requestedSeat });
			await invalidateAnalyticsCache();
			return { ok: true, waitlisted: true };
		}
		
		return { ok: false };
	} catch (error) {
		logger.error('handleCancel error', { error: error.message, bookingId });
		if (error instanceof ValidationError) throw error;
		throw new DatabaseError('Failed to process cancellation', { originalError: error.message });
	}
}

async function startBookingConsumer() {
	await startRabbit();
	await subscribe(config.queues.booking, async (payload) => {
		await processBookingMessage(payload);
	});
}

module.exports = { enqueueBooking, enqueueCancellation, startBookingConsumer };
