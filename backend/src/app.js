const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const config = require('./config/env');
const apiRoutes = require('./routes');
const notFoundHandler = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const { enforceRequestOrigin } = require('./middleware/csrfProtection');

const app = express();
const configuredOrigins = config.FRONTEND_URL.split(',').map((origin) => origin.trim()).filter(Boolean);
const allowedOrigins = new Set(configuredOrigins.length ? configuredOrigins : (config.NODE_ENV === 'production' ? [] : ['http://localhost:3000']));

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    // Non-browser clients do not send Origin; browser origins must be allowlisted.
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    const error = new Error('Origin is not allowed by CORS');
    error.status = 403;
    return callback(error);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));
app.use(express.json({ limit: '20mb' }));
app.use(cookieParser());
app.use(enforceRequestOrigin);

if (config.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    const startedAt = Date.now();
    res.on('finish', () => {
      console.info(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - startedAt}ms`);
    });
    next();
  });
}

app.use('/api', apiRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
