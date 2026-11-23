function getHealth(_req, res) {
  res.status(200).json({
    success: true,
    message: 'Roomly API is running',
    status: 'healthy',
  });
}

module.exports = { getHealth };