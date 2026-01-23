import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useRoom } from '../context/RoomContext';

const FloatingChatButton = ({ unreadCount = 0 }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentRoom } = useRoom();

  // Hide on chat screen, login, or when no room selected
  const hiddenPaths = ['/chat', '/login'];
  if (!currentRoom || hiddenPaths.includes(location.pathname)) return null;

  return (
    <button
      onClick={() => navigate('/chat')}
      className="fixed bottom-24 right-5 w-12 h-12 bg-primary rounded-full shadow-lg flex items-center justify-center z-40 hover:scale-105 active:scale-95 transition-transform"
      aria-label="Open chat"
    >
      {/* Chat Icon */}
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className="w-5 h-5 text-white" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
        strokeWidth={2}
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
        />
      </svg>

      {/* Unread Badge */}
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 min-w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-sm">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
};

export default FloatingChatButton;
