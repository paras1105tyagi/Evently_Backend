'use strict';

const dotenv = require('dotenv');

dotenv.config();

const config = {
	environment: process.env.NODE_ENV || 'development',
	port: Number(process.env.PORT || 3000),
	mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/event_management',
	rabbitmqUrl: process.env.RABBITMQ_URL || 'amqp://localhost',
	queues: {
		booking: process.env.BOOKING_QUEUE || 'booking_queue',
		notify: process.env.NOTIFY_QUEUE || 'notification_queue'
	},
	appSecret: process.env.APP_SECRET || 'dev-secret'
};

module.exports = config;
