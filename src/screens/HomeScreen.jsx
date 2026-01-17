import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRoom } from '../context/RoomContext';
import { calculateMonthlyTotals, calculateRoomTotal } from '../services/calculationService';
import GradientHeader from '../components/GradientHeader';
import PrimaryButton from '../components/PrimaryButton';
import MemberDetailModal from '../components/MemberDetailModal';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const HomeScreen = () => {
  const navigate = useNavigate();
  const { 
    currentRoom, 
    rooms, 
    members, 
    expenses, 
    expenseDetails,
    loading,
    error,
    createRoom,
    selectRoom,
    selectedMonth,
    setSelectedMonth
  } = useRoom();

  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [creating, setCreating] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  const { beneficiariesMap, paymentsMap } = expenseDetails;

  // Calculate totals
  const memberTotals = members.length > 0 && expenses.length > 0
    ? calculateMonthlyTotals(expenses, members, beneficiariesMap, paymentsMap, selectedMonth.year, selectedMonth.month)
    : {};

  const roomTotal = expenses.length > 0
    ? calculateRoomTotal(expenses, selectedMonth.year, selectedMonth.month)
    : 0;

  const handleCreateRoom = async () => {
    if (newRoomName.trim() && !creating) {
      setCreating(true);
      try {
        await createRoom(newRoomName.trim());
        setNewRoomName('');
        setShowCreateRoom(false);
      } catch (err) {
        console.error('Error creating room:', err);
      } finally {
        setCreating(false);
      }
    }
  };

  // Prepare chart data
  const chartData = Object.values(memberTotals).map(member => ({
    name: member.name.length > 8 ? member.name.substring(0, 8) + '...' : member.name,
    'Should Pay': member.totalExpense,
    'Actually Paid': member.totalSpends
  }));

  // Month selector options
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Generate year options (current year and 2 years back/forward)
  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear - 1, currentYear, currentYear + 1];

  // If no room selected, show room selection
  if (!currentRoom) {
    return (
      <div className="min-h-screen pb-20">
        <GradientHeader title="Split App" />
        <div className="px-4 py-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-4">
              {error}
            </div>
          )}

          <h2 className="text-xl font-bold text-gray-900 mb-4">Your Rooms</h2>
          
          {loading ? (
            <div className="text-center py-10">
              <p className="text-gray-500">Loading...</p>
            </div>
          ) : rooms.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-6xl mb-4">🏠</div>
              <p className="text-gray-500 mb-4">No rooms yet. Create your first room to start tracking expenses!</p>
            </div>
          ) : (
            <div className="space-y-3 mb-6">
              {rooms.map(room => (
                <button
                  key={room.id}
                  onClick={() => selectRoom(room)}
                  className="w-full bg-white rounded-2xl p-4 shadow-sm text-left hover:bg-gray-50 transition-colors border border-gray-100"
                >
                  <p className="text-lg font-semibold text-gray-900">{room.name}</p>
                  <p className="text-sm text-gray-500">Tap to open</p>
                </button>
              ))}
            </div>
          )}

          {!showCreateRoom ? (
            <PrimaryButton 
              variant="gradient" 
              fullWidth 
              onClick={() => setShowCreateRoom(true)}
            >
              + Create New Room
            </PrimaryButton>
          ) : (
            <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
              <input
                type="text"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                placeholder="Room name (e.g., Apartment 2024)"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-orange"
                autoFocus
              />
              <div className="flex gap-3">
                <PrimaryButton 
                  variant="outline" 
                  fullWidth 
                  onClick={() => {
                    setShowCreateRoom(false);
                    setNewRoomName('');
                  }}
                >
                  Cancel
                </PrimaryButton>
                <PrimaryButton 
                  variant="gradient" 
                  fullWidth 
                  onClick={handleCreateRoom}
                  disabled={!newRoomName.trim() || creating}
                >
                  {creating ? 'Creating...' : 'Create'}
                </PrimaryButton>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Room Dashboard
  return (
    <div className="min-h-screen pb-20">
      <GradientHeader 
        title={currentRoom.name}
        rightIcon="Change"
        onRightClick={() => selectRoom(null)}
      />

      <div className="px-4 -mt-6 pb-6">
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-4">
            {error}
          </div>
        )}

        {/* Month Selector */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <p className="text-sm text-gray-500 mb-2">Select Month</p>
          <div className="flex items-center gap-3">
            <select
              value={selectedMonth.month}
              onChange={(e) => setSelectedMonth(prev => ({ ...prev, month: parseInt(e.target.value) }))}
              className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-orange"
            >
              {months.map((month, index) => (
                <option key={index} value={index}>{month}</option>
              ))}
            </select>
            <select
              value={selectedMonth.year}
              onChange={(e) => setSelectedMonth(prev => ({ ...prev, year: parseInt(e.target.value) }))}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-orange"
            >
              {yearOptions.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Room Total */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 shadow-sm mb-4 text-white">
          <p className="text-sm opacity-80 mb-1">Total Room Expense</p>
          <p className="text-3xl font-bold">
            ₹{roomTotal.toLocaleString('en-IN')}
          </p>
          <p className="text-sm opacity-80 mt-1">
            {months[selectedMonth.month]} {selectedMonth.year}
          </p>
        </div>

        {/* Quick Actions */}
        {members.length === 0 ? (
          <div className="bg-yellow-50 rounded-2xl p-4 mb-4">
            <p className="text-yellow-800 font-medium mb-2">⚠️ Add Members First</p>
            <p className="text-yellow-700 text-sm mb-3">You need to add members before you can track expenses.</p>
            <PrimaryButton variant="gradient" fullWidth onClick={() => navigate('/members')}>
              Add Members
            </PrimaryButton>
          </div>
        ) : expenses.length === 0 ? (
          <div className="bg-blue-50 rounded-2xl p-4 mb-4">
            <p className="text-blue-800 font-medium mb-2">📝 No Expenses Yet</p>
            <p className="text-blue-700 text-sm mb-3">Start adding expenses to track who paid what.</p>
            <PrimaryButton variant="gradient" fullWidth onClick={() => navigate('/add')}>
              + Add First Expense
            </PrimaryButton>
          </div>
        ) : null}

        {/* Member Summary Cards */}
        {Object.keys(memberTotals).length > 0 && (
          <>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Member Summary</h3>
            <div className="space-y-3 mb-6">
              {Object.values(memberTotals).map(member => (
                <div 
                  key={member.memberId} 
                  className="bg-white rounded-2xl p-4 shadow-sm cursor-pointer hover:bg-gray-50 active:scale-[0.99] transition-all"
                  onClick={() => setSelectedMember(member)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{member.name}</p>
                        <p className="text-xs text-gray-400">Tap for details</p>
                      </div>
                    </div>
                    <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                      member.balance > 0.01 
                        ? 'bg-green-100 text-green-700' 
                        : member.balance < -0.01 
                          ? 'bg-red-100 text-red-700' 
                          : 'bg-gray-100 text-gray-600'
                    }`}>
                      {member.balance > 0.01 
                        ? `Gets ₹${member.balance.toLocaleString('en-IN')}` 
                        : member.balance < -0.01 
                          ? `Pays ₹${Math.abs(member.balance).toLocaleString('en-IN')}` 
                          : 'Settled ✓'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm bg-gray-50 rounded-xl p-3">
                    <div>
                      <p className="text-gray-500">Should Pay</p>
                      <p className="font-semibold text-gray-900">₹{member.totalExpense.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-500">Actually Paid</p>
                      <p className="font-semibold text-gray-900">₹{member.totalSpends.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Chart */}
            {chartData.length > 0 && (
              <div className="bg-white rounded-2xl p-4 shadow-sm mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Expense vs Paid</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      formatter={(value) => `₹${value.toLocaleString('en-IN')}`}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Legend />
                    <Bar dataKey="Should Pay" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Actually Paid" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Settlement Button */}
            <PrimaryButton 
              variant="gradient" 
              fullWidth
              onClick={() => navigate('/settle/' + currentRoom.id)}
            >
              💰 View Who Pays Whom
            </PrimaryButton>
          </>
        )}
      </div>

      {/* Member Detail Modal */}
      <MemberDetailModal
        isOpen={!!selectedMember}
        onClose={() => setSelectedMember(null)}
        member={selectedMember}
        memberTotals={memberTotals}
        expenses={expenses}
        members={members}
        beneficiariesMap={beneficiariesMap}
        paymentsMap={paymentsMap}
        selectedMonth={selectedMonth}
      />
    </div>
  );
};

export default HomeScreen;
