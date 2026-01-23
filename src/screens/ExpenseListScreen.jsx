import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRoom } from '../context/RoomContext';
import { useToast } from '../context/ToastContext';
import ExpenseDetailModal from '../components/ExpenseDetailModal';

const ExpenseListScreen = () => {
  const navigate = useNavigate();
  const { expenses, members, expenseDetails, selectedMonth, deleteExpense, undoDeleteExpense, clearDeletedExpense, loading } = useRoom();
  const { showToast } = useToast();
  const { beneficiariesMap, paymentsMap } = expenseDetails;
  
  const [menuOpen, setMenuOpen] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [selectedExpense, setSelectedExpense] = useState(null);

  const filteredExpenses = expenses.filter(exp => {
    const expDate = exp.date?.toDate ? exp.date.toDate() : new Date(exp.date);
    return expDate.getMonth() === selectedMonth.month && expDate.getFullYear() === selectedMonth.year;
  }).sort((a, b) => {
    const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
    const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
    return dateB - dateA;
  });

  const getMemberName = (memberId) => {
    const member = members.find(m => m.id === memberId);
    return member ? member.name : 'Unknown';
  };

  const getPayerNames = (expenseId) => {
    const payments = paymentsMap[expenseId] || [];
    return payments.map(p => getMemberName(p.memberId)).join(', ') || 'N/A';
  };

  const handleDelete = async (expenseId, expenseName) => {
    if (deleting) return;
    setDeleting(expenseId);
    setMenuOpen(null);
    
    try {
      await deleteExpense(expenseId);
      
      showToast({
        message: `"${expenseName || 'Expense'}" deleted`,
        type: 'info',
        duration: 5000,
        showUndo: true,
        onUndo: async () => {
          try {
            await undoDeleteExpense();
            showToast({
              message: 'Expense restored',
              type: 'success',
              duration: 3000
            });
          } catch (err) {
            showToast({
              message: 'Failed to restore expense',
              type: 'error',
              duration: 3000
            });
          }
        }
      });

      // Clear stored expense after toast duration
      setTimeout(() => {
        clearDeletedExpense();
      }, 5500);

    } catch (err) {
      console.error('Error deleting expense:', err);
      showToast({
        message: 'Failed to delete expense',
        type: 'error',
        duration: 3000
      });
    } finally {
      setDeleting(null);
    }
  };

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="bg-surface px-5 pt-12 pb-4 border-b border-divider">
        <h1 className="text-[22px] font-semibold text-text-primary">Expenses</h1>
        <p className="text-xs text-text-muted mt-1">{months[selectedMonth.month]} {selectedMonth.year}</p>
      </div>

      <div className="px-5 py-6">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-surface rounded-card p-4 shadow-card">
                <div className="skeleton h-5 w-40 rounded mb-2" />
                <div className="skeleton h-4 w-24 rounded mb-3" />
                <div className="skeleton h-4 w-full rounded" />
              </div>
            ))}
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-primary-light rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#FF7A45" strokeWidth="1.5">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
            </div>
            <p className="text-sm text-text-secondary mb-1">No expenses this month</p>
            <p className="text-xs text-text-muted mb-6">Tap the + button to add one</p>
            <button 
              onClick={() => navigate('/add')}
              className="h-11 px-6 rounded-button bg-primary text-white text-sm font-medium"
            >
              Add Expense
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-text-muted">{filteredExpenses.length} expense{filteredExpenses.length !== 1 ? 's' : ''}</p>
              <p className="text-sm font-medium text-text-primary">
                Total: ₹{filteredExpenses.reduce((sum, e) => sum + (e.totalAmount || e.amount || 0), 0).toLocaleString('en-IN')}
              </p>
            </div>

            <div className="space-y-3">
              {filteredExpenses.map(expense => {
                const expAmount = expense.totalAmount || expense.amount || 0;
                const expDate = expense.date?.toDate ? expense.date.toDate() : new Date(expense.date);
                return (
                <div 
                  key={expense.id} 
                  className="bg-surface rounded-card shadow-card overflow-hidden cursor-pointer hover:shadow-card-hover active:scale-[0.99] transition-all"
                  onClick={() => setSelectedExpense(expense)}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-medium text-text-primary truncate">
                          {expense.itemName || expense.name || 'Expense'}
                        </p>
                        <p className="text-xs text-text-muted mt-0.5">
                          {expDate.toLocaleDateString('en-IN', { 
                            day: 'numeric', 
                            month: 'short',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-lg font-semibold text-text-primary">
                          ₹{expAmount.toLocaleString('en-IN')}
                        </p>
                        <div className="relative">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === expense.id ? null : expense.id); }}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:bg-background transition-colors"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                              <circle cx="12" cy="5" r="2" />
                              <circle cx="12" cy="12" r="2" />
                              <circle cx="12" cy="19" r="2" />
                            </svg>
                          </button>
                          
                          {menuOpen === expense.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
                              <div className="absolute right-0 top-full mt-1 bg-surface rounded-lg shadow-lg border border-divider py-1 z-20 min-w-[120px]">
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleDelete(expense.id, expense.itemName || expense.name); }}
                                  disabled={deleting === expense.id}
                                  className="w-full px-4 py-2.5 text-left text-sm text-error hover:bg-error-light transition-colors disabled:opacity-50"
                                >
                                  {deleting === expense.id ? 'Deleting...' : 'Delete'}
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-text-muted">
                      <span className="flex items-center gap-1.5">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                        Paid by {getPayerNames(expense.id)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                        {(beneficiariesMap[expense.id] || []).length} split
                      </span>
                    </div>
                  </div>
                </div>
              )})}
            </div>
          </>
        )}
      </div>

      <ExpenseDetailModal
        isOpen={!!selectedExpense}
        onClose={() => setSelectedExpense(null)}
        expense={selectedExpense}
        members={members}
        beneficiariesMap={beneficiariesMap}
        paymentsMap={paymentsMap}
      />
    </div>
  );
};

export default ExpenseListScreen;
