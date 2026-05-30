import { useEffect, useRef } from 'react';

const Starfield = () => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let stars = [];
    let animationId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      generateStars();
    };

    const generateStars = () => {
      stars = [];
      const numStars = Math.min(800, Math.floor(window.innerWidth * window.innerHeight / 6000));

      // Add cosmic elements
      const numCosmicElements = Math.min(6, Math.floor(window.innerWidth * window.innerHeight / 40000));
      for (let i = 0; i < numCosmicElements; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: 20 + Math.random() * 40,
          alpha: 0.05 + Math.random() * 0.1,
          baseAlpha: 0.05 + Math.random() * 0.1,
          twinkle: Math.random() * 0.01 + 0.003,
          phase: Math.random() * Math.PI * 2,
          color: ['#BF40BF', '#C030D8', '#00F2EA', '#2DD4BF'][Math.floor(Math.random() * 4)],
          isCosmicElement: true,
          driftX: (Math.random() - 0.5) * 0.02,
          driftY: (Math.random() - 0.5) * 0.02
        });
      }

      // Add shooting stars
      const numShootingStars = Math.min(4, Math.floor(window.innerWidth * window.innerHeight / 50000));
      for (let i = 0; i < numShootingStars; i++) {
        stars.push({
          x: -50,
          y: Math.random() * canvas.height * 0.7,
          radius: 1 + Math.random() * 3,
          alpha: 0.7 + Math.random() * 0.3,
          baseAlpha: 0.7 + Math.random() * 0.3,
          twinkle: 0,
          phase: 0,
          color: ['#FFFFFF', '#00F2EA'][Math.floor(Math.random() * 2)],
          isShootingStar: true,
          velocityX: 1 + Math.random() * 6,
          velocityY: 0.2 + Math.random() * 2,
          trail: [],
          trailLength: 15 + Math.random() * 20
        });
      }

      // Add regular stars
      for (let i = 0; i < numStars; i++) {
        const isAccent = Math.random() > 0.6;
        const accentColors = ['#BF40BF', '#00F2EA', '#2DD4BF', '#3B82F6'];

        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: 0.5 + Math.random() * 2,
          alpha: 0.2 + Math.random() * 0.6,
          baseAlpha: 0.2 + Math.random() * 0.6,
          twinkle: Math.random() * 0.04 + 0.005,
          phase: Math.random() * Math.PI * 2,
          color: isAccent ? accentColors[Math.floor(Math.random() * accentColors.length)] : '#FFFFFF'
        });
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw cosmic background gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#0D1128');
      gradient.addColorStop(1, '#15193B');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const time = Date.now() * 0.001;

      stars.forEach(star => {
        ctx.save();

        if (star.isCosmicElement) {
          // Animate cosmic elements
          const pulseAlpha = star.baseAlpha + Math.sin(time * star.twinkle + star.phase) * 0.2;
          const alpha = Math.max(0.01, Math.min(0.15, pulseAlpha));

          star.x += star.driftX;
          star.y += star.driftY;

          // Wrap around edges
          if (star.x < -star.radius) star.x = canvas.width + star.radius;
          if (star.x > canvas.width + star.radius) star.x = -star.radius;
          if (star.y < -star.radius) star.y = canvas.height + star.radius;
          if (star.y > canvas.height + star.radius) star.y = -star.radius;

          ctx.shadowBlur = star.radius;
          ctx.shadowColor = star.color;
          ctx.globalAlpha = alpha;
          ctx.fillStyle = star.color;
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
          ctx.fill();
        } else if (star.isShootingStar) {
          // Animate shooting stars
          star.x += star.velocityX;
          star.y += star.velocityY;

          star.trail.push({ x: star.x, y: star.y, alpha: star.alpha });
          if (star.trail.length > star.trailLength) {
            star.trail.shift();
          }

          star.trail.forEach((point, index) => {
            const trailAlpha = (point.alpha * index) / star.trail.length;
            ctx.globalAlpha = trailAlpha;
            ctx.fillStyle = star.color;
            ctx.beginPath();
            ctx.arc(point.x, point.y, star.radius * (index / star.trail.length), 0, Math.PI * 2);
            ctx.fill();
          });

          if (star.x > canvas.width + 50 || star.y > canvas.height + 50) {
            star.x = -50;
            star.y = Math.random() * canvas.height * 0.7;
            star.trail = [];
          }
        } else {
          // Animate regular stars
          const twinkleAlpha = star.baseAlpha + Math.sin(time * star.twinkle + star.phase) * 0.4;
          const alpha = Math.max(0.1, Math.min(1, twinkleAlpha));

          ctx.beginPath();
          ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);

          if (star.color === '#FFFFFF') {
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
          } else {
            const hex = star.color.replace('#', '');
            const r = parseInt(hex.substr(0, 2), 16);
            const g = parseInt(hex.substr(2, 2), 16);
            const b = parseInt(hex.substr(4, 2), 16);
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
          }

          ctx.fill();
        }

        ctx.restore();
      });

      animationId = requestAnimationFrame(animate);
    };

    resize();
    animate();

    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: -1 }}
    />
  );
};

export default Starfield;
