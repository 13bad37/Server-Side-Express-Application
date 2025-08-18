const envConfig = require('../config/env');
const logger = require('../config/logger');
const env = envConfig.nodeEnv;
const config = require('../../knexfile')[env];
const knex = require('knex')(config);

// Test database connection
knex.raw('SELECT 1')
  .then(() => {
    logger.info('Database connection established successfully');
  })
  .catch((err) => {
    logger.error('Failed to connect to database:', err);
    process.exit(1);
  });

// Handle connection errors
knex.on('query-error', (error, obj) => {
  logger.error('Database query error:', { error: error.message, query: obj.sql });
});

module.exports = knex;
