import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiAlertTriangle, FiHome } from 'react-icons/fi';
import GlassCard from '../components/ui/GlassCard';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-dark-200 text-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-[20%] left-[20%] w-[300px] h-[300px] rounded-full bg-rose-500/10 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[20%] w-[300px] h-[300px] rounded-full bg-primary-500/10 blur-[80px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md text-center relative z-10 space-y-6"
      >
        <div className="inline-flex w-20 h-20 rounded-full bg-rose-500/10 border border-rose-500/20 items-center justify-center text-rose-400">
          <FiAlertTriangle className="w-10 h-10 animate-bounce" />
        </div>

        <div className="space-y-2">
          <h1 className="text-6xl font-black tracking-tight text-white">404</h1>
          <h2 className="text-xl font-bold text-white/80">Road Blocked! Page Not Found</h2>
          <p className="text-sm text-white/50 max-w-xs mx-auto leading-relaxed">
            The road you are looking for has been closed, re-routed, or was never built.
          </p>
        </div>

        <div className="pt-2">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-accent-500 text-white font-semibold hover:shadow-lg hover:shadow-primary-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <FiHome className="w-5 h-5" /> Go Back Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
