const Report = require('../models/Report');
const Detection = require('../models/Detection');
const ApiResponse = require('../utils/apiResponse');
const { emitToAdmins } = require('../utils/socketManager');
const { sendEmail, adminNotificationEmail } = require('../utils/emailService');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');

/**
 * @desc    Create a new road damage report
 * @route   POST /api/reports
 * @access  Private
 */
const createReport = async (req, res, next) => {
  try {
    const { title, description, severity, address, latitude, longitude, coordinates } = req.body;

    // Build images array from uploaded files
    const images = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        // Cloudinary gives secure_url/url; local disk gives path
        images.push(file.secure_url || file.url || file.path);
      }
    }

    let lat = parseFloat(latitude);
    let lng = parseFloat(longitude);

    // Fallback to coordinates string/array if latitude/longitude are not provided
    if (isNaN(lat) || isNaN(lng)) {
      if (coordinates) {
        try {
          const coords = typeof coordinates === 'string'
            ? JSON.parse(coordinates)
            : coordinates;
          if (Array.isArray(coords) && coords.length >= 2) {
            lng = parseFloat(coords[0]);
            lat = parseFloat(coords[1]);
          }
        } catch (err) {
          console.warn('Failed parsing coordinates:', err);
        }
      }
    }

    if (isNaN(lat) || isNaN(lng)) {
      return ApiResponse.error(res, 'Valid coordinates (latitude & longitude) are required', 400);
    }

    // Create report
    const report = await Report.create({
      user: req.user._id,
      title,
      description,
      severity: severity || 'medium',
      address: address || '',
      images,
      location: {
        type: 'Point',
        coordinates: [lng, lat],
      },
    });

    // If images exist, attempt AI detection on the first image
    if (images.length > 0 && process.env.AI_SERVICE_URL) {
      try {
        const aiUrl = `${process.env.AI_SERVICE_URL}/detect`;
        const startTime = Date.now();

        let aiResponse;
        const imageSource = images[0];

        // If it's a URL (Cloudinary), send as JSON
        if (imageSource.startsWith('http')) {
          aiResponse = await fetch(aiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image_url: imageSource }),
          });
        } else {
          // Local file – send as multipart form using native FormData
          const fileBuffer = fs.readFileSync(imageSource);
          const formData = new globalThis.FormData();
          formData.set(
            'image',
            new globalThis.Blob([fileBuffer], { type: 'image/jpeg' }),
            path.basename(imageSource)
          );

          aiResponse = await fetch(aiUrl, {
            method: 'POST',
            body: formData,
          });
        }

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const processingTime = Date.now() - startTime;

          const detections = aiData.detections || [];
          const damageTypes = [...new Set(detections.map((d) => d.class))];
          let overallSeverity = severity || 'medium';
          if (detections.some((d) => d.severity === 'high')) {
            overallSeverity = 'high';
          } else if (detections.some((d) => d.severity === 'medium')) {
            overallSeverity = 'medium';
          }

          const dbSummary = {
            totalDamages: aiData.summary && typeof aiData.summary.totalDetections === 'number'
              ? aiData.summary.totalDetections
              : (aiData.summary && typeof aiData.summary.totalDamages === 'number' ? aiData.summary.totalDamages : detections.length),
            overallSeverity: aiData.summary && aiData.summary.overallSeverity
              ? aiData.summary.overallSeverity
              : overallSeverity,
            damageTypes: aiData.summary && aiData.summary.damageTypes
              ? (Array.isArray(aiData.summary.damageTypes) ? aiData.summary.damageTypes : Object.keys(aiData.summary.damageTypes))
              : damageTypes,
          };

          const detection = await Detection.create({
            report: report._id,
            originalImage: imageSource,
            processedImage: aiData.processed_image || aiData.processedImage || '',
            detections,
            summary: dbSummary,
            processingTime,
          });

          // Link detection to report
          report.detectionResults = detection._id;

          // Update severity based on AI analysis if available
          if (aiData.summary && aiData.summary.overallSeverity) {
            report.severity = aiData.summary.overallSeverity;
          }

          await report.save();
        }
      } catch (aiError) {
        // AI service unavailable – continue without detection
        console.warn(`⚠️  AI detection failed: ${aiError.message}`);
      }
    }

    // Populate for response
    const populatedReport = await Report.findById(report._id)
      .populate('detectionResults')
      .populate('user', 'name email');

    // Notify admins via socket
    emitToAdmins('newReport', {
      reportId: report._id,
      title: report.title,
      severity: report.severity,
      createdAt: report.createdAt,
    });

    // Send admin notification email (non-blocking)
    const adminUsers = await User.find({ role: 'admin' });
    for (const admin of adminUsers) {
      sendEmail(
        admin.email,
        `New Report: ${title}`,
        adminNotificationEmail(title, req.user.name, report.severity)
      ).catch(() => {});
    }

    ApiResponse.success(res, populatedReport, 'Report created successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current user's reports with pagination and filtering
 * @route   GET /api/reports
 * @access  Private
 */
const getReports = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, severity } = req.query;

    const filter = { user: req.user._id };
    if (status) filter.status = status;
    if (severity) filter.severity = severity;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [reports, total] = await Promise.all([
      Report.find(filter)
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
 * @desc    Get a single report by ID
 * @route   GET /api/reports/:id
 * @access  Private
 */
const getReport = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('detectionResults')
      .populate('user', 'name email');

    if (!report) {
      return ApiResponse.error(res, 'Report not found', 404);
    }

    // Verify ownership or admin
    if (
      report.user._id.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return ApiResponse.error(res, 'Not authorized to view this report', 403);
    }

    ApiResponse.success(res, report, 'Report retrieved');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a report (only if status is pending)
 * @route   PUT /api/reports/:id
 * @access  Private
 */
const updateReport = async (req, res, next) => {
  try {
    let report = await Report.findById(req.params.id);

    if (!report) {
      return ApiResponse.error(res, 'Report not found', 404);
    }

    // Verify ownership
    if (report.user.toString() !== req.user._id.toString()) {
      return ApiResponse.error(res, 'Not authorized to update this report', 403);
    }

    // Only allow updates if status is pending
    if (report.status !== 'pending') {
      return ApiResponse.error(
        res,
        'Cannot update a report that is no longer pending',
        400
      );
    }

    const { title, description, severity, address } = req.body;

    if (title !== undefined) report.title = title;
    if (description !== undefined) report.description = description;
    if (severity !== undefined) report.severity = severity;
    if (address !== undefined) report.address = address;

    await report.save();

    report = await Report.findById(report._id)
      .populate('detectionResults')
      .populate('user', 'name email');

    ApiResponse.success(res, report, 'Report updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a report
 * @route   DELETE /api/reports/:id
 * @access  Private
 */
const deleteReport = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return ApiResponse.error(res, 'Report not found', 404);
    }

    // Verify ownership
    if (report.user.toString() !== req.user._id.toString()) {
      return ApiResponse.error(res, 'Not authorized to delete this report', 403);
    }

    // Delete associated detection if exists
    if (report.detectionResults) {
      await Detection.findByIdAndDelete(report.detectionResults);
    }

    await Report.findByIdAndDelete(report._id);

    ApiResponse.success(res, null, 'Report deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Find reports near given coordinates
 * @route   GET /api/reports/nearby
 * @access  Private
 */
const getNearbyReports = async (req, res, next) => {
  try {
    const { lat, lng, radius = 5000 } = req.query;

    if (!lat || !lng) {
      return ApiResponse.error(res, 'Latitude and longitude are required', 400);
    }

    const reports = await Report.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: parseInt(radius, 10),
        },
      },
      status: { $in: ['approved', 'in_progress'] },
    })
      .populate('user', 'name')
      .select('title severity status location address createdAt')
      .limit(50);

    ApiResponse.success(res, reports, `Found ${reports.length} nearby reports`);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all approved/in-progress/resolved reports for map display
 * @route   GET /api/reports/map
 * @access  Public
 */
const getMapReports = async (req, res, next) => {
  try {
    const reports = await Report.find({
      status: { $in: ['approved', 'in_progress', 'resolved'] },
    }).select('title severity status location address createdAt');

    ApiResponse.success(res, reports, `Found ${reports.length} reports for map`);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReport,
  getReports,
  getReport,
  updateReport,
  deleteReport,
  getNearbyReports,
  getMapReports,
};
