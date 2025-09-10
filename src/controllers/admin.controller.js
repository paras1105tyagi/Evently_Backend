'use strict';

const eventRepo = require('../repositories/event.repo');
const Ticket = require('../models/ticket.model');
const { mostBookedEvents, totalBookingsPerEvent, cancellationRate, capacityUtilization } = require('../services/analytics.service');

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
		const event = await eventRepo.updateById(id, update);
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
// 68c13dce3fb2cf5b0cef4575
// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2OGMxM2Q2NTNmYjJjZjViMGNlZjQ1NzIiLCJyb2xlIjoiYWRtaW4iLCJlbWFpbCI6InVzZXJAYWRtaW4uY29tIiwiaWF0IjoxNzU3NDk0NjY2LCJleHAiOjE3NTc1ODEwNjZ9.BqTSq6BmPRBRYPxJZn1-J6ctYIAuoEJ-jlR2KXBNNo8
// 


// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2OGMxM2MzYzNmYjJjZjViMGNlZjQ1NjkiLCJyb2xlIjoidXNlciIsImVtYWlsIjoidXNlckBleGFtcGxlLmNvbSIsImlhdCI6MTc1NzQ5NDk1MiwiZXhwIjoxNzU3NTgxMzUyfQ.2OSmAuTBr3pBqdYPX3mDfvgt5S8AsX8pa3YTPpiHCe8
module.exports = {
	createEvent,
	listEvents,
	updateEvent,
	deleteEvent,
	analyticsMostBooked,
	analyticsTotalBookingsPerEvent,
	analyticsCancelRate,
	analyticsCapacityUtilization
};
