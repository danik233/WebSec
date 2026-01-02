// server/middleware/rateLimiter.middleware.js
const rateLimit = require('express-rate-limit');
const config = require('../config/upload.config');

const uploadLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  message: {
    success: false,
    error: 'Too many upload requests from this IP, please try again later',
    retryAfter: config.rateLimitWindowMs / 1000
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Use IP address for rate limiting
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress;
  },
  // Skip successful requests from counting (optional)
  skip: (req, res) => res.statusCode < 400,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Too many upload requests, please try again later',
      retryAfter: Math.ceil(config.rateLimitWindowMs / 1000)
    });
  }
});

module.exports = { uploadLimiter };