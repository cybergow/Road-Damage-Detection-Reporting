import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiSearch, FiFilter, FiEdit3, FiEye, FiCheck, FiX, FiActivity, FiArrowRight } from 'react-icons/fi';
import axios from '../api/axios';
import DashboardLayout from '../components/layout/DashboardLayout';
import GlassCard from '../components/ui/GlassCard';
import StatusBadge from '../components/ui/StatusBadge';
import Badge from '../components/ui/Badge';
import { formatDate } from '../utils/helpers';
import toast from 'react-hot-toast';

export default function AdminReports() {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');

  // Modal actions
  const [selectedReport, setSelectedReport] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [nextStatus, setNextStatus] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchReports = async () => {
    try {
      const response = await axios.get('/admin/reports');
      const data = response.data.data || [];
      setReports(data);
      setFilteredReports(data);
    } catch (err) {
      console.error('Error fetching admin reports:', err);
      toast.error('Could not load administrative list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    let result = reports;

    // Apply Search
    if (search.trim()) {
      const s = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(s) ||
          r.description.toLowerCase().includes(s) ||
          (r.address && r.address.toLowerCase().includes(s)) ||
          (r.user?.name && r.user.name.toLowerCase().includes(s))
      );
    }

    // Apply Status Filter
    if (statusFilter !== 'all') {
      result = result.filter((r) => r.status === statusFilter);
    }

    // Apply Severity Filter
    if (severityFilter !== 'all') {
      result = result.filter((r) => r.severity === severityFilter);
    }

    setFilteredReports(result);
  }, [search, statusFilter, severityFilter, reports]);

  const handleOpenActionModal = (report, status) => {
    setSelectedReport(report);
    setNextStatus(status);
    setAdminNotes(report.adminNotes || '');
  };

  const handleUpdateStatusSubmit = async (e) => {
    e.preventDefault();
    if (!selectedReport) return;

    setActionLoading(true);
    const toastId = toast.loading(`Updating report status to: ${nextStatus}...`);

    try {
      const response = await axios.put(`/admin/reports/${selectedReport._id}/status`, {
        status: nextStatus,
        adminNotes,
      });

      if (response.data.success) {
        toast.success('Complaint status updated successfully!', { id: toastId });
        setSelectedReport(null);
        setAdminNotes('');
        fetchReports(); // Refresh data
      } else {
        throw new Error(response.data.message || 'Update failed');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Error updating status', { id: toastId });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Manage Complaints</h1>
          <p className="text-white/60 mt-1">Review user submissions, update repair progress statuses, and append notes.</p>
        </div>

        {/* Filter bar */}
        <GlassCard className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-xs">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by title, location, user..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:border-accent-400 focus:ring-0 text-sm text-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <FiFilter className="text-white/40 w-4 h-4" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-auto bg-dark-100 border border-white/10 rounded-xl text-xs py-2 px-3 focus:ring-0 text-white"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="w-full sm:w-auto bg-dark-100 border border-white/10 rounded-xl text-xs py-2 px-3 focus:ring-0 text-white"
              >
                <option value="all">All Severities</option>
                <option value="low">Low Severity</option>
                <option value="medium">Medium Severity</option>
                <option value="high">High Severity</option>
              </select>
            </div>
          </div>
        </GlassCard>

        {/* Desktop Table View */}
        <GlassCard className="overflow-hidden p-0">
          {loading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3, 4].map(n => (
                <div key={n} className="h-10 w-full animate-pulse rounded-lg bg-white/5" />
              ))}
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-white/40 text-sm font-medium">No reports matches this query.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5 text-white/60 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="px-6 py-4">Title & Reporter</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Severity</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-white/80">
                  {filteredReports.map((r) => (
                    <tr key={r._id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-white">{r.title}</div>
                        <div className="text-xs text-white/50 mt-1 flex items-center gap-1">
                          <span>By: {r.user?.name || 'Citizen User'}</span>
                          <span className="text-white/20">•</span>
                          <span className="truncate max-w-[200px]">{r.address || 'Geo-Location set'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{formatDate(r.createdAt)}</td>
                      <td className="px-6 py-4">
                        <Badge type="severity" value={r.severity} />
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex justify-end gap-2.5">
                          <Link
                            to={`/reports/${r._id}`}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-colors"
                            title="View Report"
                          >
                            <FiEye className="w-4 h-4" />
                          </Link>

                          {r.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleOpenActionModal(r, 'approved')}
                                className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 transition-colors"
                                title="Approve"
                              >
                                <FiCheck className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleOpenActionModal(r, 'rejected')}
                                className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 transition-colors"
                                title="Reject"
                              >
                                <FiX className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          {r.status === 'approved' && (
                            <button
                              onClick={() => handleOpenActionModal(r, 'in_progress')}
                              className="px-3 py-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 font-semibold text-xs flex items-center gap-1 transition-colors"
                            >
                              <FiActivity className="w-3.5 h-3.5" /> Dispatch
                            </button>
                          )}

                          {r.status === 'in_progress' && (
                            <button
                              onClick={() => handleOpenActionModal(r, 'resolved')}
                              className="px-3 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 font-semibold text-xs flex items-center gap-1 transition-colors"
                            >
                              <FiCheck className="w-3.5 h-3.5" /> Resolve
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>
      </div>

      {/* Action modal for status changes & notes */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md glass-card p-6 space-y-6"
          >
            <div>
              <h3 className="text-lg font-bold text-white capitalize">
                Transition to: {nextStatus.replace('_', ' ')}
              </h3>
              <p className="text-xs text-white/50 mt-1">
                Updating: "{selectedReport.title}"
              </p>
            </div>

            <form onSubmit={handleUpdateStatusSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white/50">Municipal Action Notes</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Enter details, repair crew dispatch times, BITMAP seals, or reason for rejection..."
                  rows={4}
                  className="w-full rounded-xl bg-white/5 border border-white/10 focus:border-accent-400 focus:ring-0 p-4 text-white text-sm"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedReport(null)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/75 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary-500 to-accent-500 text-white text-xs font-semibold disabled:opacity-50"
                >
                  {actionLoading ? 'Updating...' : 'Submit Action'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </DashboardLayout>
  );
}
