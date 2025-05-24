const express         = require('express');
const router          = express.Router();
const { searchMovies, getMovieData } = require('../controllers/moviesController');

/**
 * GET /movies/search
 * @query title?   — substring match on primaryTitle
 * @query year?    — exact yyyy
 * @query page?    — page number (100 results/page)
 */
router.get('/search', searchMovies);

/**
 * GET /movies/data/:imdbID
 * @param imdbID    — movie tconst
 */
router.get('/data/:imdbID', getMovieData);

module.exports = router;
