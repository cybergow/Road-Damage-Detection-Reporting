import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMapPin, FiCalendar, FiUser, FiInfo, FiTrash2, FiArrowLeft, FiEdit, FiClock, FiActivity, FiCheckCircle, FiFileText } from 'react-icons/fi';
import axios from '../api/axios';
import { useAuth } from '../hooks/useAuth';
import DashboardLayout from '../components/layout/DashboardLayout';
import GlassCard from '../components/ui/GlassCard';
import StatusBadge from '../components/ui/StatusBadge';
import Badge from '../components/ui/Badge';
import MapView from '../components/map/MapView';
import { formatDate, getSeverityColor } from '../utils/helpers';
import toast from 'react-hot-toast';

export default function ReportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await axios.get(`/reports/${id}`);
        const data = response.data.data;
        setReport(data);
        if (data?.images?.length > 0) {
          setActiveImage(data.images[0]);
        }
      } catch (err) {
        console.error('Error fetching report details:', err);
        toast.error('Could not find requested report');
        navigate('/reports');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [id, navigate]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await axios.delete(`/reports/${id}`);
      toast.success('Report deleted successfully');
      navigate('/reports');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to delete report');
      setShowDeleteModal(false);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="h-[400px] w-full animate-pulse rounded-2xl bg-white/5 border border-white/10" />
      </DashboardLayout>
    );
  }

  if (!report) return null;

  const latlng = report.location?.coordinates
    ? { lat: report.location.coordinates[1], lng: report.location.coordinates[0] }
    : null;

  const isOwner = report.user?._id === user?.id || report.user === user?.id;
  const isPending = report.status === 'pending';

  // Timeline tracking status
  const statuses = ['pending', 'approved', 'in_progress', 'resolved'];
  const currentIdx = statuses.indexOf(report.status);

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-5xl mx-auto">
        {/* Back navigation */}
        <div className="flex flex-wrap justify-between items-center gap-4">
          <Link
            to={user?.role === 'admin' ? '/admin/reports' : '/reports'}
            className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
          >
            <FiArrowLeft className="w-4 h-4" /> Back to List
          </Link>

          {isOwner && isPending && (
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl text-rose-400 text-sm font-semibold flex items-center gap-2 transition-colors"
              >
                <FiTrash2 className="w-4 h-4" /> Delete Report
              </button>
            </div>
          )}
        </div>

        {/* Layout grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Photos & Map */}
          <div className="lg:col-span-2 space-y-6">
            <GlassCard className="p-4 space-y-4">
              <div className="aspect-video w-full rounded-xl overflow-hidden bg-white/5 border border-white/10 relative">
                {activeImage ? (
                  <img src={activeImage} alt={report.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/20">No Image Uploaded</div>
                )}
                <div className="absolute top-4 left-4">
                  <Badge type="severity" value={report.severity} />
                </div>
              </div>

              {report.images?.length > 1 && (
                <div className="flex gap-2.5 overflow-x-auto pb-1">
                  {report.images.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveImage(img)}
                      className={`w-20 h-16 rounded-lg overflow-hidden border-2 shrink-0 ${
                        activeImage === img ? 'border-accent-400' : 'border-white/10 hover:border-white/30'
                      }`}
                    >
                      <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </GlassCard>

            <GlassCard className="p-4 space-y-3">
              <h3 className="font-bold text-sm text-white/60 flex items-center gap-2">
                <FiMapPin className="w-4 h-4 text-accent-400" /> Damage Geographic Location
              </h3>
              <p className="text-sm font-medium text-white">{report.address || 'Address not listed'}</p>
              
              {latlng && (
                <div className="h-[250px] rounded-xl overflow-hidden border border-white/10 mt-3">
                  <MapView center={[latlng.lat, latlng.lng]} zoom={15} selectedLocation={latlng} />
                </div>
              )}
            </GlassCard>
          </div>

          {/* Details & Status Tracker */}
          <div className="space-y-6">
            <GlassCard className="space-y-5">
              <div>
                <StatusBadge status={report.status} />
                <h2 className="text-xl font-bold mt-3 leading-snug">{report.title}</h2>
              </div>

              <div className="text-xs text-white/50 space-y-3 border-y border-white/10 py-4">
                <div className="flex items-center gap-2">
                  <FiCalendar className="w-4 h-4 text-accent-400" />
                  <span>Reported on: {formatDate(report.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FiUser className="w-4 h-4 text-accent-400" />
                  <span>Reporter: {report.user?.name || 'Citizen User'}</span>
                </div>
              </div>

              <div>
                <span className="text-xs text-white/40 block mb-1">Details:</span>
                <p className="text-sm text-white/70 leading-relaxed">{report.description}</p>
              </div>

              {report.adminNotes && (
                <div className="p-4 rounded-xl bg-accent-500/5 border border-accent-500/20 space-y-1">
                  <span className="text-xs text-accent-400 font-bold block">Municipal Action Notes:</span>
                  <p className="text-xs text-white/80 leading-relaxed">{report.adminNotes}</p>
                </div>
              )}
            </GlassCard>

            {/* Workflow Timeline */}
            <GlassCard className="space-y-4">
              <h3 className="font-bold text-sm text-white/60">Complaint Processing Timeline</h3>
              <div className="space-y-5 pt-2">
                {[
                  { label: 'Complaint Filed', desc: 'Received and awaiting admin check', icon: <FiFileText /> },
                  { label: 'Verification Approved', desc: 'Validated and mapped to municipal schedules', icon: <FiCheckCircle /> },
                  { label: 'Work Order Dispatched', desc: 'Repair crew is assigned and active', icon: <FiActivity /> },
                  { label: 'Damage Resolved', desc: 'Road surface is restored', icon: <FiCheckCircle /> },
                ].map((stepItem, idx) => {
                  const isDone = report.status === 'rejected' ? false : idx <= currentIdx;
                  const isActive = report.status === 'rejected' ? false : idx === currentIdx;

                  return (
                    <div key={idx} className="flex gap-4 relative">
                      {idx < 3 && (
                        <div
                          className={`absolute left-3 top-7 bottom-0 w-0.5 -translate-x-1/2 ${
                            idx < currentIdx ? 'bg-primary-500' : 'bg-white/10'
                          }`}
                        />
                      )}
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border shrink-0 z-10 transition-colors ${
                          isDone
                            ? 'bg-primary-500 border-primary-500 text-white'
                            : 'bg-dark-100 border-white/10 text-white/30'
                        }`}
                      >
                        {stepItem.icon}
                      </div>
                      <div className="min-w-0">
                        <h4 className={`text-xs font-bold ${isDone ? 'text-white' : 'text-white/40'}`}>{stepItem.label}</h4>
                        <p className="text-[10px] text-white/50 mt-0.5">{stepItem.desc}</p>
                      </div>
                    </div>
                  );
                })}

                {report.status === 'rejected' && (
                  <div className="flex gap-4 text-rose-400 p-3 rounded-xl bg-rose-500/5 border border-rose-500/10">
                    <FiInfo className="w-5 h-5 shrink-0" />
                    <div className="text-xs">
                      <h4 className="font-bold">Report Rejected</h4>
                      <p className="text-white/60 mt-0.5">This report has been reviewed and flagged as invalid or closed.</p>
                    </div>
                  </div>
                )}
              </div>
            </GlassCard>

            {/* AI Bounding Box summary */}
            {report.detectionResults && (
              <GlassCard className="p-4 space-y-2">
                <h4 className="font-bold text-xs text-white/60 flex items-center gap-1.5">
                  <FiInfo className="w-4 h-4 text-accent-400" /> AI Detection Metrology
                </h4>
                <div className="text-xs space-y-1.5 text-white/70">
                  <p>AI verified damage boxes exist in database schemas.</p>
                </div>
              </GlassCard>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-sm glass-card p-6 space-y-6"
          >
            <div>
              <h3 className="text-lg font-bold text-white">Delete Report?</h3>
              <p className="text-xs text-white/60 mt-1.5">
                This action is permanent and cannot be undone. All database records will be erased.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/75 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete permanently'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </DashboardLayout>
  );
}
