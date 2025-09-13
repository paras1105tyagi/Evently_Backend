# Event Management Backend (Node.js, Express, MongoDB, RabbitMQ, Redis)

## Quickstart

1. Copy `.env.example` to `.env` and adjust values.
2. Start MongoDB, RabbitMQ, and Redis locally.
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
- Redis caching for improved performance on frequently accessed data.

## Redis Caching

### Setup Redis

#### Option 1: Cloud Redis (Recommended - No Installation Required)

**Redis Cloud (Free Tier Available):**
1. Go to https://redis.com/try-free/
2. Sign up for a free account
3. Create a new database
4. Copy the connection string
5. Add to your `.env` file: `REDIS_URL=redis://default:password@host:port`

**Upstash (Serverless-friendly):**
1. Go to https://upstash.com/
2. Create a free account
3. Create a new Redis database
4. Copy the connection string
5. Add to your `.env` file: `REDIS_URL=redis://username:password@host:port`

**Railway:**
1. Go to https://railway.app/
2. Create a new project
3. Add Redis service
4. Copy the connection string
5. Add to your `.env` file: `REDIS_URL=redis://username:password@host:port`

#### Option 2: Local Installation

**Using Docker:**
```bash
docker run -d --name redis-server -p 6379:6379 redis:7-alpine
```

**Windows:**
1. Download Redis from https://github.com/microsoftarchive/redis/releases
2. Extract and run `redis-server.exe`

**macOS:**
```bash
brew install redis
brew services start redis
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

### Environment Variables

Add to your `.env` file:
```env
# For cloud Redis (recommended)
REDIS_URL=redis://default:password@your-host:port

# For local Redis
# REDIS_URL=redis://localhost:6379
```

### Cached Endpoints

The following endpoints are now cached with Redis:

1. **GET /api/user/events** - User events list (5 minutes TTL)
2. **GET /api/admin/events** - Admin events list (5 minutes TTL)  
3. **GET /api/admin/analytics/most-booked** - Most booked events analytics (10 minutes TTL)

### Cache Invalidation

Cache is automatically invalidated when:
- Events are created, updated, or deleted
- Bookings are made or cancelled
- Waitlist entries are processed

### Cache Configuration

- **TTL (Time To Live)**: Configurable per endpoint
- **Key Generation**: Based on request parameters and query strings
- **Pattern-based Invalidation**: Uses Redis pattern matching for efficient cache clearing

### Monitoring

Redis connection status is logged. Check application logs for:
- `Redis client connected` - Successful connection
- `Redis client ready` - Ready to accept commands
- `Cache hit for key: ...` - Cache was used
- `Data cached with key: ...` - New data was cached
- `Cache invalidated for patterns: ...` - Cache was cleared
