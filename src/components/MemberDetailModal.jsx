import React from 'react';
import { getMemberExpenseBreakdown, getMemberObligations, generateObligations } from '../services/calculationService';

const MemberDetailModal = ({ 
  isOpen, 
  onClose, 
  member, 
  expenses,
  members,
  beneficiariesMap,
  paymentsMap,
  selectedMonth
}) => {
  if (!isOpen || !member) return null;

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const expenseBreakdown = getMemberExpenseBreakdown(
    member.memberId, expenses, beneficiariesMap, paymentsMap, selectedMonth.year, selectedMonth.month
  );

  const obligations = generateObligations(expenses, members, beneficiariesMap, paymentsMap, selectedMonth.year, selectedMonth.month);
  const memberObligations = getMemberObligations(member.memberId, obligations);

  const formatDate = (date) => new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-surface w-full max-w-lg rounded-t-3xl max-h-[85vh] overflow-hidden animate-slide-up">
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-divider rounded-full" />
        </div>

        <div className="px-5 pb-4 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary-light flex items-center justify-center text-primary font-bold text-xl">
            {member.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-text-primary">{member.name}</h2>
            <p className="text-xs text-text-muted">{months[selectedMonth.month]} {selectedMonth.year}</p>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-text-muted hover:bg-divider transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Balance Statement */}
        <div className={`mx-5 mb-4 p-4 rounded-card ${
          member.balance > 0.01 ? 'bg-success-light' : member.balance < -0.01 ? 'bg-error-light' : 'bg-background'
        }`}>
          <p className={`text-sm font-medium ${
            member.balance > 0.01 ? 'text-success' : member.balance < -0.01 ? 'text-error' : 'text-text-secondary'
          }`}>
            {member.balance > 0.01 
              ? `Will receive ₹${member.balance.toLocaleString('en-IN')}` 
              : member.balance < -0.01 
                ? `Needs to pay ₹${Math.abs(member.balance).toLocaleString('en-IN')}` 
                : 'All settled up!'}
          </p>
          <p className="text-xs text-text-muted mt-1">
            Paid ₹{member.totalSpends.toLocaleString('en-IN')} · Share ₹{member.totalExpense.toLocaleString('en-IN')}
          </p>
        </div>

        <div className="overflow-y-auto max-h-[calc(85vh-200px)] pb-8">
          {/* Expenses */}
          <div className="px-5">
            <h3 className="text-base font-medium text-text-primary mb-3">Expenses ({expenseBreakdown.length})</h3>
            
            {expenseBreakdown.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <p className="text-sm text-text-secondary">No expenses this month</p>
              </div>
            ) : (
              <div className="space-y-2">
                {expenseBreakdown.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-background rounded-card">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">{item.expenseName}</p>
                      <p className="text-xs text-text-muted">
                        {formatDate(item.expenseDate)} · ₹{item.totalAmount.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${
                        item.net > 0.01 ? 'text-success' : item.net < -0.01 ? 'text-error' : 'text-text-muted'
                      }`}>
                        {item.net > 0.01 ? `+₹${item.net.toLocaleString('en-IN')}` : item.net < -0.01 ? `-₹${Math.abs(item.net).toLocaleString('en-IN')}` : '₹0'}
                      </p>
                      <p className="text-xs text-text-muted">Share: ₹{item.memberShare.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Settlements */}
          {(memberObligations.owes.length > 0 || memberObligations.owed.length > 0) && (
            <div className="px-5 mt-6">
              <h3 className="text-base font-medium text-text-primary mb-3">Settlements</h3>
              <div className="space-y-2">
                {memberObligations.owed.map((item, idx) => (
                  <div key={`owed-${idx}`} className="flex items-center gap-3 p-3 bg-success-light rounded-card">
                    <div className="w-9 h-9 rounded-full bg-success/10 flex items-center justify-center text-success font-semibold text-sm">
                      {item.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-text-primary">{item.name}</p>
                      <p className="text-xs text-success">owes you</p>
                    </div>
                    <p className="text-sm font-semibold text-success">+₹{item.totalAmount.toLocaleString('en-IN')}</p>
                  </div>
                ))}
                {memberObligations.owes.map((item, idx) => (
                  <div key={`owes-${idx}`} className="flex items-center gap-3 p-3 bg-error-light rounded-card">
                    <div className="w-9 h-9 rounded-full bg-error/10 flex items-center justify-center text-error font-semibold text-sm">
                      {item.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-text-primary">{item.name}</p>
                      <p className="text-xs text-error">you owe</p>
                    </div>
                    <p className="text-sm font-semibold text-error">-₹{item.totalAmount.toLocaleString('en-IN')}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemberDetailModal;
