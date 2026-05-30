import { useEffect, useState } from 'react';
import Starfield from './Starfield';

const BackgroundProvider = ({ children, useStarfield = true, useGradient = true }) => {
  const [backgroundType, setBackgroundType] = useState('default');

  // Define different background themes
  const backgroundThemes = {
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

  // Apply background theme to document
  useEffect(() => {
    const theme = backgroundThemes[backgroundType] || backgroundThemes.default;
    if (useGradient) {
      document.body.style.background = theme.gradient;
      document.body.style.backgroundAttachment = 'fixed';
      document.body.style.minHeight = '100vh';
    } else {
      document.body.style.background = 'transparent';
    }

    return () => {
      document.body.style.background = '';
      document.body.style.backgroundAttachment = '';
      document.body.style.minHeight = '';
    };
  }, [backgroundType, useGradient]);

  return (
    <>
      {/* Starfield background (if enabled) - or gradient-only for performance */}
      {useStarfield && backgroundThemes[backgroundType]?.starfield ? (
        <Starfield />
      ) : (
        useGradient && (
          <div className="fixed inset-0 pointer-events-none z-[-2]" style={{
            background: backgroundThemes[backgroundType]?.gradient || backgroundThemes.default.gradient,
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