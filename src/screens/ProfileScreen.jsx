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
        const userMember = members.find(m => m.oderId === user.uid);
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
        const userMember = members.find(m => m.oderId === user.uid);
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
  const currentUserMember = members.find(m => m.oderId === user?.uid);

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Profile Header - Modern Gradient Style */}
      <div className="bg-gradient-to-br from-primary via-primary to-orange-400 px-5 pt-12 pb-8">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-white/80 mb-6 hover:text-white transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span className="text-sm font-medium">Back</span>
        </button>
        
        {/* User Profile Card */}
        <div className="flex items-center gap-4">
          {user.photoURL ? (
            <img 
              src={user.photoURL} 
              alt="Profile" 
              className="w-20 h-20 rounded-2xl border-4 border-white/20 shadow-lg object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center text-white text-3xl font-bold shadow-lg backdrop-blur-sm">
              {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-white truncate">
              {user.displayName || 'User'}
            </h1>
            <p className="text-sm text-white/70 truncate">{user.email}</p>
            {currentRoom && (
              <div className="mt-2 inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-xs text-white font-medium truncate max-w-[120px]">{currentRoom.name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Balance Summary Card */}
        {currentRoom && (
          <div className="mt-6 bg-white/15 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-white/60 uppercase tracking-wide font-medium">Your Balance</p>
                {balanceLoading ? (
                  <div className="h-8 w-24 bg-white/20 rounded-lg animate-pulse mt-1" />
                ) : (
                  <p className={`text-2xl font-bold mt-1 ${
                    Math.abs(memberBalance || 0) <= 0.01 
                      ? 'text-green-300' 
                      : memberBalance > 0 
                        ? 'text-green-300'
                        : 'text-red-300'
                  }`}>
                    {Math.abs(memberBalance || 0) <= 0.01 
                      ? '✓ Settled'
                      : memberBalance > 0
                        ? `+₹${memberBalance?.toLocaleString('en-IN')}`
                        : `-₹${Math.abs(memberBalance || 0).toLocaleString('en-IN')}`
                    }
                  </p>
                )}
              </div>
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                Math.abs(memberBalance || 0) <= 0.01 
                  ? 'bg-green-400/20' 
                  : memberBalance > 0 
                    ? 'bg-green-400/20'
                    : 'bg-red-400/20'
              }`}>
                {Math.abs(memberBalance || 0) <= 0.01 ? (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-green-300">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                ) : memberBalance > 0 ? (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-green-300">
                    <path d="M12 19V5M5 12l7-7 7 7" />
                  </svg>
                ) : (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-red-300">
                    <path d="M12 5v14M5 12l7 7 7-7" />
                  </svg>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="sticky top-0 bg-background z-10 px-5 pt-4 pb-2">
        <div className="flex bg-surface rounded-xl p-1 shadow-sm border border-divider">
          {[
            { id: 'rooms', label: 'Rooms', icon: '🏠' },
            { id: 'history', label: 'History', icon: '📜' },
            { id: 'settings', label: 'Settings', icon: '⚙️' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id 
                  ? 'bg-primary text-white shadow-sm' 
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <span className="mr-1.5">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-5 py-4">
        
        {/* Rooms Tab */}
        {activeTab === 'rooms' && (
          <div className="space-y-4">
            {/* Current Room Actions */}
            {currentRoom && (
              <div className="bg-surface rounded-2xl shadow-card overflow-hidden border border-divider">
                <div className="p-4 border-b border-divider">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-xl">
                        {currentRoom.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-text-primary">{currentRoom.name}</p>
                        <p className="text-xs text-text-muted mt-0.5">Code: <span className="font-mono font-medium">{currentRoom.code}</span></p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-full">Active</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 divide-x divide-divider">
                  <button
                    onClick={handleCopyCode}
                    className="p-4 flex items-center justify-center gap-2 text-text-secondary hover:bg-background transition-colors active:scale-95"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    <span className="text-sm font-medium">Copy Code</span>
                  </button>
                  <button
                    onClick={() => setShowLeaveConfirm(true)}
                    disabled={!canLeaveRoom}
                    className={`p-4 flex items-center justify-center gap-2 transition-colors active:scale-95 ${
                      canLeaveRoom 
                        ? 'text-error hover:bg-error/5' 
                        : 'text-text-muted cursor-not-allowed opacity-50'
                    }`}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    <span className="text-sm font-medium">Leave</span>
                  </button>
                </div>
                
                {!canLeaveRoom && memberBalance !== null && (
                  <div className="px-4 pb-4">
                    <p className="text-xs text-amber-600 bg-amber-50 rounded-lg p-3 text-center">
                      ⚠️ Settle your balance before leaving
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Room List */}
            <div>
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Your Rooms</h3>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2].map(i => (
                    <div key={i} className="bg-surface rounded-xl p-4 shadow-card animate-pulse border border-divider">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-divider" />
                        <div className="flex-1">
                          <div className="h-5 w-32 bg-divider rounded mb-2" />
                          <div className="h-4 w-20 bg-divider rounded" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : userRooms.length === 0 ? (
                <div className="bg-surface rounded-xl p-8 shadow-card text-center border border-divider">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">🏠</span>
                  </div>
                  <p className="text-sm text-text-secondary font-medium">No rooms joined yet</p>
                  <p className="text-xs text-text-muted mt-1">Create or join a room to get started</p>
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
                      className={`w-full bg-surface rounded-xl p-4 flex items-center justify-between shadow-card hover:shadow-md transition-all border active:scale-[0.98] ${
                        currentRoom?.id === room.id ? 'border-primary ring-1 ring-primary/20' : 'border-divider'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg font-bold ${
                          currentRoom?.id === room.id ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
                        }`}>
                          {room.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-semibold text-text-primary">{room.name}</p>
                          <p className="text-xs text-text-muted font-mono">{room.code}</p>
                        </div>
                      </div>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-muted">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div>
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Settlement History</h3>
            {!currentRoom ? (
              <div className="bg-surface rounded-xl p-8 shadow-card text-center border border-divider">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">📋</span>
                </div>
                <p className="text-sm text-text-secondary font-medium">Select a room first</p>
                <p className="text-xs text-text-muted mt-1">History will appear here</p>
              </div>
            ) : historyLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-surface rounded-xl p-4 shadow-card animate-pulse border border-divider">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-divider" />
                      <div className="flex-1">
                        <div className="h-5 w-48 bg-divider rounded mb-2" />
                        <div className="h-4 w-24 bg-divider rounded" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : settlementHistory.length === 0 ? (
              <div className="bg-surface rounded-xl p-8 shadow-card text-center border border-divider">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">💰</span>
                </div>
                <p className="text-sm text-text-secondary font-medium">No settlements yet</p>
                <p className="text-xs text-text-muted mt-1">Your settlement history will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {settlementHistory.map((settlement) => {
                  const isReceiver = settlement.toMemberId === currentUserMember?.id;
                  const date = settlement.settledAt?.toDate?.() || new Date();
                  
                  return (
                    <div key={settlement.id} className="bg-surface rounded-xl p-4 shadow-card border border-divider">
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-full flex items-center justify-center text-lg font-bold ${
                          isReceiver ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                        }`}>
                          {isReceiver ? '↓' : '↑'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-text-primary truncate">
                            {isReceiver 
                              ? `From ${settlement.fromMemberName}` 
                              : `To ${settlement.toMemberName}`
                            }
                          </p>
                          <p className="text-xs text-text-muted">
                            {date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                        <p className={`text-base font-bold ${isReceiver ? 'text-green-600' : 'text-red-600'}`}>
                          {isReceiver ? '+' : '-'}₹{settlement.amount.toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-4">
            {/* Appearance */}
            <div>
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Appearance</h3>
              <div className="bg-surface rounded-xl shadow-card overflow-hidden border border-divider">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-background flex items-center justify-center">
                      <span className="text-xl">{darkMode ? '🌙' : '☀️'}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-primary">Dark Mode</p>
                      <p className="text-xs text-text-muted">Reduce eye strain at night</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setDarkMode(!darkMode)}
                    className={`w-14 h-8 rounded-full transition-colors relative ${
                      darkMode ? 'bg-primary' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-transform shadow-md ${
                      darkMode ? 'translate-x-7' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div>
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Notifications</h3>
              <div className="bg-surface rounded-xl shadow-card overflow-hidden border border-divider">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-background flex items-center justify-center">
                      <span className="text-xl">🔔</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-primary">Push Notifications</p>
                      <p className="text-xs text-text-muted">Get notified of new messages</p>
                    </div>
                  </div>
                  <button className="w-14 h-8 rounded-full bg-primary relative">
                    <div className="w-6 h-6 bg-white rounded-full absolute top-1 translate-x-7 shadow-md" />
                  </button>
                </div>
              </div>
            </div>

            {/* Account Actions */}
            <div>
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Account</h3>
              <div className="bg-surface rounded-xl shadow-card overflow-hidden border border-divider">
                <button
                  onClick={handleSignOut}
                  className="w-full p-4 flex items-center gap-3 text-error hover:bg-error/5 transition-colors active:scale-[0.98]"
                >
                  <div className="w-11 h-11 rounded-xl bg-error/10 flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                  </div>
                  <span className="text-sm font-semibold">Sign Out</span>
                </button>
              </div>
            </div>

            {/* App Info */}
            <div className="text-center pt-6 pb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">💸</span>
              </div>
              <p className="text-sm font-semibold text-text-primary">Split</p>
              <p className="text-xs text-text-muted mt-1">Version 1.0.0</p>
              <p className="text-xs text-text-muted mt-2">Made with ❤️ for easy expense sharing</p>
            </div>
          </div>
        )}
      </div>

      {/* Leave Room Confirmation Modal */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-5">
          <div className="bg-surface rounded-t-3xl sm:rounded-2xl p-6 w-full sm:max-w-sm shadow-xl animate-slide-up">
            <div className="w-12 h-1 bg-divider rounded-full mx-auto mb-6 sm:hidden" />
            <div className="w-16 h-16 bg-error/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-error">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-text-primary text-center mb-2">Leave Room?</h3>
            <p className="text-sm text-text-secondary text-center mb-6">
              Are you sure you want to leave "{currentRoom?.name}"? You can rejoin later with the room code.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="flex-1 h-12 rounded-xl border border-divider text-text-secondary text-sm font-semibold hover:bg-background transition-colors active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={handleLeaveRoom}
                disabled={leaving}
                className="flex-1 h-12 rounded-xl bg-error text-white text-sm font-semibold hover:bg-error/90 disabled:opacity-50 transition-colors active:scale-95"
              >
                {leaving ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Leaving...
                  </span>
                ) : 'Leave Room'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileScreen;
