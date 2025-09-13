'use strict';

const mongoose = require('mongoose');
const config = require('../config');
const logger = require('../utils/logger');
const { DatabaseError } = require('../middlewares/error');

mongoose.set('strictQuery', true);

// Handle connection events
mongoose.connection.on('connected', () => {
	logger.info('MongoDB connected successfully');
});

mongoose.connection.on('error', (err) => {
	logger.error('MongoDB connection error', { error: err.message });
});

mongoose.connection.on('disconnected', () => {
	logger.warn('MongoDB disconnected');
});

// Handle process termination
process.on('SIGINT', async () => {
	try {
		await mongoose.connection.close();
		logger.info('MongoDB connection closed through app termination');
		process.exit(0);
	} catch (err) {
		logger.error('Error closing MongoDB connection', { error: err.message });
		process.exit(1);
	}
});

async function connectMongo() {
	try {
		const connection = await mongoose.connect(config.mongoUri, {
			autoIndex: true,   // ✅ builds indexes defined in your schemas
			maxPoolSize: 10,
			serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
			socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
			family: 4 // Use IPv4, skip trying IPv6
		});

		logger.info('MongoDB connected successfully');

		// ✅ Sync indexes to make sure schema indexes are applied
		try {
			await Promise.all(
				Object.values(connection.models).map(model => model.syncIndexes())
			);
			logger.info('MongoDB indexes synced successfully');
		} catch (indexError) {
			logger.warn('Some indexes failed to sync', { error: indexError.message });
		}

		return connection;
	} catch (err) {
		logger.error('MongoDB connection failed', { 
			error: err.message, 
			code: err.code,
			name: err.name 
		});
		
		// Don't exit immediately, let the application handle the error
		throw new DatabaseError('Failed to connect to MongoDB', { 
			originalError: err.message,
			code: err.code 
		});
	}
}

module.exports = { connectMongo };
