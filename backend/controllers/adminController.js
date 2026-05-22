const Report = require('../models/Report');
const User = require('../models/User');
const Detection = require('../models/Detection');
const ApiResponse = require('../utils/apiResponse');
const { emitToUser } = require('../utils/socketManager');
const { sendEmail, reportStatusUpdateEmail } = require('../utils/emailService');

/**
 * @desc    Get all reports (admin) with pagination, search, and filters
 * @route   GET /api/admin/reports
 * @access  Private/Admin
 */
const getAllReports = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, severity, search } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (severity) filter.severity = severity;

    // Text search on title, description, or address
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [reports, total] = await Promise.all([
      Report.find(filter)
        .populate('user', 'name email')
        .populate('detectionResults')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Report.countDocuments(filter),
    ]);

    ApiResponse.paginated(res, reports, pageNum, limitNum, total);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update report status and add admin notes
 * @route   PUT /api/admin/reports/:id/status
 * @access  Private/Admin
 */
const updateReportStatus = async (req, res, next) => {
  try {
    const { status, adminNotes } = req.body;

    if (!status) {
      return ApiResponse.error(res, 'Status is required', 400);
    }

    const validStatuses = ['pending', 'approved', 'in_progress', 'resolved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return ApiResponse.error(
        res,
        `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        400
      );
    }

    const report = await Report.findById(req.params.id).populate('user', 'name email');

    if (!report) {
      return ApiResponse.error(res, 'Report not found', 404);
    }

    const previousStatus = report.status;
    report.status = status;
    if (adminNotes !== undefined) {
      report.adminNotes = adminNotes;
    }

    await report.save();

    // Emit real-time socket event to the report owner
    emitToUser(report.user._id.toString(), 'reportStatusUpdate', {
      reportId: report._id,
      title: report.title,
      previousStatus,
      newStatus: status,
      adminNotes: report.adminNotes,
      updatedAt: report.updatedAt,
    });

    // Send email notification (non-blocking)
    if (report.user && report.user.email) {
      sendEmail(
        report.user.email,
        `Report Update: ${report.title}`,
        reportStatusUpdateEmail(report.title, status, adminNotes || '')
      ).catch((err) => {
        console.warn(`⚠️  Failed to send status update email: ${err.message}`);
      });
    }

    // Re-populate for response
    const updatedReport = await Report.findById(report._id)
      .populate('user', 'name email')
      .populate('detectionResults');

    ApiResponse.success(res, updatedReport, `Report status updated to '${status}'`);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get analytics – aggregated stats
 * @route   GET /api/admin/analytics
 * @access  Private/Admin
 */
const getAnalytics = async (req, res, next) => {
  try {
    // 1. Counts summary
    const [
      total,
      pending,
      approved,
      in_progress,
      resolved,
      rejected,
      lowSeverity,
      mediumSeverity,
      highSeverity
    ] = await Promise.all([
      Report.countDocuments(),
      Report.countDocuments({ status: 'pending' }),
      Report.countDocuments({ status: 'approved' }),
      Report.countDocuments({ status: 'in_progress' }),
      Report.countDocuments({ status: 'resolved' }),
      Report.countDocuments({ status: 'rejected' }),
      Report.countDocuments({ severity: 'low' }),
      Report.countDocuments({ severity: 'medium' }),
      Report.countDocuments({ severity: 'high' }),
    ]);

    const counts = { total, pending, approved, in_progress, resolved, rejected };
    const severityDistribution = { low: lowSeverity, medium: mediumSeverity, high: highSeverity };

    // Reports by month (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const reportsOverTime = await Report.aggregate([
      { $match: { createdAt: { $gte: twelveMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      {
        $project: {
          _id: 0,
          year: '$_id.year',
          month: '$_id.month',
          label: {
            $concat: [
              { $toString: '$_id.year' },
              '-',
              {
                $cond: [
                  { $lt: ['$_id.month', 10] },
                  { $concat: ['0', { $toString: '$_id.month' }] },
                  { $toString: '$_id.month' },
                ],
              },
            ],
          },
          count: 1,
        },
      },
    ]);

    // Top 5 affected locations (by address)
    const topLocations = await Report.aggregate([
      { $match: { address: { $ne: '' } } },
      { $group: { _id: '$address', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $project: {
          _id: 0,
          location: '$_id',
          count: 1,
        },
      },
    ]);

    ApiResponse.success(res, {
      counts,
      severityDistribution,
      reportsOverTime,
      topLocations,
    }, 'Analytics data retrieved');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get dashboard summary stats
 * @route   GET /api/admin/dashboard
 * @access  Private/Admin
 */
const getDashboardStats = async (req, res, next) => {
  try {
    // Get start of today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      totalReports,
      pendingReports,
      resolvedReports,
      inProgressReports,
      totalUsers,
      reportsToday,
    ] = await Promise.all([
      Report.countDocuments(),
      Report.countDocuments({ status: 'pending' }),
      Report.countDocuments({ status: 'resolved' }),
      Report.countDocuments({ status: 'in_progress' }),
      User.countDocuments(),
      Report.countDocuments({ createdAt: { $gte: todayStart } }),
    ]);

    ApiResponse.success(res, {
      totalReports,
      pendingReports,
      resolvedReports,
      inProgressReports,
      totalUsers,
      reportsToday,
    }, 'Dashboard stats retrieved');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllReports,
  updateReportStatus,
  getAnalytics,
  getDashboardStats,
};
