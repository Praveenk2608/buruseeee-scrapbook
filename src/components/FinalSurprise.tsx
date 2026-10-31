import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Sparkles, ArrowUp, RotateCcw } from 'lucide-react';
import type { PhotoItem } from '../types';
import { triggerBirthdayConfetti, triggerHeartConfetti } from '../utils/confetti';
import { soundManager } from '../utils/audioSynthesizer';

interface FinalSurpriseProps {
  recipientName: string;
  senderName: string;
  finalLetter: {
    title: string;
    paragraphs: string[];
    signOff: string;
    favouriteMemoryPhoto: PhotoItem;
  };
  onScrollToTop: () => void;
}

export const FinalSurprise: React.FC<FinalSurpriseProps> = ({
  recipientName,
  senderName,
  finalLetter,
  onScrollToTop,
}) => {
  const [isBoxOpened, setIsBoxOpened] = useState(false);

  const handleOpenGift = () => {
    soundManager.playWheelWin();
    setIsBoxOpened(true);
    triggerBirthdayConfetti();
    triggerHeartConfetti();
  };

  return (
    <section id="surprise" className="py-24 px-4 max-w-4xl mx-auto text-center scroll-mt-24">
      {/* Section Header */}
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFF0F5] border border-[#F48FB1]/40 text-[#75445A] text-xs font-bold uppercase tracking-widest mb-3 shadow-xs">
          <Gift size={14} className="text-[#F48FB1]" />
          <span>The Grand Birthday Finale 🎀</span>
        </div>
        <h2 className="font-romantic text-4xl sm:text-6xl md:text-7xl text-[#75445A] font-bold mb-3 tracking-wide drop-shadow-xs">
          One Last Birthday Surprise 🎁
        </h2>
        <p className="font-handwriting text-2xl sm:text-3xl text-[#75445A]/90 max-w-lg mx-auto">
          Tied with a silky baby pink ribbon and sealed with all the love in the universe. Open it, {recipientName}! ✨
        </p>
      </div>

      <div className="bg-white/95 rounded-3xl p-6 sm:p-12 scrapbook-shadow border border-[#F48FB1]/30">
        <AnimatePresence mode="wait">
          {!isBoxOpened ? (
            /* Sealed Baby Pink 3D Animated Gift Box */
            <motion.div
              key="closed-gift"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={handleOpenGift}
              className="cursor-pointer group flex flex-col items-center justify-center py-8"
            >
              {/* Gift Box Container in Baby Pink Palette */}
              <motion.div
                whileHover={{ scale: 1.05, rotate: 2 }}
                whileTap={{ scale: 0.95 }}
                className="relative w-48 h-48 sm:w-56 sm:h-56 bg-gradient-to-tr from-[#F48FB1] via-[#F8BBD0] to-[#E8DDF8] rounded-3xl shadow-2xl flex items-center justify-center border-4 border-white"
              >
                {/* Horizontal Pink/Cream Ribbon */}
                <div className="absolute inset-y-0 w-8 bg-gradient-to-r from-[#FFF0F5] via-white to-[#FFF0F5] shadow-xs" />
                {/* Vertical Pink/Cream Ribbon */}
                <div className="absolute inset-x-0 h-8 bg-gradient-to-b from-[#FFF0F5] via-white to-[#FFF0F5] shadow-xs" />

                {/* Big Ribbon Bow on Top */}
                <div className="absolute -top-7 w-20 h-14 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full border-4 border-white bg-[#F48FB1] shadow-md rotate-45" />
                  <div className="w-10 h-10 rounded-full border-4 border-white bg-[#F48FB1] shadow-md -rotate-45 -ml-5" />
                </div>

                {/* Center Sparkle Tag */}
                <div className="relative z-10 w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center text-[#F48FB1] font-bold text-2xl group-hover:animate-bounce border border-[#F48FB1]/30">
                  🎁
                </div>
              </motion.div>

              <button
                onClick={handleOpenGift}
                className="mt-8 px-8 py-3.5 rounded-full bg-gradient-to-r from-[#F48FB1] to-[#F06292] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all"
              >
                OPEN YOUR LAST SURPRISE 🎁
              </button>
              <p className="text-xs uppercase tracking-widest text-[#F48FB1] font-bold mt-2">
                Specially packed for {recipientName}
              </p>
            </motion.div>
          ) : (
            /* Opened Gift Reveal: Spotlight Photo + Long Emotional Letter */
            <motion.div
              key="opened-gift"
              initial={{ scale: 0.85, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: 'spring', damping: 25 }}
              className="text-left space-y-8"
            >
              {/* Spotlight Memory Photo */}
              <div className="flex justify-center mb-6">
                <div className="polaroid-frame max-w-xs w-full text-center rotate-1 shadow-2xl border border-[#F48FB1]/40 animate-glow">
                  <div className="washi-tape washi-tape-lavender -top-3 left-1/2 -translate-x-1/2" />
                  <div className="aspect-square w-full rounded-xl overflow-hidden bg-neutral-100 shadow-inner">
                    <img
                      src={finalLetter.favouriteMemoryPhoto.url}
                      alt="Spotlight Bestie Memory"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="pt-3">
                    <p className="font-handwriting text-2xl text-[#75445A] font-bold">
                      Our Crown Jewel Memory 👑
                    </p>
                    <p className="text-[11px] text-[#75445A]/70 font-sans">
                      From 26.08.2016 to Forever… Our bond is eternal.
                    </p>
                  </div>
                </div>
              </div>

              {/* Emotional Letter Card in Baby Pink Palette */}
              <div className="bg-[#FFF0F5] rounded-3xl p-6 sm:p-10 border border-[#F48FB1]/40 shadow-md lined-paper">
                <h3 className="font-romantic text-3xl sm:text-5xl text-[#75445A] font-bold mb-4">
                  {finalLetter.title}
                </h3>

                <div className="font-handwriting text-2xl sm:text-3xl text-[#75445A] space-y-4 leading-relaxed">
                  {finalLetter.paragraphs.map((p, idx) => (
                    <p key={idx}>{p}</p>
                  ))}
                </div>

                <div className="mt-8 pt-4 border-t border-[#F48FB1]/30 text-right">
                  <p className="font-romantic text-3xl sm:text-4xl text-[#F48FB1] font-bold">
                    {finalLetter.signOff}
                  </p>
                  <p className="font-handwriting text-2xl text-[#75445A] font-semibold mt-1">
                    — {senderName}
                  </p>
                </div>
              </div>

              {/* Action Buttons: Relive Magic / Scroll to Top */}
              <div className="flex flex-wrap items-center justify-center gap-4 pt-6">
                <button
                  onClick={() => {
                    triggerBirthdayConfetti();
                    onScrollToTop();
                  }}
                  className="px-8 py-3.5 rounded-full bg-gradient-to-r from-[#F48FB1] via-[#F06292] to-[#E8DDF8] text-white font-bold text-sm shadow-md hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2"
                >
                  <Sparkles size={16} />
                  <span>Relive the Magic (Back to Top)</span>
                  <ArrowUp size={16} />
                </button>

                <button
                  onClick={() => setIsBoxOpened(false)}
                  className="px-5 py-3 rounded-full bg-[#FFF0F5] hover:bg-[#FCE4EC] text-[#75445A] font-bold text-xs flex items-center gap-1.5 transition-colors border border-[#F48FB1]/30"
                >
                  <RotateCcw size={14} />
                  <span>Pack Gift Box Again</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};
