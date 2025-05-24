const knex = require('../db/knex');

async function getProfile(req, res, next) {
  try {
    const { email } = req.params;
    const user = await knex('users').where({ email }).first();
    if (!user) {
      return res.status(404).json({ error: true, message: 'User not found' });
    }

    const base = {
      email:     user.email,
      firstName: user.firstName,
      lastName:  user.lastName
    };

    if (!req.user || req.user.id !== user.id) {
      return res.json(base);
    }

    return res.json({
      ...base,
      dob:     user.dob    ? user.dob.toISOString().slice(0,10) : null,
      address: user.address || null
    });
  } catch (err) {
    next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    const { email } = req.params;
    const user = await knex('users').where({ email }).first();
    if (!user) {
      return res.status(404).json({ error: true, message: 'User not found' });
    }
    if (!req.user) {
      return res.status(401).json({ error: true, message: "Authorization header ('Bearer token') not found" });
    }
    if (req.user.id !== user.id) {
      return res.status(403).json({ error: true, message: 'Forbidden' });
    }

    const { firstName, lastName, dob, address } = req.body;
    if ([firstName, lastName, dob, address].some(v => v === undefined)) {
      return res.status(400).json({
        error: true,
        message: 'Request body incomplete: firstName, lastName, dob and address are required.'
      });
    }
    if (typeof firstName !== 'string' || typeof lastName !== 'string' || typeof address !== 'string') {
      return res.status(400).json({
        error: true,
        message: 'Request body invalid: firstName, lastName and address must be strings only.'
      });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dob) || isNaN(Date.parse(dob))) {
      return res.status(400).json({
        error: true,
        message: 'Invalid input: dob must be a real date in format YYYY-MM-DD.'
      });
    }

    await knex('users').where({ email }).update({ firstName, lastName, dob, address });
    const updated = await knex('users').where({ email }).first();

    return res.json({
      email:     updated.email,
      firstName: updated.firstName,
      lastName:  updated.lastName,
      dob:       updated.dob.toISOString().slice(0,10),
      address:   updated.address
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getProfile, updateProfile };
