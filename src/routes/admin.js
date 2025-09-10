'use strict';

const { Router } = require('express');
const Joi = require('joi');
const validate = require('../middlewares/validate');
const {
	createEvent,
	listEvents,
	updateEvent,
	deleteEvent,
	analyticsMostBooked,
	analyticsTotalBookingsPerEvent,
	analyticsCancelRate,
	analyticsCapacityUtilization
} = require('../controllers/admin.controller');

const router = Router();0

const createEventSchema = Joi.object({
	body: Joi.object({
		name: Joi.string().required(),
		venue: Joi.string().required(),
		startTime: Joi.date().iso().required(),
		capacity: Joi.number().integer().min(1).required(),
		seats: Joi.number().integer().min(1).required()
	})
});
router.post('/events', validate(createEventSchema), createEvent);

router.get('/events', listEvents);

const updateEventSchema = Joi.object({
	params: Joi.object({ id: Joi.string().required() }),
	body: Joi.object({
		name: Joi.string(),
		venue: Joi.string(),
		startTime: Joi.date().iso(),
		capacity: Joi.number().integer().min(1),
		seats: Joi.number().integer().min(1),
		isActive: Joi.boolean()
	}).min(1)
});
router.patch('/events/:id', validate(updateEventSchema), updateEvent);

const deleteEventSchema = Joi.object({ params: Joi.object({ id: Joi.string().required() }) });
router.delete('/events/:id', validate(deleteEventSchema), deleteEvent);

router.get('/analytics/most-booked', analyticsMostBooked);
router.get('/analytics/total-bookings-per-event', analyticsTotalBookingsPerEvent);
router.get('/analytics/cancel-rate', analyticsCancelRate);

const capUtilSchema = Joi.object({ query: Joi.object({ eventId: Joi.string().optional() }) });
router.get('/analytics/capacity-utilization', validate(capUtilSchema), analyticsCapacityUtilization);

module.exports = router;
