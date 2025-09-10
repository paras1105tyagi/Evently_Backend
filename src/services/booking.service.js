'use strict';

const { v4: uuidv4 } = require('uuid');
const { publishToQueue, startRabbit, subscribe } = require('../queues/rabbit');
const config = require('../config');
const ticketRepo = require('../repositories/ticket.repo');
const historyRepo = require('../repositories/bookingHistory.repo');
const logger = require('../utils/logger');
const { ApiError } = require('../middlewares/error');

async function enqueueBooking({ userId, eventId, seatNumber }) {
	try {
		const bookingId = uuidv4();
		await publishToQueue(config.queues.booking, { type: 'BOOK', bookingId, userId, eventId, seatNumber });
		return { bookingId };
	} catch (err) {
		logger.error('enqueueBooking failed', { err: err.message });
		throw new ApiError(500, 'Failed to enqueue booking');
	}
}

async function enqueueCancellation({ bookingId }) {
	try {
		await publishToQueue(config.queues.booking, { type: 'CANCEL', bookingId });
		return { bookingId };
	} catch (err) {
		logger.error('enqueueCancellation failed', { err: err.message });
		throw new ApiError(500, 'Failed to enqueue cancellation');
	}
}

async function processBookingMessage(message) {
	const { type } = message;
	if (type === 'BOOK') {
		return handleBook(message);
	}
	if (type === 'CANCEL') {
		return handleCancel(message);
	}
}

async function handleBook({ bookingId, userId, eventId, seatNumber }) {
	try {
		const ticket = await ticketRepo.reserveSeat(eventId, seatNumber, userId, bookingId);
		if (ticket) {
			await historyRepo.create({ userId, eventId, action: 'book', bookingId, meta: { seatNumber: ticket.seatNumber } });
			await publishToQueue(config.queues.notify, { type: 'BOOK_CONFIRMED', userId, eventId, bookingId, seatNumber: ticket.seatNumber });
			return { ok: true, seatNumber: ticket.seatNumber };
		}
		await historyRepo.create({ userId, eventId, action: 'waitlist', bookingId, meta: { requestedSeat: seatNumber } });
		await publishToQueue(config.queues.notify, { type: 'WAITLISTED', userId, eventId, bookingId, requestedSeat: seatNumber });
		return { ok: false, waitlisted: true };
	} catch (err) {
		logger.error('handleBook error', { err: err.message });
		throw err;
	}
}

async function handleCancel({ bookingId }) {
	try {
		if (!bookingId) return { ok: false };
		const query = { bookingId, status: 'booked' };
		const ticket = await ticketRepo.releaseSeat(query);
		if (ticket) {
			await historyRepo.create({ userId: ticket.userId, eventId: ticket.eventId, action: 'cancel', bookingId, meta: { seatNumber: ticket.seatNumber } });
			await publishToQueue(config.queues.notify, { type: 'CANCELLED', userId: ticket.userId, eventId: ticket.eventId, bookingId, seatNumber: ticket.seatNumber });
			return { ok: true, seatNumber: ticket.seatNumber };
		}
		return { ok: false };
	} catch (err) {
		logger.error('handleCancel error', { err: err.message });
		throw err;
	}
}

async function startBookingConsumer() {
	await startRabbit();
	await subscribe(config.queues.booking, async (payload) => {
		await processBookingMessage(payload);
	});
}

module.exports = { enqueueBooking, enqueueCancellation, startBookingConsumer };
