'use strict';

const redisClient = require('../config/redis');
const logger = require('../utils/logger');

/**
 * Cache middleware factory
 * @param {string} keyPrefix - Prefix for cache keys
 * @param {number} ttlSeconds - Time to live in seconds (default: 300 = 5 minutes)
 * @param {Function} keyGenerator - Function to generate cache key from request
 * @returns {Function} Express middleware function
 */
function createCacheMiddleware(keyPrefix, ttlSeconds = 300, keyGenerator = null) {
  return async (req, res, next) => {
    try {
      // Generate cache key
      const cacheKey = keyGenerator ? keyGenerator(req) : `${keyPrefix}:${req.originalUrl}`;
      
      // Try to get from cache
      const cachedData = await redisClient.get(cacheKey);
      
      if (cachedData) {
        logger.info(`Cache hit for key: ${cacheKey}`);
        return res.json(cachedData);
      }

      // Store original res.json to intercept the response
      const originalJson = res.json;
      res.json = function(data) {
        // Store in cache
        redisClient.set(cacheKey, data, ttlSeconds)
          .then(() => {
            logger.info(`Data cached with key: ${cacheKey}`);
          })
          .catch(error => {
            logger.error(`Failed to cache data for key ${cacheKey}:`, error);
          });

        // Send response
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error:', error);
      // Continue without caching if Redis fails
      next();
    }
  };
}

/**
 * Cache invalidation middleware
 * @param {string|Array} patterns - Cache key patterns to invalidate
 * @returns {Function} Express middleware function
 */
function createCacheInvalidationMiddleware(patterns) {
  return async (req, res, next) => {
    try {
      // Store original res.json to intercept the response
      const originalJson = res.json;
      res.json = function(data) {
        // Invalidate cache after successful response
        const patternsArray = Array.isArray(patterns) ? patterns : [patterns];
        
        Promise.all(patternsArray.map(pattern => redisClient.delPattern(pattern)))
          .then(() => {
            logger.info(`Cache invalidated for patterns: ${patternsArray.join(', ')}`);
          })
          .catch(error => {
            logger.error(`Failed to invalidate cache for patterns ${patternsArray.join(', ')}:`, error);
          });

        // Send response
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      logger.error('Cache invalidation middleware error:', error);
      // Continue without cache invalidation if Redis fails
      next();
    }
  };
}

/**
 * Specific cache key generators
 */
const cacheKeyGenerators = {
  // For user events endpoint
  userEvents: (req) => {
    const { page = 1, limit = 10, ...filters } = req.query;
    const filterString = Object.keys(filters).length > 0 ? 
      `:${Object.entries(filters).sort().map(([k, v]) => `${k}=${v}`).join('&')}` : '';
    return `user:events:page=${page}:limit=${limit}${filterString}`;
  },

  // For admin analytics most-booked endpoint
  adminMostBooked: (req) => {
    const { limit = 10 } = req.query;
    return `admin:analytics:most-booked:limit=${limit}`;
  },

  // For admin events endpoint
  adminEvents: (req) => {
    const { page = 1, limit = 10, ...filters } = req.query;
    const filterString = Object.keys(filters).length > 0 ? 
      `:${Object.entries(filters).sort().map(([k, v]) => `${k}=${v}`).join('&')}` : '';
    return `admin:events:page=${page}:limit=${limit}${filterString}`;
  }
};

module.exports = {
  createCacheMiddleware,
  createCacheInvalidationMiddleware,
  cacheKeyGenerators
};
