'use strict';

const eventRepo = require('../repositories/event.repo');
const Ticket = require('../models/ticket.model');
const { mostBookedEvents, totalBookingsPerEvent, cancellationRate, capacityUtilization } = require('../services/analytics.service');
const waitlistRepo = require('../repositories/waitlist.repo');
const ticketRepo = require('../repositories/ticket.repo');

async function createEvent(req, res, next) {
	try {
		const { name, venue, startTime, capacity, seats } = req.body;
		const event = await eventRepo.create({ name, venue, startTime, capacity, seats });
		const tickets = Array.from({ length: seats }).map((_, idx) => ({ eventId: event._id, seatNumber: idx + 1 }));
		await Ticket.insertMany(tickets, { ordered: false });
		res.status(201).json(event);
	} catch (err) {
		next(err);
	}
}

async function listEvents(req, res, next) {
	try {
		const events = await eventRepo.findAll();
		res.json({ items: events });
	} catch (err) {
		next(err);
	}
}

async function updateEvent(req, res, next) {
	try {
		const { id } = req.params;
		const update = req.body;
		const org_event = await eventRepo.findById(id);
		if (!org_event) return res.status(404).json({ error: 'Event not found' });

		if(update.seats && org_event.seats > update.seats){
			return res.status(400).json({ error: 'Cannot decrease seats' });
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
	} catch (err) {
		next(err);
	}
}

async function deleteEvent(req, res, next) {
	try {
		const { id } = req.params;
		await eventRepo.deleteById(id);
		res.status(204).send();
	} catch (err) {
		next(err);
	}
}

async function analyticsMostBooked(req, res, next) {
	try {
		const items = await mostBookedEvents();
		res.json({ items });
	} catch (err) {
		next(err);
	}
}

async function analyticsTotalBookingsPerEvent(req, res, next) {
	try {
		const items = await totalBookingsPerEvent();
		res.json({ items });
	} catch (err) {
		next(err);
	}
}

async function analyticsCancelRate(req, res, next) {
	try {
		const result = await cancellationRate();
		res.json(result);
	} catch (err) {
		next(err);
	}
}

async function analyticsCapacityUtilization(req, res, next) {
	try {
		const { eventId } = req.query;
		const result = await capacityUtilization(eventId);
		res.json(result);
	} catch (err) {
		next(err);
	}
}

async function waitlistStatus(req, res, next) {
	try {
		const { eventId } = req.query || {};
		if (!eventId) return res.status(400).json({ error: 'eventId is required' });
		const entries = await waitlistRepo.listByEvent(eventId);
		res.json({ items: entries });
	} catch (err) {
		next(err);
	}
}

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
