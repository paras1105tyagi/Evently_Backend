'use strict';

const { startRabbit, publishToQueue, subscribe } = require('../queues/rabbit');
const config = require('../config');
const logger = require('../utils/logger');

async function enqueueNotification(message) {
	await publishToQueue(config.queues.notify, message);
}

async function startNotificationConsumer() {
	await startRabbit();
	await subscribe(config.queues.notify, async (payload) => {
		logger.info('Notify', payload);
	});
}

module.exports = { enqueueNotification, startNotificationConsumer };
