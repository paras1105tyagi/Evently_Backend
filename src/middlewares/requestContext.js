'use strict';

const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

function requestContext(req, res, next) {
	req.id = req.headers['x-request-id'] || uuidv4();
	const start = Date.now();
	logger.info('req.start', { reqId: req.id, method: req.method, path: req.path });
	res.on('finish', () => {
		const ms = Date.now() - start;
		logger.info('req.end', { reqId: req.id, method: req.method, path: req.path, status: res.statusCode, ms });
	});
	next();
}

module.exports = requestContext;
