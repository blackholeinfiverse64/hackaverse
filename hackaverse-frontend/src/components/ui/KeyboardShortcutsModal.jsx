import { useEffect, useState } from 'react';
import UIPortal from './UIPortal';

const KeyboardShortcutsModal = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Cmd/Ctrl + ? to open shortcuts
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === '?') {
        e.preventDefault();
        setIsOpen(!isOpen);
      }
      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const shortcuts = [
    { keys: ['Cmd/Ctrl', '?'], description: 'Open keyboard shortcuts' },
    { keys: ['/'], description: 'Focus search' },
    { keys: ['Esc'], description: 'Close modal or search' },
    { keys: ['C'], description: 'Toggle sidebar collapse' },
    { keys: ['Cmd/Ctrl', 'K'], description: 'Command palette' },
    { keys: ['Cmd/Ctrl', 'B'], description: 'Toggle dark mode' },
  ];

  if (!isOpen) return null;

  return (
    <UIPortal>
      <div 
        className="fixed inset-0 z-[1400] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={() => setIsOpen(false)}
      >
        <div 
          className="glass-card w-full max-w-lg mx-4 max-h-96 overflow-auto animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-black/40 px-6 py-4 border-b border-white/10 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <i className="uil uil-keyboard text-cyan-400"></i>
              Keyboard Shortcuts
            </h2>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/60 hover:text-white transition-colors"
              aria-label="Close"
            >
              <i className="uil uil-times text-xl"></i>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {shortcuts.map((shortcut, i) => (
              <div key={i} className="flex items-center justify-between hover:bg-white/5 p-2 rounded-lg transition-colors">
                <span className="text-white/80">{shortcut.description}</span>
                <div className="flex gap-1">
                  {shortcut.keys.map((key, j) => (
                    <div key={j} className="flex items-center gap-1">
                      <kbd className="px-2 py-1 bg-white/10 border border-white/20 rounded text-white/70 text-xs font-medium">
                        {key}
                      </kbd>
                      {j < shortcut.keys.length - 1 && <span className="text-white/40">+</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="bg-black/40 px-6 py-3 border-t border-white/10 text-center text-white/60 text-sm">
            Press <kbd className="px-2 py-1 bg-white/10 rounded text-xs">Esc</kbd> to close
          </div>
        </div>
      </div>
    </UIPortal>
  );
};

export default KeyboardShortcutsModal;
