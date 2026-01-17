import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/', icon: 'home', label: 'Home' },
    { path: '/expenses', icon: 'receipt', label: 'Expenses' },
    { path: '/add', icon: 'add', label: 'Add', isCenter: true },
    { path: '/members', icon: 'group', label: 'Members' },
    { path: '/settle/room', icon: 'payments', label: 'Settle' },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const icons = {
    home: (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        {active && <path d="M9 22V12h6v10" fill="#F8FAFC" stroke="none" />}
      </svg>
    ),
    receipt: (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" fill="none" />
        {!active && (
          <>
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </>
        )}
      </svg>
    ),
    group: (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    payments: (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
        {!active && <line x1="1" y1="10" x2="23" y2="10" />}
      </svg>
    ),
    add: () => (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    ),
  };

  return (
    <div className="fixed bottom-5 left-4 right-4 z-50">
      <nav className="bg-white/95 backdrop-blur-xl rounded-[20px] shadow-dock border border-gray-100/50 flex items-center justify-around px-2 h-16 max-w-md mx-auto">
        {navItems.map((item) => {
          const active = isActive(item.path);
          
          if (item.isCenter) {
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="w-14 h-14 -mt-5 rounded-full bg-primary text-white shadow-fab flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
              >
                {icons[item.icon]()}
              </button>
            );
          }

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center gap-0.5 py-2 px-3 rounded-xl transition-all ${
                active 
                  ? 'text-primary' 
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <span className={`transition-transform ${active ? 'scale-110' : ''}`}>
                {icons[item.icon](active)}
              </span>
              <span className={`text-[10px] font-medium ${active ? 'text-primary' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default BottomNav;
