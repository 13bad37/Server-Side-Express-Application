const knex = require('../db/knex');
const logger = require('../config/logger');

// parse rating into number or null
const parseRating = (r) => {
  if (r == null || r === '') return null
  const n = parseFloat(r)
  return Number.isNaN(n) ? null : n
}

exports.getPerson = async (req, res, next) => {
  try {
    if (Object.keys(req.query).length > 0) {
      return res.status(400).json({ error: true, message: 'Query parameters are not permitted.' })
    }

    const { id } = req.params
    const person = await knex('names')
      .select('nconst as id', 'primaryName as name', 'birthYear', 'deathYear')
      .where({ nconst: id })
      .first()

    if (!person) {
      return res.status(404).json({ error: true, message: 'No record exists of a person with this ID' })
    }

    // fetch credits, sort by year then by title ignoring "The "
    const rawRoles = await knex('principals as p')
      .innerJoin('basics as b', 'p.tconst', 'b.tconst')
      .leftJoin('ratings as r_imdb', function () {
        this.on('b.tconst', '=', 'r_imdb.tconst')
          .andOn('r_imdb.source', '=', knex.raw('?', ['Internet Movie Database']))
      })
      .select(
        'b.primaryTitle as movieName',
        'b.tconst       as movieId',
        'b.year         as year',
        'p.category',
        'p.characters',
        'r_imdb.value   as imdbRating'
      )
      .where('p.nconst', id)
      .orderBy([
        { column: 'b.year',         order: 'asc' },
        // strip leading "The " when sorting titles
        { column: knex.raw("CASE WHEN b.primaryTitle LIKE 'The %' THEN substr(b.primaryTitle, 5) ELSE b.primaryTitle END"), order: 'asc' }
      ])

    const roles = rawRoles.map(r => ({
      movieName:  r.movieName,
      movieId:    r.movieId,
      category:   r.category,
      characters: r.characters ? JSON.parse(r.characters) : [],
      imdbRating: parseRating(r.imdbRating)
    }))

    return res.json({
      id:        person.id,
      name:      person.name,
      birthYear: person.birthYear,
      deathYear: person.deathYear,
      roles
    })
  } catch (err) {
    next(err)
  }
}

exports.getPersonCredits = async (req, res, next) => {
  try {
    if (Object.keys(req.query).length > 0) {
      return res.status(400).json({ error: true, message: 'Query parameters are not permitted.' })
    }

    const { id } = req.params
    const exists = await knex('names').where({ nconst: id }).first()
    if (!exists) {
      return res.status(404).json({ error: true, message: 'No record exists of a person with this ID' })
    }

    const raw = await knex('principals as p')
      .innerJoin('basics as b', 'p.tconst', 'b.tconst')
      .leftJoin('ratings as r_imdb', function () {
        this.on('b.tconst', '=', 'r_imdb.tconst')
          .andOn('r_imdb.source', '=', knex.raw('?', ['Internet Movie Database']))
      })
      .select(
        'b.primaryTitle as movieName',
        'b.tconst       as movieId',
        'b.year         as year',
        'p.category',
        'p.characters',
        'r_imdb.value   as imdbRating'
      )
      .where('p.nconst', id)
      .orderBy([
        { column: 'b.year',         order: 'asc' },
        { column: knex.raw("CASE WHEN b.primaryTitle LIKE 'The %' THEN substr(b.primaryTitle, 5) ELSE b.primaryTitle END"), order: 'asc' }
      ])

    const formatted = raw.map(r => ({
      movieName:  r.movieName,
      movieId:    r.movieId,
      category:   r.category,
      characters: r.characters ? JSON.parse(r.characters) : [],
      imdbRating: parseRating(r.imdbRating)
    }))

    return res.json(formatted)
  } catch (err) {
    next(err)
  }
}
