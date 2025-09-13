'use strict';

const eventRepo = require('../repositories/event.repo');
const Ticket = require('../models/ticket.model');
const { mostBookedEvents, totalBookingsPerEvent, cancellationRate, capacityUtilization } = require('../services/analytics.service');
const waitlistRepo = require('../repositories/waitlist.repo');
const ticketRepo = require('../repositories/ticket.repo');
const { asyncHandler, ValidationError, NotFoundError, ConflictError } = require('../middlewares/error');

const createEvent = asyncHandler(async (req, res) => {
	const { name, venue, startTime, capacity, seats } = req.body;
	
	if (!name) {
		throw new ValidationError('Event name is required');
	}
	if (!venue) {
		throw new ValidationError('Venue is required');
	}
	if (!startTime) {
		throw new ValidationError('Start time is required');
	}
	if (!seats || !Number.isInteger(seats) || seats < 1) {
		throw new ValidationError('Valid number of seats is required');
	}
	
	const event = await eventRepo.create({ name, venue, startTime, capacity, seats });
	const tickets = Array.from({ length: seats }).map((_, idx) => ({ eventId: event._id, seatNumber: idx + 1 }));
	await Ticket.insertMany(tickets, { ordered: false });
	res.status(201).json(event);
});

const listEvents = asyncHandler(async (req, res) => {
	const events = await eventRepo.findAll();
	res.json({ items: events });
});

const updateEvent = asyncHandler(async (req, res) => {
	const { id } = req.params;
	const update = req.body;
	
	if (!id) {
		throw new ValidationError('Event ID is required');
	}
	if (!update || typeof update !== 'object') {
		throw new ValidationError('Update data is required');
	}
	
	const org_event = await eventRepo.findById(id);
	if (!org_event) {
		throw new NotFoundError('Event', id);
	}

	if (update.seats && org_event.seats > update.seats) {
		throw new ConflictError('Cannot decrease seats');
	}
	
	const event = await eventRepo.updateById(id, update);
	
	// Reconcile ticket seats if seats changed
	if (update && typeof update.seats === 'number') {
		const newSeats = update.seats;
		// Create missing tickets up to newSeats
		const existingMax = await Ticket.find({ eventId: id }).sort({ seatNumber: -1 }).limit(1).lean();
		const currentMax = existingMax[0]?.seatNumber || 0;
		if (newSeats > currentMax) {
			await ticketRepo.createSeatRange(id, currentMax + 1, newSeats);
		} else if (newSeats < currentMax) {
			await ticketRepo.deleteAvailableAboveSeat(id, newSeats);
		}
	}
	
	res.json(event);
});

const deleteEvent = asyncHandler(async (req, res) => {
	const { id } = req.params;
	
	if (!id) {
		throw new ValidationError('Event ID is required');
	}
	
	await eventRepo.deleteById(id);
	res.status(204).send();
});

const analyticsMostBooked = asyncHandler(async (req, res) => {
	const items = await mostBookedEvents();
	res.json({ items });
});

const analyticsTotalBookingsPerEvent = asyncHandler(async (req, res) => {
	const items = await totalBookingsPerEvent();
	res.json({ items });
});

const analyticsCancelRate = asyncHandler(async (req, res) => {
	const result = await cancellationRate();
	res.json(result);
});

const analyticsCapacityUtilization = asyncHandler(async (req, res) => {
	const { eventId } = req.query;
	const result = await capacityUtilization(eventId);
	res.json(result);
});

const waitlistStatus = asyncHandler(async (req, res) => {
	const { eventId } = req.query || {};
	if (!eventId) {
		throw new ValidationError('eventId is required');
	}
	
	const entries = await waitlistRepo.listByEvent(eventId);
	res.json({ items: entries });
});

module.exports = {
	createEvent,
	listEvents,
	updateEvent,
	deleteEvent,
	analyticsMostBooked,
	analyticsTotalBookingsPerEvent,
	analyticsCancelRate,
	analyticsCapacityUtilization,
	waitlistStatus
};
