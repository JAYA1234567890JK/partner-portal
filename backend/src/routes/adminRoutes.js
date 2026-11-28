const express = require('express');
const authenticateUser = require('../middleware/authenticateUser');
const authorizeRoles = require('../middleware/authorizeRoles');
const adminController = require('../controllers/adminController');
const { validatePropertyStatus } = require('../validators/adminValidators');

const router = express.Router();
router.use(authenticateUser, authorizeRoles('ADMIN'));
router.get('/overview', adminController.getOverview);
router.get('/applications', adminController.listApplications);
router.get('/properties', adminController.listProperties);
router.get('/partners', adminController.listPartners);
router.patch('/properties/:propertyId/status', validatePropertyStatus, adminController.updatePropertyStatus);

module.exports = router;
