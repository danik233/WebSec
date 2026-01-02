// server/middleware/auth.middleware.js
const User = require("../modules/user");

/**
 * Optional authentication - doesn't fail if no auth
 * But attaches user if authenticated
 */
async function optionalAuth(req, res, next) {
  try {
    // For now, we'll skip authentication and just pass through
    // You can implement session-based or JWT authentication here later
    next();
  } catch (error) {
    console.error('❌ Optional auth error:', error);
    next();
  }
}

/**
 * Require authentication
 */
async function authenticate(req, res, next) {
  try {
    // TODO: Implement your session/JWT logic here
    // For now, return 401 to indicate auth is required
    return res.status(401).json({
      success: false,
      error: 'Authentication not implemented yet'
    });
  } catch (error) {
    console.error('❌ Authentication error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
}

/**
 * Check if user is admin
 */
function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }
  
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
  }
  
  next();
}

module.exports = {
  authenticate,
  optionalAuth,
  requireAdmin
};