import React, { createContext, useContext, useState, useCallback } from 'react';
import Toast from '../components/Toast';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null);

  const showToast = useCallback(({ message, type = 'info', duration = 5000, onUndo, showUndo = false }) => {
    // Clear any existing toast first
    setToast(null);
    // Small delay to ensure re-render
    setTimeout(() => {
      setToast({ message, type, duration, onUndo, showUndo });
    }, 50);
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onUndo={toast.onUndo}
          showUndo={toast.showUndo}
          onClose={hideToast}
        />
      )}
    </ToastContext.Provider>
  );
};
