'use strict';

const Ticket = require('../models/ticket.model');

module.exports = {
	reserveSeat: (eventId, seatNumber, userId, bookingId) =>
		Ticket.findOneAndUpdate(
			{ eventId, status: 'available', ...(seatNumber != null ? { seatNumber } : {}) },
			{ $set: { status: 'booked', userId, bookingId } },
			{ new: true }
		),
	releaseSeat: (query) =>
		Ticket.findOneAndUpdate(
			query,
			{ $set: { status: 'available' }, $unset: { userId: '', bookingId: '' } },
			{ new: false }
		),
	countByStatus: (eventId, status) => Ticket.countDocuments({ eventId, status }),
	listSeats: (eventId) => Ticket.find({ eventId }).select('seatNumber status userId bookingId').sort({ seatNumber: 1 }).lean()
};
