# Event Management System

A comprehensive backend API for managing events, ticket bookings, and user interactions built with Node.js, Express, MongoDB, Redis, and RabbitMQ.

## 🚀 Features

- **User Management**: Registration, authentication, and role-based access control
- **Event Management**: Create, read, update, and delete events with capacity management
- **Ticket Booking System**: Real-time seat booking with RabbitMQ queue processing
- **Waitlist Management**: Automatic waitlist handling for sold-out events
- **Analytics Dashboard**: Comprehensive analytics for event performance
- **Caching Layer**: Redis-based caching for improved performance
- **Notification System**: Email notifications for booking confirmations
- **API Documentation**: Swagger/OpenAPI documentation

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Cache**: Redis
- **Message Queue**: RabbitMQ
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Joi
- **Documentation**: Swagger UI
- **Security**: Helmet, CORS, bcryptjs

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Redis
- RabbitMQ

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd Event_Management
npm install
```

### 2. Environment Setup

Create a `.env` file in the root directory:

```env
# Server Configuration
NODE_ENV=development
PORT=3000

# Database
MONGODB_URI=mongodb://localhost:27017/event_management

# Redis Configuration
REDIS_URL=redis://localhost:6379

# RabbitMQ Configuration
RABBITMQ_URL=amqp://localhost

# JWT Secret
APP_SECRET=your-super-secret-jwt-key

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
MAIL_FROM=no-reply@example.com

# Queue Names
BOOKING_QUEUE=booking_queue
NOTIFY_QUEUE=notification_queue
```

### 3. Start Services

**Local Installation**
- Start MongoDB: `mongod`
- Start Redis: `redis-server`
- Start RabbitMQ: `rabbitmq-server`

### 4. Run the Application

```bash
# Development mode
npm run dev

# Production mode
npm start
```

### 5. Access the Application

- **API Base URL**: `http://localhost:3000/api`
- **API Documentation**: `http://localhost:3000/api-docs`
- **Health Check**: `http://localhost:3000/health`

## 📚 API Endpoints

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register a new user | No |
| POST | `/api/auth/login` | Login user | No |

**Request Examples:**

```bash
# Register
POST /api/auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "user"
}

# Login
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "password123"
}
```

### User Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/user/events` | Get all active events | Yes |
| GET | `/api/user/seats?eventId=<id>` | Get available seats for an event | Yes |
| POST | `/api/user/book` | Book a ticket | Yes |
| POST | `/api/user/cancel` | Cancel a booking | Yes |
| GET | `/api/user/history?userId=<id>` | Get booking history | Yes |

**Request Examples:**

```bash
# Book a ticket
POST /api/user/book
{
  "userId": "64a1b2c3d4e5f6789012345",
  "eventId": "64a1b2c3d4e5f6789012346",
  "seatNumber": 15
}

# Cancel booking
POST /api/user/cancel
{
  "bookingId": "booking-uuid-123"
}
```

### Admin Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/admin/events` | Create a new event | Yes (Admin) |
| GET | `/api/admin/events` | Get all events | Yes (Admin) |
| PATCH | `/api/admin/events/:id` | Update an event | Yes (Admin) |
| DELETE | `/api/admin/events/:id` | Delete an event | Yes (Admin) |
| GET | `/api/admin/analytics/most-booked` | Get most booked events | Yes (Admin) |
| GET | `/api/admin/analytics/total-bookings-per-event` | Get total bookings per event | Yes (Admin) |
| GET | `/api/admin/analytics/cancel-rate` | Get cancellation rate analytics | Yes (Admin) |
| GET | `/api/admin/analytics/capacity-utilization?eventId=<id>` | Get capacity utilization | Yes (Admin) |
| GET | `/api/admin/waitlist?eventId=<id>` | Get waitlist status | Yes (Admin) |

**Request Examples:**

```bash
# Create event
POST /api/admin/events
{
  "name": "Tech Conference 2024",
  "venue": "Convention Center",
  "startTime": "2024-06-15T09:00:00.000Z",
  "capacity": 500,
  "seats": 500
}

# Update event
PATCH /api/admin/events/64a1b2c3d4e5f6789012346
{
  "name": "Updated Event Name",
  "capacity": 600
}
```

## 🏗️ Project Structure

```
src/
├── app.js                 # Express app configuration
├── server.js             # Server startup and initialization
├── config/
│   ├── index.js          # Application configuration
│   └── redis.js          # Redis client configuration
├── controllers/
│   ├── admin.controller.js    # Admin business logic
│   └── user.controller.js     # User business logic
├── db/
│   └── mongoose.js       # MongoDB connection
├── docs/
│   └── swagger.js        # API documentation
├── middlewares/
│   ├── auth.js           # Authentication middleware
│   ├── cache.js          # Redis caching middleware
│   ├── error.js          # Error handling middleware
│   ├── requestContext.js # Request context middleware
│   └── validate.js       # Request validation middleware
├── models/
│   ├── bookingHistory.model.js  # Booking history schema
│   ├── event.model.js           # Event schema
│   ├── ticket.model.js          # Ticket schema
│   ├── user.model.js            # User schema
│   └── waitlist.model.js        # Waitlist schema
├── queues/
│   └── rabbit.js         # RabbitMQ configuration
├── repositories/
│   ├── bookingHistory.repo.js   # Booking history data access
│   ├── event.repo.js            # Event data access
│   ├── ticket.repo.js           # Ticket data access
│   ├── user.repo.js             # User data access
│   └── waitlist.repo.js         # Waitlist data access
├── routes/
│   ├── admin.js          # Admin routes
│   ├── auth.js           # Authentication routes
│   ├── index.js          # Main router
│   └── user.js           # User routes
├── services/
│   ├── analytics.service.js     # Analytics business logic
│   ├── booking.service.js       # Booking business logic
│   └── notification.service.js  # Notification service
└── utils/
    ├── auth.js           # Authentication utilities
    └── logger.js         # Logging utilities
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment mode | `development` | No |
| `PORT` | Server port | `3000` | No |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/event_management` | Yes |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` | Yes |
| `RABBITMQ_URL` | RabbitMQ connection string | `amqp://localhost` | Yes |
| `APP_SECRET` | JWT secret key | `dev-secret` | Yes |
| `SMTP_HOST` | SMTP server host | - | No |
| `SMTP_PORT` | SMTP server port | `587` | No |
| `SMTP_USER` | SMTP username | - | No |
| `SMTP_PASS` | SMTP password | - | No |
| `MAIL_FROM` | From email address | `no-reply@example.com` | No |

## 🚀 Redis Caching

### Setup Redis

#### Option 1: Cloud Redis (Recommended)

**Redis Cloud (Free Tier Available):**
1. Go to https://redis.com/try-free/
2. Sign up for a free account
3. Create a new database
4. Copy the connection string
5. Add to your `.env` file: `REDIS_URL=redis://default:password@host:port`

#### Option 2: Local Installation

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

### Cached Endpoints

The following endpoints are cached with Redis:

1. **GET /api/user/events** - User events list (5 minutes TTL)
2. **GET /api/admin/events** - Admin events list (5 minutes TTL)  
3. **GET /api/admin/analytics/most-booked** - Most booked events analytics (10 minutes TTL)

### Cache Invalidation

Cache is automatically invalidated when:
- Events are created, updated, or deleted
- Bookings are made or cancelled
- Waitlist entries are processed

## 🔄 Message Queue System

The application uses RabbitMQ for handling asynchronous operations:

- **Booking Queue**: Processes ticket bookings to prevent overselling
- **Notification Queue**: Handles email notifications for booking confirmations

## 📊 Database Schema

### Users
- `name`: String (required)
- `email`: String (required, unique)
- `passwordHash`: String (required)
- `role`: Enum ['user', 'admin'] (default: 'user')

### Events
- `name`: String (required, indexed)
- `venue`: String (required)
- `startTime`: Date (required, indexed)
- `capacity`: Number (required)
- `seats`: Number (required)
- `isActive`: Boolean (default: true, indexed)

### Tickets
- `eventId`: ObjectId (required, indexed)
- `seatNumber`: Number (required)
- `userId`: ObjectId (indexed)
- `status`: Enum ['available', 'reserved', 'booked'] (default: 'available', indexed)
- `bookingId`: String (indexed)

## 🧪 Testing

```bash
# Test Redis connection
npm run test:redis

# Run all tests (when implemented)
npm test
```

## 📝 API Documentation

Interactive API documentation is available at `/api-docs` when the server is running. The documentation includes:

- All available endpoints
- Request/response schemas
- Authentication requirements
- Example requests and responses

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcryptjs for password security
- **Input Validation**: Joi schema validation for all inputs
- **CORS Protection**: Cross-origin resource sharing configuration
- **Helmet**: Security headers middleware
- **Role-based Access Control**: Admin and user role separation

## 🚀 Deployment

### Production Environment Variables

```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://your-production-db
REDIS_URL=redis://your-production-redis
RABBITMQ_URL=amqp://your-production-rabbitmq
APP_SECRET=your-super-secure-jwt-secret
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🆘 Support

For support and questions:
- Check the API documentation at `/api-docs`
- Review the logs for error details
- Ensure all required services (MongoDB, Redis, RabbitMQ) are running

## 🔄 Version History

- **v1.0.0** - Initial release with core functionality
  - User authentication and management
  - Event CRUD operations
  - Ticket booking system
  - Redis caching
  - RabbitMQ message queuing
  - Analytics dashboard
  - API documentation