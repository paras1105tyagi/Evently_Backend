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
		logger.info('Starting application...');
		
		// Connect to MongoDB
		await connectMongo();
		logger.info('MongoDB connected successfully');
		
		// Connect to Redis
		await redisClient.connect();
		logger.info('Redis connected successfully');
		
		// Start RabbitMQ
		await startRabbit();
		logger.info('RabbitMQ started successfully');
		
		// Start consumers
		startBookingConsumer();
		startNotificationConsumer();
		logger.info('Message consumers started');
		
		// Start HTTP server
		app.listen(config.port, () => {
			logger.info(`Server running on port ${config.port}`);
			console.log(`Server running on port ${config.port}`);
		});
	} catch (error) {
		logger.error('Failed to start application', { 
			error: error.message, 
			stack: error.stack 
		});
		console.error('Failed to start application', error);
		process.exit(1);
	}
}

start();
