'use strict';

const amqp = require('amqplib');
const config = require('../config');
const logger = require('../utils/logger');

let connection;
let channel; // confirm channel
let isConnecting = false;
let subscribers = []; // [{ queueName, handler }]
let connectAttempt = 0;

async function createConnection() {
	if (isConnecting) return;
	isConnecting = true;
	const backoff = Math.min(30000, 1000 * Math.pow(2, connectAttempt));
	try {
		connection = await amqp.connect(config.rabbitmqUrl);
		channel = await connection.createConfirmChannel();
		await channel.assertQueue(config.queues.booking, { durable: true });
		await channel.assertQueue(config.queues.notify, { durable: true });
		channel.prefetch(10);

		connection.on('error', (err) => {
			logger.error('RabbitMQ connection error', { err: err.message });
		});
		connection.on('close', () => {
			logger.warn('RabbitMQ connection closed');
			connection = undefined;
			channel = undefined;
			connectAttempt++;
			setTimeout(() => {
				createConnection().catch(() => {});
			}, backoff);
		});

		// Re-subscribe consumers
		subscribers.forEach(({ queueName, handler }) => internalSubscribe(queueName, handler));
		connectAttempt = 0;
	} catch (err) {
		logger.error('RabbitMQ connect failed', { err: err.message });
		connectAttempt++;
		setTimeout(() => {
			createConnection().catch(() => {});
		}, backoff);
	} finally {
		isConnecting = false;
	}
}

async function startRabbit() {
	if (channel) return { connection, channel };
	await createConnection();
	return { connection, channel };
}

async function publishToQueue(queueName, message) {
	if (!channel) await startRabbit();
	return new Promise((resolve, reject) => {
		try {
			const payload = Buffer.from(JSON.stringify(message));
			channel.sendToQueue(queueName, payload, { persistent: true }, (err, ok) => {
				if (err) return reject(err);
				return resolve(ok);
			});
		} catch (err) {
			reject(err);
		}
	});
}

function internalSubscribe(queueName, handler) {
	if (!channel) return;
	channel.consume(
		queueName,
		async (msg) => {
			if (!msg) return;
			try {
				const payload = JSON.parse(msg.content.toString());
				await handler(payload);
				channel.ack(msg);
			} catch (err) {
				logger.error('Queue handler error', { queueName, err: err.message });
				// Requeue for transient errors
				channel.nack(msg, false, true);
			}
		},
		{ noAck: false }
	);
}

async function subscribe(queueName, handler) {
	// Remember subscriber for re-subscription on reconnect
	subscribers.push({ queueName, handler });
	if (!channel) await startRabbit();
	internalSubscribe(queueName, handler);
}





module.exports = { startRabbit, publishToQueue, subscribe };
