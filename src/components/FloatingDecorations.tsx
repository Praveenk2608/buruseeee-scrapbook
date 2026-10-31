import React from 'react';
import { motion } from 'framer-motion';

export const FloatingDecorations: React.FC = () => {
  const decorations = [
    { emoji: '🎀', left: '3%', top: '8%', size: 'text-2xl md:text-3xl', delay: 0, duration: 7 },
    { emoji: '🦋', left: '93%', top: '14%', size: 'text-2xl md:text-3xl', delay: 1.2, duration: 8.5 },
    { emoji: '💗', left: '6%', top: '24%', size: 'text-3xl md:text-4xl', delay: 0.5, duration: 8 },
    { emoji: '✨', left: '91%', top: '32%', size: 'text-xl md:text-2xl', delay: 2, duration: 6 },
    { emoji: '🎀', left: '4%', top: '42%', size: 'text-2xl md:text-3xl', delay: 1.8, duration: 9 },
    { emoji: '🦋', left: '94%', top: '50%', size: 'text-3xl', delay: 0.7, duration: 8 },
    { emoji: '💕', left: '5%', top: '60%', size: 'text-2xl md:text-3xl', delay: 2.2, duration: 7.5 },
    { emoji: '⭐', left: '92%', top: '68%', size: 'text-xl md:text-2xl', delay: 1.5, duration: 6.5 },
    { emoji: '🎗️', left: '7%', top: '78%', size: 'text-2xl md:text-3xl', delay: 0.3, duration: 8.2 },
    { emoji: '🌸', left: '90%', top: '86%', size: 'text-3xl md:text-4xl', delay: 2.7, duration: 7.8 },
    { emoji: '💖', left: '4%', top: '94%', size: 'text-2xl md:text-3xl', delay: 1.1, duration: 8.5 },
    { emoji: '🦋', left: '88%', top: '96%', size: 'text-2xl md:text-3xl', delay: 1.9, duration: 7 },
  ];

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {decorations.map((item, idx) => (
        <motion.div
          key={idx}
          className={`absolute ${item.size} select-none opacity-45 hover:opacity-80 transition-opacity`}
          style={{ left: item.left, top: item.top }}
          animate={{
            y: [-18, 18, -18],
            rotate: [-10, 10, -10],
            scale: [0.92, 1.08, 0.92],
          }}
          transition={{
            duration: item.duration,
            repeat: Infinity,
            delay: item.delay,
            ease: 'easeInOut',
          }}
        >
          {item.emoji}
        </motion.div>
      ))}
    </div>
  );
};
