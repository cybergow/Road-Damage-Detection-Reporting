const express = require('express');
const router = express.Router();
const {
  createReport,
  getReports,
  getReport,
  updateReport,
  deleteReport,
  getNearbyReports,
  getMapReports,
} = require('../controllers/reportController');
const { protect } = require('../middleware/auth');
const { uploadMultiple } = require('../middleware/upload');
const { reportValidation, handleValidationErrors } = require('../middleware/validate');

/**
 * @route   POST /api/reports
 * @desc    Create a new report with optional image uploads
 * @access  Private
 */
router.post('/', protect, uploadMultiple, createReport);

/**
 * @route   GET /api/reports
 * @desc    Get current user's reports
 * @access  Private
 */
router.get('/', protect, getReports);

/**
 * @route   GET /api/reports/nearby
 * @desc    Get reports near given coordinates
 * @access  Private
 */
router.get('/nearby', protect, getNearbyReports);

/**
 * @route   GET /api/reports/map
 * @desc    Get all approved reports for map display
 * @access  Public
 */
router.get('/map', getMapReports);

/**
 * @route   GET /api/reports/:id
 * @desc    Get a single report by ID
 * @access  Private
 */
router.get('/:id', protect, getReport);

/**
 * @route   PUT /api/reports/:id
 * @desc    Update a report (only if pending)
 * @access  Private
 */
router.put('/:id', protect, updateReport);

/**
 * @route   DELETE /api/reports/:id
 * @desc    Delete a report
 * @access  Private
 */
router.delete('/:id', protect, deleteReport);

module.exports = router;
