const express = require('express');
const router = express.Router();
const { authenticate, optionalAuthenticate } = require('../middleware/auth');
const { getProfile, updateProfile } = require('../controllers/profileController');
const {
  profileGetValidation,
  profileUpdateValidation
} = require('../middleware/validation');

router.get('/:email/profile', profileGetValidation, optionalAuthenticate, getProfile);
router.put('/:email/profile', profileUpdateValidation, authenticate, updateProfile);

module.exports = router;
