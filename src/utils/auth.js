'use strict';

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config');

function signToken(payload, expiresIn = '1d') {
	return jwt.sign(payload, config.appSecret, { expiresIn });
}

function verifyToken(token) {
	return jwt.verify(token, config.appSecret);
}

async function hashPassword(plain) {
	const salt = await bcrypt.genSalt(10);
	return bcrypt.hash(plain, salt);
}

async function comparePassword(plain, hash) {
	return bcrypt.compare(plain, hash);
}

module.exports = { signToken, verifyToken, hashPassword, comparePassword };
