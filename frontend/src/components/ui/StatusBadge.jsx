import { FiClock, FiCheck, FiX, FiTool, FiThumbsUp } from 'react-icons/fi';

const statusConfig = {
  pending: {
    icon: FiClock,
    color: 'text-amber-400',
    bg: 'bg-amber-500/15',
    border: 'border-amber-500/30',
    label: 'Pending Review',
    dot: true,
  },
  approved: {
    icon: FiThumbsUp,
    color: 'text-primary-400',
    bg: 'bg-primary-500/15',
    border: 'border-primary-500/30',
    label: 'Approved',
  },
  in_progress: {
    icon: FiTool,
    color: 'text-accent-400',
    bg: 'bg-accent-500/15',
    border: 'border-accent-500/30',
    label: 'In Progress',
  },
  resolved: {
    icon: FiCheck,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-500/30',
    label: 'Resolved',
  },
  rejected: {
    icon: FiX,
    color: 'text-rose-400',
    bg: 'bg-rose-500/15',
    border: 'border-rose-500/30',
    label: 'Rejected',
  },
};

const StatusBadge = ({ status, className = '' }) => {
  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border
        ${config.bg} ${config.color} ${config.border}
        ${className}
      `}
    >
      {config.dot && (
        <span className="relative flex h-2 w-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.bg} opacity-75`} />
          <span className={`relative inline-flex rounded-full h-2 w-2 bg-amber-400`} />
        </span>
      )}
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
};

export default StatusBadge;
