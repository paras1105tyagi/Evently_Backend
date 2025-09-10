# Event Management Backend (Node.js, Express, MongoDB, RabbitMQ)

## Quickstart

1. Copy `.env.example` to `.env` and adjust values.
2. Start MongoDB and RabbitMQ locally.
3. Install deps: `npm install`
4. Run dev server: `npm run dev`
5. Swagger: GET /api-docs

## Scripts
- dev: nodemon src/server.js
- start: node src/server.js

## Overview
- REST APIs for user and admin features.
- RabbitMQ queues handle booking/cancellation to avoid overselling.
- MongoDB with indexes on frequently queried fields.

## Future
- Add caching layer (Redis) via `src/utils/cache.js` adapter later.
