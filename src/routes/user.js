'use strict';

const { Router } = require('express');
const Joi = require('joi');
const validate = require('../middlewares/validate');
const { listEvents, listSeats, bookTicket, cancelTicket, bookingHistory } = require('../controllers/user.controller');

const router = Router();

router.get('/events', listEvents);

const seatsSchema = Joi.object({ query: Joi.object({ eventId: Joi.string().required() }) });
router.get('/seats', validate(seatsSchema), listSeats);

const bookSchema = Joi.object({
	body: Joi.object({
		userId: Joi.string().required(),
		eventId: Joi.string().required(),
		seatNumber: Joi.number().integer().min(1).optional()
	})
});
router.post('/book', validate(bookSchema), bookTicket);

const cancelSchema = Joi.object({
	body: Joi.object({
		bookingId: Joi.string().required()
	})
});
router.post('/cancel', validate(cancelSchema), cancelTicket);

const historySchema = Joi.object({
	query: Joi.object({ userId: Joi.string().required() })
});
router.get('/history', validate(historySchema), bookingHistory);

module.exports = router;
