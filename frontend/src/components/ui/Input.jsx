const Input = ({
  label,
  error,
  icon,
  type = 'text',
  className = '',
  ...props
}) => {
  const isTextarea = type === 'textarea';
  const Component = isTextarea ? 'textarea' : 'input';

  const renderIcon = () => {
    if (!icon) return null;
    // If it's a React element (JSX literal), render it directly
    if (typeof icon === 'object' && icon !== null && icon.$$typeof) {
      return icon;
    }
    // Otherwise, treat it as a component class or function
    const IconComponent = icon;
    return <IconComponent className="w-4 h-4" />;
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-white/70">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">
            {renderIcon()}
          </div>
        )}
        <Component
          type={isTextarea ? undefined : type}
          className={`
            w-full bg-white/5 border border-white/10 rounded-xl
            ${icon ? 'pl-10' : 'pl-4'} pr-4 py-3
            text-white placeholder-white/30
            focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50
            transition-all duration-300
            backdrop-blur-sm
            ${isTextarea ? 'min-h-[120px] resize-y' : ''}
            ${error ? 'border-rose-500/50 focus:ring-rose-500/50' : ''}
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="text-xs text-rose-400 mt-1">{error}</p>
      )}
    </div>
  );
};

export default Input;
