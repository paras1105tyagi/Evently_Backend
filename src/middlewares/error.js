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
	const status = err.status || (err.isJoi ? 400 : 500);
	const payload = {
		reqId: req.id,
		status,
		error: err.message || 'Internal Server Error'
	};
	if (err.isJoi && err.details) {
		payload.details = err.details.map((d) => d.message);
	}
	logger.error('Request error', { status, message: err.message, stack: process.env.NODE_ENV === 'production' ? undefined : err.stack, details: err.details, reqId: req.id, path: req.path, method: req.method });
	res.status(status).json(payload);
}

module.exports = { ApiError, errorHandler };
