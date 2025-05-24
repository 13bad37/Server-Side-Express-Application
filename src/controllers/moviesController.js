const knex = require('../db/knex');

exports.searchMovies = async (req, res, next) => {
  try {
    const { title, year, page = 1 } = req.query;
    const pg = parseInt(page, 10);
    if (isNaN(pg) || pg < 1) {
      return res.status(400).json({ error: true, message: 'Invalid page format. page must be a number.' });
    }

    let q = knex('basics as b')
      .leftJoin('ratings as r', 'b.tconst', 'r.imdbID')
      .select(
        'b.primaryTitle as title',
        'b.startYear    as year',
        'b.tconst       as imdbID',
        'r.averageRating         as imdbRating',
        'r.rottenTomatoesRating  as rottenTomatoesRating',
        'r.metacriticRating      as metacriticRating',
        'b.titleType     as classification'
      )
      .orderBy('b.tconst', 'asc')
      .limit(100)
      .offset((pg - 1) * 100);

    if (title) {
      q = q.where('b.primaryTitle', 'like', `%${title}%`);
    }
    if (year) {
      if (!/^\d{4}$/.test(year)) {
        return res.status(400).json({ error: true, message: 'Invalid year format. Format must be yyyy.' });
      }
      q = q.where('b.startYear', year);
    }

    const data = await q;
    const [{ count }] = await knex('basics').count('tconst as count');
    const lastPage = Math.ceil(count / 100);

    return res.json({
      data,
      pagination: {
        total:       count,
        lastPage,
        perPage:     100,
        currentPage: pg,
        from:        (pg - 1) * 100,
        to:          (pg - 1) * 100 + data.length
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.getMovieData = async (req, res, next) => {
  try {
    const { imdbID } = req.params;
    const movie = await knex('basics as b')
      .leftJoin('ratings as r', 'b.tconst', 'r.imdbID')
      .select(
        'b.primaryTitle as title',
        'b.startYear     as year',
        'b.runtimeMinutes as runtime',
        'b.genres',
        'b.country',
        'r.averageRating         as imdbRating',
        'r.rottenTomatoesRating  as rottenTomatoesRating',
        'r.metacriticRating      as metacriticRating',
        'b.poster',
        'b.plot'
      )
      .where('b.tconst', imdbID)
      .first();

    if (!movie) {
      return res.status(404).json({ error: true, message: 'No record exists of a movie with this ID' });
    }

    // fetch principals (cast/crew)
    const principals = await knex('principals as p')
      .join('basics as b2', 'p.tconst', 'b2.tconst')
      .select(
        'p.nconst      as id',
        'b2.primaryTitle as name',
        'p.category',
        'p.characters'
      )
      .where('p.tconst', imdbID);

    // reformat ratings array
    movie.ratings = [
      { source: 'Internet Movie Database', value: movie.imdbRating },
      { source: 'Rotten Tomatoes',          value: movie.rottenTomatoesRating },
      { source: 'Metacritic',               value: movie.metacriticRating }
    ];
    delete movie.imdbRating;
    delete movie.rottenTomatoesRating;
    delete movie.metacriticRating;

    movie.principals = principals.map(p => ({
      ...p,
      characters: p.characters ? p.characters.split(',') : []
    }));

    return res.json(movie);
  } catch (err) {
    next(err);
  }
};
