export const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel', type = 'danger' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-bg-card border border-white/10 rounded-2xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-text-secondary mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className={`flex-1 font-medium px-4 py-2 rounded-lg ${
              type === 'danger' ? 'bg-red-600 hover:bg-red-700 text-white' :
              'bg-cyan hover:bg-cyan/80 text-black'
            }`}
          >
            {confirmText}
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-4 py-2 rounded-lg"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
};
