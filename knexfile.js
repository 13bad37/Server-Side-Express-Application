const config = require('./src/config/env');

module.exports = {
  development: {
    client: 'mysql2',
    connection: {
      host    : config.database.host,
      port    : config.database.port,
      user    : config.database.user,
      password: config.database.password,
      database: config.database.name,
      charset : 'utf8'
    },
    migrations: {
      directory: './src/db/migrations'
    },
    pool: {
      min: 2,
      max: 10
    }
  },
  production: {
    client: 'mysql2',
    connection: {
      host    : config.database.host,
      port    : config.database.port,
      user    : config.database.user,
      password: config.database.password,
      database: config.database.name,
      charset : 'utf8',
      ssl: config.nodeEnv === 'production' ? { rejectUnauthorized: false } : false
    },
    migrations: {
      directory: './src/db/migrations'
    },
    pool: {
      min: 2,
      max: 20
    }
  }
};
