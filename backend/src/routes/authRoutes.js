const express = require('express');
const authController = require('../controllers/authController');
const authenticateUser = require('../middleware/authenticateUser');
const authorizeRoles = require('../middleware/authorizeRoles');
const { createRateLimiter } = require('../middleware/authRateLimit');
const { registerSchema, loginSchema, adminLoginSchema, validateBody } = require('../validators/authValidators');

const router = express.Router();
const registerLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many registration attempts. Please try again later.',
});
const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many login attempts. Please try again later.',
});

router.post('/register', registerLimiter, validateBody(registerSchema), authController.register);
router.post('/login', loginLimiter, validateBody(loginSchema), authController.login);
router.post('/admin/login', loginLimiter, validateBody(adminLoginSchema), authController.adminLogin);
// Logout remains available for expired sessions; origin checks protect this cookie action.
router.post('/logout', authController.logout);
router.get('/me', authenticateUser, authorizeRoles('PARTNER'), authController.me);
router.get('/admin/me', authenticateUser, authorizeRoles('ADMIN'), authController.adminMe);

module.exports = router;
