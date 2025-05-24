const jwt   = require('jsonwebtoken');
const knex  = require('../db/knex');
const crypto = require('crypto');

async function generateTokens(userId, options = {}) {
  const bearerExpires  = options.bearerExpiresInSeconds  ?? parseInt(process.env.JWT_BEARER_EXPIRES, 10);
  const refreshExpires = options.refreshExpiresInSeconds ?? parseInt(process.env.JWT_REFRESH_EXPIRES, 10);

  const bearerToken  = jwt.sign({ sub: userId }, process.env.JWT_SECRET, { expiresIn: bearerExpires });
  const jti          = crypto.randomBytes(16).toString('hex');
  const refreshToken = jwt.sign({ sub: userId, jti }, process.env.JWT_SECRET, { expiresIn: refreshExpires });

  const expiresAt = new Date(Date.now() + refreshExpires * 1000);
  await knex('refresh_tokens').insert({ user_id: userId, token: refreshToken, expires_at: expiresAt });

  return { bearerToken, bearerExpires, refreshToken, refreshExpires };
}

function authenticate(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) {
    return res.status(401).json({ error: true, message: "Authorization header ('Bearer token') not found" });
  }
  if (!auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: true, message: 'Authorization header is malformed' });
  }
  const token = auth.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.sub };
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: true, message: 'JWT token has expired' });
    }
    return res.status(401).json({ error: true, message: 'Invalid JWT token' });
  }
}

function optionalAuthenticate(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return next();
  if (!auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: true, message: 'Authorization header is malformed' });
  }
  const token = auth.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.sub };
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: true, message: 'JWT token has expired' });
    }
    return res.status(401).json({ error: true, message: 'Invalid JWT token' });
  }
}

module.exports = { generateTokens, authenticate, optionalAuthenticate };
