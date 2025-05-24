require('dotenv').config();
const express   = require('express');
const swaggerUi = require('swagger-ui-express');
const path      = require('path');

const authRoutes    = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const moviesRoutes  = require('./routes/movies');
const peopleRoutes  = require('./routes/people');

const app  = express();
const PORT = process.env.PORT || 3000;

// Body‐parser
app.use(express.json());

// Swagger UI
// — no more yamljs, just require the JSON directly
const swaggerDocument = require(path.join(__dirname, '../openapi.json'));
app.use('/', swaggerUi.serve);
app.get('/', swaggerUi.setup(swaggerDocument));

// API routes
app.use('/user',   authRoutes);
app.use('/user',   profileRoutes);
app.use('/movies', moviesRoutes);
app.use('/people', peopleRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: true, message: err.message });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
