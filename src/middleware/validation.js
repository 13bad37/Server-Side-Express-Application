const { body, param, query, validationResult } = require('express-validator');
const logger = require('../config/logger');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Validation failed', { 
      ip: req.ip, 
      path: req.path, 
      errors: errors.array() 
    });
    return res.status(400).json({
      error: true,
      message: 'Request validation failed',
      details: errors.array()
    });
  }
  next();
};

// Auth validation rules
const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  handleValidationErrors
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  body('bearerExpiresInSeconds')
    .optional()
    .isInt({ min: 60, max: 3600 })
    .withMessage('Bearer token expiry must be between 60 and 3600 seconds'),
  body('refreshExpiresInSeconds')
    .optional()
    .isInt({ min: 3600, max: 2592000 })
    .withMessage('Refresh token expiry must be between 1 hour and 30 days'),
  handleValidationErrors
];

const refreshValidation = [
  body('refreshToken')
    .notEmpty()
    .isJWT()
    .withMessage('Valid refresh token is required'),
  handleValidationErrors
];

// Profile validation rules
const profileUpdateValidation = [
  param('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('firstName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .matches(/^[a-zA-Z\s-']+$/)
    .withMessage('First name must be 1-50 characters and contain only letters, spaces, hyphens, and apostrophes'),
  body('lastName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .matches(/^[a-zA-Z\s-']+$/)
    .withMessage('Last name must be 1-50 characters and contain only letters, spaces, hyphens, and apostrophes'),
  body('dob')
    .isISO8601()
    .isBefore(new Date().toISOString())
    .withMessage('Date of birth must be a valid date in the past'),
  body('address')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Address must be 1-200 characters'),
  handleValidationErrors
];

const profileGetValidation = [
  param('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  handleValidationErrors
];

// Movie validation rules
const movieSearchValidation = [
  query('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .matches(/^[a-zA-Z0-9\s\-:.,!?']+$/)
    .withMessage('Title must be 1-100 characters and contain only alphanumeric characters and basic punctuation'),
  query('year')
    .optional()
    .isInt({ min: 1800, max: new Date().getFullYear() + 5 })
    .withMessage('Year must be between 1800 and current year + 5'),
  query('page')
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage('Page must be between 1 and 10000'),
  handleValidationErrors
];

const movieDataValidation = [
  param('imdbID')
    .matches(/^tt\d+$/)
    .withMessage('Invalid IMDb ID format'),
  handleValidationErrors
];

// People validation rules
const personValidation = [
  param('id')
    .matches(/^nm\d+$/)
    .withMessage('Invalid person ID format'),
  handleValidationErrors
];

module.exports = {
  registerValidation,
  loginValidation,
  refreshValidation,
  profileUpdateValidation,
  profileGetValidation,
  movieSearchValidation,
  movieDataValidation,
  personValidation,
  handleValidationErrors
};