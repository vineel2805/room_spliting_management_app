import React, { useEffect, useState } from 'react';

const Toast = ({ 
  message, 
  type = 'info', 
  duration = 5000, 
  onUndo, 
  onClose,
  showUndo = false 
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 300);
  };

  const handleUndo = () => {
    onUndo?.();
    handleClose();
  };

  if (!isVisible) return null;

  const bgColor = {
    info: 'bg-gray-800',
    success: 'bg-green-600',
    error: 'bg-red-600',
    warning: 'bg-amber-600'
  }[type];

  return (
    <div 
      className={`fixed bottom-28 left-4 right-4 z-[60] flex justify-center transition-all duration-300 ${
        isExiting ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
      }`}
    >
      <div className={`${bgColor} text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 max-w-sm w-full`}>
        {/* Icon */}
        {type === 'success' && (
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}
        {type === 'error' && (
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
        {type === 'info' && (
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
        {type === 'warning' && (
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        )}
        
        {/* Message */}
        <p className="flex-1 text-sm font-medium">{message}</p>
        
        {/* Undo Button */}
        {showUndo && onUndo && (
          <button
            onClick={handleUndo}
            className="text-sm font-bold uppercase tracking-wide text-white/90 hover:text-white px-2 py-1 -mr-2 hover:bg-white/10 rounded transition-colors"
          >
            Undo
          </button>
        )}
        
        {/* Close Button */}
        {!showUndo && (
          <button onClick={handleClose} className="p-1 -mr-1 hover:bg-white/10 rounded transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default Toast;
