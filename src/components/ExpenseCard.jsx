import React from 'react';

const ExpenseCard = ({ 
  groupName, 
  totalExpense, 
  status, 
  statusLabel,
  onClick 
}) => {
  const getStatusColor = () => {
    if (status === 'owe') return 'bg-red-50 text-money-red border-money-red/20';
    if (status === 'owed') return 'bg-green-50 text-money-green border-money-green/20';
    return 'bg-gray-50 text-money-neutral border-money-neutral/20';
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-card p-4 shadow-card cursor-pointer hover:shadow-lg transition-shadow"
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-base font-semibold text-gray-900">{groupName}</h3>
        <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${getStatusColor()}`}>
          {statusLabel}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-money-neutral">Total expense</span>
        <span className="text-lg font-bold text-gray-900">
          ₹{totalExpense.toLocaleString('en-IN')}
        </span>
      </div>
    </div>
  );
};

export default ExpenseCard;
