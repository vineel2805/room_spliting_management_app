import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRoom } from '../context/RoomContext';

const AddExpenseScreen = () => {
  const navigate = useNavigate();
  const { members, addExpense } = useRoom();
  
  const [step, setStep] = useState(1);
  const [itemName, setItemName] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Payers state - supports multiple payers with custom amounts
  const [paidBy, setPaidBy] = useState([]);
  const [paymentType, setPaymentType] = useState('single'); // 'single' or 'multiple'
  const [customPayments, setCustomPayments] = useState({});
  
  // Split state
  const [splitBetween, setSplitBetween] = useState([]);
  const [splitType, setSplitType] = useState('equal');
  const [customShares, setCustomShares] = useState({});
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const amountNum = parseFloat(amount) || 0;

  // Payer handlers
  const handlePayerToggle = (memberId) => {
    if (paymentType === 'single') {
      // Single payer mode - replace selection
      setPaidBy([memberId]);
      setCustomPayments({ [memberId]: amountNum });
    } else {
      // Multiple payer mode - toggle
      if (paidBy.includes(memberId)) {
        setPaidBy(paidBy.filter(id => id !== memberId));
        const newPayments = { ...customPayments };
        delete newPayments[memberId];
        setCustomPayments(newPayments);
      } else {
        setPaidBy([...paidBy, memberId]);
      }
    }
  };

  const handlePaymentChange = (memberId, value) => {
    setCustomPayments({ ...customPayments, [memberId]: parseFloat(value) || 0 });
  };

  const selectAllPayers = () => {
    setPaidBy(members.map(m => m.id));
  };

  // Split handlers
  const handleSplitToggle = (memberId) => {
    if (splitBetween.includes(memberId)) {
      setSplitBetween(splitBetween.filter(id => id !== memberId));
      const newShares = { ...customShares };
      delete newShares[memberId];
      setCustomShares(newShares);
    } else {
      setSplitBetween([...splitBetween, memberId]);
    }
  };

  const handleShareChange = (memberId, value) => {
    setCustomShares({ ...customShares, [memberId]: parseFloat(value) || 0 });
  };

  const selectAllForSplit = () => {
    setSplitBetween(members.map(m => m.id));
  };

  // Validation
  const canProceedStep1 = itemName.trim() && amount && amountNum > 0 && date;
  
  const totalCustomPayments = Object.values(customPayments).reduce((a, b) => a + b, 0);
  const paymentsValid = paymentType === 'single' || Math.abs(totalCustomPayments - amountNum) < 0.01;
  const canProceedStep2 = paidBy.length > 0 && paymentsValid;
  
  const totalCustomShares = Object.values(customShares).reduce((a, b) => a + b, 0);
  const customSharesValid = splitType === 'equal' || Math.abs(totalCustomShares - amountNum) < 0.01;
  const canSubmit = splitBetween.length > 0 && customSharesValid;

  const handleSubmit = async () => {
    if (submitting) return;
    setError('');
    setSubmitting(true);

    try {
      // Build payments array
      let payments;
      if (paymentType === 'single') {
        payments = paidBy.map(id => ({ memberId: id, amount: amountNum }));
      } else {
        payments = paidBy.map(id => ({ 
          memberId: id, 
          amount: customPayments[id] || 0 
        })).filter(p => p.amount > 0);
      }

      const expenseData = {
        itemName: itemName.trim(),
        amount: amountNum,
        date,
        payments,
        beneficiaries: splitBetween.map(id => ({
          memberId: id,
          shareAmount: splitType === 'custom' ? (customShares[id] || 0) : (amountNum / splitBetween.length)
        }))
      };

      await addExpense(expenseData);
      navigate('/expenses');
    } catch (err) {
      console.error('Error adding expense:', err);
      setError('Failed to add expense. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (members.length === 0) {
    return (
      <div className="min-h-screen bg-background pb-28">
        <div className="bg-surface px-5 pt-12 pb-4 border-b border-divider">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-text-secondary mb-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span className="text-sm">Back</span>
          </button>
          <h1 className="text-[22px] font-semibold text-text-primary">Add Expense</h1>
        </div>
        <div className="px-5 py-16 text-center">
          <div className="w-20 h-20 bg-primary-light rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#FF7A45" strokeWidth="1.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" />
              <line x1="22" y1="11" x2="16" y2="11" />
            </svg>
          </div>
          <p className="text-sm text-text-secondary mb-1">No members yet</p>
          <p className="text-xs text-text-muted mb-6">Add members before creating expenses.</p>
          <button onClick={() => navigate('/members')} className="h-11 px-6 rounded-button bg-primary text-white text-sm font-medium">
            Add Members
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="bg-surface px-5 pt-12 pb-4 border-b border-divider">
        <button onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)} className="flex items-center gap-2 text-text-secondary mb-3">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span className="text-sm">{step > 1 ? 'Back' : 'Cancel'}</span>
        </button>
        <h1 className="text-[22px] font-semibold text-text-primary">Add Expense</h1>
        <p className="text-xs text-text-muted mt-1">Step {step} of 3</p>
      </div>

      {/* Progress */}
      <div className="px-5 py-4">
        <div className="flex gap-2">
          {[1, 2, 3].map(s => (
            <div key={s} className={`flex-1 h-1 rounded-full transition-colors ${s <= step ? 'bg-primary' : 'bg-divider'}`} />
          ))}
        </div>
      </div>

      <div className="px-5">
        {error && (
          <div className="bg-error-light text-error p-4 rounded-card mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Step 1: Details */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">What's this expense for?</label>
              <input
                type="text"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="e.g., Groceries, Rent, Dinner"
                className="w-full h-12 px-4 bg-surface border border-divider rounded-card text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted text-sm">₹</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="w-full h-12 pl-8 pr-4 bg-surface border border-divider rounded-card text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-12 px-4 bg-surface border border-divider rounded-card text-sm text-text-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!canProceedStep1}
              className="w-full h-12 rounded-button bg-primary text-white text-sm font-medium disabled:opacity-50 mt-6"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 2: Who Paid */}
        {step === 2 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-text-primary">Who paid?</p>
              {paymentType === 'multiple' && (
                <button onClick={selectAllPayers} className="text-xs font-medium text-primary">
                  Select All
                </button>
              )}
            </div>

            {/* Payment Type Toggle */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => {
                  setPaymentType('single');
                  setPaidBy([]);
                  setCustomPayments({});
                }}
                className={`flex-1 h-10 rounded-button text-xs font-medium transition-colors ${
                  paymentType === 'single' ? 'bg-primary text-white' : 'bg-surface border border-divider text-text-secondary'
                }`}
              >
                Single Payer
              </button>
              <button
                onClick={() => {
                  setPaymentType('multiple');
                  setPaidBy([]);
                  setCustomPayments({});
                }}
                className={`flex-1 h-10 rounded-button text-xs font-medium transition-colors ${
                  paymentType === 'multiple' ? 'bg-primary text-white' : 'bg-surface border border-divider text-text-secondary'
                }`}
              >
                Multiple Payers
              </button>
            </div>

            <div className="space-y-2">
              {members.map(member => (
                <div key={member.id}>
                  <button
                    onClick={() => handlePayerToggle(member.id)}
                    className={`w-full flex items-center gap-3 p-4 rounded-card border transition-all ${
                      paidBy.includes(member.id)
                        ? 'border-primary bg-primary-light'
                        : 'border-divider bg-surface hover:bg-background'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm ${
                      paidBy.includes(member.id) ? 'bg-primary text-white' : 'bg-background text-text-muted'
                    }`}>
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="flex-1 text-left text-sm font-medium text-text-primary">{member.name}</span>
                    {paidBy.includes(member.id) && paymentType === 'single' && (
                      <span className="text-xs text-text-muted">₹{amountNum.toLocaleString('en-IN')}</span>
                    )}
                    {paidBy.includes(member.id) && (
                      <svg className="text-primary" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                  
                  {/* Custom payment amount input for multiple payers */}
                  {paymentType === 'multiple' && paidBy.includes(member.id) && (
                    <div className="mt-2 ml-14 mr-4">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-xs">₹</span>
                        <input
                          type="number"
                          value={customPayments[member.id] || ''}
                          onChange={(e) => handlePaymentChange(member.id, e.target.value)}
                          placeholder="Amount paid"
                          className="w-full h-10 pl-7 pr-3 bg-background border border-divider rounded-lg text-sm text-right focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Payment validation for multiple payers */}
            {paymentType === 'multiple' && paidBy.length > 0 && (
              <div className="mt-4 p-3 bg-surface rounded-card border border-divider">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted">Total Paid</span>
                  <span className={`text-sm font-medium ${paymentsValid ? 'text-success' : 'text-error'}`}>
                    ₹{totalCustomPayments.toLocaleString('en-IN')} / ₹{amountNum.toLocaleString('en-IN')}
                  </span>
                </div>
                {!paymentsValid && (
                  <p className="text-xs text-error mt-1">Payments must equal total amount</p>
                )}
              </div>
            )}

            <button
              onClick={() => setStep(3)}
              disabled={!canProceedStep2}
              className="w-full h-12 rounded-button bg-primary text-white text-sm font-medium disabled:opacity-50 mt-6"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 3: Split */}
        {step === 3 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-text-primary">Split between</p>
              <button onClick={selectAllForSplit} className="text-xs font-medium text-primary">
                Select All
              </button>
            </div>

            <div className="space-y-2 mb-4">
              {members.map(member => (
                <button
                  key={member.id}
                  onClick={() => handleSplitToggle(member.id)}
                  className={`w-full flex items-center gap-3 p-4 rounded-card border transition-all ${
                    splitBetween.includes(member.id)
                      ? 'border-primary bg-primary-light'
                      : 'border-divider bg-surface hover:bg-background'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm ${
                    splitBetween.includes(member.id) ? 'bg-primary text-white' : 'bg-background text-text-muted'
                  }`}>
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="flex-1 text-left text-sm font-medium text-text-primary">{member.name}</span>
                  {splitBetween.includes(member.id) && splitType === 'equal' && (
                    <span className="text-xs text-text-muted">
                      ₹{(amountNum / splitBetween.length).toFixed(0)}
                    </span>
                  )}
                  {splitBetween.includes(member.id) && (
                    <svg className="text-primary" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              ))}
            </div>

            {splitBetween.length > 0 && (
              <div className="bg-surface rounded-card p-4 mb-4 border border-divider">
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => setSplitType('equal')}
                    className={`flex-1 h-10 rounded-button text-xs font-medium transition-colors ${
                      splitType === 'equal' ? 'bg-primary text-white' : 'bg-background text-text-secondary'
                    }`}
                  >
                    Equal Split
                  </button>
                  <button
                    onClick={() => setSplitType('custom')}
                    className={`flex-1 h-10 rounded-button text-xs font-medium transition-colors ${
                      splitType === 'custom' ? 'bg-primary text-white' : 'bg-background text-text-secondary'
                    }`}
                  >
                    Custom Split
                  </button>
                </div>

                {splitType === 'custom' && (
                  <div className="space-y-2">
                    {splitBetween.map(memberId => {
                      const member = members.find(m => m.id === memberId);
                      return (
                        <div key={memberId} className="flex items-center gap-3">
                          <span className="text-sm text-text-primary flex-1">{member?.name}</span>
                          <div className="relative w-24">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-xs">₹</span>
                            <input
                              type="number"
                              value={customShares[memberId] || ''}
                              onChange={(e) => handleShareChange(memberId, e.target.value)}
                              placeholder="0"
                              className="w-full h-10 pl-7 pr-2 bg-background border border-divider rounded-lg text-sm text-right focus:outline-none focus:border-primary"
                            />
                          </div>
                        </div>
                      );
                    })}
                    <div className="flex items-center justify-between pt-2 border-t border-divider">
                      <span className="text-xs text-text-muted">Total</span>
                      <span className={`text-sm font-medium ${customSharesValid ? 'text-success' : 'text-error'}`}>
                        ₹{totalCustomShares.toFixed(0)} / ₹{amountNum.toFixed(0)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={!canSubmit || submitting}
              className="w-full h-12 rounded-button bg-primary text-white text-sm font-medium disabled:opacity-50"
            >
              {submitting ? 'Adding...' : 'Add Expense'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddExpenseScreen;
