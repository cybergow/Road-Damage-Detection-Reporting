import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiPlus, FiCpu, FiMap, FiList, FiAlertCircle, FiCheckCircle, FiClock, FiActivity } from 'react-icons/fi';
import axios from '../api/axios';
import { useAuth } from '../hooks/useAuth';
import DashboardLayout from '../components/layout/DashboardLayout';
import GlassCard from '../components/ui/GlassCard';
import StatusBadge from '../components/ui/StatusBadge';
import { formatRelativeTime } from '../utils/helpers';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
  });
  const [recentReports, setRecentReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await axios.get('/reports');
        const reports = response.data.data || [];
        
        // Calculate user specific stats
        const counts = reports.reduce(
          (acc, report) => {
            acc.total += 1;
            if (report.status === 'pending') acc.pending += 1;
            else if (report.status === 'in_progress') acc.inProgress += 1;
            else if (report.status === 'resolved') acc.resolved += 1;
            return acc;
          },
          { total: 0, pending: 0, inProgress: 0, resolved: 0 }
        );

        setStats(counts);
        setRecentReports(reports.slice(0, 5));
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const cardContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardItemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } },
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Banner */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Dashboard</h1>
            <p className="text-white/60 mt-1">Hello, {user?.name}! Welcome back to RoadGuard AI.</p>
          </div>
          <Link
            to="/reports/new"
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-accent-500 hover:shadow-lg hover:shadow-primary-500/20 text-white font-medium text-sm flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <FiPlus className="w-4 h-4" /> New Report
          </Link>
        </div>

        {/* Stats Row */}
        <motion.div
          variants={cardContainerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <motion.div variants={cardItemVariants}>
            <GlassCard className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-400">
                <FiList className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-white/50">My Reports</p>
                <h3 className="text-2xl font-bold mt-0.5">{stats.total}</h3>
              </div>
            </GlassCard>
          </motion.div>

          <motion.div variants={cardItemVariants}>
            <GlassCard className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <FiClock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-white/50">Pending Review</p>
                <h3 className="text-2xl font-bold mt-0.5">{stats.pending}</h3>
              </div>
            </GlassCard>
          </motion.div>

          <motion.div variants={cardItemVariants}>
            <GlassCard className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <FiActivity className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-white/50">In Progress</p>
                <h3 className="text-2xl font-bold mt-0.5">{stats.inProgress}</h3>
              </div>
            </GlassCard>
          </motion.div>

          <motion.div variants={cardItemVariants}>
            <GlassCard className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <FiCheckCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-white/50">Resolved</p>
                <h3 className="text-2xl font-bold mt-0.5">{stats.resolved}</h3>
              </div>
            </GlassCard>
          </motion.div>
        </motion.div>

        {/* Quick Actions & Recent Updates */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold">Quick Actions</h2>
            <div className="grid grid-cols-1 gap-4">
              <Link to="/detect">
                <GlassCard hover className="flex items-center gap-4 cursor-pointer">
                  <div className="w-10 h-10 rounded-lg bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-400">
                    <FiCpu className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">AI Damage Detection</h4>
                    <p className="text-xs text-white/50 mt-0.5">Upload a photo to detect potholes with AI</p>
                  </div>
                </GlassCard>
              </Link>

              <Link to="/map">
                <GlassCard hover className="flex items-center gap-4 cursor-pointer">
                  <div className="w-10 h-10 rounded-lg bg-accent-500/10 border border-accent-500/20 flex items-center justify-center text-accent-400">
                    <FiMap className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">Interactive Map</h4>
                    <p className="text-xs text-white/50 mt-0.5">Explore nearby reports and safety warnings</p>
                  </div>
                </GlassCard>
              </Link>
            </div>
          </div>

          {/* Recent Reports */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Recent Reports</h2>
              <Link to="/reports" className="text-sm text-accent-400 hover:underline">
                View all
              </Link>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-20 w-full animate-pulse rounded-xl bg-white/5 border border-white/10" />
                ))}
              </div>
            ) : recentReports.length === 0 ? (
              <GlassCard className="text-center py-12">
                <FiAlertCircle className="w-10 h-10 text-white/20 mx-auto mb-3" />
                <p className="text-white/60">You haven't submitted any reports yet.</p>
                <Link to="/reports/new" className="text-accent-400 text-sm hover:underline mt-2 inline-block">
                  Submit your first report now
                </Link>
              </GlassCard>
            ) : (
              <div className="space-y-4">
                {recentReports.map((report) => (
                  <Link key={report._id} to={`/reports/${report._id}`} className="block">
                    <GlassCard hover className="flex items-center justify-between p-4 gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        {report.images?.[0] ? (
                          <img
                            src={report.images[0]}
                            alt={report.title}
                            className="w-12 h-12 rounded-lg object-cover bg-white/5 shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/30 shrink-0">
                            No Pic
                          </div>
                        )}
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm truncate text-white">{report.title}</h4>
                          <p className="text-xs text-white/40 mt-1 truncate">{report.address || 'Address not listed'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <span className="text-xs text-white/40 hidden sm:block">
                          {formatRelativeTime(report.createdAt)}
                        </span>
                        <StatusBadge status={report.status} />
                      </div>
                    </GlassCard>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
