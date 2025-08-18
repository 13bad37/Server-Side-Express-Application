const jwt = require('jsonwebtoken');
const knex = require('../db/knex');
const config = require('../config/env');
const logger = require('../config/logger');
const JWT_SECRET = config.jwtSecret;

/**
 * Issue a new pair of (Bearer, Refresh) tokens and store the refresh one in the DB.
 */
async function generateTokens(userId, opts = {}) {
  // default lifetimes
  const bearerExpiresInSeconds  = opts.bearerExpiresInSeconds  ?? 600
  const refreshExpiresInSeconds = opts.refreshExpiresInSeconds ?? 86400

  // sign both tokens
  const bearerToken  = jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: bearerExpiresInSeconds })
  const refreshToken = jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: refreshExpiresInSeconds })

  // persist the refresh token
  await knex('refresh_tokens').insert({
    token:      refreshToken,
    user_id:    userId,
    expires_at: new Date(Date.now() + refreshExpiresInSeconds * 1000)
  })

  return {
    bearerToken,
    bearerExpires: bearerExpiresInSeconds,
    refreshToken,
    refreshExpires: refreshExpiresInSeconds
  }
}

/**
 * Require a valid Bearer JWT. On failure, send 401 with an exact message.
 */
function authenticate(req, res, next) {
  const auth = req.header('Authorization')
  if (!auth) {
    return res
      .status(401)
      .json({ error: true, message: "Authorization header ('Bearer token') not found" })
  }
  const parts = auth.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    // same message for any malformed header
    return res
      .status(401)
      .json({ error: true, message: "Authorization header ('Bearer token') not found" })
  }

  const token = parts[1]
  jwt.verify(token, JWT_SECRET, async (err, payload) => {
    if (err) {
      logger.warn('Authentication failed', { 
        ip: req.ip, 
        userAgent: req.get('User-Agent'),
        error: err.message 
      });
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: true, message: 'JWT token has expired' });
      }
      return res.status(401).json({ error: true, message: 'Invalid JWT token' });
    }
    
    try {
      // ensure the user still exists
      const user = await knex('users').where({ id: payload.sub }).first();
      if (!user) {
        logger.warn('Token valid but user not found', { userId: payload.sub, ip: req.ip });
        return res.status(401).json({ error: true, message: 'Invalid JWT token' });
      }
      req.user = { id: payload.sub };
      next();
    } catch (dbError) {
      logger.error('Database error during authentication', { error: dbError.message, userId: payload.sub });
      return res.status(500).json({ error: true, message: 'Internal server error' });
    }
  })
}

/**
 * Try to authenticate, but if no header or malformed, just proceed without setting req.user.
 */
function optionalAuthenticate(req, res, next) {
  const auth = req.header('Authorization')
  if (!auth) return next()
  const parts = auth.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res
      .status(401)
      .json({ error: true, message: "Authorization header ('Bearer token') not found" })
  }
  jwt.verify(parts[1], JWT_SECRET, async (err, payload) => {
    if (!err) {
      try {
        const user = await knex('users').where({ id: payload.sub }).first();
        if (user) {
          req.user = { id: payload.sub };
        }
      } catch (dbError) {
        logger.error('Database error during optional authentication', { error: dbError.message });
      }
    }
    next();
  })
}

module.exports = {
  generateTokens,
  authenticate,
  optionalAuthenticate
}
