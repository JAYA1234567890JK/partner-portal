const express = require('express');
const authenticateUser = require('../middleware/authenticateUser');
const authorizeRoles = require('../middleware/authorizeRoles');
const partnerController = require('../controllers/partnerController');

const router = express.Router();
router.use(authenticateUser, authorizeRoles('PARTNER'));
router.get('/onboarding/draft', partnerController.getDraft);
router.put('/onboarding/draft', (req, res, next) => {
  if (!req.body || !req.body.draft || typeof req.body.draft !== 'object' || Array.isArray(req.body.draft)) {
    return res.status(400).json({ success: false, message: 'A property draft is required.' });
  }
  return next();
}, partnerController.saveDraft);
router.post('/properties', (req, res, next) => {
  if (!req.body || !req.body.draft || typeof req.body.draft !== 'object' || Array.isArray(req.body.draft)) {
    return res.status(400).json({ success: false, message: 'Property details are required.' });
  }
  return next();
}, partnerController.submitProperty);
router.get('/properties', partnerController.listProperties);
router.get('/dashboard', partnerController.getDashboard);

module.exports = router;
