import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiShield, FiAlertTriangle, FiMapPin, FiBarChart2, FiArrowRight } from 'react-icons/fi';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import GlassCard from '../components/ui/GlassCard';

export default function Landing() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } },
  };

  return (
    <div className="min-h-screen bg-dark-200 text-white flex flex-col relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-accent-500/10 blur-[150px] pointer-events-none" />

      <Navbar />

      {/* Hero Section */}
      <main className="flex-grow pt-24 pb-16 px-4 max-w-7xl mx-auto sm:px-6 lg:px-8 flex flex-col justify-center relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 text-accent-400 text-xs font-semibold uppercase tracking-wider mb-6">
            <FiShield className="w-3.5 h-3.5" /> Smart City Infrastructure Protection
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6 leading-tight"
          >
            AI-Powered <span className="bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">Road Damage</span> Detection & Reporting
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-lg sm:text-xl text-white/60 mb-8 max-w-2xl mx-auto leading-relaxed"
          >
            Empower citizens and city planners with automatic pothole and crack detection using state-of-the-art computer vision models. Build safer, smoother roads together.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-primary-500 to-accent-500 text-white font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-primary-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Get Started <FiArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-semibold flex items-center justify-center transition-all"
            >
              Sign In
            </Link>
          </motion.div>
        </motion.div>

        {/* Features grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20"
        >
          <motion.div variants={itemVariants}>
            <GlassCard hover className="h-full flex flex-col">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-6 text-rose-400">
                <FiAlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Instant AI Analysis</h3>
              <p className="text-white/60 leading-relaxed">
                Upload images or videos of road anomalies and let our real-time YOLOv8 machine learning algorithm detect, annotate, and grade severity levels automatically.
              </p>
            </GlassCard>
          </motion.div>

          <motion.div variants={itemVariants}>
            <GlassCard hover className="h-full flex flex-col">
              <div className="w-12 h-12 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center mb-6 text-primary-400">
                <FiMapPin className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Live Interactive Map</h3>
              <p className="text-white/60 leading-relaxed">
                Track and explore reports in your vicinity with precise geo-tagging, satellite address lookup, and an aggregated heatmap of critical damage density.
              </p>
            </GlassCard>
          </motion.div>

          <motion.div variants={itemVariants}>
            <GlassCard hover className="h-full flex flex-col">
              <div className="w-12 h-12 rounded-xl bg-accent-500/10 border border-accent-500/20 flex items-center justify-center mb-6 text-accent-400">
                <FiBarChart2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Admin Analytics</h3>
              <p className="text-white/60 leading-relaxed">
                Comprehensive data dashboard for municipal bodies, presenting repair charts, damage type counts, regional stats, and workflow tracking.
              </p>
            </GlassCard>
          </motion.div>
        </motion.div>

        {/* Stats segment */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="border-t border-white/10 pt-16 pb-8"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl sm:text-5xl font-black text-white leading-tight">15k+</div>
              <div className="text-sm text-white/50 mt-1">Detections Evaluated</div>
            </div>
            <div>
              <div className="text-3xl sm:text-5xl font-black text-accent-400 leading-tight">94.2%</div>
              <div className="text-sm text-white/50 mt-1">Detection Precision</div>
            </div>
            <div>
              <div className="text-3xl sm:text-5xl font-black text-primary-400 leading-tight">850+</div>
              <div className="text-sm text-white/50 mt-1">Resolved Reports</div>
            </div>
            <div>
              <div className="text-3xl sm:text-5xl font-black text-rose-400 leading-tight">2.5 hrs</div>
              <div className="text-sm text-white/50 mt-1">Avg Response Speed</div>
            </div>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
