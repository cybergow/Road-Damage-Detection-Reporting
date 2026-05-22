const Detection = require('../models/Detection');
const ApiResponse = require('../utils/apiResponse');
const fs = require('fs');
const path = require('path');

/**
 * @desc    Detect road damage in an uploaded image via AI service
 * @route   POST /api/detect
 * @access  Private
 */
const detectImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return ApiResponse.error(res, 'No image file uploaded', 400);
    }

    const AI_SERVICE_URL = process.env.AI_SERVICE_URL;

    if (!AI_SERVICE_URL) {
      return ApiResponse.error(
        res,
        'AI detection service is not configured',
        503
      );
    }

    const imageSource = req.file.secure_url || req.file.url || req.file.path;
    const aiUrl = `${AI_SERVICE_URL}/detect`;
    const startTime = Date.now();

    let aiResponse;

    try {
      if (imageSource.startsWith('http')) {
        // Cloudinary URL – send as JSON
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
          new globalThis.Blob([fileBuffer], { type: req.file.mimetype || 'image/jpeg' }),
          path.basename(imageSource)
        );

        aiResponse = await fetch(aiUrl, {
          method: 'POST',
          body: formData,
        });
      }
    } catch (fetchError) {
      console.error(`❌ AI service connection failed: ${fetchError.message}`);
      return ApiResponse.error(
        res,
        'AI detection service is currently unavailable. Please try again later.',
        503
      );
    }

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text().catch(() => 'Unknown error');
      console.error(`❌ AI service returned ${aiResponse.status}: ${errorText}`);
      return ApiResponse.error(
        res,
        'AI detection service returned an error. Please try again later.',
        503
      );
    }

    const aiData = await aiResponse.json();
    const processingTime = Date.now() - startTime;

    // Build detection document
    const detections = aiData.detections || [];
    const damageTypes = [...new Set(detections.map((d) => d.class))];

    // Determine overall severity from detections
    let overallSeverity = 'low';
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
      originalImage: imageSource,
      processedImage: aiData.processed_image || aiData.processedImage || '',
      detections,
      summary: dbSummary,
      processingTime,
    });

    ApiResponse.success(
      res,
      {
        detection,
        processedImage: detection.processedImage,
        detections: detection.detections,
        summary: detection.summary,
        processingTime: `${processingTime}ms`,
      },
      'Image analysis complete',
      200
    );
  } catch (error) {
    next(error);
  }
};

module.exports = { detectImage };
