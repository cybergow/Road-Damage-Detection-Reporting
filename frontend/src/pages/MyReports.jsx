import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiSearch, FiFilter, FiAlertCircle, FiPlus, FiArrowRight, FiCalendar, FiMapPin } from 'react-icons/fi';
import axios from '../api/axios';
import DashboardLayout from '../components/layout/DashboardLayout';
import GlassCard from '../components/ui/GlassCard';
import StatusBadge from '../components/ui/StatusBadge';
import Badge from '../components/ui/Badge';
import { formatDate } from '../utils/helpers';

export default function MyReports() {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await axios.get('/reports');
        const data = response.data.data || [];
        setReports(data);
        setFilteredReports(data);
      } catch (err) {
        console.error('Error retrieving user reports:', err);
      } finally {
        setLoading(false);
      }
    };
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
          (r.address && r.address.toLowerCase().includes(s))
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

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Title Block */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">My Reports</h1>
            <p className="text-white/60 mt-1">Review the status and repair progress of your submitted road complaints.</p>
          </div>
          <Link
            to="/reports/new"
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-accent-500 hover:shadow-lg hover:shadow-primary-500/20 text-white font-medium text-sm flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <FiPlus className="w-4 h-4" /> New Report
          </Link>
        </div>

        {/* Filter bar */}
        <GlassCard className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-xs">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4" />
            <input
              type="text"
              placeholder="Search reports..."
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

        {/* Reports Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-80 w-full animate-pulse rounded-2xl bg-white/5 border border-white/10" />
            ))}
          </div>
        ) : filteredReports.length === 0 ? (
          <GlassCard className="text-center py-20">
            <FiAlertCircle className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">No Reports Found</h3>
            <p className="text-white/50 max-w-sm mx-auto text-sm leading-relaxed">
              No matching reports were found. Submit a new report to register a road complaint.
            </p>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReports.map((report) => (
              <motion.div
                key={report._id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <Link to={`/reports/${report._id}`} className="block h-full">
                  <GlassCard hover className="flex flex-col h-full group">
                    <div className="aspect-video w-full rounded-xl overflow-hidden bg-white/5 relative border border-white/10">
                      {report.images?.[0] ? (
                        <img
                          src={report.images[0]}
                          alt={report.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/20 text-xs">
                          No Photo Uploaded
                        </div>
                      )}
                      <div className="absolute top-3 left-3 flex gap-2">
                        <Badge type="severity" value={report.severity} />
                      </div>
                      <div className="absolute bottom-3 right-3">
                        <StatusBadge status={report.status} />
                      </div>
                    </div>

                    <div className="flex-grow flex flex-col pt-5">
                      <h3 className="font-bold text-base text-white group-hover:text-accent-400 transition-colors line-clamp-1">
                        {report.title}
                      </h3>
                      <p className="text-xs text-white/50 line-clamp-2 mt-2 leading-relaxed flex-grow">
                        {report.description}
                      </p>

                      <div className="border-t border-white/10 mt-5 pt-4 flex flex-col gap-2.5 text-xs text-white/40">
                        <div className="flex items-center gap-2">
                          <FiMapPin className="w-3.5 h-3.5 text-accent-400" />
                          <span className="truncate">{report.address || 'Address unlisted'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FiCalendar className="w-3.5 h-3.5" />
                            <span>{formatDate(report.createdAt)}</span>
                          </div>
                          <span className="text-accent-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                            Details <FiArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
