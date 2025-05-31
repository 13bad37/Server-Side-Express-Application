require('dotenv').config();
const fs        = require('fs');
const https     = require('https');
const express   = require('express');
const swaggerUi = require('swagger-ui-express');
const path      = require('path');

const authRoutes    = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const moviesRoutes  = require('./routes/movies');
const peopleRoutes  = require('./routes/people');

const app = express();

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Body parser
app.use(express.json());

// Swagger UI at /
const swaggerDocument = require(path.join(__dirname, '../openapi.json'));
app.use('/', swaggerUi.serve);
app.get('/', swaggerUi.setup(swaggerDocument));

// API routes
app.use('/user',   authRoutes);
app.use('/user',   profileRoutes);
app.use('/movies', moviesRoutes);
app.use('/people', peopleRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res
    .status(err.status || 500)
    .json({ error: true, message: err.message });
});

// Read your self-signed certificate + key (one level up from src/)
const keyFile  = path.join(__dirname, '../selfsigned.key');
const certFile = path.join(__dirname, '../selfsigned.crt');
const options = {
  key:  fs.readFileSync(keyFile),
  cert: fs.readFileSync(certFile)
};

// Start HTTPS server on port 3000
const PORT = process.env.PORT || 3000;
https
  .createServer(options, app)
  .listen(PORT, () => {
    console.log(`🛡️  HTTPS server listening on https://localhost:${PORT}`);
  });