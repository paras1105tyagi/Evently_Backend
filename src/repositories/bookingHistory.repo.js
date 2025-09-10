'use strict';

const BookingHistory = require('../models/bookingHistory.model');

module.exports = {
	create: (data) => BookingHistory.create(data),
	findByUser: (userId) => BookingHistory.find({ userId }).sort({ createdAt: -1 }).lean()
};
