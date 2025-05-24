// src/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const knex   = require('../db/knex');
const { generateTokens } = require('../middleware/auth');

exports.register = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400)
        .json({ error: true, message: 'Request body incomplete, both email and password are required' });
    }
    const exists = await knex('users').where({ email }).first();
    if (exists) {
      return res.status(409).json({ error: true, message: 'User already exists' });
    }
    const password_hash = await bcrypt.hash(password, 10);
    await knex('users').insert({ email, password_hash });
    return res.status(201).json({ message: 'User created' });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password, bearerExpiresInSeconds, refreshExpiresInSeconds } = req.body;
    if (!email || !password) {
      return res.status(400)
        .json({ error: true, message: 'Request body incomplete, both email and password are required' });
    }
    const user = await knex('users').where({ email }).first();
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: true, message: 'Incorrect email or password' });
    }
    const opts = {};
    if (bearerExpiresInSeconds)  opts.bearerExpiresInSeconds  = bearerExpiresInSeconds;
    if (refreshExpiresInSeconds) opts.refreshExpiresInSeconds = refreshExpiresInSeconds;
    const { bearerToken, bearerExpires, refreshToken, refreshExpires } =
      await generateTokens(user.id, opts);
    return res.json({
      bearerToken:  { token: bearerToken,  token_type: 'Bearer',  expires_in: bearerExpires  },
      refreshToken: { token: refreshToken, token_type: 'Refresh', expires_in: refreshExpires }
    });
  } catch (err) {
    next(err);
  }
};

exports.refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: true, message: 'Request body incomplete, refresh token required' });
    }
    let payload;
    try {
      payload = jwt.verify(refreshToken, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: true, message: 'JWT token has expired' });
      }
      return res.status(401).json({ error: true, message: 'Invalid JWT token' });
    }
    const stored = await knex('refresh_tokens').where({ token: refreshToken }).first();
    if (!stored) {
      return res.status(401).json({ error: true, message: 'Invalid JWT token' });
    }
    await knex('refresh_tokens').where({ token: refreshToken }).del();
    const { bearerToken, bearerExpires, refreshToken: newRefresh, refreshExpires } =
      await generateTokens(payload.sub);
    return res.json({
      bearerToken:  { token: bearerToken,  token_type: 'Bearer',  expires_in: bearerExpires  },
      refreshToken: { token: newRefresh,   token_type: 'Refresh', expires_in: refreshExpires }
    });
  } catch (err) {
    next(err);
  }
};

exports.logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: true, message: 'Request body incomplete, refresh token required' });
    }
    await knex('refresh_tokens').where({ token: refreshToken }).del();
    return res.json({ error: false, message: 'Token successfully invalidated' });
  } catch (err) {
    next(err);
  }
};
