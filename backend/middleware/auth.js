const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_tourist_ai_hub_jwt_token_key_2026';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'super_secret_refresh_token_tourist_hub_2026';

/**
 * Extracts token from Authorization header or signed/unsigned cookies
 */
function extractToken(req) {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }
  if (req.cookies && req.cookies.touristhub_access_token) {
    return req.cookies.touristhub_access_token;
  }
  return null;
}

/**
 * Authenticate incoming requests via access token (header or cookie)
 */
function authenticateToken(req, res, next) {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Authentication token required.'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired session. Please log in again.'
      });
    }
    req.user = user;
    next();
  });
}

/**
 * Role-Based Access Control middleware
 * Supports single or multiple roles (e.g., 'Super Admin', 'Admin', 'User')
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const userRole = (req.user.role || '').toLowerCase();
    const hasRole = allowedRoles.some(r => r.toLowerCase() === userRole);

    if (!hasRole) {
      return res.status(403).json({
        success: false,
        message: `Access forbidden. Requires one of [${allowedRoles.join(', ')}] privileges. Current: ${req.user.role}`
      });
    }
    next();
  };
}

/**
 * Require either Super Admin or Admin role
 */
function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }

  const role = (req.user.role || '').toLowerCase();
  if (role === 'admin' || role === 'super admin') {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Access forbidden. Administrator privileges required.'
  });
}

/**
 * Require Super Admin role specifically
 */
function requireSuperAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }

  const role = (req.user.role || '').toLowerCase();
  if (role === 'super admin') {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Access forbidden. Super Administrator privileges required.'
  });
}

/**
 * Optional authentication - attaches user if valid token present, otherwise continues
 */
function optionalAuth(req, res, next) {
  const token = extractToken(req);

  if (token) {
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (!err) {
        req.user = user;
      }
      next();
    });
  } else {
    next();
  }
}

module.exports = {
  authenticateToken,
  requireRole,
  requireAdmin,
  requireSuperAdmin,
  optionalAuth,
  JWT_SECRET,
  JWT_REFRESH_SECRET
};
