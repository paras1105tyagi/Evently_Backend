'use strict';

const levels = ['error', 'warn', 'info', 'debug'];
const currentLevel = process.env.LOG_LEVEL || 'info';
const levelIndex = levels.indexOf(currentLevel);

function log(level, message, meta) {
	const idx = levels.indexOf(level);
	if (idx > levelIndex) return;
	const time = new Date().toISOString();
	const entry = { time, level, message, ...(meta ? { meta } : {}) };
	// eslint-disable-next-line no-console
	console[level === 'debug' ? 'log' : level](JSON.stringify(entry));
}

module.exports = {
	error: (msg, meta) => log('error', msg, meta),
	warn: (msg, meta) => log('warn', msg, meta),
	info: (msg, meta) => log('info', msg, meta),
	debug: (msg, meta) => log('debug', msg, meta)
};
