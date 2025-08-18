const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  getPerson,
  getPersonCredits
} = require('../controllers/peopleController');
const { personValidation } = require('../middleware/validation');

router.get('/:id', personValidation, authenticate, getPerson);
router.get('/:id/credits', personValidation, authenticate, getPersonCredits);

module.exports = router;
