const fs = require('fs');
const https = require('https');
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const cors = require('cors');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const path = require('path');

const config = require('./config/env');
const logger = require('./config/logger');

const authRoutes    = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const moviesRoutes  = require('./routes/movies');
const peopleRoutes  = require('./routes/people');

const app = express();

// Trust proxy for rate limiting and IP detection
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Compression middleware
app.use(compression());

// Request logging
app.use(morgan('combined', {
  stream: { write: message => logger.info(message.trim()) }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: true, message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', { ip: req.ip, path: req.path });
    res.status(429).json({ error: true, message: 'Too many requests, please try again later' });
  }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 auth requests per windowMs
  message: { error: true, message: 'Too many authentication attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});

app.use(limiter);

// CORS middleware
const corsOptions = {
  origin: config.nodeEnv === 'production' ? 
    ['https://yourdomain.com'] : // Replace with your actual domain
    true,
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parser with limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Swagger UI at /
const swaggerDocument = require(path.join(__dirname, '../openapi.json'));
app.use('/', swaggerUi.serve);
app.get('/', swaggerUi.setup(swaggerDocument));

// API routes with auth rate limiting for sensitive endpoints
app.use('/user/register', authLimiter);
app.use('/user/login', authLimiter);
app.use('/user', authRoutes);
app.use('/user', profileRoutes);
app.use('/movies', moviesRoutes);
app.use('/people', peopleRoutes);

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip
  });
  
  // Don't leak error details in production
  const message = config.nodeEnv === 'production' ? 
    'Internal server error' : 
    err.message;
    
  res
    .status(err.status || 500)
    .json({ error: true, message });
});

// Read your self-signed certificate + key (one level up from src/)
const keyFile  = path.join(__dirname, '../selfsigned.key');
const certFile = path.join(__dirname, '../selfsigned.crt');
const options = {
  key:  fs.readFileSync(keyFile),
  cert: fs.readFileSync(certFile)
};

// Graceful shutdown handling
const server = https.createServer(options, app);

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', { error: err.message, stack: err.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection', { reason, promise });
  process.exit(1);
});

// Start HTTPS server
server.listen(config.port, () => {
  logger.info(`🛡️ HTTPS server listening on https://localhost:${config.port}`);
});