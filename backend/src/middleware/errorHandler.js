const config = require('../config/env');

function errorHandler(error, _req, res, _next) {
  const status = Number.isInteger(error.status) ? error.status : 500;
  const message = status >= 500
    ? 'Internal server error'
    : error.message || 'Internal server error';

  if (status >= 500) console.error('[error]', error);
  else if (config.NODE_ENV !== 'test') console.warn('[request-error]', message);

  res.status(status).json({ success: false, message });
}

module.exports = errorHandler;
