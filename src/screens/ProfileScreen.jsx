import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useRoom } from '../context/RoomContext';
import { getUserRooms, leaveRoom, calculateMemberOverallBalance } from '../services/authService';

const ProfileScreen = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { currentRoom, selectRoom, members } = useRoom();
  const [userRooms, setUserRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [memberBalance, setMemberBalance] = useState(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

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

  // Calculate member's balance when component mounts or room changes
  useEffect(() => {
    const loadBalance = async () => {
      if (currentRoom && user && members.length > 0) {
        setBalanceLoading(true);
        // Find the current user's member ID
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
    } catch (err) {
      console.error('Error leaving room:', err);
      alert(err.message || 'Failed to leave room');
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

  const canLeaveRoom = memberBalance !== null && Math.abs(memberBalance) <= 0.01;

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="bg-surface px-5 pt-12 pb-6 border-b border-divider">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-text-secondary mb-4"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span className="text-sm">Back</span>
        </button>
        
        {/* User Profile */}
        <div className="flex items-center gap-4">
          {user.photoURL ? (
            <img 
              src={user.photoURL} 
              alt="Profile" 
              className="w-16 h-16 rounded-full border-3 border-primary"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary-light flex items-center justify-center text-primary text-2xl font-semibold">
              {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-text-primary truncate">
              {user.displayName || 'User'}
            </h1>
            <p className="text-sm text-text-muted truncate">{user.email}</p>
          </div>
        </div>
      </div>

      <div className="px-5 py-6 space-y-6">
        {/* Current Room */}
        {currentRoom && (
          <div>
            <h2 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">Current Room</h2>
            <div className="bg-surface rounded-card shadow-card overflow-hidden">
              <div className="p-4 border-b border-divider">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-text-primary">{currentRoom.name}</p>
                    <p className="text-xs text-text-muted mt-0.5">Code: {currentRoom.code}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF7A45" strokeWidth="2">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                  </div>
                </div>
                
                {/* Balance Status */}
                {balanceLoading ? (
                  <div className="mt-3 p-3 rounded-lg bg-background">
                    <div className="skeleton h-4 w-48 rounded" />
                  </div>
                ) : memberBalance !== null && (
                  <div className={`mt-3 p-3 rounded-lg ${
                    Math.abs(memberBalance) <= 0.01 
                      ? 'bg-success-light' 
                      : memberBalance > 0 
                        ? 'bg-success-light'
                        : 'bg-error-light'
                  }`}>
                    <p className={`text-xs font-medium ${
                      Math.abs(memberBalance) <= 0.01 
                        ? 'text-success' 
                        : memberBalance > 0 
                          ? 'text-success'
                          : 'text-error'
                    }`}>
                      {Math.abs(memberBalance) <= 0.01 
                        ? '✓ All settled - You can leave this room'
                        : memberBalance > 0
                          ? `You are owed ₹${memberBalance.toLocaleString('en-IN')} - Settle before leaving`
                          : `You owe ₹${Math.abs(memberBalance).toLocaleString('en-IN')} - Settle before leaving`
                      }
                    </p>
                  </div>
                )}
              </div>
              
              <button
                onClick={() => setShowLeaveConfirm(true)}
                disabled={!canLeaveRoom}
                className={`w-full p-4 flex items-center gap-3 transition-colors ${
                  canLeaveRoom 
                    ? 'text-error hover:bg-error-light' 
                    : 'text-text-muted cursor-not-allowed opacity-50'
                }`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span className="text-sm font-medium">
                  {canLeaveRoom ? 'Leave Room' : 'Settle up to leave'}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Your Rooms */}
        <div>
          <h2 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">Your Rooms</h2>
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
            <div className="bg-surface rounded-card p-6 shadow-card text-center">
              <p className="text-sm text-text-muted">No rooms joined yet</p>
            </div>
          ) : (
            <div className="bg-surface rounded-card shadow-card divide-y divide-divider overflow-hidden">
              {userRooms.map(room => (
                <button
                  key={room.id}
                  onClick={() => {
                    selectRoom(room);
                    navigate('/');
                  }}
                  className={`w-full p-4 flex items-center justify-between hover:bg-background transition-colors ${
                    currentRoom?.id === room.id ? 'bg-primary-light' : ''
                  }`}
                >
                  <div className="text-left">
                    <p className="text-sm font-medium text-text-primary">{room.name}</p>
                    <p className="text-xs text-text-muted mt-0.5">Code: {room.code}</p>
                  </div>
                  {currentRoom?.id === room.id && (
                    <span className="text-xs font-medium text-primary bg-primary-light px-2 py-1 rounded-full">Active</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Settings */}
        <div>
          <h2 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">Settings</h2>
          <div className="bg-surface rounded-card shadow-card overflow-hidden">
            {/* Dark Mode Toggle */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center">
                  {darkMode ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-500">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-secondary">
                      <circle cx="12" cy="12" r="5" />
                      <line x1="12" y1="1" x2="12" y2="3" />
                      <line x1="12" y1="21" x2="12" y2="23" />
                      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                      <line x1="1" y1="12" x2="3" y2="12" />
                      <line x1="21" y1="12" x2="23" y2="12" />
                      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                    </svg>
                  )}
                </div>
                <span className="text-sm font-medium text-text-primary">Dark Mode</span>
              </div>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`w-12 h-7 rounded-full transition-colors ${
                  darkMode ? 'bg-primary' : 'bg-divider'
                } relative`}
              >
                <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform shadow-sm ${
                  darkMode ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          className="w-full bg-surface rounded-card shadow-card p-4 flex items-center justify-center gap-3 text-error hover:bg-error-light transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span className="text-sm font-medium">Sign Out</span>
        </button>
      </div>

      {/* Leave Room Confirmation Modal */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-5">
          <div className="bg-surface rounded-card p-6 w-full max-w-sm shadow-xl animate-slide-up">
            <h3 className="text-lg font-semibold text-text-primary mb-2">Leave Room?</h3>
            <p className="text-sm text-text-secondary mb-6">
              Are you sure you want to leave "{currentRoom?.name}"? You can rejoin later with the room code and password.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="flex-1 h-11 rounded-button border border-divider text-text-secondary text-sm font-medium hover:bg-background transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLeaveRoom}
                disabled={leaving}
                className="flex-1 h-11 rounded-button bg-error text-white text-sm font-medium hover:bg-error/90 disabled:opacity-50 transition-colors"
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
