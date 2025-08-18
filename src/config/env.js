require('dotenv').config();

const requiredEnvVars = [
  'JWT_SECRET',
  'DB_HOST',
  'DB_USER', 
  'DB_PASSWORD',
  'DB_NAME'
];

const optionalEnvVars = {
  PORT: 3000,
  DB_PORT: 3306,
  NODE_ENV: 'development'
};

function validateEnvironment() {
  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long for security');
  }

  // Set default values for optional variables
  Object.entries(optionalEnvVars).forEach(([key, defaultValue]) => {
    if (!process.env[key]) {
      process.env[key] = defaultValue.toString();
    }
  });

  return {
    port: parseInt(process.env.PORT, 10),
    jwtSecret: process.env.JWT_SECRET,
    nodeEnv: process.env.NODE_ENV,
    database: {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT, 10),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      name: process.env.DB_NAME
    }
  };
}

module.exports = validateEnvironment();