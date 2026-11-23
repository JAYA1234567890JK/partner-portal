function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.auth) return res.status(401).json({ success: false, message: 'Authentication required.' });
    if (!allowedRoles.includes(req.auth.role)) {
      return res.status(403).json({ success: false, message: 'You are not authorized to access this resource.' });
    }
    return next();
  };
}

module.exports = authorizeRoles;
