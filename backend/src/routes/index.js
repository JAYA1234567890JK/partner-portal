const express = require('express');
const healthRoutes = require('./healthRoutes');
const authRoutes = require('./authRoutes');
const partnerRoutes = require('./partnerRoutes');
const imageRoutes = require('./imageRoutes');

const router = express.Router();
router.use('/', healthRoutes);
router.use('/auth', authRoutes);
router.use('/partner', partnerRoutes);
router.use('/', imageRoutes);

module.exports = router;
