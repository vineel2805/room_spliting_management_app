import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useRoom } from '../context/RoomContext';
import { calculateMonthlyTotals, calculateSettlements } from '../services/calculationService';
import GradientHeader from '../components/GradientHeader';
import PrimaryButton from '../components/PrimaryButton';

const SettlementScreen = () => {
  const navigate = useNavigate();
  const { currentRoom, members, expenses, expenseDetails, selectedMonth, loading } = useRoom();
  const { beneficiariesMap, paymentsMap } = expenseDetails;

  // Calculate member totals and settlements
  const memberTotals = members.length > 0 && expenses.length > 0
    ? calculateMonthlyTotals(expenses, members, beneficiariesMap, paymentsMap, selectedMonth.year, selectedMonth.month)
    : {};

  const settlements = Object.keys(memberTotals).length > 0
    ? calculateSettlements(memberTotals)
    : [];

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  if (!currentRoom) {
    return (
      <div className="min-h-screen pb-20">
        <GradientHeader title="Settlements" />
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
      <GradientHeader title="Who Pays Whom" />

      <div className="px-4 py-6">
        {/* Header Card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-6">
          <h3 className="font-semibold text-gray-900 mb-1">Settlement Summary</h3>
          <p className="text-sm text-gray-500">
            For {months[selectedMonth.month]} {selectedMonth.year}
          </p>
        </div>

        {loading ? (
          <div className="text-center py-10">
            <p className="text-gray-500">Calculating...</p>
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-6xl mb-4">👥</div>
            <p className="text-gray-500 mb-4">Add members first to see settlements</p>
            <PrimaryButton variant="gradient" onClick={() => navigate('/members')}>
              Add Members
            </PrimaryButton>
          </div>
        ) : expenses.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-6xl mb-4">📝</div>
            <p className="text-gray-500 mb-4">Add expenses to see who owes whom</p>
            <PrimaryButton variant="gradient" onClick={() => navigate('/add')}>
              Add Expense
            </PrimaryButton>
          </div>
        ) : settlements.length === 0 ? (
          <div className="bg-green-50 rounded-2xl p-6 text-center">
            <div className="text-5xl mb-4">✅</div>
            <p className="text-xl font-bold text-green-700 mb-2">All Settled!</p>
            <p className="text-green-600">
              No payments needed. Everyone has paid their fair share this month.
            </p>
          </div>
        ) : (
          <>
            {/* Settlements List */}
            <div className="space-y-4 mb-6">
              {settlements.map((settlement, index) => (
                <div
                  key={index}
                  className="bg-white rounded-2xl p-5 shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    {/* Payer */}
                    <div className="flex flex-col items-center flex-1">
                      <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-lg mb-2">
                        {getInitials(settlement.fromName)}
                      </div>
                      <p className="font-semibold text-gray-900 text-center text-sm">{settlement.fromName}</p>
                      <p className="text-xs text-red-500">Pays</p>
                    </div>
                    
                    {/* Amount & Arrow */}
                    <div className="flex flex-col items-center">
                      <div className="bg-gradient-to-r from-red-500 to-green-500 text-white px-4 py-2 rounded-full font-bold text-lg">
                        ₹{settlement.amount.toLocaleString('en-IN')}
                      </div>
                      <div className="text-2xl text-gray-400 mt-1">→</div>
                    </div>
                    
                    {/* Receiver */}
                    <div className="flex flex-col items-center flex-1">
                      <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-lg mb-2">
                        {getInitials(settlement.toName)}
                      </div>
                      <p className="font-semibold text-gray-900 text-center text-sm">{settlement.toName}</p>
                      <p className="text-xs text-green-500">Receives</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="bg-gray-50 rounded-2xl p-4 mb-6">
              <p className="text-sm text-gray-600 text-center">
                {settlements.length} payment{settlements.length !== 1 ? 's' : ''} needed to settle all balances
              </p>
            </div>
          </>
        )}

        {/* Balance Details */}
        {Object.keys(memberTotals).length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm mb-6">
            <h4 className="font-semibold text-gray-900 mb-3">Balance Details</h4>
            <div className="space-y-2">
              {Object.values(memberTotals).map(member => (
                <div key={member.memberId} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-xs">
                      {getInitials(member.name)}
                    </div>
                    <span className="font-medium text-gray-900">{member.name}</span>
                  </div>
                  <span className={`font-semibold ${
                    member.balance > 0.01 
                      ? 'text-green-600' 
                      : member.balance < -0.01 
                        ? 'text-red-600' 
                        : 'text-gray-500'
                  }`}>
                    {member.balance > 0.01 
                      ? `+₹${member.balance.toLocaleString('en-IN')}` 
                      : member.balance < -0.01 
                        ? `-₹${Math.abs(member.balance).toLocaleString('en-IN')}` 
                        : '₹0'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* How it works */}
        <div className="bg-blue-50 rounded-2xl p-4">
          <h4 className="font-medium text-blue-900 mb-2">💡 How this works</h4>
          <ul className="text-sm text-blue-800 space-y-2">
            <li><strong>Should Pay</strong> = Your share of all expenses you used</li>
            <li><strong>Actually Paid</strong> = Total money you spent</li>
            <li><strong>Positive balance (+)</strong> = You paid more, others owe you</li>
            <li><strong>Negative balance (-)</strong> = You paid less, you owe others</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SettlementScreen;
