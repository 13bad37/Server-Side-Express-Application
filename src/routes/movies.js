const express = require('express');
const router = express.Router();
const { searchMovies, getMovieData } = require('../controllers/moviesController');
const {
  movieSearchValidation,
  movieDataValidation
} = require('../middleware/validation');

router.get('/search', movieSearchValidation, searchMovies);
router.get('/data/:imdbID', movieDataValidation, getMovieData);

module.exports = router;
