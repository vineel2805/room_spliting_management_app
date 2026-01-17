import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/', icon: '🏠', label: 'Home' },
    { path: '/expenses', icon: '📝', label: 'Expenses' },
    { path: '/add', icon: '+', label: 'Add', isCenter: true },
    { path: '/members', icon: '👥', label: 'Members' },
    { path: '/settle/room', icon: '💰', label: 'Settle' },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 flex items-center justify-around px-2 z-50">
      {navItems.map((item) => {
        if (item.isCenter) {
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="w-14 h-14 -mt-4 rounded-full bg-gradient-primary text-white shadow-lg flex items-center justify-center text-xl font-bold hover:scale-110 active:scale-95 transition-transform"
            >
              {item.icon}
            </button>
          );
        }

        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-colors ${
              isActive(item.path) ? 'text-accent-orange' : 'text-money-neutral'
            }`}
          >
            <span className="text-2xl">{item.icon}</span>
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNav;
