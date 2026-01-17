import React from 'react';
import { getMemberExpenseBreakdown, getMemberObligations, generateObligations } from '../services/calculationService';

const MemberDetailModal = ({ 
  isOpen, 
  onClose, 
  member, 
  memberTotals,
  expenses,
  members,
  beneficiariesMap,
  paymentsMap,
  selectedMonth
}) => {
  if (!isOpen || !member) return null;

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Get expense breakdown for this member
  const expenseBreakdown = getMemberExpenseBreakdown(
    member.memberId,
    expenses,
    beneficiariesMap,
    paymentsMap,
    selectedMonth.year,
    selectedMonth.month
  );

  // Get obligations
  const obligations = generateObligations(
    expenses,
    members,
    beneficiariesMap,
    paymentsMap,
    selectedMonth.year,
    selectedMonth.month
  );
  const memberObligations = getMemberObligations(member.memberId, obligations);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short' 
    });
  };

  // Get emoji for expense type
  const getExpenseIcon = (name) => {
    const lower = name.toLowerCase();
    if (lower.includes('grocery') || lower.includes('vegetables') || lower.includes('fruits')) return '🛒';
    if (lower.includes('electricity') || lower.includes('power') || lower.includes('bill')) return '⚡';
    if (lower.includes('rent')) return '🏠';
    if (lower.includes('water')) return '💧';
    if (lower.includes('gas') || lower.includes('cylinder')) return '🔥';
    if (lower.includes('wifi') || lower.includes('internet') || lower.includes('broadband')) return '📶';
    if (lower.includes('food') || lower.includes('dinner') || lower.includes('lunch') || lower.includes('breakfast')) return '🍽️';
    if (lower.includes('milk') || lower.includes('dairy')) return '🥛';
    if (lower.includes('medicine') || lower.includes('medical')) return '💊';
    if (lower.includes('petrol') || lower.includes('fuel')) return '⛽';
    if (lower.includes('repair') || lower.includes('maintenance')) return '🔧';
    return '📝';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-gray-50 w-full max-w-lg rounded-t-3xl max-h-[90vh] overflow-hidden animate-slide-up">
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2 bg-white">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-5 pb-4 bg-white border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
              {member.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">{member.name}</h2>
              <p className="text-sm text-gray-500">
                {months[selectedMonth.month]} {selectedMonth.year}
              </p>
            </div>
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)] pb-8">
          {/* Summary Stats */}
          <div className="px-5 py-4 bg-white mb-2">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-orange-50 rounded-2xl p-4 text-center">
                <p className="text-xs text-orange-600 font-medium mb-1">Should Pay</p>
                <p className="text-lg font-bold text-orange-700">
                  ₹{member.totalExpense.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="bg-blue-50 rounded-2xl p-4 text-center">
                <p className="text-xs text-blue-600 font-medium mb-1">Actually Paid</p>
                <p className="text-lg font-bold text-blue-700">
                  ₹{member.totalSpends.toLocaleString('en-IN')}
                </p>
              </div>
              <div className={`rounded-2xl p-4 text-center ${
                member.balance > 0.01 
                  ? 'bg-green-50' 
                  : member.balance < -0.01 
                    ? 'bg-red-50' 
                    : 'bg-gray-100'
              }`}>
                <p className={`text-xs font-medium mb-1 ${
                  member.balance > 0.01 
                    ? 'text-green-600' 
                    : member.balance < -0.01 
                      ? 'text-red-600' 
                      : 'text-gray-500'
                }`}>Balance</p>
                <p className={`text-lg font-bold ${
                  member.balance > 0.01 
                    ? 'text-green-700' 
                    : member.balance < -0.01 
                      ? 'text-red-700' 
                      : 'text-gray-600'
                }`}>
                  {member.balance > 0.01 
                    ? `+₹${member.balance.toLocaleString('en-IN')}` 
                    : member.balance < -0.01 
                      ? `-₹${Math.abs(member.balance).toLocaleString('en-IN')}` 
                      : '₹0'}
                </p>
              </div>
            </div>
          </div>

          {/* Expense Breakdown - Primary */}
          <div className="px-5 py-4 bg-white mb-2">
            <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span>📋</span> Expense Breakdown 
              <span className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                {expenseBreakdown.length}
              </span>
            </h3>
            
            {expenseBreakdown.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                <div className="text-5xl mb-3">📭</div>
                <p className="font-medium">No expenses this month</p>
                <p className="text-sm text-gray-400 mt-1">Add some expenses to see the breakdown</p>
              </div>
            ) : (
              <div className="space-y-3">
                {expenseBreakdown.map((item, idx) => (
                  <div 
                    key={idx}
                    className="bg-gray-50 rounded-2xl p-4 border border-gray-100"
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-2xl flex-shrink-0">
                        {getExpenseIcon(item.expenseName)}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <p className="font-semibold text-gray-900 truncate">{item.expenseName}</p>
                            <p className="text-xs text-gray-500">
                              {formatDate(item.expenseDate)} • Total ₹{item.totalAmount.toLocaleString('en-IN')}
                            </p>
                          </div>
                          <span className={`text-sm font-bold px-3 py-1 rounded-full whitespace-nowrap ${
                            item.net > 0.01 
                              ? 'bg-green-100 text-green-700' 
                              : item.net < -0.01 
                                ? 'bg-red-100 text-red-700' 
                                : 'bg-gray-200 text-gray-600'
                          }`}>
                            {item.net > 0.01 
                              ? `+₹${item.net.toLocaleString('en-IN')}` 
                              : item.net < -0.01 
                                ? `-₹${Math.abs(item.net).toLocaleString('en-IN')}` 
                                : '₹0'}
                          </span>
                        </div>
                        
                        {/* Share & Paid */}
                        <div className="flex gap-4">
                          <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-1.5">
                            <span className="text-xs text-gray-500">Share:</span>
                            <span className="text-sm font-semibold text-orange-600">
                              ₹{item.memberShare.toLocaleString('en-IN')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-1.5">
                            <span className="text-xs text-gray-500">Paid:</span>
                            <span className="text-sm font-semibold text-blue-600">
                              ₹{item.memberPaid.toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Settlement Status - Secondary */}
          {(memberObligations.owes.length > 0 || memberObligations.owed.length > 0) && (
            <div className="px-5 py-4 bg-white">
              <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span>💸</span> Settlement Status
              </h3>
              <div className="space-y-2">
                {memberObligations.owed.map((item, idx) => (
                  <div 
                    key={`owed-${idx}`}
                    className="flex items-center justify-between px-4 py-3 bg-green-50 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-sm">
                        {item.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{item.name}</p>
                        <p className="text-xs text-green-600">owes you</p>
                      </div>
                    </div>
                    <span className="text-base font-bold text-green-600">
                      +₹{item.totalAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
                {memberObligations.owes.map((item, idx) => (
                  <div 
                    key={`owes-${idx}`}
                    className="flex items-center justify-between px-4 py-3 bg-red-50 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-sm">
                        {item.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{item.name}</p>
                        <p className="text-xs text-red-600">you owe</p>
                      </div>
                    </div>
                    <span className="text-base font-bold text-red-600">
                      -₹{item.totalAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default MemberDetailModal;
