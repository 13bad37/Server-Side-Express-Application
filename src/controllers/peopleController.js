const knex = require('../db/knex');

exports.getPerson = async (req, res, next) => {
  try {
    const { id } = req.params;
    const person = await knex('names')
      .select(
        'primaryName as name',
        'birthYear',
        'deathYear'
      )
      .where('nconst', id)
      .first();

    if (!person) {
      return res.status(404).json({ error: true, message: 'No record exists of a person with this ID' });
    }

    // fetch roles
    const roles = await knex('principals as p')
      .join('basics as b', 'p.tconst', 'b.tconst')
      .leftJoin('ratings as r', 'b.tconst', 'r.imdbID')
      .select(
        'b.primaryTitle as movieName',
        'b.tconst      as movieId',
        'p.category',
        'p.characters',
        'r.averageRating as imdbRating'
      )
      .where('p.nconst', id);

    const formatted = roles.map(r => ({
      movieName:  r.movieName,
      movieId:    r.movieId,
      category:   r.category,
      characters: r.characters ? r.characters.split(',') : [],
      imdbRating: r.imdbRating
    }));

    return res.json({ ...person, roles: formatted });
  } catch (err) {
    next(err);
  }
};
