'use strict';

const Event = require('../models/event.model');

module.exports = {
	create: (data) => Event.create(data),
	findActive: () => Event.find({ isActive: true }).sort({ startTime: 1 }).lean(),
	findAll: () => Event.find().sort({ startTime: 1 }).lean(),
	updateById: (id, update) => Event.findByIdAndUpdate(id, update, { new: true }),
	deleteById: (id) => Event.findByIdAndDelete(id),
	findActiveById: (id) => Event.findOne({ _id: id, isActive: true }).lean()
};
