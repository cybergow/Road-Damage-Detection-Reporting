const express = require('express');
const router = express.Router();
const {
  getAllReports,
  updateReportStatus,
  getAnalytics,
  getDashboardStats,
} = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const authorize = require('../middleware/roleAuth');

// All admin routes require authentication + admin role
router.use(protect);
router.use(authorize('admin'));

/**
 * @route   GET /api/admin/reports
 * @desc    Get all reports (admin view)
 * @access  Private/Admin
 */
router.get('/reports', getAllReports);

/**
 * @route   PUT /api/admin/reports/:id/status
 * @desc    Update report status
 * @access  Private/Admin
 */
router.put('/reports/:id/status', updateReportStatus);

/**
 * @route   GET /api/admin/analytics
 * @desc    Get analytics data
 * @access  Private/Admin
 */
router.get('/analytics', getAnalytics);

/**
 * @route   GET /api/admin/dashboard
 * @desc    Get dashboard summary stats
 * @access  Private/Admin
 */
router.get('/dashboard', getDashboardStats);

module.exports = router;
