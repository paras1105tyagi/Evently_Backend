'use strict';

const mongoose = require('mongoose');
const config = require('../config');

mongoose.set('strictQuery', true);

async function connectMongo() {
	const connection = await mongoose.connect(config.mongoUri, {
		autoIndex: true,
		maxPoolSize: 10
	});
	return connection;
}

module.exports = { connectMongo };
