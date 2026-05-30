import { useEffect, useRef } from 'react';

const BlackBackground = ({ children, withGlow = false, glowComponent = null }) => {
  const backgroundRef = useRef(null);

  // Performance check and reduced motion
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion && backgroundRef.current) {
      backgroundRef.current.classList.add('reduced-motion');
    }
  }, []);

  return (
    <div ref={backgroundRef} className="black-background">
      {/* Pure black background - no textures, no grids */}
      
      {/* Optional component-specific glow */}
      {withGlow && glowComponent && (
        <div className="component-glow">
          {glowComponent}
        </div>
      )}
      
      {children}
    </div>
  );
};

export default BlackBackground;