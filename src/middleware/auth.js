const jwt  = require('jsonwebtoken');
const knex = require('../db/knex');

const JWT_SECRET = process.env.JWT_SECRET;

// call this in login/refresh to issue + store a refresh token
async function generateTokens(userId, opts = {}) {
  const bearerExpiresInSeconds  = opts.bearerExpiresInSeconds  ?? 600;
  const refreshExpiresInSeconds = opts.refreshExpiresInSeconds ?? 86400;

  const bearerToken  = jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: bearerExpiresInSeconds });
  const refreshToken = jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: refreshExpiresInSeconds });

  await knex('refresh_tokens').insert({
    token:      refreshToken,
    user_id:    userId,
    expires_at: new Date(Date.now() + refreshExpiresInSeconds * 1000)
  });

  return {
    bearerToken,
    bearerExpires: bearerExpiresInSeconds,
    refreshToken,
    refreshExpires: refreshExpiresInSeconds
  };
}

// require a valid Bearer JWT
function authenticate(req, res, next) {
  const auth = req.header('Authorization');
  if (!auth) {
    return res.status(401).json({ error: true, message: "Authorization header ('Bearer token') not found" });
  }
  const [scheme, token] = auth.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: true, message: 'Authorization header is malformed' });
  }
  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: true, message: 'JWT token has expired' });
      }
      return res.status(401).json({ error: true, message: 'Invalid JWT token' });
    }
    req.user = { id: payload.sub };
    next();
  });
}

// try to authenticate, but let it slide if no header
function optionalAuthenticate(req, res, next) {
  const auth = req.header('Authorization');
  if (!auth) return next();
  const [scheme, token] = auth.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: true, message: 'Authorization header is malformed' });
  }
  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if (!err) req.user = { id: payload.sub };
    next();
  });
}

module.exports = {
  generateTokens,
  authenticate,
  optionalAuthenticate
};
