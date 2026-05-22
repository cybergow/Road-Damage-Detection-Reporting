import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiHome, FiCamera, FiFilePlus, FiFileText, FiMap,
  FiBarChart2, FiClipboard, FiChevronLeft, FiChevronRight,
} from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';

const userItems = [
  { to: '/dashboard', icon: FiHome, label: 'Dashboard' },
  { to: '/detect', icon: FiCamera, label: 'Detect Damage' },
  { to: '/reports/new', icon: FiFilePlus, label: 'New Report' },
  { to: '/reports', icon: FiFileText, label: 'My Reports' },
  { to: '/map', icon: FiMap, label: 'Map' },
];

const adminItems = [
  { to: '/admin', icon: FiBarChart2, label: 'Analytics' },
  { to: '/admin/reports', icon: FiClipboard, label: 'Manage Reports' },
  { to: '/map', icon: FiMap, label: 'Map' },
];

const Sidebar = ({ collapsed, onToggle }) => {
  const location = useLocation();
  const { isAdmin } = useAuth();
  const items = isAdmin ? adminItems : userItems;

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 256 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="hidden lg:flex flex-col fixed left-0 top-16 bottom-0 z-30 glass-card border-t-0 border-l-0 border-b-0 rounded-none"
    >
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? 'bg-gradient-to-r from-primary-500/20 to-accent-500/10 text-white border border-primary-500/20'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-primary-400' : 'group-hover:text-white'}`} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </div>

      <button
        onClick={onToggle}
        className="p-3 border-t border-white/10 text-white/40 hover:text-white hover:bg-white/5 transition-all flex items-center justify-center"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <FiChevronRight className="w-5 h-5" /> : <FiChevronLeft className="w-5 h-5" />}
      </button>
    </motion.aside>
  );
};

export default Sidebar;
