const express = require('express');
const router  = express.Router();
const { authenticate, optionalAuthenticate } = require('../middleware/auth');
const { getProfile, updateProfile }         = require('../controllers/profileController');

router.get('/:email/profile', optionalAuthenticate, getProfile);
router.put('/:email/profile', authenticate,         updateProfile);

module.exports = router;
