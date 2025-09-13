'use strict';

const { startRabbit, publishToQueue, subscribe } = require('../queues/rabbit');
const config = require('../config');
const logger = require('../utils/logger');
const nodemailer = require('nodemailer');
const User = require('../models/user.model');
const Event = require('../models/event.model');
const { 
	ValidationError, 
	ExternalServiceError, 
	DatabaseError 
} = require('../middlewares/error');

let transporter;
function getTransporter() {
	if (!transporter) {
		transporter = nodemailer.createTransport({
			host: config.smtp.host,
			port: config.smtp.port,
			secure: config.smtp.secure,
			auth: config.smtp.user && config.smtp.pass ? { user: config.smtp.user, pass: config.smtp.pass } : undefined
		});
	}
	return transporter;
}

async function enqueueNotification(message) {
	try {
		if (!message || typeof message !== 'object') {
			throw new ValidationError('Notification message is required');
		}
		
		await publishToQueue(config.queues.notify, message);
	} catch (error) {
		logger.error('enqueueNotification error', { error: error.message, message });
		if (error instanceof ValidationError) throw error;
		throw new ExternalServiceError('RabbitMQ', 'Failed to enqueue notification', { originalError: error.message });
	}
}

async function sendBookingConfirmedEmail({ userId, eventId, seatNumber, bookingId, promoted }) {
	try {
		if (!userId) {
			throw new ValidationError('User ID is required');
		}
		if (!eventId) {
			throw new ValidationError('Event ID is required');
		}
		if (!bookingId) {
			throw new ValidationError('Booking ID is required');
		}
		
		const [user, event] = await Promise.all([
			User.findById(userId).lean(),
			Event.findById(eventId).lean()
		]);
		
		if (!user || !user.email) {
			logger.warn('Cannot send email - user not found or no email', { userId, eventId });
			return;
		}
		
		const subject = promoted ? 'Your waitlisted ticket is confirmed' : 'Your ticket is confirmed';
		const text = `Hello ${user.name},\n\nYour ${promoted ? 'waitlisted ' : ''}booking is confirmed for "${event?.name || 'Event'}".\nSeat: ${seatNumber}\nBooking ID: ${bookingId}\n\nVenue: ${event?.venue || ''}\nStart: ${event?.startTime || ''}\n\nThanks!`;
		
		await getTransporter().sendMail({ from: config.smtp.from, to: user.email, subject, text });
		logger.info('Booking confirmation email sent', { userId, eventId, bookingId, seatNumber });
	} catch (error) {
		logger.error('sendBookingConfirmedEmail failed', { error: error.message, userId, eventId, bookingId, seatNumber });
		if (error instanceof ValidationError) throw error;
		throw new ExternalServiceError('SMTP', 'Failed to send booking confirmation email', { originalError: error.message });
	}
}

async function startNotificationConsumer() {
	try {
		await startRabbit();
		await subscribe(config.queues.notify, async (payload) => {
			try {
				logger.info('Processing notification', payload);
				if (payload?.type === 'BOOK_CONFIRMED') {
					await sendBookingConfirmedEmail(payload);
				}
			} catch (error) {
				logger.error('Notification processing error', { error: error.message, payload });
				// Don't rethrow - we don't want to crash the consumer
			}
		});
	} catch (error) {
		logger.error('Failed to start notification consumer', { error: error.message });
		throw new ExternalServiceError('RabbitMQ', 'Failed to start notification consumer', { originalError: error.message });
	}
}

module.exports = { enqueueNotification, startNotificationConsumer };
