const multer = require('multer');

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const extensionByMime = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

const uploadImages = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 10 },
  fileFilter(_req, file, callback) {
    if (!allowedMimeTypes.has(file.mimetype)) {
      const error = new Error('Only JPG, PNG, and WebP images are accepted.');
      error.status = 415;
      return callback(error);
    }
    return callback(null, true);
  },
}).array('images', 10);

function validateImageSignatures(req, res, next) {
  const files = req.files || [];
  const matches = {
    'image/jpeg': (buffer) => buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff,
    'image/png': (buffer) => buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
    'image/webp': (buffer) => buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP',
  };
  const invalid = files.find((file) => !matches[file.mimetype]?.(file.buffer));
  if (invalid) return res.status(415).json({ success: false, message: 'The uploaded file content does not match its image type.' });
  return next();
}

function handleImageUpload(req, res, next) {
  uploadImages(req, res, (error) => {
    if (!error) return validateImageSignatures(req, res, next);
    if (error.code === 'LIMIT_FILE_SIZE') error.status = 413;
    else if (error.code === 'LIMIT_FILE_COUNT') error.status = 400;
    return next(error);
  });
}

module.exports = { handleImageUpload, extensionByMime };
