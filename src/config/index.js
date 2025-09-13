'use strict';

const dotenv = require('dotenv');

dotenv.config();

const config = {
	environment: process.env.NODE_ENV || 'development',
	port: Number(process.env.PORT || 3000),
	mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/event_management',
	redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
	rabbitmqUrl: process.env.RABBITMQ_URL || 'amqp://localhost',
	queues: {
		booking: process.env.BOOKING_QUEUE || 'booking_queue',
		notify: process.env.NOTIFY_QUEUE || 'notification_queue'
	},
	appSecret: process.env.APP_SECRET || 'dev-secret',
	smtp: {
		host: process.env.SMTP_HOST,
		port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
		secure: process.env.SMTP_SECURE === 'true',
		user: process.env.SMTP_USER,
		pass: process.env.SMTP_PASS,
		from: process.env.MAIL_FROM || 'no-reply@example.com'
	}
};

module.exports = config;
