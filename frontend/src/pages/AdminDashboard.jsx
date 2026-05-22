import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiList, FiClock, FiActivity, FiCheckCircle, FiTrash2, FiFileText } from 'react-icons/fi';
import axios from '../api/axios';
import DashboardLayout from '../components/layout/DashboardLayout';
import GlassCard from '../components/ui/GlassCard';
import SeverityChart from '../components/charts/SeverityChart';
import ReportsOverTime from '../components/charts/ReportsOverTime';
import TopLocations from '../components/charts/TopLocations';
import useSocket from '../hooks/useSocket';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const socket = useSocket();

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get('/admin/analytics');
      setAnalytics(response.data.data);
    } catch (err) {
      console.error('Error fetching admin analytics:', err);
      toast.error('Failed to load analytics dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Listen to live updates from socket
  useEffect(() => {
    if (!socket) return;

    const handleReportChange = () => {
      // Re-fetch analytics silently to update the numbers in real-time
      fetchAnalytics();
    };

    socket.on('report-status-updated', handleReportChange);
    socket.on('new-report-submitted', handleReportChange);

    return () => {
      socket.off('report-status-updated', handleReportChange);
      socket.off('new-report-submitted', handleReportChange);
    };
  }, [socket]);

  if (loading || !analytics) {
    return (
      <DashboardLayout>
        <div className="h-[400px] w-full animate-pulse rounded-2xl bg-white/5 border border-white/10" />
      </DashboardLayout>
    );
  }

  const { counts, severityDistribution, reportsOverTime, topLocations } = analytics;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Title */}
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Admin Control Center</h1>
          <p className="text-white/60 mt-1">Smart city analytics dashboard for road damage complaints & repairs.</p>
        </div>

        {/* Counts row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <GlassCard className="p-4 flex flex-col justify-between h-28">
            <span className="text-[10px] text-white/50 font-semibold uppercase">Total Complaints</span>
            <div className="flex justify-between items-baseline mt-2">
              <span className="text-3xl font-extrabold text-white">{counts.total || 0}</span>
              <FiList className="text-primary-400 w-5 h-5" />
            </div>
          </GlassCard>

          <GlassCard className="p-4 flex flex-col justify-between h-28">
            <span className="text-[10px] text-white/50 font-semibold uppercase">Pending Verification</span>
            <div className="flex justify-between items-baseline mt-2">
              <span className="text-3xl font-extrabold text-amber-400">{counts.pending || 0}</span>
              <FiClock className="text-amber-400 w-5 h-5" />
            </div>
          </GlassCard>

          <GlassCard className="p-4 flex flex-col justify-between h-28">
            <span className="text-[10px] text-white/50 font-semibold uppercase">Work Dispatched</span>
            <div className="flex justify-between items-baseline mt-2">
              <span className="text-3xl font-extrabold text-cyan-400">{counts.in_progress || 0}</span>
              <FiActivity className="text-cyan-400 w-5 h-5" />
            </div>
          </GlassCard>

          <GlassCard className="p-4 flex flex-col justify-between h-28">
            <span className="text-[10px] text-white/50 font-semibold uppercase">Restored Roads</span>
            <div className="flex justify-between items-baseline mt-2">
              <span className="text-3xl font-extrabold text-emerald-400">{counts.resolved || 0}</span>
              <FiCheckCircle className="text-emerald-400 w-5 h-5" />
            </div>
          </GlassCard>

          <GlassCard className="p-4 flex flex-col justify-between h-28 col-span-2 md:col-span-1">
            <span className="text-[10px] text-white/50 font-semibold uppercase">Rejected Alerts</span>
            <div className="flex justify-between items-baseline mt-2">
              <span className="text-3xl font-extrabold text-rose-500">{counts.rejected || 0}</span>
              <FiTrash2 className="text-rose-500 w-5 h-5" />
            </div>
          </GlassCard>
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <ReportsOverTime data={reportsOverTime} />
          </div>
          <div>
            <SeverityChart data={severityDistribution} />
          </div>
        </div>

        {/* Bottom stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <TopLocations data={topLocations} />
          
          <GlassCard className="space-y-4">
            <h3 className="text-sm font-semibold text-white/80">Municipal System Health</h3>
            <div className="space-y-4 pt-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-white/60">AI Model Response Speed</span>
                <span className="font-bold text-accent-400">185 ms</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                <div className="bg-accent-500 h-full w-[95%]" />
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-white/60">Database Latency</span>
                <span className="font-bold text-emerald-400">12 ms</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                <div className="bg-emerald-500 h-full w-[99%]" />
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-white/60">Citizen Response/Resolution Efficiency</span>
                <span className="font-bold text-amber-400">89.4%</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                <div className="bg-amber-500 h-full w-[89.4%]" />
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </DashboardLayout>
  );
}
