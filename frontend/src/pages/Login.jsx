import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiShield, FiAlertCircle } from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import GlassCard from '../components/ui/GlassCard';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-200 text-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-[10%] left-[10%] w-[350px] h-[350px] rounded-full bg-primary-500/10 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] rounded-full bg-accent-500/10 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/15">
              <FiShield className="w-5.5 h-5.5 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white group-hover:text-accent-400 transition-colors">RoadGuard AI</span>
          </Link>
          <h2 className="text-xl font-medium text-white/60 mt-4">Welcome back! Sign in to continue</h2>
        </div>

        <GlassCard>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
                <FiAlertCircle className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Input
              label="Email Address"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<FiMail className="text-white/40" />}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<FiLock className="text-white/40" />}
              required
            />

            <div className="flex items-center justify-between text-xs text-white/50 pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" className="rounded bg-white/5 border-white/10 text-primary-500 focus:ring-0 focus:ring-offset-0" />
                <span>Remember me</span>
              </label>
              <a href="#" className="hover:text-white transition-colors">Forgot password?</a>
            </div>

            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
              fullWidth
              className="mt-2"
            >
              Sign In
            </Button>
          </form>
        </GlassCard>

        <p className="text-center text-sm text-white/40 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-accent-400 hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
