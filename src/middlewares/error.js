'use strict';

const logger = require('../utils/logger');

class ApiError extends Error {
	constructor(status, message, details) {
		super(message);
		this.status = status || 500;
		this.details = details;
	}
}

function errorHandler(err, req, res, next) {
	const status = err.status || 500;
	logger.error('Request error', { status, message: err.message, stack: err.stack, details: err.details });
	res.status(status).json({ error: err.message || 'Internal Server Error' });
}

module.exports = { ApiError, errorHandler };
