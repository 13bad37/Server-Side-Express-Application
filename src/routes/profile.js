const express = require('express');
const router  = express.Router();

const {
  optionalAuthenticate,
  authenticate
} = require('../middleware/auth');

const {
  getProfile,
  updateProfile
} = require('../controllers/profileController');

// DEBUG: log out what we actually imported
console.log('🛠  PROFILE ROUTE HANDLERS:', {
  optionalAuthenticate: typeof optionalAuthenticate,
  authenticate:         typeof authenticate,
  getProfile:           typeof getProfile,
  updateProfile:        typeof updateProfile,
});

router.get('/:email/profile',
  optionalAuthenticate,
  getProfile
);

router.put('/:email/profile',
  authenticate,
  updateProfile
);

module.exports = router;
