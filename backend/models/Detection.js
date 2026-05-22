const mongoose = require('mongoose');

const detectionSchema = new mongoose.Schema({
  report: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Report',
  },
  originalImage: {
    type: String,
    required: [true, 'Original image URL is required'],
  },
  processedImage: {
    type: String,
    default: '',
  },
  detections: [
    {
      class: { type: String },
      confidence: { type: Number },
      bbox: [{ type: Number }],
      severity: { type: String },
    },
  ],
  summary: {
    totalDamages: {
      type: Number,
      default: 0,
    },
    overallSeverity: {
      type: String,
      default: 'low',
    },
    damageTypes: [{ type: String }],
  },
  processingTime: {
    type: Number,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Detection', detectionSchema);
