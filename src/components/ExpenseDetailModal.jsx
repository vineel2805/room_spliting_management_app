import React from 'react';

const ExpenseDetailModal = ({ 
  isOpen, 
  onClose, 
  expense, 
  members,
  beneficiariesMap,
  paymentsMap 
}) => {
  if (!isOpen || !expense) return null;

  const expAmount = expense.totalAmount || expense.amount || 0;
  const expDate = expense.date?.toDate ? expense.date.toDate() : new Date(expense.date);
  
  const beneficiaries = beneficiariesMap[expense.id] || [];
  const payments = paymentsMap[expense.id] || [];

  const getMemberName = (memberId) => {
    const member = members.find(m => m.id === memberId);
    return member ? member.name : 'Unknown';
  };

  // Calculate each person's net for this expense
  const calculateNetPerPerson = () => {
    const netMap = {};
    
    // Initialize all participants
    const allParticipantIds = new Set([
      ...beneficiaries.map(b => b.memberId),
      ...payments.map(p => p.memberId)
    ]);
    
    allParticipantIds.forEach(id => {
      netMap[id] = {
        memberId: id,
        name: getMemberName(id),
        paid: 0,
        share: 0,
        net: 0
      };
    });

    // Add payments (what each person paid)
    payments.forEach(p => {
      if (netMap[p.memberId]) {
        netMap[p.memberId].paid += p.paidAmount || 0;
      }
    });

    // Add shares (what each person owes)
    const hasCustomShares = beneficiaries.some(b => b.shareAmount !== undefined && b.shareAmount !== null);
    
    beneficiaries.forEach(b => {
      if (netMap[b.memberId]) {
        if (hasCustomShares) {
          netMap[b.memberId].share += b.shareAmount || 0;
        } else {
          netMap[b.memberId].share += expAmount / beneficiaries.length;
        }
      }
    });

    // Calculate net (paid - share)
    Object.values(netMap).forEach(person => {
      person.net = person.paid - person.share;
    });

    return Object.values(netMap).sort((a, b) => b.net - a.net);
  };

  const netPerPerson = calculateNetPerPerson();
  const totalPaid = payments.reduce((sum, p) => sum + (p.paidAmount || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-surface w-full max-w-lg rounded-t-3xl max-h-[85vh] overflow-hidden animate-slide-up">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-divider rounded-full" />
        </div>

        {/* Header */}
        <div className="px-5 pb-4 border-b border-divider">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-text-primary">
                {expense.itemName || expense.name || 'Expense'}
              </h2>
              <p className="text-xs text-text-muted mt-1">
                {expDate.toLocaleDateString('en-IN', { 
                  weekday: 'long',
                  day: 'numeric', 
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
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
          
          {/* Total Amount */}
          <div className="mt-4 p-4 bg-primary-light rounded-card">
            <p className="text-xs text-text-muted mb-1">Total Amount</p>
            <p className="text-3xl font-bold text-primary">₹{expAmount.toLocaleString('en-IN')}</p>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(85vh-220px)] pb-8">
          {/* Who Paid */}
          <div className="px-5 pt-4">
            <h3 className="text-sm font-medium text-text-primary mb-3 flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                <line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
              Paid By
            </h3>
            <div className="space-y-2">
              {payments.length === 0 ? (
                <p className="text-sm text-text-muted">No payment info</p>
              ) : (
                payments.map((payment, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-background rounded-card">
                    <div className="w-9 h-9 rounded-full bg-success-light flex items-center justify-center text-success font-semibold text-sm">
                      {getMemberName(payment.memberId).charAt(0).toUpperCase()}
                    </div>
                    <span className="flex-1 text-sm font-medium text-text-primary">
                      {getMemberName(payment.memberId)}
                    </span>
                    <span className="text-sm font-semibold text-success">
                      ₹{(payment.paidAmount || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Split Between */}
          <div className="px-5 pt-6">
            <h3 className="text-sm font-medium text-text-primary mb-3 flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              Split Between ({beneficiaries.length})
            </h3>
            <div className="space-y-2">
              {beneficiaries.length === 0 ? (
                <p className="text-sm text-text-muted">No split info</p>
              ) : (
                beneficiaries.map((ben, idx) => {
                  const hasCustomShare = ben.shareAmount !== undefined && ben.shareAmount !== null;
                  const share = hasCustomShare ? ben.shareAmount : (expAmount / beneficiaries.length);
                  return (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-background rounded-card">
                      <div className="w-9 h-9 rounded-full bg-primary-light flex items-center justify-center text-primary font-semibold text-sm">
                        {getMemberName(ben.memberId).charAt(0).toUpperCase()}
                      </div>
                      <span className="flex-1 text-sm font-medium text-text-primary">
                        {getMemberName(ben.memberId)}
                      </span>
                      <span className="text-sm font-medium text-text-secondary">
                        ₹{share.toLocaleString('en-IN')}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Net Impact */}
          <div className="px-5 pt-6">
            <h3 className="text-sm font-medium text-text-primary mb-3 flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
              Net Impact
            </h3>
            <div className="space-y-2">
              {netPerPerson.map((person, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-background rounded-card">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm ${
                    person.net > 0.01 ? 'bg-success-light text-success' : 
                    person.net < -0.01 ? 'bg-error-light text-error' : 
                    'bg-background text-text-muted'
                  }`}>
                    {person.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text-primary">{person.name}</p>
                    <p className="text-xs text-text-muted">
                      Paid ₹{person.paid.toLocaleString('en-IN')} · Share ₹{person.share.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <span className={`text-sm font-semibold ${
                    person.net > 0.01 ? 'text-success' : 
                    person.net < -0.01 ? 'text-error' : 
                    'text-text-muted'
                  }`}>
                    {person.net > 0.01 ? '+' : ''}₹{person.net.toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseDetailModal;
