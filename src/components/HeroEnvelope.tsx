import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ChevronDown, Music, ArrowRight, RotateCcw } from 'lucide-react';
import { triggerBirthdayConfetti } from '../utils/confetti';
import { soundManager } from '../utils/audioSynthesizer';
import type { ScrapbookConfig } from '../types';

interface HeroEnvelopeProps {
  config: ScrapbookConfig;
}

export const HeroEnvelope: React.FC<HeroEnvelopeProps> = ({ config }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenEnvelope = () => {
    soundManager.playCardFlip();
    setIsOpen(true);
    triggerBirthdayConfetti();
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
  };

  return (
    <section id="envelope" className="relative min-h-[90vh] flex items-center justify-center pt-20 pb-16 px-4">
      {/* Background radial sparkles & blush glow */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] bg-gradient-to-tr from-[#F48FB1]/20 via-[#FFF0F5]/40 to-[#E8DDF8]/20 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="max-w-2xl w-full mx-auto text-center">
        {/* Cute Top Ribbon Tag */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFF0F5] text-[#75445A] text-xs font-bold uppercase tracking-widest mb-6 border border-[#F48FB1]/40 shadow-xs"
        >
          <Sparkles size={14} className="text-[#F48FB1] animate-spin" style={{ animationDuration: '4s' }} />
          <span>A Baby Pink Birthday Surprise For {config.recipientName}</span>
          <span className="text-sm">🎀</span>
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="font-romantic text-5xl sm:text-6xl md:text-7xl text-[#75445A] mb-2 leading-tight drop-shadow-xs"
        >
          Happy Birthday, {config.recipientName}! 💗
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="font-handwriting text-2xl md:text-3xl text-[#75445A]/90 mb-8 max-w-lg mx-auto"
        >
          {config.tagline}
        </motion.p>

        {/* The Interactive Envelope Container */}
        <div className="relative mx-auto w-full max-w-md h-[360px] flex items-center justify-center perspective-[1000px]">
          <AnimatePresence mode="wait">
            {!isOpen ? (
              /* Sealed Envelope State */
              <motion.div
                key="sealed-envelope"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0, y: 40 }}
                transition={{ type: 'spring', damping: 20 }}
                onClick={handleOpenEnvelope}
                className="cursor-pointer group relative w-[340px] sm:w-[380px] h-[240px] bg-[#FFF0F5] rounded-3xl border-2 border-[#F48FB1]/50 shadow-xl flex flex-col items-center justify-center hover:scale-102 transition-transform duration-300"
                style={{
                  boxShadow: '0 25px 45px -12px rgba(244, 143, 177, 0.35), 0 8px 16px -4px rgba(117, 68, 90, 0.08)',
                }}
              >
                {/* Washi tape on envelope corners */}
                <div className="washi-tape washi-tape-lavender -top-3 -left-3 -rotate-12" />
                <div className="washi-tape washi-tape-peach -top-3 -right-3 rotate-12" />

                {/* Envelope Flap Triangles */}
                <div
                  className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-[#FCE4EC] to-[#F8BBD0] origin-top rounded-t-3xl transition-all duration-300 group-hover:brightness-105"
                  style={{
                    clipPath: 'polygon(0 0, 50% 100%, 100% 0)',
                  }}
                />

                {/* Wax Seal Stamp in Center */}
                <motion.div
                  whileHover={{ scale: 1.12, rotate: 6 }}
                  whileTap={{ scale: 0.92 }}
                  className="relative z-10 w-20 h-20 rounded-full bg-gradient-to-br from-[#F48FB1] via-[#F06292] to-[#ec407a] shadow-lg flex items-center justify-center border-2 border-white"
                >
                  <div className="w-16 h-16 rounded-full border border-dashed border-white/80 flex items-center justify-center">
                    <span className="font-script text-3xl font-bold text-white drop-shadow-sm">B</span>
                  </div>
                  {/* Subtle seal drip effect */}
                  <div className="absolute -bottom-1 w-3 h-3 bg-[#F06292] rounded-full blur-[0.5px]" />
                </motion.div>

                {/* Envelope Front Label */}
                <div className="relative z-10 mt-6 text-center">
                  <p className="font-handwriting text-2xl text-[#75445A] font-bold">
                    For: <span className="text-[#F48FB1] underline decoration-wavy decoration-[#F8BBD0]">{config.recipientName}</span> 💌
                  </p>
                  <p className="text-xs uppercase tracking-widest text-[#F48FB1] font-bold mt-1 animate-pulse">
                    Tap Wax Seal to Break & Open 🎀
                  </p>
                </div>
              </motion.div>
            ) : (
              /* Opened Envelope with Unfurled Letter State */
              <motion.div
                key="opened-envelope"
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 border border-[#F48FB1]/40 shadow-2xl text-left"
                style={{
                  boxShadow: '0 25px 50px -12px rgba(244, 143, 177, 0.35)',
                }}
              >
                {/* Washi tapes on letter */}
                <div className="washi-tape washi-tape-mint -top-3 left-6 -rotate-6" />
                <div className="washi-tape washi-tape-pink -top-3 right-6 rotate-6" />

                {/* Reset button to fold envelope back */}
                <button
                  onClick={handleReset}
                  className="absolute top-4 right-4 text-neutral-400 hover:text-[#F48FB1] p-1.5 rounded-full hover:bg-[#FFF0F5] transition-colors"
                  title="Seal envelope again"
                >
                  <RotateCcw size={16} />
                </button>

                {/* Stamp & Date */}
                <div className="flex items-center justify-between border-b border-pink-100 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🎂</span>
                    <div>
                      <span className="text-xs font-bold text-[#F48FB1] uppercase tracking-wider block">Special Edition</span>
                      <span className="text-xs text-[#75445A]/70">{config.birthdayDate}</span>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-[#FFF0F5] rounded-full border border-[#F48FB1]/30 text-[#75445A] font-mono text-xs font-semibold">
                    NO. 1 BESTIE 👑
                  </div>
                </div>

                {/* Letter Body */}
                <h3 className="font-romantic text-3xl sm:text-4xl text-[#75445A] mb-2 font-bold">
                  Dearest {config.recipientName},
                </h3>

                <p className="font-handwriting text-xl sm:text-2xl text-[#75445A]/90 leading-relaxed mb-4">
                  Today is all about YOU! Welcome to your very own handmade baby pink digital scrapbook and cinematic memory vault.
                  Every single page, photo, joke, and memory here was handcrafted with infinite love to celebrate how truly magical you are.
                </p>

                <p className="text-xs text-[#512DA8] font-semibold bg-[#E8DDF8]/50 p-2.5 rounded-xl border border-[#D1C4E9]/60 mb-6 flex items-center gap-2">
                  <Sparkles size={16} className="text-[#512DA8] shrink-0" />
                  <span>Scroll down to explore 8 chapters, 53 Polaroid memories, friends' video wishes, video maker, games & secret letters!</span>
                </p>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-3">
                  <a
                    href="#story"
                    className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-[#F48FB1] to-[#F06292] text-white font-bold text-sm shadow-md hover:shadow-lg hover:scale-102 transition-all"
                  >
                    <span>Read Our Story</span>
                    <ArrowRight size={15} />
                  </a>

                  <a
                    href="#friends-wishes"
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-[#FFF0F5] text-[#75445A] border border-[#F48FB1]/30 font-bold text-sm hover:bg-[#FCE4EC] transition-colors"
                  >
                    <span>Friends' Wishes 💌</span>
                  </a>

                  <button
                    onClick={() => {
                      soundManager.startBackgroundMelody();
                      triggerBirthdayConfetti();
                    }}
                    className="p-3 rounded-full bg-[#E8DDF8] text-[#512DA8] hover:bg-[#D1C4E9] transition-colors"
                    title="Play Birthday Melodies"
                  >
                    <Music size={16} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="mt-12 flex flex-col items-center gap-1 text-[#F48FB1] text-xs font-bold"
        >
          <span>Scroll to uncover the baby pink scrapbook</span>
          <ChevronDown size={18} />
        </motion.div>
      </div>
    </section>
  );
};
