import { motion } from 'framer-motion';

const GlassCard = ({ children, className = '', hover = false, onClick, ...props }) => {
  const Component = hover ? motion.div : 'div';
  const hoverProps = hover
    ? {
        whileHover: { scale: 1.02, y: -4 },
        transition: { type: 'spring', stiffness: 300, damping: 20 },
      }
    : {};

  return (
    <Component
      className={`glass-card p-6 ${hover ? 'cursor-pointer glass-card-hover' : ''} ${className}`}
      onClick={onClick}
      {...hoverProps}
      {...props}
    >
      {children}
    </Component>
  );
};

export default GlassCard;
