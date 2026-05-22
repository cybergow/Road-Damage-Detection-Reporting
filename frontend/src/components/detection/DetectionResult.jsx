import { motion } from 'framer-motion';
import { FiCheckCircle, FiAlertTriangle, FiClock, FiArrowRight } from 'react-icons/fi';
import GlassCard from '../ui/GlassCard';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

const DetectionResult = ({ result, onCreateReport }) => {
  if (!result) return null;

  const { annotatedImage, detections = [], overallSeverity, processingTime } = result;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Annotated Image */}
      {annotatedImage && (
        <GlassCard>
          <h3 className="text-sm font-semibold text-white/80 mb-3">Detection Results</h3>
          <img
            src={annotatedImage}
            alt="Annotated detection result"
            className="w-full max-h-96 object-contain rounded-xl"
          />
        </GlassCard>
      )}

      {/* Summary */}
      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white/80">Analysis Summary</h3>
          {processingTime && (
            <div className="flex items-center gap-1.5 text-xs text-white/40">
              <FiClock className="w-3 h-3" />
              {processingTime}ms
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 rounded-xl bg-white/5">
            <p className="text-2xl font-bold text-white">{detections.length}</p>
            <p className="text-xs text-white/50">Damages Found</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-white/5">
            <p className="text-2xl font-bold text-white">
              {detections.length > 0
                ? (detections.reduce((sum, d) => sum + (d.confidence || 0), 0) / detections.length * 100).toFixed(0)
                : 0}%
            </p>
            <p className="text-xs text-white/50">Avg Confidence</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-white/5 col-span-2 sm:col-span-1">
            <div className="flex justify-center mb-1">
              <Badge type="severity" value={overallSeverity || 'low'} />
            </div>
            <p className="text-xs text-white/50">Overall Severity</p>
          </div>
        </div>
      </GlassCard>

      {/* Detection List */}
      {detections.length > 0 && (
        <GlassCard>
          <h3 className="text-sm font-semibold text-white/80 mb-3">Detected Damages</h3>
          <div className="space-y-2">
            {detections.map((det, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    det.severity === 'high' ? 'bg-rose-400' : det.severity === 'medium' ? 'bg-amber-400' : 'bg-emerald-400'
                  }`} />
                  <span className="text-sm font-medium text-white/80">
                    {det.class || det.label || 'Damage'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-white/50">
                    {((det.confidence || 0) * 100).toFixed(1)}%
                  </span>
                  <Badge type="severity" value={det.severity || 'medium'} />
                </div>
              </motion.div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Create Report Button */}
      <div className="flex justify-center">
        <Button
          variant="primary"
          size="lg"
          icon={FiArrowRight}
          onClick={onCreateReport}
        >
          Submit as Report
        </Button>
      </div>
    </motion.div>
  );
};

export default DetectionResult;
