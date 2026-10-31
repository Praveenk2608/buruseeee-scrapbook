import { useEffect, useState } from 'react';

interface Sparkle {
  id: number;
  x: number;
  y: number;
  emoji: string;
  size: number;
  rotation: number;
}

const EMOJIS = ['💗', '🎀', '🌸', '✨', '💕', '🌷'];

export const HeartCursor: React.FC = () => {
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);

  useEffect(() => {
    // Check if device has fine pointer (mouse), not touch-only
    const hasMouse = window.matchMedia('(pointer: fine)').matches;
    if (!hasMouse) return;

    let idCounter = 0;
    let lastTime = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      // Throttle to create one sparkle every 80ms
      if (now - lastTime < 80) return;
      lastTime = now;

      const randomEmoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
      const newSparkle: Sparkle = {
        id: idCounter++,
        x: e.clientX,
        y: e.clientY,
        emoji: randomEmoji,
        size: Math.floor(Math.random() * 8) + 12,
        rotation: (Math.random() - 0.5) * 40,
      };

      setSparkles((prev) => [...prev.slice(-15), newSparkle]);

      // Remove sparkle after 800ms
      setTimeout(() => {
        setSparkles((prev) => prev.filter((s) => s.id !== newSparkle.id));
      }, 800);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {sparkles.map((sparkle) => (
        <span
          key={sparkle.id}
          className="absolute transform -translate-x-1/2 -translate-y-1/2 select-none animate-heart-float"
          style={{
            left: `${sparkle.x}px`,
            top: `${sparkle.y}px`,
            fontSize: `${sparkle.size}px`,
            transform: `translate(-50%, -50%) rotate(${sparkle.rotation}deg)`,
          }}
        >
          {sparkle.emoji}
        </span>
      ))}
    </div>
  );
};
