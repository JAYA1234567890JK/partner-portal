const express = require('express');
const healthRoutes = require('./healthRoutes');
const authRoutes = require('./authRoutes');
const partnerRoutes = require('./partnerRoutes');
const imageRoutes = require('./imageRoutes');
const adminRoutes = require('./adminRoutes');

const router = express.Router();
router.use('/', healthRoutes);
router.use('/auth', authRoutes);
router.use('/partner', partnerRoutes);
router.use('/admin', adminRoutes);
router.use('/', imageRoutes);

module.exports = router;
