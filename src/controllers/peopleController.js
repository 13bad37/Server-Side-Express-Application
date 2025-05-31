const knex = require('../db/knex');

/**
 * GET /people/:id
 *   (JWT required)
 * Returns one person’s basic info from `names` by IMDB ID (nconst).
 */
exports.getPerson = async (req, res, next) => {
  try {
    const { id } = req.params; // route is /people/:id
    const person = await knex('names')
      .select('primaryName as name', 'birthYear', 'deathYear')
      .where({ nconst: id })
      .first();

    if (!person) {
      return res
        .status(404)
        .json({ error: true, message: 'No record exists of a person with this ID' });
    }

    return res.json(person);
  } catch (err) {
    console.error('❌ GET /people/:id:', err.message);
    return res.status(500).json({ error: true, message: err.message });
  }
};

/**
 * GET /people/:id/credits
 *   (JWT required)
 * Returns person’s “principals” (cast/crew) credits ordered by movie title.
 */
exports.getPersonCredits = async (req, res, next) => {
  try {
    const { id } = req.params; // route is /people/:id/credits

    // Ensure the person exists in `names`
    const person = await knex('names').where({ nconst: id }).first();
    if (!person) {
      return res.status(404).json({ error: true, message: 'Person not found' });
    }

    // Join principals - basics = ratings (using r.imdbRating)
    const credits = await knex('principals as p')
      .innerJoin('basics as b', 'p.tconst', 'b.tconst')
      .leftJoin('ratings as r', 'b.tconst', 'r.imdbID')
      .where('p.nconst', id)
      .select(
        'b.primaryTitle    as movieName',
        'b.tconst          as movieId',
        'p.category',
        'p.characters',
        'r.imdbRating      as imdbRating'
      )
      .orderBy('b.primaryTitle', 'asc');

    // Transform each row: parse JSON array in `characters`
    const formatted = credits.map((row) => ({
      movieName:  row.movieName,
      movieId:    row.movieId,
      category:   row.category,
      characters: row.characters ? JSON.parse(row.characters) : [],
      imdbRating: row.imdbRating !== null ? row.imdbRating : null
    }));

    return res.json(formatted);
  } catch (err) {
    console.error('❌ GET /people/:id/credits:', err.message);
    return res.status(500).json({ error: true, message: err.message });
  }
};
