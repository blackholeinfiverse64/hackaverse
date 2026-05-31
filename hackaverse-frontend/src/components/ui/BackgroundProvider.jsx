import { useEffect, useState } from 'react';
import Starfield from './Starfield';

// Defined OUTSIDE component so it's never recreated on re-render
const BACKGROUND_THEMES = {
  default: {
    gradient: 'linear-gradient(135deg, #0D1128 0%, #15193B 50%, #0F142E 100%)',
    starfield: true
  },
  cosmic: {
    gradient: 'linear-gradient(135deg, #1A1B3A 0%, #2D1B69 50%, #1A1B3A 100%)',
    starfield: true
  },
  nebula: {
    gradient: 'linear-gradient(135deg, #2D1B69 0%, #1A1B3A 50%, #2D1B69 100%)',
    starfield: true
  },
  galaxy: {
    gradient: 'linear-gradient(135deg, #0D1128 0%, #1A1B3A 50%, #2D1B69 100%)',
    starfield: true
  },
  minimal: {
    gradient: 'linear-gradient(135deg, #0D1128 0%, #15193B 100%)',
    starfield: false
  }
};

const BackgroundProvider = ({ children, useStarfield = true, useGradient = true }) => {
  const [backgroundType] = useState('default');

  const theme = BACKGROUND_THEMES[backgroundType] || BACKGROUND_THEMES.default;

  // Apply background theme to document — stable deps, no flicker
  useEffect(() => {
    if (useGradient) {
      document.body.style.background = theme.gradient;
      document.body.style.backgroundAttachment = 'fixed';
      document.body.style.minHeight = '100vh';
    }
    // Intentionally NO cleanup that clears background — prevents flash on re-mount
    // The background persists which is the correct behavior for a global background
  }, [backgroundType, useGradient, theme.gradient]);

  return (
    <>
      {/* Starfield background (if enabled) */}
      {useStarfield && theme.starfield ? (
        <Starfield />
      ) : (
        useGradient && (
          <div className="fixed inset-0 pointer-events-none z-[-2]" style={{
            background: theme.gradient,
          }} />
        )
      )}

      {/* Main content */}
      <div className="relative z-10">
        {children}
      </div>
    </>
  );
};

export default BackgroundProvider;