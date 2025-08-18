const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/authController');
const {
  registerValidation,
  loginValidation,
  refreshValidation
} = require('../middleware/validation');

router.post('/register', registerValidation, ctrl.register);
router.post('/login', loginValidation, ctrl.login);
router.post('/refresh', refreshValidation, ctrl.refresh);
router.post('/logout', refreshValidation, ctrl.logout);

module.exports = router;
