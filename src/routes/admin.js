'use strict';

const { Router } = require('express');
const Joi = require('joi');
const validate = require('../middlewares/validate');
const { createCacheMiddleware, createCacheInvalidationMiddleware, cacheKeyGenerators } = require('../middlewares/cache');
const {
	createEvent,
	listEvents,
	updateEvent,
	deleteEvent,
	analyticsMostBooked,
	analyticsTotalBookingsPerEvent,
	analyticsCancelRate,
	analyticsCapacityUtilization,
	waitlistStatus
} = require('../controllers/admin.controller');

const router = Router();

const createEventSchema = Joi.object({
	body: Joi.object({
		name: Joi.string().required(),
		venue: Joi.string().required(),
		startTime: Joi.date().iso().required(),
		capacity: Joi.number().integer().min(1).required(),
		seats: Joi.number().integer().min(1).required()
	})
});
router.post('/events', validate(createEventSchema), createCacheInvalidationMiddleware(['user:events:*', 'admin:events:*', 'admin:analytics:*']), createEvent);

router.get('/events', createCacheMiddleware('admin:events', 300, cacheKeyGenerators.adminEvents), listEvents);

const updateEventSchema = Joi.object({
	params: Joi.object({ id: Joi.string().required() }),
	body: Joi.object({ name: Joi.string(), venue: Joi.string(), startTime: Joi.date().iso(), capacity: Joi.number().integer().min(1), seats: Joi.number().integer().min(1), isActive: Joi.boolean() }).min(1)
});
router.patch('/events/:id', validate(updateEventSchema), createCacheInvalidationMiddleware(['user:events:*', 'admin:events:*', 'admin:analytics:*']), updateEvent);

const deleteEventSchema = Joi.object({ params: Joi.object({ id: Joi.string().required() }) });
router.delete('/events/:id', validate(deleteEventSchema), createCacheInvalidationMiddleware(['user:events:*', 'admin:events:*', 'admin:analytics:*']), deleteEvent);

router.get('/analytics/most-booked', createCacheMiddleware('admin:analytics:most-booked', 600, cacheKeyGenerators.adminMostBooked), analyticsMostBooked);
router.get('/analytics/total-bookings-per-event', analyticsTotalBookingsPerEvent);
router.get('/analytics/cancel-rate', analyticsCancelRate);

const capUtilSchema = Joi.object({ query: Joi.object({ eventId: Joi.string().optional() }) });
router.get('/analytics/capacity-utilization', validate(capUtilSchema), analyticsCapacityUtilization);

const waitlistSchema = Joi.object({ query: Joi.object({ eventId: Joi.string().required() }) });
router.get('/waitlist', validate(waitlistSchema), waitlistStatus);

module.exports = router;
