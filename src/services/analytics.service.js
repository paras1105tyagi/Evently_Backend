'use strict';

const mongoose = require('mongoose');
const BookingHistory = require('../models/bookingHistory.model');
const Ticket = require('../models/ticket.model');

async function mostBookedEvents(limit = 10) {
	// Use current net bookings from Ticket(status='booked') and join Event for names
	const pipeline = [
		{ $match: { status: 'booked' } },
		{ $group: { _id: '$eventId', totalBooked: { $sum: 1 } } },
		{ $sort: { totalBooked: -1 } },
		{ $limit: limit },
		{ $lookup: { from: 'events', localField: '_id', foreignField: '_id', as: 'event' } },
		{ $unwind: { path: '$event', preserveNullAndEmptyArrays: true } },
		{ $project: { _id: 1, totalBooked: 1, eventName: '$event.name' } }
	];
	return Ticket.aggregate(pipeline);
}

async function totalBookingsPerEvent() {
	const pipeline = [
		{ $match: { status: 'booked' } },
		{ $group: { _id: '$eventId', totalBooked: { $sum: 1 } } },
		{ $lookup: { from: 'events', localField: '_id', foreignField: '_id', as: 'event' } },
		{ $unwind: { path: '$event', preserveNullAndEmptyArrays: true } },
		{ $project: { _id: 1, totalBooked: 1, eventName: '$event.name' } },
		{ $sort: { totalBooked: -1 } }
	];
	return Ticket.aggregate(pipeline);
}

async function cancellationRate() {
	// Only count cancellations for bookingIds that were actually booked
	const [agg] = await BookingHistory.aggregate([
		{ $match: { action: { $in: ['book', 'cancel'] }, bookingId: { $exists: true, $ne: null } } },
		{
			$group: {
				_id: '$bookingId',
				booked: { $max: { $cond: [{ $eq: ['$action', 'book'] }, 1, 0] } },
				cancelled: { $max: { $cond: [{ $eq: ['$action', 'cancel'] }, 1, 0] } }
			}
		},
		{
			$group: {
				_id: null,
				totalBooked: { $sum: '$booked' },
				totalCancelled: { $sum: { $cond: [{ $and: [{ $eq: ['$booked', 1] }, { $eq: ['$cancelled', 1] }] }, 1, 0] } }
			}
		}
	]);
	const totalBooked = agg ? agg.totalBooked : 0;
	const totalCancelled = agg ? agg.totalCancelled : 0;
	const rate = totalBooked === 0 ? 0 : totalCancelled / totalBooked;
	return { rate, totalBooked, totalCancelled };
}

async function capacityUtilization(eventId) {
	const match = eventId ? { eventId: new mongoose.Types.ObjectId(eventId) } : {};
	const pipeline = [
		{ $match: match },
		{
			$group: {
				_id: '$eventId',
				totalSeats: { $sum: 1 },
				bookedSeats: { $sum: { $cond: [{ $eq: ['$status', 'booked'] }, 1, 0] } }
			}
		},
		{ $lookup: { from: 'events', localField: '_id', foreignField: '_id', as: 'event' } },
		{ $unwind: { path: '$event', preserveNullAndEmptyArrays: true } },
		{
			$project: {
				_id: 1,
				eventName: '$event.name',
				utilization: {
					$cond: [
						{ $eq: ['$totalSeats', 0] },
						0,
						{ $divide: ['$bookedSeats', '$totalSeats'] }
					]
				},
				totalSeats: 1,
				bookedSeats: 1
			}
		}
	];
	const results = await Ticket.aggregate(pipeline);
	if (eventId) return results[0] || { utilization: 0 };
	return results;
}

module.exports = { mostBookedEvents, totalBookingsPerEvent, cancellationRate, capacityUtilization };
