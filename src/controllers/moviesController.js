const knex = require('../db/knex');

exports.searchMovies = async (req, res, next) => {
  try {
    const { title, year, page = 1 } = req.query;
    const pg = parseInt(page, 10);
    const limit = 100;

    if (isNaN(pg) || pg < 1) {
      return res.status(400).json({ error: true, message: 'Invalid page format. page must be a number.' });
    }

    if (year && !/^\d{4}$/.test(year)) {
      return res.status(400).json({ error: true, message: 'Invalid year format. Format must be yyyy.' });
    }

    const applyFilters = (qb) => {
      if (title) qb.where('b.primaryTitle', 'like', `%${title}%`);
      if (year) qb.where('b.year', year);
      return qb;
    };

    const countQuery = knex('basics as b');
    applyFilters(countQuery);
    const { count } = await countQuery.count('b.tconst as count').first();
    const total = parseInt(count, 10);
    const lastPage = Math.ceil(total / limit);

    const dataQuery = knex('basics as b')
      .leftJoin('ratings as r_imdb', function () {
        this.on('b.tconst', '=', 'r_imdb.tconst').andOn('r_imdb.source', '=', knex.raw('?', ['Internet Movie Database']));
      })
      .leftJoin('ratings as r_rt', function () {
        this.on('b.tconst', '=', 'r_rt.tconst').andOn('r_rt.source', '=', knex.raw('?', ['Rotten Tomatoes']));
      })
      .leftJoin('ratings as r_mc', function () {
        this.on('b.tconst', '=', 'r_mc.tconst').andOn('r_mc.source', '=', knex.raw('?', ['Metacritic']));
      })
      .select(
        'b.primaryTitle as title',
        'b.year as year',
        'b.tconst as imdbID',
        'r_imdb.value as imdbRating',
        'r_rt.value as rottenTomatoesRating',
        'r_mc.value as metacriticRating',
        'b.titleType as classification'
      )
      .orderBy('b.tconst', 'asc')
      .limit(limit)
      .offset((pg - 1) * limit);
    applyFilters(dataQuery);
    const data = await dataQuery;

    return res.json({
      data,
      pagination: {
        total,
        lastPage,
        perPage: limit,
        currentPage: pg,
        from: (pg - 1) * limit + 1,
        to: (pg - 1) * limit + data.length,
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
      .leftJoin('ratings as r_imdb', function () {
        this.on('b.tconst', '=', 'r_imdb.tconst').andOn('r_imdb.source', '=', knex.raw('?', ['Internet Movie Database']));
      })
      .leftJoin('ratings as r_rt', function () {
        this.on('b.tconst', '=', 'r_rt.tconst').andOn('r_rt.source', '=', knex.raw('?', ['Rotten Tomatoes']));
      })
      .leftJoin('ratings as r_mc', function () {
        this.on('b.tconst', '=', 'r_mc.tconst').andOn('r_mc.source', '=', knex.raw('?', ['Metacritic']));
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
      .where('b.tconst', imdbID)
      .first();

    if (!movie) {
      return res.status(404).json({ error: true, message: 'No record exists of a movie with this ID' });
    }

    movie.ratings = [
      { source: 'Internet Movie Database', value: movie.imdbRating },
      { source: 'Rotten Tomatoes', value: movie.rottenTomatoesRating },
      { source: 'Metacritic', value: movie.metacriticRating },
    ];
    delete movie.imdbRating;
    delete movie.rottenTomatoesRating;
    delete movie.metacriticRating;

    const principals = await knex('principals as p')
      .leftJoin('names as n', 'p.nconst', 'n.nconst')
      .select(
        'p.nconst as id',
        'n.primaryName as name',
        'p.category',
        'p.characters'
      )
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
