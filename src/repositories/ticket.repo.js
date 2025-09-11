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
	listSeats: (eventId) => Ticket.find({ eventId }).select('seatNumber status userId bookingId').sort({ seatNumber: 1 }).lean(),
	listSeatsUpTo: (eventId, maxSeatNumber) => Ticket.find({ eventId, seatNumber: { $lte: maxSeatNumber } }).select('seatNumber status userId bookingId').sort({ seatNumber: 1 }).lean(),
	createSeatRange: async (eventId, fromSeatIncl, toSeatIncl) => {
		const docs = [];
		for (let s = fromSeatIncl; s <= toSeatIncl; s++) docs.push({ eventId, seatNumber: s });
		if (docs.length === 0) return [];
		return Ticket.insertMany(docs, { ordered: false });
	},
	deleteAvailableAboveSeat: (eventId, maxSeatNumber) => Ticket.deleteMany({ eventId, seatNumber: { $gt: maxSeatNumber }, status: 'available' })
};
