const knex = require('../db/knex')

// parse rating into number or null
const parseRating = (r) => {
  if (r == null || r === '') return null
  const n = parseFloat(r)
  return Number.isNaN(n) ? null : n
}

exports.searchMovies = async (req, res, next) => {
  try {
    // only allow title, year, page
    const allowed = ['title', 'year', 'page']
    const invalid = Object.keys(req.query).filter(k => !allowed.includes(k))
    if (invalid.length > 0) {
      return res
        .status(400)
        .json({ error: true, message: 'Query parameters are not permitted.' })
    }

    const { title, year, page = 1 } = req.query
    const pg = parseInt(page, 10)
    if (isNaN(pg) || pg < 1) {
      return res
        .status(400)
        .json({ error: true, message: 'Invalid page format. page must be a number.' })
    }
    if (year && !/^\d{4}$/.test(year)) {
      return res
        .status(400)
        .json({ error: true, message: 'Invalid year format. Format must be yyyy.' })
    }

    const limit = 100
    const applyFilters = (qb) => {
      if (title) qb.where('b.primaryTitle', 'like', `%${title}%`)
      if (year) qb.where('b.year', year)
      return qb
    }

    // count total matches
    const cnt = await knex('basics as b')
      .modify(applyFilters)
      .count('b.tconst as count')
      .first()
    const total = parseInt(cnt.count, 10) || 0
    const lastPage = total === 0 ? 0 : Math.ceil(total / limit)

    // fetch rows if within range
    let raw = []
    if (pg <= lastPage && total > 0) {
      raw = await knex('basics as b')
        .modify(applyFilters)
        .leftJoin('ratings as r_imdb', function () {
          this.on('b.tconst', '=', 'r_imdb.tconst')
            .andOn('r_imdb.source', '=', knex.raw('?', ['Internet Movie Database']))
        })
        .leftJoin('ratings as r_rt', function () {
          this.on('b.tconst', '=', 'r_rt.tconst')
            .andOn('r_rt.source', '=', knex.raw('?', ['Rotten Tomatoes']))
        })
        .leftJoin('ratings as r_mc', function () {
          this.on('b.tconst', '=', 'r_mc.tconst')
            .andOn('r_mc.source', '=', knex.raw('?', ['Metacritic']))
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
        .offset((pg - 1) * limit)
    }

    const data = raw.map(m => ({
      title: m.title,
      year: m.year,
      imdbID: m.imdbID,
      classification: m.classification === null ? null : m.classification,
      imdbRating: parseRating(m.imdbRating),
      rottenTomatoesRating: parseRating(m.rottenTomatoesRating),
      metacriticRating: parseRating(m.metacriticRating)
    }))

    // build pagination fields (use null rather than 0)
    let prevPage = null, nextPage = null, from = 0, to = 0

    if (total === 0) {
      // no matches: keep all zeros or nulls

    } else if (pg > lastPage) {
      // out of bounds: show last page indices
      prevPage = lastPage > 0 ? lastPage : null
      from = lastPage * limit
      to = lastPage * limit

    } else {
      // valid page
      prevPage = pg > 1 ? pg - 1 : null
      nextPage = pg < lastPage ? pg + 1 : null
      from = (pg - 1) * limit
      to = from + data.length
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
        to
      }
    })
  } catch (err) {
    next(err)
  }
}

exports.getMovieData = async (req, res, next) => {
  try {
    if (Object.keys(req.query).length > 0) {
      return res
        .status(400)
        .json({ error: true, message: 'Query parameters are not permitted.' })
    }

    const { imdbID } = req.params
    const movie = await knex('basics as b')
      .where('b.tconst', imdbID)
      .leftJoin('ratings as r_imdb', function () {
        this.on('b.tconst', '=', 'r_imdb.tconst')
          .andOn('r_imdb.source', '=', knex.raw('?', ['Internet Movie Database']))
      })
      .leftJoin('ratings as r_rt', function () {
        this.on('b.tconst', '=', 'r_rt.tconst')
          .andOn('r_rt.source', '=', knex.raw('?', ['Rotten Tomatoes']))
      })
      .leftJoin('ratings as r_mc', function () {
        this.on('b.tconst', '=', 'r_mc.tconst')
          .andOn('r_mc.source', '=', knex.raw('?', ['Metacritic']))
      })
      .select(
        'b.primaryTitle as title',
        'b.year as year',
        'b.runtimeMinutes as runtime',
        'b.genres',
        'b.country',
        'b.boxoffice',
        'r_imdb.value as imdbRating',
        'r_rt.value as rottenTomatoesRating',
        'r_mc.value as metacriticRating',
        'b.poster',
        'b.plot'
      )
      .first()

    if (!movie) {
      return res
        .status(404)
        .json({ error: true, message: 'No record exists of a movie with this ID' })
    }

    movie.genres = movie.genres ? movie.genres.split(',') : []
    movie.country = movie.country ? movie.country.split(',') : []

    movie.ratings = [
      { source: 'Internet Movie Database', value: parseRating(movie.imdbRating) },
      { source: 'Rotten Tomatoes',         value: parseRating(movie.rottenTomatoesRating) },
      { source: 'Metacritic',               value: parseRating(movie.metacriticRating) }
    ]
    delete movie.imdbRating
    delete movie.rottenTomatoesRating
    delete movie.metacriticRating

    const principals = await knex('principals as p')
      .leftJoin('names as n', 'p.nconst', 'n.nconst')
      .select(
        'p.nconst as id',
        'n.primaryName as name',
        'p.category',
        'p.characters'
      )
      .where('p.tconst', imdbID)

    movie.principals = principals.map(p => ({
      id: p.id,
      name: p.name,
      category: p.category,
      characters: p.characters ? JSON.parse(p.characters) : []
    }))

    movie.boxoffice = movie.boxoffice !== null ? movie.boxoffice : null
    return res.json(movie)
  } catch (err) {
    next(err)
  }
}
