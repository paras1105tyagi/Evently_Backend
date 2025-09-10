'use strict';

const User = require('../models/user.model');

module.exports = {
	findById: (id) => User.findById(id).lean(),
	findByEmail: (email) => User.findOne({ email }).lean(),
	create: (data) => User.create(data)
};
