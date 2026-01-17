import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useRoom } from '../context/RoomContext';
import GradientHeader from '../components/GradientHeader';
import PrimaryButton from '../components/PrimaryButton';

const ExpenseListScreen = () => {
  const navigate = useNavigate();
  const { currentRoom, members, expenses, expenseDetails, deleteExpense, selectedMonth } = useRoom();
  const { beneficiariesMap, paymentsMap } = expenseDetails;

  const getMemberName = (memberId) => {
    const member = members.find(m => m.id === memberId);
    return member ? member.name : 'Unknown';
  };

  const handleDelete = async (expenseId) => {
    if (window.confirm('Delete this expense? This cannot be undone.')) {
      await deleteExpense(expenseId);
    }
  };

  // Filter expenses by selected month
  const filteredExpenses = expenses.filter(expense => {
    const expenseDate = expense.date?.toDate ? expense.date.toDate() : new Date(expense.date);
    return expenseDate.getFullYear() === selectedMonth.year && 
           expenseDate.getMonth() === selectedMonth.month;
  });

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  if (!currentRoom) {
    return (
      <div className="min-h-screen pb-20">
        <GradientHeader title="Expenses" />
        <div className="px-4 py-6 text-center">
          <p className="text-gray-500 mb-4">Please select a room first</p>
          <PrimaryButton variant="gradient" onClick={() => navigate('/')}>
            Go to Home
          </PrimaryButton>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <GradientHeader title="Expenses" />

      <div className="px-4 py-6">
        {/* Header info */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <p className="text-sm text-gray-500">
            {months[selectedMonth.month]} {selectedMonth.year}
          </p>
          <p className="text-lg font-semibold text-gray-900">
            {filteredExpenses.length} expense{filteredExpenses.length !== 1 ? 's' : ''}
          </p>
        </div>

        {filteredExpenses.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500 mb-4">No expenses this month</p>
            <PrimaryButton variant="gradient" onClick={() => navigate('/add')}>
              + Add First Expense
            </PrimaryButton>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredExpenses.map(expense => {
              const beneficiaries = beneficiariesMap[expense.id] || [];
              const payments = paymentsMap[expense.id] || [];
              const expenseDate = expense.date?.toDate ? expense.date.toDate() : new Date(expense.date);
              const sharePerPerson = beneficiaries.length > 0 
                ? (expense.totalAmount / beneficiaries.length).toFixed(2) 
                : expense.totalAmount;
              
              return (
                <div key={expense.id} className="bg-white rounded-2xl p-4 shadow-sm">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-lg">{expense.itemName}</h3>
                      <p className="text-sm text-gray-500">
                        {expenseDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-900">
                        ₹{expense.totalAmount.toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                  
                  {/* Details */}
                  <div className="border-t border-gray-100 pt-3 space-y-3">
                    {/* Split between */}
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-medium mb-1">Split Between</p>
                      <div className="flex flex-wrap gap-1">
                        {beneficiaries.map((b, idx) => (
                          <span 
                            key={idx}
                            className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 text-sm rounded-lg"
                          >
                            {getMemberName(b.memberId)}
                          </span>
                        ))}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        ₹{sharePerPerson} each
                      </p>
                    </div>
                    
                    {/* Paid by */}
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-medium mb-1">Paid By</p>
                      <div className="flex flex-wrap gap-1">
                        {payments.map((p, idx) => (
                          <span 
                            key={idx}
                            className="inline-flex items-center px-2 py-1 bg-green-50 text-green-700 text-sm rounded-lg"
                          >
                            {getMemberName(p.memberId)} - ₹{p.paidAmount.toLocaleString('en-IN')}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Delete button */}
                  <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end">
                    <button 
                      onClick={() => handleDelete(expense.id)}
                      className="text-sm text-red-500 font-medium hover:text-red-700 transition-colors"
                    >
                      Delete Expense
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpenseListScreen;
