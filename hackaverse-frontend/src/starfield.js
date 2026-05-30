// Enhanced Cosmic Starfield Background
(function() {
  'use strict';

  let canvas, ctx, stars = [], animationId;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function init() {
    // Wait for DOM to be ready and React root to exist
    const checkReady = () => {
      const rootElement = document.getElementById('root');
      console.log('Starfield: Checking if ready...', { rootElement: !!rootElement, body: !!document.body });

      if (rootElement && document.body) {
        console.log('Starfield: Initializing...');

        canvas = document.createElement('canvas');
        canvas.id = 'starfield-canvas';
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100vw';
        canvas.style.height = '100vh';
        canvas.style.zIndex = '-999999';  // Ensure it's at the very back
        canvas.style.pointerEvents = 'none';
        canvas.style.background = '#000000';

        // Insert as first child to ensure it's at the back
        if (document.body.firstChild) {
          document.body.insertBefore(canvas, document.body.firstChild);
        } else {
          document.body.appendChild(canvas);
        }

        ctx = canvas.getContext('2d');

        resize();

        if (reducedMotion) {
          drawStatic();
        } else {
          animate();
        }

        window.addEventListener('resize', resize);

        console.log('Starfield: Initialized successfully');
      } else {
        // Retry after a short delay
        setTimeout(checkReady, 100);
      }
    };

    checkReady();
  }

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    generateStars();
  }

  function generateStars() {
    stars = [];
    
    // Performance-optimized star counts based on device capabilities
    const screenArea = window.innerWidth * window.innerHeight;
    const isLowEndDevice = window.matchMedia('(max-width: 768px)').matches || 
                          (navigator.deviceMemory && navigator.deviceMemory < 4);
    
    // Reduce star count for better performance
    const baseStarCount = isLowEndDevice 
      ? Math.min(300, Math.floor(screenArea / 10000)) 
      : Math.min(600, Math.floor(screenArea / 6000));
    
    // Add basic stars
    for (let i = 0; i < baseStarCount; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: 0.5 + Math.random() * 2,
        alpha: 0.3 + Math.random() * 0.7,
        baseAlpha: 0.3 + Math.random() * 0.7,
        twinkle: Math.random() * 0.03 + 0.005,
        phase: Math.random() * Math.PI * 2,
        color: Math.random() > 0.7 ? '#00F2EA' : '#FFFFFF'
      });
    }

    // High-end devices get cosmic elements
    if (!isLowEndDevice) {
      const numCosmicElements = Math.min(4, Math.floor(screenArea / 60000));
      for (let i = 0; i < numCosmicElements; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: 30 + Math.random() * 50,
          alpha: 0.05 + Math.random() * 0.1,
          baseAlpha: 0.05 + Math.random() * 0.1,
          twinkle: Math.random() * 0.01 + 0.003,
          isCosmicElement: true,
          color: '#00F2EA'
        });
      }
      
      // Shooting stars only on high-end
      const numShootingStars = Math.min(2, Math.floor(screenArea / 100000));
      for (let i = 0; i < numShootingStars; i++) {
        stars.push({
          x: -50,
          y: Math.random() * canvas.height * 0.6,
          radius: 1 + Math.random() * 2,
          alpha: 0.8,
          isShootingStar: true,
          velocityX: 2 + Math.random() * 5,
          velocityY: 0.2 + Math.random() * 1,
          spawnTime: Math.random() * 20000
        });
      }
    }
  }

  function drawStatic() {

    // Draw cosmic background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#0D1128');
    gradient.addColorStop(1, '#15193B');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    stars.forEach(star => {
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);

      if (star.color === '#FFFFFF') {
        ctx.fillStyle = `rgba(255, 255, 255, ${star.baseAlpha})`;
      } else {
        const hex = star.color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${star.baseAlpha})`;
      }

      ctx.fill();
    });

  }

  function animate() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Only redraw gradient periodically or on resize
    const shouldRedrawGradient = Date.now() % 30 === 0; // Every 30ms
    if (shouldRedrawGradient) {
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#0D1128');
      gradient.addColorStop(1, '#15193B');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    const time = Date.now() * 0.001;
    const isLowEndDevice = window.matchMedia('(max-width: 768px)').matches || 
                          (navigator.deviceMemory && navigator.deviceMemory < 4);

    stars.forEach(star => {
      if (star.isCosmicElement && !isLowEndDevice) {
        const pulseAlpha = star.baseAlpha + Math.sin(time * star.twinkle + star.phase) * 0.3;
        const alpha = Math.max(0.02, Math.min(0.2, pulseAlpha));
        
        ctx.globalAlpha = alpha;
        ctx.fillStyle = star.color;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
      } else if (star.isShootingStar && !isLowEndDevice) {
        star.x += star.velocityX;
        star.y += star.velocityY;

        if (star.x > canvas.width + 50 || star.y > canvas.height + 50) {
          star.x = -50;
          star.y = Math.random() * canvas.height * 0.6;
        }

        ctx.globalAlpha = 0.8;
        ctx.fillStyle = star.color;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Regular stars with twinkling
        const twinkleAlpha = star.baseAlpha + Math.sin(time * star.twinkle + star.phase) * 0.5;
        const alpha = Math.max(0.1, Math.min(1, twinkleAlpha));

        ctx.globalAlpha = alpha;
        ctx.fillStyle = star.color;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    ctx.globalAlpha = 1;
    animationId = requestAnimationFrame(animate);
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  // Cleanup animation on unload
  window.addEventListener('beforeunload', () => {
    if (typeof animationId !== 'undefined') {
      cancelAnimationFrame(animationId);
    }
  });
})();
