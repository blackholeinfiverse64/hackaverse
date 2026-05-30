/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const Toast = ({ message, type, onDismiss }) => {
  const typeStyles = {
    success: 'bg-success-green/20 border-success-green text-success-green',
    error: 'bg-error-red/20 border-error-red text-error-red',
    info: 'bg-secondary-cyan/20 border-secondary-cyan text-secondary-cyan',
    // use the `warning` color defined in tailwind config
    warning: 'bg-warning/20 border-warning text-warning',
  };

  return (
    <div className={`glass-card p-3 ${typeStyles[type]} border rounded-xl mb-3 flex items-center justify-between animate-slide-in-right`}>
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onDismiss} className="ml-3 opacity-70 hover:opacity-100">
        <i className="uil uil-times"></i>
      </button>
    </div>
  );
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const toast = {
    success: (message) => addToast(message, 'success'),
    error: (message) => addToast(message, 'error'),
    info: (message) => addToast(message, 'info'),
    warning: (message) => addToast(message, 'warning'),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed top-4 right-4 z-50 max-w-sm">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onDismiss={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// Note: Toast component is internal to the provider and not exported as default to keep module shape compatible with fast refresh.