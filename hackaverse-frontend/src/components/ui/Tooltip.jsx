import React, { useState } from 'react';

const Tooltip = ({ children, content, delay = 120 }) => {
  const [isVisible, setIsVisible] = useState(false);
  let timeoutId;

  const showTooltip = () => {
    timeoutId = setTimeout(() => setIsVisible(true), delay);
  };

  const hideTooltip = () => {
    clearTimeout(timeoutId);
    setIsVisible(false);
  };

  return (
    <div 
      className="relative"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      {isVisible && (
        <div className="absolute left-full ml-2 px-2 py-1 glass-card rounded-lg text-sm text-white whitespace-nowrap z-50 shadow-[0_10px_30px_-15px_rgba(0,0,0,.6)] animate-in fade-in-0 zoom-in-95 duration-150">
          {content}
        </div>
      )}
    </div>
  );
};

export default Tooltip;