const express      = require('express');
const router       = express.Router();
const { authenticate } = require('../middleware/auth');
const { getPerson }    = require('../controllers/peopleController');

// GET /people/:id  (JWT required)
router.get('/:id', authenticate, getPerson);

module.exports = router;
