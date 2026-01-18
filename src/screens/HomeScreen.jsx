import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRoom } from '../context/RoomContext';
import { useAuth } from '../context/AuthContext';
import { calculateMonthlyTotals, calculateRoomTotal } from '../services/calculationService';
import { createRoomWithAuth, joinRoomWithCode, getUserRooms } from '../services/authService';
import MemberDetailModal from '../components/MemberDetailModal';

const HomeScreen = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { 
    currentRoom, 
    rooms, 
    members, 
    expenses, 
    expenseDetails,
    loading,
    error,
    selectRoom,
    selectedMonth,
    setSelectedMonth,
    loadRooms
  } = useRoom();

  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showJoinRoom, setShowJoinRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomPassword, setNewRoomPassword] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [joinPassword, setJoinPassword] = useState('');
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [createdRoomCode, setCreatedRoomCode] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [userRooms, setUserRooms] = useState([]);

  const { beneficiariesMap, paymentsMap } = expenseDetails;

  // Load user's rooms on mount
  useEffect(() => {
    const loadUserRooms = async () => {
      if (user) {
        const rooms = await getUserRooms(user);
        setUserRooms(rooms);
      }
    };
    loadUserRooms();
  }, [user]);

  const memberTotals = members.length > 0 && expenses.length > 0
    ? calculateMonthlyTotals(expenses, members, beneficiariesMap, paymentsMap, selectedMonth.year, selectedMonth.month)
    : {};

  const roomTotal = expenses.length > 0
    ? calculateRoomTotal(expenses, selectedMonth.year, selectedMonth.month)
    : 0;

  const handleCreateRoom = async () => {
    if (newRoomName.trim() && newRoomPassword.trim() && !creating) {
      setCreating(true);
      setActionError(null);
      try {
        const { roomId, roomCode } = await createRoomWithAuth(newRoomName.trim(), newRoomPassword.trim(), user);
        setCreatedRoomCode(roomCode);
        // Refresh rooms list
        const updatedRooms = await getUserRooms(user);
        setUserRooms(updatedRooms);
        const newRoom = updatedRooms.find(r => r.id === roomId);
        if (newRoom) selectRoom(newRoom);
      } catch (err) {
        console.error('Error creating room:', err);
        setActionError(err.message || 'Failed to create room');
      } finally {
        setCreating(false);
      }
    }
  };

  const handleJoinRoom = async () => {
    if (joinCode.trim() && joinPassword.trim() && !joining) {
      setJoining(true);
      setActionError(null);
      try {
        const { roomId, alreadyMember } = await joinRoomWithCode(joinCode.trim(), joinPassword.trim(), user);
        // Refresh rooms list
        const updatedRooms = await getUserRooms(user);
        setUserRooms(updatedRooms);
        const joinedRoom = updatedRooms.find(r => r.id === roomId);
        if (joinedRoom) selectRoom(joinedRoom);
        setShowJoinRoom(false);
        setJoinCode('');
        setJoinPassword('');
      } catch (err) {
        console.error('Error joining room:', err);
        setActionError(err.message || 'Failed to join room');
      } finally {
        setJoining(false);
      }
    }
  };

  const handleCloseCreateModal = () => {
    setShowCreateRoom(false);
    setNewRoomName('');
    setNewRoomPassword('');
    setCreatedRoomCode(null);
    setActionError(null);
  };

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const fullMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear - 1, currentYear, currentYear + 1];

  // No room selected
  if (!currentRoom) {
    return (
      <div className="min-h-screen bg-background pb-28">
        {/* Header with User Profile */}
        <div className="bg-surface px-5 pt-12 pb-4 border-b border-divider">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[22px] font-semibold text-text-primary">Split</h1>
              <p className="text-xs text-text-secondary mt-0.5">Expense sharing made simple</p>
            </div>
            {user && (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs font-medium text-text-primary truncate max-w-[120px]">
                    {user.displayName || user.email?.split('@')[0]}
                  </p>
                  <button 
                    onClick={signOut}
                    className="text-xs text-text-muted hover:text-error"
                  >
                    Sign out
                  </button>
                </div>
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt="Profile" 
                    className="w-10 h-10 rounded-full border-2 border-primary"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center text-primary font-semibold">
                    {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="px-5 py-6">
          {(error || actionError) && (
            <div className="bg-error-light text-error p-4 rounded-card mb-4 text-sm">
              {error || actionError}
            </div>
          )}

          <h2 className="text-base font-medium text-text-primary mb-4">Your Rooms</h2>
          
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="bg-surface rounded-card p-4 shadow-card">
                  <div className="skeleton h-5 w-32 rounded mb-2" />
                  <div className="skeleton h-4 w-20 rounded" />
                </div>
              ))}
            </div>
          ) : userRooms.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-primary-light rounded-full flex items-center justify-center mx-auto mb-4">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#FF7A45" strokeWidth="1.5">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </div>
              <p className="text-text-secondary text-sm mb-1">No rooms yet</p>
              <p className="text-text-muted text-xs">Create a room or join with a code</p>
            </div>
          ) : (
            <div className="space-y-3 mb-6">
              {userRooms.map(room => (
                <button
                  key={room.id}
                  onClick={() => selectRoom(room)}
                  className="w-full bg-surface rounded-card p-4 shadow-card text-left hover:shadow-card-hover active:scale-[0.99] transition-all border border-transparent hover:border-primary/20"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-text-primary">{room.name}</p>
                      <p className="text-xs text-text-muted mt-1">Code: {room.code}</p>
                    </div>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-muted">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {!showCreateRoom && !showJoinRoom ? (
              <>
                <button 
                  onClick={() => setShowCreateRoom(true)}
                  className="w-full h-12 rounded-button bg-primary text-white text-sm font-medium hover:bg-primary/90 active:scale-[0.99] transition-all"
                >
                  + Create New Room
                </button>
                <button 
                  onClick={() => setShowJoinRoom(true)}
                  className="w-full h-12 rounded-button bg-surface border border-divider text-text-primary text-sm font-medium hover:bg-background active:scale-[0.99] transition-all"
                >
                  Join with Code
                </button>
              </>
            ) : showCreateRoom ? (
              <div className="bg-surface rounded-card p-4 shadow-card space-y-3">
                {createdRoomCode ? (
                  // Success state - show room code
                  <div className="text-center py-4">
                    <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-text-primary mb-2">Room Created!</p>
                    <p className="text-xs text-text-muted mb-4">Share this code with your roommates:</p>
                    <div className="bg-background rounded-button p-4 mb-4">
                      <p className="text-2xl font-bold text-primary tracking-widest">{createdRoomCode}</p>
                    </div>
                    <p className="text-xs text-text-muted mb-4">
                      They'll also need the password you set to join.
                    </p>
                    <button 
                      onClick={handleCloseCreateModal}
                      className="w-full h-11 rounded-button bg-primary text-white text-sm font-medium"
                    >
                      Got it
                    </button>
                  </div>
                ) : (
                  // Create form
                  <>
                    <p className="text-sm font-medium text-text-primary">Create New Room</p>
                    <input
                      type="text"
                      value={newRoomName}
                      onChange={(e) => setNewRoomName(e.target.value)}
                      placeholder="Room name (e.g., Apartment 2024)"
                      className="w-full px-4 py-3 bg-background border border-divider rounded-button text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                      autoFocus
                    />
                    <input
                      type="password"
                      value={newRoomPassword}
                      onChange={(e) => setNewRoomPassword(e.target.value)}
                      placeholder="Set a password for the room"
                      className="w-full px-4 py-3 bg-background border border-divider rounded-button text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                    />
                    <p className="text-xs text-text-muted">
                      Share the room code and password with people you want to add.
                    </p>
                    <div className="flex gap-3">
                      <button 
                        onClick={handleCloseCreateModal}
                        className="flex-1 h-11 rounded-button border border-divider text-text-secondary text-sm font-medium hover:bg-background transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleCreateRoom}
                        disabled={!newRoomName.trim() || !newRoomPassword.trim() || creating}
                        className="flex-1 h-11 rounded-button bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
                      >
                        {creating ? 'Creating...' : 'Create'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              // Join Room Form
              <div className="bg-surface rounded-card p-4 shadow-card space-y-3">
                <p className="text-sm font-medium text-text-primary">Join a Room</p>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="Enter 6-character room code"
                  maxLength={6}
                  className="w-full px-4 py-3 bg-background border border-divider rounded-button text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 uppercase tracking-widest text-center font-medium"
                  autoFocus
                />
                <input
                  type="password"
                  value={joinPassword}
                  onChange={(e) => setJoinPassword(e.target.value)}
                  placeholder="Enter room password"
                  className="w-full px-4 py-3 bg-background border border-divider rounded-button text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                />
                <div className="flex gap-3">
                  <button 
                    onClick={() => { setShowJoinRoom(false); setJoinCode(''); setJoinPassword(''); setActionError(null); }}
                    className="flex-1 h-11 rounded-button border border-divider text-text-secondary text-sm font-medium hover:bg-background transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleJoinRoom}
                    disabled={joinCode.length !== 6 || !joinPassword.trim() || joining}
                    className="flex-1 h-11 rounded-button bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  >
                    {joining ? 'Joining...' : 'Join'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Room Dashboard
  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="bg-surface px-5 pt-12 pb-4 border-b border-divider">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-[22px] font-semibold text-text-primary">{currentRoom.name}</h1>
            {currentRoom.code && (
              <p className="text-xs text-text-muted">Code: {currentRoom.code}</p>
            )}
          </div>
          <button
            onClick={() => navigate('/profile')}
            className="w-10 h-10 rounded-full bg-background flex items-center justify-center hover:bg-divider transition-colors overflow-hidden"
          >
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-secondary">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            )}
          </button>
        </div>

        {/* Month Selector */}
        <div className="flex items-center gap-2">
          <div className="flex-1 flex bg-background rounded-button p-1 overflow-x-auto">
            {months.map((month, index) => (
              <button
                key={index}
                onClick={() => setSelectedMonth(prev => ({ ...prev, month: index }))}
                className={`flex-1 min-w-[40px] py-2 text-xs font-medium rounded-lg transition-all ${
                  selectedMonth.month === index
                    ? 'bg-surface text-text-primary shadow-sm'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                {month}
              </button>
            ))}
          </div>
          <select
            value={selectedMonth.year}
            onChange={(e) => setSelectedMonth(prev => ({ ...prev, year: parseInt(e.target.value) }))}
            className="h-10 px-3 bg-background border-0 rounded-button text-xs font-medium text-text-primary focus:outline-none"
          >
            {yearOptions.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="px-5 py-6">
        {error && (
          <div className="bg-error-light text-error p-4 rounded-card mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Total Card */}
        <div className="bg-surface rounded-card p-5 shadow-card mb-6">
          <p className="text-xs text-text-muted mb-1">Total Expenses</p>
          <p className="text-3xl font-semibold text-text-primary">
            ₹{roomTotal.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-text-muted mt-1">
            {fullMonths[selectedMonth.month]} {selectedMonth.year}
          </p>
        </div>

        {/* Empty States */}
        {members.length === 0 ? (
          <div className="bg-primary-light rounded-card p-5 mb-6">
            <p className="text-sm font-medium text-primary mb-1">Add members first</p>
            <p className="text-xs text-text-secondary mb-4">You need members before tracking expenses.</p>
            <button 
              onClick={() => navigate('/members')}
              className="h-10 px-5 rounded-button bg-primary text-white text-sm font-medium"
            >
              Add Members
            </button>
          </div>
        ) : expenses.length === 0 ? (
          <div className="bg-surface border border-divider rounded-card p-5 mb-6">
            <p className="text-sm font-medium text-text-primary mb-1">No expenses yet</p>
            <p className="text-xs text-text-secondary mb-4">Start adding expenses to track spending.</p>
            <button 
              onClick={() => navigate('/add')}
              className="h-10 px-5 rounded-button bg-primary text-white text-sm font-medium"
            >
              Add Expense
            </button>
          </div>
        ) : null}

        {/* Member Balances */}
        {Object.keys(memberTotals).length > 0 && (
          <>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-medium text-text-primary">Balances</h3>
              <button 
                onClick={() => navigate('/settle/' + currentRoom.id)}
                className="text-xs font-medium text-primary"
              >
                Settle up →
              </button>
            </div>
            
            <div className="bg-surface rounded-card shadow-card divide-y divide-divider overflow-hidden">
              {Object.values(memberTotals).map(member => (
                <button 
                  key={member.memberId} 
                  className="w-full flex items-center gap-4 p-4 hover:bg-background/50 active:bg-background transition-colors text-left"
                  onClick={() => setSelectedMember(member)}
                >
                  <div className="w-11 h-11 rounded-full bg-primary-light flex items-center justify-center text-primary font-semibold">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{member.name}</p>
                    <p className="text-xs text-text-muted">
                      Paid ₹{member.totalSpends.toLocaleString('en-IN')}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${
                      member.balance > 0.01 ? 'text-success' : member.balance < -0.01 ? 'text-error' : 'text-text-muted'
                    }`}>
                      {member.balance > 0.01 
                        ? `+₹${member.balance.toLocaleString('en-IN')}` 
                        : member.balance < -0.01 
                          ? `-₹${Math.abs(member.balance).toLocaleString('en-IN')}` 
                          : '₹0'}
                    </p>
                    <p className="text-xs text-text-muted">
                      {member.balance > 0.01 ? 'gets back' : member.balance < -0.01 ? 'owes' : 'settled'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

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
