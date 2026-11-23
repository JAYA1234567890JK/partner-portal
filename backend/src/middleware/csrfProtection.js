const config = require('../config/env');

const safeMethods = new Set(['GET', 'HEAD', 'OPTIONS']);
const configuredOrigins = new Set(
  config.FRONTEND_URL.split(',').map((value) => value.trim()).filter(Boolean),
);
if (!configuredOrigins.size && config.NODE_ENV !== 'production') configuredOrigins.add('http://localhost:3000');

function enforceRequestOrigin(req, res, next) {
  if (safeMethods.has(req.method)) return next();
  const origin = req.get('origin');
  // Browsers send Origin on cross-origin state changes. Reject missing origins when a
  // session cookie is present; allow origin-less Postman/cURL requests without cookies.
  if (!origin && req.cookies && req.cookies.roomly_access) {
    return res.status(403).json({ success: false, message: 'Request origin could not be verified.' });
  }
  if (origin && (!configuredOrigins.size || !configuredOrigins.has(origin))) {
    return res.status(403).json({ success: false, message: 'Request origin is not allowed.' });
  }
  return next();
}

module.exports = { enforceRequestOrigin };
