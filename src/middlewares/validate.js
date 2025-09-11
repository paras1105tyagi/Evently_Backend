"use strict";

const { ApiError } = require('./error');

function validate(schema) {
	return (req, res, next) => {
		const data = { body: req.body, params: req.params, query: req.query };
		const { error, value } = schema.validate(data, { abortEarly: false, allowUnknown: true });
		if (error) {
			const err = new ApiError(400, 'Validation failed', error.details);
			err.isJoi = true;
			return next(err);
		}
		req.validated = value;
		next();
	};
}

module.exports = validate;
