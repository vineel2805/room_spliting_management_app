import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import GradientHeader from '../components/GradientHeader';
import PrimaryButton from '../components/PrimaryButton';
import MemberRow from '../components/MemberRow';
import AmountBadge from '../components/AmountBadge';

const GroupDetailScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Mock data - replace with actual state/API
  const groupData = {
    id: parseInt(id),
    name: 'Apartment Rent',
    balance: -1250.50, // Negative means you owe, positive means you're owed
    totalExpense: 15000,
  };

  const balances = [
    { member: 'C', amount: -2500, type: 'owed' }, // C owes you
    { member: 'B', amount: 1250, type: 'owe' }, // You owe B
  ];

  const expenses = [
    {
      id: 1,
      item: 'Electricity Bill',
      date: '2024-01-15',
      amount: 2500,
      status: 'owed',
      statusLabel: 'Owes you',
    },
    {
      id: 2,
      item: 'Internet Bill',
      date: '2024-01-10',
      amount: 1500,
      status: 'owe',
      statusLabel: 'You owe',
    },
    {
      id: 3,
      item: 'Maintenance',
      date: '2024-01-05',
      amount: 3000,
      status: 'neutral',
      statusLabel: 'Not involved',
    },
  ];

  const isOwed = groupData.balance > 0;
  const balanceAmount = Math.abs(groupData.balance);

  return (
    <div className="min-h-screen pb-20">
      <GradientHeader 
        title={groupData.name}
        rightIcon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        }
        onRightClick={() => navigate(-1)}
      />

      <div className="px-4 -mt-6 pb-6">
        {/* Top Card */}
        <div className="bg-white rounded-card p-6 shadow-card mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-money-neutral mb-1">
                {isOwed ? 'You are owed' : 'You owe'}
              </p>
              <p className={`text-3xl font-bold ${isOwed ? 'text-money-green' : 'text-money-red'}`}>
                ₹{balanceAmount.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
          <PrimaryButton 
            variant="gradient" 
            fullWidth
            onClick={() => navigate(`/settle/${id}`)}
          >
            Settle Up
          </PrimaryButton>
        </div>

        {/* Who owes whom list */}
        <div className="mb-6">
          <h3 className="text-base font-semibold text-gray-900 mb-3">Balances</h3>
          <div className="flex flex-col gap-2">
            {balances.map((balance, index) => (
              <div
                key={index}
                className="bg-white rounded-card p-4 shadow-card flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-sm">
                    {balance.member}
                  </div>
                  <p className="text-base font-medium text-gray-900">
                    {balance.type === 'owed' ? `${balance.member} owes you` : `You owe ${balance.member}`}
                  </p>
                </div>
                <AmountBadge 
                  amount={Math.abs(balance.amount)} 
                  type={balance.type === 'owed' ? 'owed' : 'owe'}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Expense List */}
        <div>
          <h3 className="text-base font-semibold text-gray-900 mb-3">Expenses</h3>
          <div className="flex flex-col gap-3">
            {expenses.map((expense) => (
              <div
                key={expense.id}
                className="bg-white rounded-card p-4 shadow-card"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="text-base font-semibold text-gray-900 mb-1">
                      {expense.item}
                    </h4>
                    <p className="text-sm text-money-neutral">
                      {new Date(expense.date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                    expense.status === 'owe' 
                      ? 'bg-red-50 text-money-red' 
                      : expense.status === 'owed'
                      ? 'bg-green-50 text-money-green'
                      : 'bg-gray-50 text-money-neutral'
                  }`}>
                    {expense.statusLabel}
                  </span>
                </div>
                <div className="flex items-center justify-end mt-2">
                  <span className="text-lg font-bold text-gray-900">
                    ₹{expense.amount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupDetailScreen;
