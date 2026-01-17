import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const HomeIcon = ({ active }) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? "0" : "1.8"} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      {!active && <polyline points="9 22 9 12 15 12 15 22" />}
    </svg>
  );

  const ExpensesIcon = ({ active }) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? "0" : "1.8"} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M2 10h20" stroke={active ? "#fff" : "currentColor"} strokeWidth="1.8" fill="none" />
    </svg>
  );

  const MembersIcon = ({ active }) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? "0" : "1.8"} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );

  const SettleIcon = ({ active }) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? "0" : "1.8"} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );

  const PlusIcon = () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 pointer-events-none">
      {/* Floating Pill Navigation */}
      <nav className="pointer-events-auto bg-white rounded-[28px] shadow-[0_4px_24px_rgba(0,0,0,0.12)] mx-auto max-w-sm flex items-center h-16 px-2 relative">
        
        {/* Home */}
        <button
          onClick={() => navigate('/')}
          className={`flex-1 flex items-center justify-center py-3 transition-colors ${
            isActive('/') ? 'text-primary' : 'text-gray-400'
          }`}
        >
          <HomeIcon active={isActive('/')} />
        </button>

        {/* Expenses */}
        <button
          onClick={() => navigate('/expenses')}
          className={`flex-1 flex items-center justify-center py-3 transition-colors ${
            isActive('/expenses') ? 'text-primary' : 'text-gray-400'
          }`}
        >
          <ExpensesIcon active={isActive('/expenses')} />
        </button>

        {/* Center FAB - Add Button */}
        <div className="flex-1 flex items-center justify-center">
          <button
            onClick={() => navigate('/add')}
            className="absolute -top-5 w-14 h-14 bg-primary rounded-full shadow-[0_6px_20px_rgba(255,122,69,0.45)] flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
          >
            <PlusIcon />
          </button>
        </div>

        {/* Members */}
        <button
          onClick={() => navigate('/members')}
          className={`flex-1 flex items-center justify-center py-3 transition-colors ${
            isActive('/members') ? 'text-primary' : 'text-gray-400'
          }`}
        >
          <MembersIcon active={isActive('/members')} />
        </button>

        {/* Settle */}
        <button
          onClick={() => navigate('/settle/room')}
          className={`flex-1 flex items-center justify-center py-3 transition-colors ${
            isActive('/settle') ? 'text-primary' : 'text-gray-400'
          }`}
        >
          <SettleIcon active={isActive('/settle')} />
        </button>
      </nav>
    </div>
  );
};

export default BottomNav;
