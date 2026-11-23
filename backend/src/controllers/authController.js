const authService = require('../services/authService');

async function register(req, res, next) {
  try {
    const result = await authService.registerPartner(req.validatedBody);
    return res.status(201).json({
      success: true,
      message: 'Partner account created successfully.',
      data: {
        user: result.user,
        partner: result.partner,
      },
    });
  } catch (error) { return next(error); }
}

async function login(req, res, next) {
  try {
    const result = await authService.login(req.validatedBody);
    authService.setAuthCookie(res, result.token);
    return res.json({
      success: true,
      message: 'Login successful.',
      data: { user: result.user },
    });
  } catch (error) { return next(error); }
}

function logout(_req, res) {
  authService.clearAuthCookie(res);
  return res.json({ success: true, message: 'Logout successful.' });
}

async function me(req, res, next) {
  try {
    const user = await authService.getCurrentPartner(req.auth.userId);
    return res.json({ success: true, data: { user } });
  } catch (error) { return next(error); }
}

module.exports = { register, login, logout, me };
