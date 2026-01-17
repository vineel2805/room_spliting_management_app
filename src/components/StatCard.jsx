import React from 'react';

const StatCard = ({ title, amount, type = 'neutral', subtitle }) => {
  const getTypeStyles = () => {
    switch (type) {
      case 'owe':
        return 'text-money-red';
      case 'owed':
        return 'text-money-green';
      default:
        return 'text-money-neutral';
    }
  };

  return (
    <div className="bg-white rounded-card p-4 shadow-card flex-1">
      <p className="text-sm text-money-neutral mb-2">{title}</p>
      <p className={`text-2xl font-bold ${getTypeStyles()} mb-1`}>
        ₹{amount.toLocaleString('en-IN')}
      </p>
      {subtitle && (
        <p className="text-xs text-money-neutral">{subtitle}</p>
      )}
    </div>
  );
};

export default StatCard;
