const express           = require('express');
const router            = express.Router();
const { authenticate }  = require('../middleware/auth');
const {
  getPerson,
  getPersonCredits
} = require('../controllers/peopleController');

// GET /people/:id - (requires JWT)
router.get('/:id', authenticate, getPerson);

// GET /people/:id/credits  (requires JWT)
//    — note: pass getPersonCredits, not getPersonCredits()
router.get('/:id/credits', authenticate, getPersonCredits);

module.exports = router;
