require('dotenv').config();
const { validateEnvironment } = require('../validators/envValidator');

const config = validateEnvironment();

module.exports = config;