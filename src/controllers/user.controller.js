"use strict";

const eventRepo = require("../repositories/event.repo");
const historyRepo = require("../repositories/bookingHistory.repo");
const ticketRepo = require("../repositories/ticket.repo");
const {
  enqueueBooking,
  enqueueCancellation,
} = require("../services/booking.service");

async function listEvents(req, res, next) {
  try {
    const events = await eventRepo.findActive();
    res.json({ items: events });
  } catch (err) {
    next(err);
  }
}

async function listSeats(req, res, next) {
  try {
    const { eventId } = req.query || {};
    if (!eventId) return res.status(400).json({ error: 'eventId is required' });
    const ev = await eventRepo.findActiveById(eventId);
    if (!ev) return res.status(404).json({ error: 'Event not found or inactive' });
    const limit = ev.seats || 0;
    const seats = limit > 0 ? await ticketRepo.listSeatsUpTo(eventId, limit) : await ticketRepo.listSeats(eventId);
    res.json({ items: seats });
  } catch (err) {
    next(err);
  }
}

async function bookTicket(req, res, next) {
  try {
    const { userId, eventId, seatNumber } = req.body || {};
    if (!userId || !eventId) return res.status(400).json({ error: 'userId and eventId are required' });
    const ev = await eventRepo.findActiveById(eventId);
    if (!ev) return res.status(404).json({ error: 'Event not found or inactive' });
    const { bookingId } = await enqueueBooking({ userId, eventId, seatNumber });
    res.status(202).json({ bookingId, status: 'queued' });
  } catch (err) {
    next(err);
  }
}

async function cancelTicket(req, res, next) {
  try {
    const { bookingId } = req.body || {};
    if (!bookingId) return res.status(400).json({ error: 'bookingId is required' });
    // For cancel, we don't know eventId upfront. We allow cancel regardless of active flag, but if desired, we could resolve booking and check.
    await enqueueCancellation({ bookingId });
    res.status(202).json({ bookingId, status: 'queued' });
  } catch (err) {
    next(err);
  }
}

async function bookingHistory(req, res, next) {
  try {
    const { userId } = req.query || {};
    if (!userId) return res.status(400).json({ error: 'userId is required' });
    const items = await historyRepo.findByUser(userId);
    res.json({ items });
  } catch (err) {
    next(err);
  }
}

module.exports = { listEvents, listSeats, bookTicket, cancelTicket, bookingHistory };
