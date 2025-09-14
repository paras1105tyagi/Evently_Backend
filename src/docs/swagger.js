'use strict';

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
	definition: {
		openapi: '3.0.0',
		info: { title: 'Event Management API', version: '1.0.0' },
		servers: [ { url: 'https://evently-backend-2-0pfm.onrender.com' } ],
		components: {
			securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
			schemas: {
				RegisterRequest: { type: 'object', required: ['name','email','password'], properties: { name:{type:'string'}, email:{type:'string',format:'email'}, password:{type:'string',format:'password'}, role:{type:'string',enum:['user','admin']} } },
				LoginRequest: { type: 'object', required: ['email','password'], properties: { email:{type:'string',format:'email'}, password:{type:'string',format:'password'} } },
				CreateEventRequest: { type: 'object', required: ['name','venue','startTime','capacity','seats'], properties: { name:{type:'string'}, venue:{type:'string'}, startTime:{type:'string',format:'date-time'}, capacity:{type:'integer'}, seats:{type:'integer'} } },
				UpdateEventRequest: { type: 'object', properties: { name:{type:'string'}, venue:{type:'string'}, startTime:{type:'string',format:'date-time'}, capacity:{type:'integer'}, seats:{type:'integer'}, isActive:{type:'boolean'} } },
				BookRequest: { type: 'object', required: ['userId','eventId'], properties: { userId:{type:'string'}, eventId:{type:'string'}, seatNumber:{type:'integer'} } },
				CancelRequest: { type: 'object', required: ['bookingId'], properties: { bookingId:{type:'string'} } }
			}
		},
		security: [ { bearerAuth: [] } ],
		paths: {
			'/health': { get: { summary: 'Health check', responses: { '200': { description: 'OK' } } } },
			'/api/auth/register': { post: { summary: 'Register user/admin', requestBody: { required: true, content: { 'application/json': { schema: { $ref:'#/components/schemas/RegisterRequest' } } } }, responses: { '201': { description: 'Registered' }, '409': { description: 'Email exists' } } } },
			'/api/auth/login': { post: { summary: 'Login', requestBody: { required: true, content: { 'application/json': { schema: { $ref:'#/components/schemas/LoginRequest' } } } }, responses: { '200': { description: 'OK (JWT)' }, '401': { description: 'Invalid credentials' } } } },
			'/api/user/events': { get: { summary: 'List active events', responses: { '200': { description: 'OK' } } } },
			'/api/user/seats': { get: { summary: 'Seat availability', parameters: [ { name:'eventId', in:'query', required:true, schema:{ type:'string' } } ], responses: { '200': { description: 'OK' } } } },
			'/api/user/book': { post: { summary: 'Book ticket', requestBody: { required: true, content: { 'application/json': { schema: { $ref:'#/components/schemas/BookRequest' } } } }, responses: { '202': { description: 'Queued' } } } },
			'/api/user/cancel': { post: { summary: 'Cancel booking', requestBody: { required: true, content: { 'application/json': { schema: { $ref:'#/components/schemas/CancelRequest' } } } }, responses: { '202': { description: 'Queued' } } } },
			'/api/user/history': { get: { summary: 'User booking history', parameters: [ { name:'userId', in:'query', required:true, schema:{ type:'string' } } ], responses: { '200': { description: 'OK' } } } },
			'/api/admin/events': { get: { summary: 'List events', responses: { '200': { description: 'OK' } } }, post: { summary: 'Create event', requestBody: { required: true, content: { 'application/json': { schema: { $ref:'#/components/schemas/CreateEventRequest' } } } }, responses: { '201': { description: 'Created' } } } },
			'/api/admin/events/{id}': { patch: { summary: 'Update event', parameters: [ { name:'id', in:'path', required:true, schema:{ type:'string' } } ], requestBody: { required: true, content: { 'application/json': { schema: { $ref:'#/components/schemas/UpdateEventRequest' } } } }, responses: { '200': { description: 'OK' } } }, delete: { summary: 'Delete event', parameters: [ { name:'id', in:'path', required:true, schema:{ type:'string' } } ], responses: { '204': { description: 'Deleted' } } } },
			'/api/admin/analytics/most-booked': { get: { summary: 'Most booked events (includes eventName)', responses: { '200': { description: 'OK' } } } },
			'/api/admin/analytics/total-bookings-per-event': { get: { summary: 'Total bookings per event (net, includes eventName)', responses: { '200': { description: 'OK' } } } },
			'/api/admin/analytics/cancel-rate': { get: { summary: 'Cancellation rate', responses: { '200': { description: 'OK' } } } },
			'/api/admin/analytics/capacity-utilization': { get: { summary: 'Capacity utilization', parameters: [ { name:'eventId', in:'query', required:false, schema:{ type:'string' } } ], responses: { '200': { description: 'OK' } } } },
			'/api/admin/waitlist': { get: { summary: 'Waitlist status for an event', parameters: [ { name:'eventId', in:'query', required:true, schema:{ type:'string' } } ], responses: { '200': { description: 'OK' }, '400': { description: 'Validation error' } } } }
		}
	},
	apis: []
};

module.exports = swaggerJsdoc(options);
