#!/usr/bin/env node

/**
 * Redis Connection Test Script
 * Run this to test your Redis cloud connection
 * Usage: node test-redis.js
 */

require('dotenv').config();
const redisClient = require('./src/config/redis');

async function testRedisConnection() {
  console.log(' Testing Redis connection...');
  // console.log(' Redis URL:', process.env.REDIS_URL || 'redis://localhost:6379');
  
  try {
    // Connect to Redis
    await redisClient.connect();
    console.log(' Redis connection successful!');
    
    // Test basic operations
    console.log(' Testing cache operations...');
    
    // Test SET
    const testKey = 'test:connection';
    const testValue = { message: 'Hello Redis Cloud!', timestamp: new Date().toISOString() };
    await redisClient.set(testKey, testValue, 60); // 60 seconds TTL
    console.log(' SET operation successful');
    
    // Test GET
    const retrievedValue = await redisClient.get(testKey);
    console.log(' GET operation successful');
    console.log(' Retrieved data:', retrievedValue);
    
    // Test EXISTS
    const exists = await redisClient.exists(testKey);
    console.log(' EXISTS operation successful:', exists);
    
    // Test DELETE
    await redisClient.del(testKey);
    console.log(' DELETE operation successful');
    
    // Test pattern deletion
    await redisClient.set('test:pattern:1', 'value1', 60);
    await redisClient.set('test:pattern:2', 'value2', 60);
    await redisClient.delPattern('test:pattern:*');
    console.log(' Pattern deletion successful');
    
    console.log('\n All Redis operations completed successfully!');
    console.log(' Your Redis cloud setup is working perfectly!');
    
  } catch (error) {
    console.error(' Redis connection failed:', error.message);
    console.error('\n Troubleshooting tips:');
    console.error('1. Check your REDIS_URL in .env file');
    console.error('2. Verify your Redis cloud service is running');
    console.error('3. Check if your IP is whitelisted (if required)');
    console.error('4. Verify username/password are correct');
    process.exit(1);
  } finally {
    // Disconnect
    await redisClient.disconnect();
    console.log(' Disconnected from Redis');
  }
}

// Run the test
testRedisConnection();
