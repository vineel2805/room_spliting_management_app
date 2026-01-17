import React from 'react';

const PrimaryButton = ({ 
  children, 
  onClick, 
  disabled = false, 
  variant = 'gradient',
  fullWidth = false 
}) => {
  const baseClasses = 'px-6 py-3 rounded-xl font-semibold text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed';
  const variantClasses = variant === 'gradient' 
    ? 'bg-gradient-primary text-white hover:shadow-lg active:scale-95' 
    : 'bg-white text-gray-900 border-2 border-gray-200 hover:bg-gray-50';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses} ${fullWidth ? 'w-full' : ''}`}
    >
      {children}
    </button>
  );
};

export default PrimaryButton;
