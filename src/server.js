'use strict';

const app = require('./app');
const config = require('./config');
const { connectMongo } = require('./db/mongoose');
const { startRabbit } = require('./queues/rabbit');
const { startBookingConsumer } = require('./services/booking.service');
const { startNotificationConsumer } = require('./services/notification.service');

async function start() {
	try {
		await connectMongo();
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
