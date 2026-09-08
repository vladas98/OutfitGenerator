const multer = require('multer');

// Images are kept in MongoDB (see models/ItemImage.js), not on disk, so multer
// hands the controller a Buffer rather than writing a file. The host wipes its
// filesystem on restart, which used to leave every uploaded photo missing.
const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('Only image uploads are allowed'));
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024, files: 20 },
});

module.exports = upload;
