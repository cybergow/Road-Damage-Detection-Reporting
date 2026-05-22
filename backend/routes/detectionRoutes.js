const express = require('express');
const router = express.Router();
const { detectImage } = require('../controllers/detectionController');
const { protect } = require('../middleware/auth');
const { uploadSingle } = require('../middleware/upload');

/**
 * @route   POST /api/detect
 * @desc    Detect road damage in an uploaded image
 * @access  Private
 */
router.post('/', protect, uploadSingle, detectImage);

module.exports = router;
