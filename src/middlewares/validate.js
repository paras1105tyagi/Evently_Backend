"use strict";

const { ValidationError } = require('./error');
const logger = require('../utils/logger');

function validate(schema) {
	return (req, res, next) => {
		try {
			const data = { body: req.body, params: req.params, query: req.query };
			const { error, value } = schema.validate(data, { 
				abortEarly: false, 
				allowUnknown: true,
				stripUnknown: true
			});
			
			if (error) {
				const details = error.details.map(detail => ({
					field: detail.path.join('.'),
					message: detail.message,
					value: detail.context?.value,
					type: detail.type
				}));
				
				logger.warn('Validation failed', { 
					details, 
					path: req.path, 
					method: req.method,
					reqId: req.id 
				});
				
				const err = new ValidationError('Validation failed', details);
				err.isJoi = true;
				return next(err);
			}
			
			req.validated = value;
			next();
		} catch (validationError) {
			logger.error('Validation middleware error', { 
				error: validationError.message, 
				path: req.path, 
				method: req.method,
				reqId: req.id 
			});
			next(validationError);
		}
	};
}

module.exports = validate;
