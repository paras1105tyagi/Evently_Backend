'use strict';

const mongoose = require('mongoose');
const BookingHistory = require('../models/bookingHistory.model');
const Ticket = require('../models/ticket.model');
const Event = require('../models/event.model');
const { DatabaseError, ValidationError } = require('../middlewares/error');
const logger = require('../utils/logger');

async function mostBookedEvents(limit = 10) {
	try {
		if (!Number.isInteger(limit) || limit < 1) {
			throw new ValidationError('Limit must be a positive integer');
		}
		
		// Count distinct bookingIds per event for actions book or waitlist (interest), include event name
		const pipeline = [
			{ $match: { action: { $in: ['book', 'waitlist'] }, bookingId: { $exists: true, $ne: null } } },
			{ $group: { _id: { eventId: '$eventId', bookingId: '$bookingId' } } },
			{ $group: { _id: '$_id.eventId', attempts: { $sum: 1 } } },
			{ $sort: { attempts: -1 } },
			{ $limit: limit },
			{ $lookup: { from: 'events', localField: '_id', foreignField: '_id', as: 'event' } },
			{ $unwind: { path: '$event', preserveNullAndEmptyArrays: true } },
			{ $project: { _id: 1, attempts: 1, eventName: '$event.name' } }
		];
		return await BookingHistory.aggregate(pipeline);
	} catch (error) {
		logger.error('Analytics service - mostBookedEvents error', { error: error.message, limit });
		if (error instanceof ValidationError) throw error;
		throw new DatabaseError('Failed to get most booked events', { originalError: error.message });
	}
}

async function totalBookingsPerEvent() {
	try {
		// Same as above but for all events (no limit)
		const pipeline = [
			{ $match: { action: { $in: ['book', 'waitlist'] }, bookingId: { $exists: true, $ne: null } } },
			{ $group: { _id: { eventId: '$eventId', bookingId: '$bookingId' } } },
			{ $group: { _id: '$_id.eventId', attempts: { $sum: 1 } } },
			{ $lookup: { from: 'events', localField: '_id', foreignField: '_id', as: 'event' } },
			{ $unwind: { path: '$event', preserveNullAndEmptyArrays: true } },
			{ $project: { _id: 1, attempts: 1, eventName: '$event.name' } },
			{ $sort: { attempts: -1 } }
		];
		return await BookingHistory.aggregate(pipeline);
	} catch (error) {
		logger.error('Analytics service - totalBookingsPerEvent error', { error: error.message });
		throw new DatabaseError('Failed to get total bookings per event', { originalError: error.message });
	}
}

async function cancellationRate() {
	try {
		// Include waitlisted attempts in denominator: distinct bookingIds that had either book or waitlist
		const [agg] = await BookingHistory.aggregate([
			{ $match: { action: { $in: ['book', 'waitlist', 'cancel'] }, bookingId: { $exists: true, $ne: null } } },
			{
				$group: {
					_id: '$bookingId',
					attempted: { $max: { $cond: [{ $in: ['$action', ['book', 'waitlist']] }, 1, 0] } },
					cancelled: { $max: { $cond: [{ $eq: ['$action', 'cancel'] }, 1, 0] } }
				}
			},
			{ $group: { _id: null, totalAttempts: { $sum: '$attempted' }, totalCancelled: { $sum: '$cancelled' } } }
		]);
		const totalAttempts = agg ? agg.totalAttempts : 0;
		const totalCancelled = agg ? agg.totalCancelled : 0;
		const rate = totalAttempts === 0 ? 0 : totalCancelled / totalAttempts;
		return { rate, totalBookings: totalAttempts, totalCancelled };
	} catch (error) {
		logger.error('Analytics service - cancellationRate error', { error: error.message });
		throw new DatabaseError('Failed to get cancellation rate', { originalError: error.message });
	}
}

async function capacityUtilization(eventId) {
	try {
		if (eventId) {
			if (!mongoose.Types.ObjectId.isValid(eventId)) {
				throw new ValidationError('Invalid event ID format');
			}
			
			const ev = await Event.findById(eventId).lean();
			if (!ev) return { utilization: 0 };
			
			const bookedSeats = await Ticket.countDocuments({ 
				eventId: new mongoose.Types.ObjectId(eventId), 
				status: 'booked', 
				seatNumber: { $lte: ev.seats } 
			});
			const totalSeats = ev.seats || 0;
			const utilization = totalSeats === 0 ? 0 : bookedSeats / totalSeats;
			return { _id: ev._id, eventName: ev.name, totalSeats, bookedSeats, utilization };
		}
		
		// For all events, compute per-event utilization
		const events = await Event.find({}).select('_id name seats').lean();
		const results = [];
		for (const ev of events) {
			const bookedSeats = await Ticket.countDocuments({ 
				eventId: ev._id, 
				status: 'booked', 
				seatNumber: { $lte: ev.seats } 
			});
			const totalSeats = ev.seats || 0;
			results.push({ 
				_id: ev._id, 
				eventName: ev.name, 
				totalSeats, 
				bookedSeats, 
				utilization: totalSeats === 0 ? 0 : bookedSeats / totalSeats 
			});
		}
		return results;
	} catch (error) {
		logger.error('Analytics service - capacityUtilization error', { error: error.message, eventId });
		if (error instanceof ValidationError) throw error;
		throw new DatabaseError('Failed to get capacity utilization', { originalError: error.message });
	}
}

module.exports = { mostBookedEvents, totalBookingsPerEvent, cancellationRate, capacityUtilization };
