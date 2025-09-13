'use strict';

const Event = require('../models/event.model');
const { DatabaseError, NotFoundError, ValidationError } = require('../middlewares/error');
const logger = require('../utils/logger');

async function findById(id) {
	try {
		if (!id) {
			throw new ValidationError('Event ID is required');
		}
		const event = await Event.findById(id).lean();
		return event;
	} catch (error) {
		logger.error('Event repository - findById error', { error: error.message, id });
		if (error instanceof ValidationError) throw error;
		throw new DatabaseError('Failed to find event', { originalError: error.message });
	}
}

async function create(data) {
	try {
		if (!data || typeof data !== 'object') {
			throw new ValidationError('Event data is required');
		}
		const event = await Event.create(data);
		return event;
	} catch (error) {
		logger.error('Event repository - create error', { error: error.message, data });
		if (error.name === 'ValidationError') {
			throw new ValidationError('Invalid event data', Object.values(error.errors).map(err => ({
				field: err.path,
				message: err.message,
				value: err.value
			})));
		}
		throw new DatabaseError('Failed to create event', { originalError: error.message });
	}
}

async function findActive() {
	try {
		const events = await Event.find({ isActive: true }).sort({ startTime: 1 }).lean();
		return events;
	} catch (error) {
		logger.error('Event repository - findActive error', { error: error.message });
		throw new DatabaseError('Failed to find active events', { originalError: error.message });
	}
}

async function findAll() {
	try {
		const events = await Event.find().sort({ startTime: 1 }).lean();
		return events;
	} catch (error) {
		logger.error('Event repository - findAll error', { error: error.message });
		throw new DatabaseError('Failed to find events', { originalError: error.message });
	}
}

async function updateById(id, update) {
	try {
		if (!id) {
			throw new ValidationError('Event ID is required');
		}
		if (!update || typeof update !== 'object') {
			throw new ValidationError('Update data is required');
		}
		const event = await Event.findByIdAndUpdate(id, update, { new: true });
		if (!event) {
			throw new NotFoundError('Event', id);
		}
		return event;
	} catch (error) {
		logger.error('Event repository - updateById error', { error: error.message, id, update });
		if (error instanceof ValidationError || error instanceof NotFoundError) throw error;
		if (error.name === 'ValidationError') {
			throw new ValidationError('Invalid update data', Object.values(error.errors).map(err => ({
				field: err.path,
				message: err.message,
				value: err.value
			})));
		}
		throw new DatabaseError('Failed to update event', { originalError: error.message });
	}
}

async function deleteById(id) {
	try {
		if (!id) {
			throw new ValidationError('Event ID is required');
		}
		const event = await Event.findByIdAndDelete(id);
		if (!event) {
			throw new NotFoundError('Event', id);
		}
		return event;
	} catch (error) {
		logger.error('Event repository - deleteById error', { error: error.message, id });
		if (error instanceof ValidationError || error instanceof NotFoundError) throw error;
		throw new DatabaseError('Failed to delete event', { originalError: error.message });
	}
}

async function findActiveById(id) {
	try {
		if (!id) {
			throw new ValidationError('Event ID is required');
		}
		const event = await Event.findOne({ _id: id, isActive: true }).lean();
		return event;
	} catch (error) {
		logger.error('Event repository - findActiveById error', { error: error.message, id });
		if (error instanceof ValidationError) throw error;
		throw new DatabaseError('Failed to find active event', { originalError: error.message });
	}
}

module.exports = {
	findById,
	create,
	findActive,
	findAll,
	updateById,
	deleteById,
	findActiveById
};
