function createRateLimiter({ windowMs, max, message }) {
  const requests = new Map();
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of requests) if (entry.resetAt <= now) requests.delete(key);
  }, windowMs);
  cleanupInterval.unref();

  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    let entry = requests.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      requests.set(key, entry);
    }
    entry.count += 1;
    res.set('RateLimit-Limit', String(max));
    res.set('RateLimit-Remaining', String(Math.max(0, max - entry.count)));
    res.set('RateLimit-Reset', String(Math.ceil(entry.resetAt / 1000)));
    if (entry.count > max) {
      res.set('Retry-After', String(Math.max(1, Math.ceil((entry.resetAt - now) / 1000))));
      return res.status(429).json({ success: false, message });
    }
    return next();
  };
}

module.exports = { createRateLimiter };
