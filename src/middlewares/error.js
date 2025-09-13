'use strict';

const logger = require('../utils/logger');

class ApiError extends Error {
	constructor(status, message, details, code) {
		super(message);
		this.status = status || 500;
		this.details = details;
		this.code = code;
		this.isOperational = true;
	}
}

class ValidationError extends ApiError {
	constructor(message, details) {
		super(400, message, details, 'VALIDATION_ERROR');
	}
}

class NotFoundError extends ApiError {
	constructor(resource, identifier) {
		super(404, `${resource} not found`, { resource, identifier }, 'NOT_FOUND');
	}
}

class ConflictError extends ApiError {
	constructor(message, details) {
		super(409, message, details, 'CONFLICT');
	}
}

class UnauthorizedError extends ApiError {
	constructor(message = 'Unauthorized') {
		super(401, message, null, 'UNAUTHORIZED');
	}
}

class ForbiddenError extends ApiError {
	constructor(message = 'Forbidden') {
		super(403, message, null, 'FORBIDDEN');
	}
}

class DatabaseError extends ApiError {
	constructor(message, details) {
		super(500, message, details, 'DATABASE_ERROR');
	}
}

class ExternalServiceError extends ApiError {
	constructor(service, message, details) {
		super(502, `External service error: ${service}`, { service, originalMessage: message, ...details }, 'EXTERNAL_SERVICE_ERROR');
	}
}

class RateLimitError extends ApiError {
	constructor(message = 'Rate limit exceeded') {
		super(429, message, null, 'RATE_LIMIT');
	}
}

function isOperationalError(error) {
	if (error instanceof ApiError) {
		return error.isOperational;
	}
	return false;
}

function handleDatabaseError(error) {
	if (error.name === 'ValidationError') {
		const details = Object.values(error.errors).map(err => ({
			field: err.path,
			message: err.message,
			value: err.value
		}));
		return new ValidationError('Database validation failed', details);
	}
	
	if (error.name === 'CastError') {
		return new ValidationError(`Invalid ${error.path}: ${error.value}`, {
			field: error.path,
			value: error.value,
			expectedType: error.kind
		});
	}
	
	if (error.code === 11000) {
		const field = Object.keys(error.keyPattern)[0];
		return new ConflictError(`${field} already exists`, {
			field,
			value: error.keyValue[field]
		});
	}
	
	if (error.name === 'MongoNetworkError' || error.name === 'MongoTimeoutError') {
		return new DatabaseError('Database connection error', { originalError: error.message });
	}
	
	return new DatabaseError('Database operation failed', { originalError: error.message });
}

function handleJoiError(error) {
	const details = error.details.map(detail => ({
		field: detail.path.join('.'),
		message: detail.message,
		value: detail.context?.value
	}));
	return new ValidationError('Validation failed', details);
}

function errorHandler(err, req, res, next) {
	let error = err;
	
	// Handle different types of errors
	if (err.isJoi) {
		error = handleJoiError(err);
	} else if (err.name && ['ValidationError', 'CastError', 'MongoError'].includes(err.name)) {
		error = handleDatabaseError(err);
	} else if (!(err instanceof ApiError)) {
		// Convert unknown errors to ApiError
		error = new ApiError(500, 'Internal Server Error', null, 'INTERNAL_ERROR');
	}
	
	const status = error.status || 500;
	const payload = {
		reqId: req.id,
		status,
		error: error.message || 'Internal Server Error',
		code: error.code || 'UNKNOWN_ERROR',
		timestamp: new Date().toISOString()
	};
	
	// Add details for client errors (4xx) but not server errors (5xx)
	if (status < 500 && error.details) {
		payload.details = error.details;
	}
	
	// Log error with appropriate level
	if (status >= 500) {
		logger.error('Server error', {
			status,
			message: error.message,
			stack: process.env.NODE_ENV === 'production' ? undefined : error.stack,
			details: error.details,
			reqId: req.id,
			path: req.path,
			method: req.method,
			userAgent: req.get('User-Agent'),
			ip: req.ip
		});
	} else {
		logger.warn('Client error', {
			status,
			message: error.message,
			details: error.details,
			reqId: req.id,
			path: req.path,
			method: req.method
		});
	}
	
	res.status(status).json(payload);
}

// Async error wrapper for route handlers
function asyncHandler(fn) {
	return (req, res, next) => {
		Promise.resolve(fn(req, res, next)).catch(next);
	};
}

module.exports = {
	ApiError,
	ValidationError,
	NotFoundError,
	ConflictError,
	UnauthorizedError,
	ForbiddenError,
	DatabaseError,
	ExternalServiceError,
	RateLimitError,
	errorHandler,
	asyncHandler,
	isOperationalError
};
