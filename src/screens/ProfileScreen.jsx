import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useRoom } from '../context/RoomContext';
import { useToast } from '../context/ToastContext';
import { getUserRooms, leaveRoom, calculateMemberOverallBalance } from '../services/authService';
import { getSettlementsByMember } from '../services/firebaseService';

const ProfileScreen = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { currentRoom, selectRoom, members } = useRoom();
  const { showToast } = useToast();
  const [userRooms, setUserRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [memberBalance, setMemberBalance] = useState(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [settlementHistory, setSettlementHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('rooms');

  useEffect(() => {
    const loadRooms = async () => {
      if (user) {
        const rooms = await getUserRooms(user);
        setUserRooms(rooms);
      }
      setLoading(false);
    };
    loadRooms();
  }, [user]);

  useEffect(() => {
    const loadBalance = async () => {
      if (currentRoom && user && members.length > 0) {
        setBalanceLoading(true);
        const userMember = members.find(m => m.userId === user.uid);
        if (userMember) {
          const balance = await calculateMemberOverallBalance(currentRoom.id, userMember.id);
          setMemberBalance(balance);
        }
        setBalanceLoading(false);
      }
    };
    loadBalance();
  }, [currentRoom, user, members]);

  useEffect(() => {
    const loadHistory = async () => {
      if (currentRoom && user && members.length > 0) {
        setHistoryLoading(true);
        const userMember = members.find(m => m.userId === user.uid);
        if (userMember) {
          const history = await getSettlementsByMember(userMember.id);
          const roomHistory = history.filter(h => h.roomId === currentRoom.id);
          setSettlementHistory(roomHistory);
        }
        setHistoryLoading(false);
      } else {
        setHistoryLoading(false);
      }
    };
    loadHistory();
  }, [currentRoom, user, members]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  }, [darkMode]);

  const handleLeaveRoom = async () => {
    if (!currentRoom || leaving) return;
    setLeaving(true);
    try {
      await leaveRoom(currentRoom.id, user);
      selectRoom(null);
      const rooms = await getUserRooms(user);
      setUserRooms(rooms);
      setShowLeaveConfirm(false);
      setMemberBalance(null);
      showToast({ message: 'Left room successfully', type: 'success', duration: 3000 });
    } catch (err) {
      console.error('Error leaving room:', err);
      showToast({ message: err.message || 'Failed to leave room', type: 'error', duration: 3000 });
    } finally {
      setLeaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const handleCopyCode = () => {
    if (currentRoom?.code) {
      navigator.clipboard.writeText(currentRoom.code);
      showToast({ message: 'Room code copied!', type: 'success', duration: 2000 });
    }
  };

  const canLeaveRoom = memberBalance !== null && Math.abs(memberBalance) <= 0.01;
  const currentUserMember = members.find(m => m.userId === user?.uid);

  // Group history by date
  const groupHistoryByDate = (history) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const groups = { today: [], thisWeek: [], earlier: [] };
    
    history.forEach(item => {
      const date = item.settledAt?.toDate?.() || new Date();
      if (date.toDateString() === today.toDateString()) {
        groups.today.push(item);
      } else if (date > weekAgo) {
        groups.thisWeek.push(item);
      } else {
        groups.earlier.push(item);
      }
    });
    
    return groups;
  };

  const groupedHistory = groupHistoryByDate(settlementHistory);

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-background dark:bg-neutral-900 pb-28">
      {/* Compact Header */}
      <div className="bg-surface dark:bg-neutral-800 border-b border-divider dark:border-neutral-700">
        <div className="px-4 pt-12 pb-4">
          {/* Back Button */}
          <button 
            onClick={() => navigate(-1)}
            className="mb-4 p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-secondary dark:text-neutral-300">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          
          {/* Profile Row */}
          <div className="flex items-center gap-3">
            {user.photoURL ? (
              <img 
                src={user.photoURL} 
                alt="Profile" 
                className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-100 dark:ring-neutral-700"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center text-white text-lg font-semibold">
                {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-semibold text-text-primary dark:text-white truncate">
                {user.displayName || 'User'}
              </h1>
              <p className="text-sm text-text-muted dark:text-neutral-400 truncate">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Balance Card - Elevated */}
        {currentRoom && (
          <div className="px-4 pb-4">
            <div className="bg-gray-50 dark:bg-neutral-700/50 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-text-muted dark:text-neutral-400 font-medium mb-1">Balance in {currentRoom.name}</p>
                  {balanceLoading ? (
                    <div className="h-7 w-20 bg-gray-200 dark:bg-neutral-600 rounded animate-pulse" />
                  ) : (
                    <p className={`text-2xl font-bold tracking-tight ${
                      Math.abs(memberBalance || 0) <= 0.01 
                        ? 'text-text-primary dark:text-white' 
                        : memberBalance > 0 
                          ? 'text-success'
                          : 'text-error'
                    }`}>
                      {Math.abs(memberBalance || 0) <= 0.01 
                        ? '₹0'
                        : memberBalance > 0
                          ? `+₹${memberBalance?.toLocaleString('en-IN')}`
                          : `-₹${Math.abs(memberBalance || 0).toLocaleString('en-IN')}`
                      }
                    </p>
                  )}
                </div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  Math.abs(memberBalance || 0) <= 0.01 
                    ? 'bg-gray-200 dark:bg-neutral-600' 
                    : memberBalance > 0 
                      ? 'bg-success-light dark:bg-success/20'
                      : 'bg-error-light dark:bg-error/20'
                }`}>
                  {Math.abs(memberBalance || 0) <= 0.01 ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-text-muted dark:text-neutral-400">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  ) : memberBalance > 0 ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-success">
                      <path d="M12 19V5M5 12l7-7 7 7" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-error">
                      <path d="M12 5v14M5 12l7 7 7-7" />
                    </svg>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Segmented Tab Control */}
      <div className="sticky top-0 bg-background dark:bg-neutral-900 z-10 px-4 py-3">
        <div className="flex bg-gray-200/60 dark:bg-neutral-800 rounded-xl p-1">
          {[
            { id: 'rooms', label: 'Rooms' },
            { id: 'history', label: 'History' },
            { id: 'settings', label: 'Settings' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id 
                  ? 'bg-surface dark:bg-neutral-700 text-text-primary dark:text-white shadow-sm' 
                  : 'text-text-secondary dark:text-neutral-400'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-4 py-2">
        
        {/* Rooms Tab */}
        {activeTab === 'rooms' && (
          <div className="space-y-3">
            {/* Active Room Card */}
            {currentRoom && (
              <div className="bg-surface dark:bg-neutral-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center text-white font-semibold">
                    {currentRoom.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-text-primary dark:text-white truncate">{currentRoom.name}</p>
                      <span className="px-1.5 py-0.5 bg-success-light dark:bg-success/20 text-success text-[10px] font-semibold rounded">ACTIVE</span>
                    </div>
                    <p className="text-xs text-text-muted dark:text-neutral-400 font-mono">{currentRoom.code}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleCopyCode}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors"
                      title="Copy code"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-muted">
                        <rect x="9" y="9" width="13" height="13" rx="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setShowLeaveConfirm(true)}
                      disabled={!canLeaveRoom}
                      className={`p-2 rounded-lg transition-colors ${
                        canLeaveRoom 
                          ? 'hover:bg-error-light dark:hover:bg-error/20 text-error' 
                          : 'text-gray-300 dark:text-neutral-600 cursor-not-allowed'
                      }`}
                      title={canLeaveRoom ? 'Leave room' : 'Settle balance first'}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                    </button>
                  </div>
                </div>
                {!canLeaveRoom && memberBalance !== null && (
                  <div className="px-4 pb-3">
                    <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg py-2 px-3 text-center">
                      Settle your balance to leave
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Room List */}
            <div>
              <p className="text-xs font-semibold text-text-muted dark:text-neutral-500 uppercase tracking-wider mb-2 px-1">All Rooms</p>
              {loading ? (
                <div className="space-y-2">
                  {[1, 2].map(i => (
                    <div key={i} className="bg-surface dark:bg-neutral-800 rounded-xl p-4 animate-pulse">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-neutral-700" />
                        <div className="flex-1">
                          <div className="h-4 w-24 bg-gray-200 dark:bg-neutral-700 rounded mb-2" />
                          <div className="h-3 w-16 bg-gray-200 dark:bg-neutral-700 rounded" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : userRooms.length === 0 ? (
                <div className="bg-surface dark:bg-neutral-800 rounded-2xl p-8 text-center">
                  <div className="w-14 h-14 bg-gray-100 dark:bg-neutral-700 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-muted">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-text-primary dark:text-white">No rooms yet</p>
                  <p className="text-xs text-text-muted dark:text-neutral-400 mt-1">Create or join a room to get started</p>
                  <button 
                    onClick={() => navigate('/')}
                    className="mt-4 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
                  >
                    Get Started →
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {userRooms.map(room => (
                    <button
                      key={room.id}
                      onClick={() => {
                        selectRoom(room);
                        navigate('/');
                      }}
                      className={`w-full bg-surface dark:bg-neutral-800 rounded-xl p-3 flex items-center gap-3 transition-all active:scale-[0.98] ${
                        currentRoom?.id === room.id ? 'ring-2 ring-primary/20' : ''
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-semibold ${
                        currentRoom?.id === room.id 
                          ? 'bg-gradient-to-br from-primary to-orange-500 text-white' 
                          : 'bg-gray-100 dark:bg-neutral-700 text-text-secondary dark:text-neutral-300'
                      }`}>
                        {room.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium text-text-primary dark:text-white">{room.name}</p>
                        <p className="text-xs text-text-muted dark:text-neutral-400 font-mono">{room.code}</p>
                      </div>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-300 dark:text-neutral-600">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* History Tab - Bank Statement Style */}
        {activeTab === 'history' && (
          <div>
            {!currentRoom ? (
              <div className="bg-surface dark:bg-neutral-800 rounded-2xl p-8 text-center">
                <div className="w-14 h-14 bg-gray-100 dark:bg-neutral-700 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-muted">
                    <path d="M12 8v4l3 3" />
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-text-primary dark:text-white">Select a room first</p>
                <p className="text-xs text-text-muted dark:text-neutral-400 mt-1">Transaction history will appear here</p>
              </div>
            ) : historyLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-surface dark:bg-neutral-800 rounded-xl p-4 animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-neutral-700" />
                      <div className="flex-1">
                        <div className="h-4 w-32 bg-gray-200 dark:bg-neutral-700 rounded mb-2" />
                        <div className="h-3 w-20 bg-gray-200 dark:bg-neutral-700 rounded" />
                      </div>
                      <div className="h-5 w-16 bg-gray-200 dark:bg-neutral-700 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : settlementHistory.length === 0 ? (
              <div className="bg-surface dark:bg-neutral-800 rounded-2xl p-8 text-center">
                <div className="w-14 h-14 bg-gray-100 dark:bg-neutral-700 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-muted">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-text-primary dark:text-white">No transactions</p>
                <p className="text-xs text-text-muted dark:text-neutral-400 mt-1">Your settlement history will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Today */}
                {groupedHistory.today.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-text-muted dark:text-neutral-500 uppercase tracking-wider mb-2 px-1">Today</p>
                    <div className="bg-surface dark:bg-neutral-800 rounded-2xl overflow-hidden divide-y divide-divider dark:divide-neutral-700">
                      {groupedHistory.today.map((settlement) => {
                        const isReceiver = settlement.toMemberId === currentUserMember?.id;
                        return (
                          <div key={settlement.id} className="p-3 flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              isReceiver ? 'bg-success-light dark:bg-success/20' : 'bg-error-light dark:bg-error/20'
                            }`}>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={isReceiver ? 'text-success' : 'text-error'}>
                                <path d={isReceiver ? "M12 19V5M5 12l7-7 7 7" : "M12 5v14M5 12l7 7 7-7"} />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-text-primary dark:text-white truncate">
                                {isReceiver ? settlement.fromMemberName : settlement.toMemberName}
                              </p>
                              <p className="text-xs text-text-muted dark:text-neutral-400">
                                {isReceiver ? 'Received' : 'Paid'}
                              </p>
                            </div>
                            <p className={`text-base font-semibold tabular-nums ${
                              isReceiver ? 'text-success' : 'text-error'
                            }`}>
                              {isReceiver ? '+' : '-'}₹{settlement.amount.toLocaleString('en-IN')}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* This Week */}
                {groupedHistory.thisWeek.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-text-muted dark:text-neutral-500 uppercase tracking-wider mb-2 px-1">This Week</p>
                    <div className="bg-surface dark:bg-neutral-800 rounded-2xl overflow-hidden divide-y divide-divider dark:divide-neutral-700">
                      {groupedHistory.thisWeek.map((settlement) => {
                        const isReceiver = settlement.toMemberId === currentUserMember?.id;
                        const date = settlement.settledAt?.toDate?.() || new Date();
                        return (
                          <div key={settlement.id} className="p-3 flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              isReceiver ? 'bg-success-light dark:bg-success/20' : 'bg-error-light dark:bg-error/20'
                            }`}>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={isReceiver ? 'text-success' : 'text-error'}>
                                <path d={isReceiver ? "M12 19V5M5 12l7-7 7 7" : "M12 5v14M5 12l7 7 7-7"} />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-text-primary dark:text-white truncate">
                                {isReceiver ? settlement.fromMemberName : settlement.toMemberName}
                              </p>
                              <p className="text-xs text-text-muted dark:text-neutral-400">
                                {date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' })}
                              </p>
                            </div>
                            <p className={`text-base font-semibold tabular-nums ${
                              isReceiver ? 'text-success' : 'text-error'
                            }`}>
                              {isReceiver ? '+' : '-'}₹{settlement.amount.toLocaleString('en-IN')}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Earlier */}
                {groupedHistory.earlier.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-text-muted dark:text-neutral-500 uppercase tracking-wider mb-2 px-1">Earlier</p>
                    <div className="bg-surface dark:bg-neutral-800 rounded-2xl overflow-hidden divide-y divide-divider dark:divide-neutral-700">
                      {groupedHistory.earlier.map((settlement) => {
                        const isReceiver = settlement.toMemberId === currentUserMember?.id;
                        const date = settlement.settledAt?.toDate?.() || new Date();
                        return (
                          <div key={settlement.id} className="p-3 flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              isReceiver ? 'bg-success-light dark:bg-success/20' : 'bg-error-light dark:bg-error/20'
                            }`}>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={isReceiver ? 'text-success' : 'text-error'}>
                                <path d={isReceiver ? "M12 19V5M5 12l7-7 7 7" : "M12 5v14M5 12l7 7 7-7"} />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-text-primary dark:text-white truncate">
                                {isReceiver ? settlement.fromMemberName : settlement.toMemberName}
                              </p>
                              <p className="text-xs text-text-muted dark:text-neutral-400">
                                {date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                              </p>
                            </div>
                            <p className={`text-base font-semibold tabular-nums ${
                              isReceiver ? 'text-success' : 'text-error'
                            }`}>
                              {isReceiver ? '+' : '-'}₹{settlement.amount.toLocaleString('en-IN')}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-4">
            {/* Preferences */}
            <div>
              <p className="text-xs font-semibold text-text-muted dark:text-neutral-500 uppercase tracking-wider mb-2 px-1">Preferences</p>
              <div className="bg-surface dark:bg-neutral-800 rounded-2xl overflow-hidden">
                {/* Dark Mode */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-neutral-700 flex items-center justify-center">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-secondary dark:text-neutral-300">
                        {darkMode ? (
                          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                        ) : (
                          <>
                            <circle cx="12" cy="12" r="5" />
                            <line x1="12" y1="1" x2="12" y2="3" />
                            <line x1="12" y1="21" x2="12" y2="23" />
                            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                            <line x1="1" y1="12" x2="3" y2="12" />
                            <line x1="21" y1="12" x2="23" y2="12" />
                            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                          </>
                        )}
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary dark:text-white">Dark Mode</p>
                      <p className="text-xs text-text-muted dark:text-neutral-400">Switch appearance</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setDarkMode(!darkMode)}
                    className={`w-12 h-7 rounded-full transition-colors relative ${
                      darkMode ? 'bg-primary' : 'bg-gray-300 dark:bg-neutral-600'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform shadow ${
                      darkMode ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                <div className="h-px bg-divider dark:bg-neutral-700 mx-4" />

                {/* Notifications */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-neutral-700 flex items-center justify-center">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-secondary dark:text-neutral-300">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary dark:text-white">Notifications</p>
                      <p className="text-xs text-text-muted dark:text-neutral-400">Push alerts</p>
                    </div>
                  </div>
                  <button className="w-12 h-7 rounded-full bg-primary relative">
                    <div className="w-5 h-5 bg-white rounded-full absolute top-1 translate-x-6 shadow" />
                  </button>
                </div>
              </div>
            </div>

            {/* Account */}
            <div>
              <p className="text-xs font-semibold text-text-muted dark:text-neutral-500 uppercase tracking-wider mb-2 px-1">Account</p>
              <div className="bg-surface dark:bg-neutral-800 rounded-2xl overflow-hidden">
                <button
                  onClick={handleSignOut}
                  className="w-full p-4 flex items-center gap-3 text-error hover:bg-error-light dark:hover:bg-error/10 transition-colors active:scale-[0.98]"
                >
                  <div className="w-9 h-9 rounded-lg bg-error-light dark:bg-error/20 flex items-center justify-center">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium">Sign Out</span>
                </button>
              </div>
            </div>

            {/* App Info */}
            <div className="text-center pt-4 pb-2">
              <p className="text-xs text-text-muted dark:text-neutral-500">Split · Version 1.0.0</p>
            </div>
          </div>
        )}
      </div>

      {/* Leave Room Modal */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-surface dark:bg-neutral-800 rounded-t-3xl sm:rounded-2xl p-6 w-full sm:max-w-sm">
            <div className="w-10 h-1 bg-gray-300 dark:bg-neutral-600 rounded-full mx-auto mb-5 sm:hidden" />
            <div className="w-12 h-12 bg-error-light dark:bg-error/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-error">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-text-primary dark:text-white text-center mb-2">Leave Room?</h3>
            <p className="text-sm text-text-muted dark:text-neutral-400 text-center mb-6">
              You can rejoin "{currentRoom?.name}" later using the room code.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="flex-1 h-11 rounded-xl bg-gray-100 dark:bg-neutral-700 text-text-secondary dark:text-neutral-200 text-sm font-medium hover:bg-gray-200 dark:hover:bg-neutral-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLeaveRoom}
                disabled={leaving}
                className="flex-1 h-11 rounded-xl bg-error text-white text-sm font-medium hover:bg-error/90 disabled:opacity-50 transition-colors"
              >
                {leaving ? 'Leaving...' : 'Leave'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileScreen;
