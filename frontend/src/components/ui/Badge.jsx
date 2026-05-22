const severityStyles = {
  low: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  medium: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  high: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
};

const statusStyles = {
  pending: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  approved: 'bg-primary-500/15 text-primary-400 border-primary-500/30',
  in_progress: 'bg-accent-500/15 text-accent-400 border-accent-500/30',
  resolved: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  rejected: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
};

const Badge = ({ type = 'severity', value, className = '' }) => {
  const styles = type === 'severity' ? severityStyles : statusStyles;
  const label =
    type === 'status' && value === 'in_progress'
      ? 'In Progress'
      : value
      ? value.charAt(0).toUpperCase() + value.slice(1)
      : 'Unknown';

  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
        ${styles[value] || 'bg-gray-500/15 text-gray-400 border-gray-500/30'}
        ${className}
      `}
    >
      {label}
    </span>
  );
};

export default Badge;
