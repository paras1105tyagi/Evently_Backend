"use strict";

const eventRepo = require("../repositories/event.repo");
const historyRepo = require("../repositories/bookingHistory.repo");
const ticketRepo = require("../repositories/ticket.repo");
const {
  enqueueBooking,
  enqueueCancellation,
} = require("../services/booking.service");
const { asyncHandler, ValidationError, NotFoundError } = require("../middlewares/error");

const listEvents = asyncHandler(async (req, res) => {
  const events = await eventRepo.findActive();
  res.json({ items: events });
});

const listSeats = asyncHandler(async (req, res) => {
  const { eventId } = req.query || {};
  if (!eventId) {
    throw new ValidationError('eventId is required');
  }
  
  const ev = await eventRepo.findActiveById(eventId);
  if (!ev) {
    throw new NotFoundError('Event', eventId);
  }
  
  const limit = ev.seats || 0;
  const seats = limit > 0 ? await ticketRepo.listSeatsUpTo(eventId, limit) : await ticketRepo.listSeats(eventId);
  res.json({ items: seats });
});

const bookTicket = asyncHandler(async (req, res) => {
  const { userId, eventId, seatNumber } = req.body || {};
  if (!userId || !eventId) {
    throw new ValidationError('userId and eventId are required');
  }
  
  const ev = await eventRepo.findActiveById(eventId);
  if (!ev) {
    throw new NotFoundError('Event', eventId);
  }
  
  // Enforce seat bounds: 1..ev.seats if seatNumber is provided
  if (seatNumber != null) {
    if (!Number.isInteger(seatNumber) || seatNumber < 1 || seatNumber > ev.seats) {
      throw new ValidationError(`seatNumber must be an integer between 1 and ${ev.seats}`);
    }
  }
  
  const { bookingId } = await enqueueBooking({ userId, eventId, seatNumber });
  res.status(202).json({ bookingId, status: 'queued' });
});

const cancelTicket = asyncHandler(async (req, res) => {
  const { bookingId } = req.body || {};
  if (!bookingId) {
    throw new ValidationError('bookingId is required');
  }
  
  // For cancel, we don't know eventId upfront. We allow cancel regardless of active flag, but if desired, we could resolve booking and check.
  await enqueueCancellation({ bookingId });
  res.status(202).json({ bookingId, status: 'queued' });
});

const bookingHistory = asyncHandler(async (req, res) => {
  const { userId } = req.query || {};
  if (!userId) {
    throw new ValidationError('userId is required');
  }
  
  const items = await historyRepo.findByUser(userId);
  res.json({ items });
});

module.exports = { listEvents, listSeats, bookTicket, cancelTicket, bookingHistory };
