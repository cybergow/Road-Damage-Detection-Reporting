const multer = require('multer');
const path = require('path');
const fs = require('fs');

let upload;

/**
 * Check whether Cloudinary is fully configured.
 * @returns {boolean}
 */
const isCloudinaryConfigured = () => {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
};

/**
 * Allowed MIME types for image uploads.
 */
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

/**
 * Multer file filter – only accept image files.
 */
const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error('Invalid file type. Only JPEG, JPG, PNG, and WEBP are allowed.'),
      false
    );
  }
};

/**
 * Maximum file size: 10 MB
 */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

if (isCloudinaryConfigured()) {
  // ── Cloudinary storage ────────────────────────────────────────────────────────
  const cloudinary = require('../config/cloudinary');
  const { CloudinaryStorage } = require('multer-storage-cloudinary');

  const storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: 'roadguard',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [{ width: 1200, crop: 'limit' }],
    },
  });

  upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: MAX_FILE_SIZE },
  });
} else {
  // ── Fallback: local disk storage ──────────────────────────────────────────────
  const uploadDir = path.join(__dirname, '..', 'uploads');

  // Ensure uploads directory exists
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext = path.extname(file.originalname);
      cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    },
  });

  upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: MAX_FILE_SIZE },
  });

  console.warn(
    '⚠️  Cloudinary not configured. Using local disk storage for uploads.'
  );
}

/** Single image upload middleware (field name: 'image') */
const uploadSingle = upload.single('image');

/** Multiple image upload middleware (field name: 'images', max 5) */
const uploadMultiple = upload.array('images', 5);

module.exports = { upload, uploadSingle, uploadMultiple };
