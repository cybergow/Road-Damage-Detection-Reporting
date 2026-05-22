import { FiShield, FiGithub } from 'react-icons/fi';

const Footer = () => {
  return (
    <footer className="glass-card border-x-0 border-b-0 rounded-none mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
              <FiShield className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold gradient-text">RoadGuard AI</span>
          </div>

          <div className="flex items-center gap-6 text-sm text-white/40">
            <a href="#" className="hover:text-white/70 transition-colors">About</a>
            <a href="#" className="hover:text-white/70 transition-colors">Privacy</a>
            <a href="#" className="hover:text-white/70 transition-colors">Terms</a>
            <a href="#" className="hover:text-white/70 transition-colors">Contact</a>
          </div>

          <div className="flex items-center gap-4">
            <a href="#" className="text-white/30 hover:text-white/60 transition-colors" aria-label="GitHub">
              <FiGithub className="w-5 h-5" />
            </a>
            <span className="text-xs text-white/30">
              © {new Date().getFullYear()} RoadGuard AI
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
