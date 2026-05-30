import { useState, useCallback } from 'react';

export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const success = useCallback((message) => showToast(message, 'success'), [showToast]);
  const error = useCallback((message) => showToast(message, 'error'), [showToast]);
  const info = useCallback((message) => showToast(message, 'info'), [showToast]);

  return { toasts, success, error, info };
};

export const ToastContainer = ({ toasts }) => {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-2">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`px-4 py-3 rounded-lg shadow-lg border animate-slide-in-right ${
            toast.type === 'success' ? 'bg-green-500/90 border-green-400 text-white' :
            toast.type === 'error' ? 'bg-red-500/90 border-red-400 text-white' :
            'bg-blue-500/90 border-blue-400 text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <i className={`uil ${
              toast.type === 'success' ? 'uil-check-circle' :
              toast.type === 'error' ? 'uil-times-circle' :
              'uil-info-circle'
            }`}></i>
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      ))}
    </div>
  );
};
