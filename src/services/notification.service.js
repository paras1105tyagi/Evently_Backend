'use strict';

const { startRabbit, publishToQueue, subscribe } = require('../queues/rabbit');
const config = require('../config');
const logger = require('../utils/logger');
const nodemailer = require('nodemailer');
const User = require('../models/user.model');
const Event = require('../models/event.model');

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
	await publishToQueue(config.queues.notify, message);
}

async function sendBookingConfirmedEmail({ userId, eventId, seatNumber, bookingId, promoted }) {
	try {
		const [user, event] = await Promise.all([
			User.findById(userId).lean(),
			Event.findById(eventId).lean()
		]);
		if (!user || !user.email) return;
		const subject = promoted ? 'Your waitlisted ticket is confirmed' : 'Your ticket is confirmed';
		const text = `Hello ${user.name},\n\nYour ${promoted ? 'waitlisted ' : ''}booking is confirmed for "${event?.name || 'Event'}".\nSeat: ${seatNumber}\nBooking ID: ${bookingId}\n\nVenue: ${event?.venue || ''}\nStart: ${event?.startTime || ''}\n\nThanks!`;
		await getTransporter().sendMail({ from: config.smtp.from, to: user.email, subject, text });
	} catch (err) {
		logger.error('sendBookingConfirmedEmail failed', { err: err.message });
	}
}

async function startNotificationConsumer() {
	await startRabbit();
	await subscribe(config.queues.notify, async (payload) => {
		logger.info('Notify', payload);
		if (payload?.type === 'BOOK_CONFIRMED') {
			await sendBookingConfirmedEmail(payload);
		}
	});
}

module.exports = { enqueueNotification, startNotificationConsumer };
