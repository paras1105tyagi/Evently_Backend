'use strict';

const Waitlist = require('../models/waitlist.model');

module.exports = {
	enqueue: (eventId, userId, requestedSeat, bookingId) => Waitlist.create({ eventId, userId, requestedSeat, bookingId }),
	peekNext: (eventId) => Waitlist.findOneAndUpdate({ eventId, status: 'pending' }, { $set: { status: 'processing' } }, { sort: { createdAt: 1 }, new: true }),
	complete: (id) => Waitlist.findByIdAndUpdate(id, { $set: { status: 'completed' } }, { new: true }),
	cancelAllForEvent: (eventId) => Waitlist.updateMany({ eventId, status: { $in: ['pending', 'processing'] } }, { $set: { status: 'cancelled' } }),
	listByEvent: (eventId) => Waitlist.find({ eventId }).sort({ createdAt: 1 }).lean(),
	cancelByBookingId: (bookingId) => Waitlist.findOneAndUpdate({ bookingId, status: { $in: ['pending', 'processing'] } }, { $set: { status: 'cancelled' } }, { new: true })
};
