import React from 'react';

const AmountBadge = ({ amount, type = 'neutral', size = 'md' }) => {
  const getTypeStyles = () => {
    switch (type) {
      case 'owe':
        return 'text-money-red bg-red-50';
      case 'owed':
        return 'text-money-green bg-green-50';
      default:
        return 'text-money-neutral bg-gray-50';
    }
  };

  const sizeClasses = {
    sm: 'text-sm px-2 py-1',
    md: 'text-base px-3 py-1.5',
    lg: 'text-lg px-4 py-2',
  };

  return (
    <span className={`font-semibold rounded-full ${getTypeStyles()} ${sizeClasses[size]}`}>
      {type === 'owe' && '-'}
      ₹{amount.toLocaleString('en-IN')}
    </span>
  );
};

export default AmountBadge;
