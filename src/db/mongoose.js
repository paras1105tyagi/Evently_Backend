'use strict';

const mongoose = require('mongoose');
const config = require('../config');

mongoose.set('strictQuery', true);

async function connectMongo() {
	try {
		const connection = await mongoose.connect(config.mongoUri, {
			autoIndex: true,   // ✅ builds indexes defined in your schemas
			maxPoolSize: 10
		});

		console.log('✅ MongoDB connected');

		// ✅ Sync indexes to make sure schema indexes are applied
		await Promise.all(
			Object.values(connection.models).map(model => model.syncIndexes())
		);
 
		console.log('✅ Indexes synced');
		console.log(await mongoose.model('User').collection.indexes());

		return connection;
	} catch (err) {
		console.error('❌ MongoDB connection error:', err);
		process.exit(1);
	}
}

module.exports = { connectMongo };
