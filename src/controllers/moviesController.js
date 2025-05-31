const knex = require('../db/knex');

// Helper: extract numeric value from rating strings (including decimals)
const parseRating = (rating) => {
  if (rating === null || rating === undefined || rating === '') {
    return null;
  }
  const ratingStr = String(rating).trim();
  if (!ratingStr) return null;

  const match = ratingStr.match(/(\d+(?:\.\d+)?)/);
  if (!match) return null;

  const n = parseFloat(match[1]);
  return Number.isNaN(n) ? null : n;
};

exports.searchMovies = async (req, res, next) => {
  try {
    const { title, year, page = 1 } = req.query;
    const pg = parseInt(page, 10);
    const limit = 100;

    // Validate page
    if (isNaN(pg) || pg < 1) {
      return res
        .status(400)
        .json({ error: true, message: 'Invalid page format. page must be a number.' });
    }
    // Validate year if provided
    if (year && !/^\d{4}$/.test(year)) {
      return res
        .status(400)
        .json({ error: true, message: 'Invalid year format. Format must be yyyy.' });
    }

    // Apply title/year filters when building a query
    const applyFilters = (qb) => {
      if (title) qb.where('b.primaryTitle', 'like', `%${title}%`);
      if (year) qb.where('b.year', year);
      return qb;
    };

    // 1) Count how many movies match
    const countResult = await knex('basics as b')
      .modify(applyFilters)
      .count('b.tconst as count')
      .first();
    const total = parseInt(countResult.count, 10) || 0;
    const lastPage = total === 0 ? 0 : Math.ceil(total / limit);

    // 2) Fetch current-page rows if in bounds
    let rawData = [];
    if (pg <= lastPage && total > 0) {
      rawData = await knex('basics as b')
        .modify(applyFilters)
        .leftJoin('ratings as r_imdb', function () {
          this.on('b.tconst', '=', 'r_imdb.tconst').andOn(
            'r_imdb.source',
            '=',
            knex.raw('?', ['Internet Movie Database'])
          );
        })
        .leftJoin('ratings as r_rt', function () {
          this.on('b.tconst', '=', 'r_rt.tconst').andOn(
            'r_rt.source',
            '=',
            knex.raw('?', ['Rotten Tomatoes'])
          );
        })
        .leftJoin('ratings as r_mc', function () {
          this.on('b.tconst', '=', 'r_mc.tconst').andOn(
            'r_mc.source',
            '=',
            knex.raw('?', ['Metacritic'])
          );
        })
        .select(
          'b.primaryTitle as title',
          'b.year as year',
          'b.tconst as imdbID',
          'r_imdb.value as imdbRating',
          'r_rt.value as rottenTomatoesRating',
          'r_mc.value as metacriticRating',
          'b.rated as classification'
        )
        .orderBy('b.tconst', 'asc')
        .limit(limit)
        .offset((pg - 1) * limit);
    }

    // 3) Normalize each row’s ratings + classification
    const data = rawData.map((m) => ({
      title: m.title,
      year: m.year,
      imdbID: m.imdbID,
      classification: m.classification === null ? null : m.classification,
      imdbRating: parseRating(m.imdbRating),
      rottenTomatoesRating: parseRating(m.rottenTomatoesRating),
      metacriticRating: parseRating(m.metacriticRating),
    }));

    // 4) Build pagination fields
    let prevPage = 0;
    let nextPage = 0;
    let from = 0;
    let to = 0;

    if (pg >= 1 && pg <= lastPage && total > 0) {
      const offset = (pg - 1) * limit;
      from = offset + 1;                // 1-based start index
      to = offset + data.length;        // 1-based end index
      prevPage = pg > 1 ? pg - 1 : 0;
      nextPage = pg < lastPage ? pg + 1 : 0;
    } else {
      // out-of-bounds or no results: from/to remain 0, prevPage/nextPage remain 0
      from = 0;
      to = 0;
      prevPage = 0;
      nextPage = 0;
    }

    return res.json({
      data,
      pagination: {
        total,
        lastPage,
        perPage: limit,
        currentPage: pg,
        prevPage,
        nextPage,
        from,
        to,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getMovieData = async (req, res, next) => {
  try {
    const { imdbID } = req.params;

    const movie = await knex('basics as b')
      .where('b.tconst', imdbID)
      .leftJoin('ratings as r_imdb', function () {
        this.on('b.tconst', '=', 'r_imdb.tconst').andOn(
          'r_imdb.source',
          '=',
          knex.raw('?', ['Internet Movie Database'])
        );
      })
      .leftJoin('ratings as r_rt', function () {
        this.on('b.tconst', '=', 'r_rt.tconst').andOn(
          'r_rt.source',
          '=',
          knex.raw('?', ['Rotten Tomatoes'])
        );
      })
      .leftJoin('ratings as r_mc', function () {
        this.on('b.tconst', '=', 'r_mc.tconst').andOn(
          'r_mc.source',
          '=',
          knex.raw('?', ['Metacritic'])
        );
      })
      .select(
        'b.primaryTitle as title',
        'b.year as year',
        'b.runtimeMinutes as runtime',
        'b.genres',
        'b.country',
        'r_imdb.value as imdbRating',
        'r_rt.value as rottenTomatoesRating',
        'r_mc.value as metacriticRating',
        'b.poster',
        'b.plot'
      )
      .first();

    if (!movie) {
      return res
        .status(404)
        .json({ error: true, message: 'No record exists of a movie with this ID' });
    }

    // Convert comma-separated strings into arrays
    movie.genres = movie.genres ? movie.genres.split(',') : [];
    movie.country = movie.country ? movie.country.split(',') : [];

    // Build a “ratings” array and remove raw rating fields
    movie.ratings = [
      { source: 'Internet Movie Database', value: parseRating(movie.imdbRating) },
      { source: 'Rotten Tomatoes', value: parseRating(movie.rottenTomatoesRating) },
      { source: 'Metacritic', value: parseRating(movie.metacriticRating) },
    ];
    delete movie.imdbRating;
    delete movie.rottenTomatoesRating;
    delete movie.metacriticRating;

    // Fetch “principals” (cast/crew) and parse the JSON in characters
    const principals = await knex('principals as p')
      .leftJoin('names as n', 'p.nconst', 'n.nconst')
      .select('p.nconst as id', 'n.primaryName as name', 'p.category', 'p.characters')
      .where('p.tconst', imdbID);

    movie.principals = principals.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      characters: p.characters ? JSON.parse(p.characters) : [],
    }));

    return res.json(movie);
  } catch (err) {
    next(err);
  }
};
