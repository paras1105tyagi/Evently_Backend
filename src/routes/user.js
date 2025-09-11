'use strict';

const { Router } = require('express');
const Joi = require('joi');
const mongoose = require('mongoose');
const validate = require('../middlewares/validate');
const { listEvents, listSeats, bookTicket, cancelTicket, bookingHistory } = require('../controllers/user.controller');

const router = Router();

router.get('/events', listEvents);

const objectIdString = Joi.string().custom((value, helpers) => {
	if (!mongoose.Types.ObjectId.isValid(value)) {
		return helpers.error('any.invalid', { message: 'must be a valid ObjectId' });
	}
	return value;
}, 'ObjectId validation');

const seatsSchema = Joi.object({ query: Joi.object({ eventId: objectIdString.required() }) });
router.get('/seats', validate(seatsSchema), listSeats);

const bookSchema = Joi.object({
	body: Joi.object({
		userId: objectIdString.required(),
		eventId: objectIdString.required(),
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
	query: Joi.object({ userId: objectIdString.required() })
});
router.get('/history', validate(historySchema), bookingHistory);

module.exports = router;
