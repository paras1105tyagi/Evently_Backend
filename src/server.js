'use strict';

const app = require('./app');
const config = require('./config');
const { connectMongo } = require('./db/mongoose');
const { db } = require('./models/ticket.model');
const { startRabbit } = require('./queues/rabbit');
const { startBookingConsumer } = require('./services/booking.service');
const { startNotificationConsumer } = require('./services/notification.service');
const redisClient = require('./config/redis');
const logger = require('./utils/logger');

process.on('unhandledRejection', (reason) => {
	logger.error('UnhandledRejection', { reason: (reason && reason.message) || reason });
});
process.on('uncaughtException', (err) => {
	logger.error('UncaughtException', { err: err.message, stack: err.stack });
});

async function start() {
	try {
		await connectMongo();
		await redisClient.connect();
		await startRabbit();
		startBookingConsumer();
		startNotificationConsumer();
		app.listen(config.port, () => {
			console.log(`Server running on port ${config.port}`);
		});
	} catch (error) {
		console.error('Failed to start application', error);
		process.exit(1);
	}
}

start();
