import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cake, Wind, RotateCcw } from 'lucide-react';
import { soundManager } from '../utils/audioSynthesizer';
import { triggerBirthdayConfetti, triggerHeartConfetti } from '../utils/confetti';

interface BirthdayCakeSectionProps {
  recipientName: string;
}

export const BirthdayCakeSection: React.FC<BirthdayCakeSectionProps> = ({ recipientName }) => {
  const [candlesLit, setCandlesLit] = useState(true);
  const [cakeCut, setCakeCut] = useState(false);

  const handleBlowCandles = () => {
    soundManager.playBlowCandles();
    setCandlesLit(false);
    triggerBirthdayConfetti();
    triggerHeartConfetti();
  };

  const relightCandles = () => {
    setCandlesLit(true);
    setCakeCut(false);
  };

  const scrollToSurprise = () => {
    const el = document.getElementById('surprise');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="cake" className="py-20 px-4 max-w-4xl mx-auto text-center scroll-mt-24">
      {/* Header */}
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFF0F5] border border-[#F48FB1]/40 text-[#75445A] text-xs font-bold uppercase tracking-widest mb-3 shadow-xs">
          <Cake size={14} className="text-[#F48FB1]" />
          <span>The Birthday Ritual 🎀</span>
        </div>
        <h2 className="font-romantic text-4xl sm:text-6xl md:text-7xl text-[#75445A] font-bold mb-3 tracking-wide drop-shadow-xs">
          Make a Wish, {recipientName}! 🎂
        </h2>
        <p className="font-handwriting text-2xl sm:text-3xl text-[#75445A]/90 max-w-lg mx-auto">
          Close your eyes, make the biggest wish in your heart, and blow out the candles! 🕯️✨
        </p>
      </div>

      {/* Layered Baby Pink Birthday Cake Visual Container */}
      <div className="bg-white/95 rounded-3xl p-6 sm:p-12 scrapbook-shadow border border-[#F48FB1]/30 max-w-xl mx-auto flex flex-col items-center">
        {/* Cake Structure */}
        <div className="relative w-64 sm:w-72 h-64 flex flex-col items-center justify-end mb-8">
          {/* Candles */}
          <div className="flex items-center justify-center gap-4 sm:gap-6 mb-1 z-10">
            {[0, 1, 2, 3, 4].map((idx) => (
              <div key={idx} className="flex flex-col items-center relative">
                {/* Flame */}
                <AnimatePresence>
                  {candlesLit ? (
                    <motion.div
                      key="flame"
                      initial={{ scale: 0.8 }}
                      animate={{
                        scale: [0.9, 1.2, 0.9],
                        y: [-2, 2, -2],
                      }}
                      exit={{ scale: 0, opacity: 0, y: -10 }}
                      transition={{
                        duration: 0.4 + idx * 0.1,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                      className="w-4 h-6 rounded-full bg-gradient-to-t from-amber-500 via-rose-400 to-yellow-200 shadow-md filter drop-shadow-[0_0_8px_rgba(244,143,177,0.9)]"
                    />
                  ) : (
                    /* Smoke puff when blown out */
                    <motion.div
                      key="smoke"
                      initial={{ opacity: 0.8, y: 0, scale: 0.5 }}
                      animate={{ opacity: 0, y: -24, scale: 1.5 }}
                      transition={{ duration: 1 }}
                      className="text-neutral-400 text-xs select-none"
                    >
                      💨
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Baby Pink Candle Stick */}
                <div
                  className={`w-2.5 h-10 rounded-t-sm shadow-xs ${
                    idx % 2 === 0
                      ? 'bg-gradient-to-b from-[#F48FB1] to-[#F06292]'
                      : 'bg-gradient-to-b from-[#E8DDF8] to-[#D1C4E9]'
                  }`}
                />
              </div>
            ))}
          </div>

          {/* Top Cake Tier - Pastel Pink & Vanilla */}
          <div className="w-44 h-16 bg-gradient-to-r from-[#F8BBD0] via-[#FFF0F5] to-[#F8BBD0] rounded-t-2xl shadow-md border-b-4 border-[#F48FB1] flex items-center justify-around px-2 relative">
            {/* Frosting Drips */}
            <div className="absolute -top-1 inset-x-0 flex justify-around">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="w-3 h-4 bg-white rounded-b-full shadow-xs" />
              ))}
            </div>
            <span className="text-sm">🍓</span>
            <span className="text-sm">✨</span>
            <span className="text-sm">🍓</span>
          </div>

          {/* Bottom Cake Tier - Blush Rose */}
          <div className="w-56 sm:w-64 h-22 bg-gradient-to-r from-[#F48FB1] via-[#FCE4EC] to-[#F48FB1] rounded-t-xl shadow-lg border-b-6 border-[#F06292] flex items-center justify-around px-4 relative">
            {/* Frosting Drips */}
            <div className="absolute -top-1 inset-x-0 flex justify-around">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="w-4 h-5 bg-white rounded-b-full shadow-xs" />
              ))}
            </div>
            <span className="text-base">🎀</span>
            <span className="font-romantic text-2xl font-bold text-[#75445A]">Buruseeee</span>
            <span className="text-base">🎀</span>
          </div>

          {/* Cake Stand / Plate */}
          <div className="w-64 sm:w-72 h-4 bg-gradient-to-r from-[#FFF0F5] via-white to-[#FFF0F5] rounded-full shadow-md border border-[#F48FB1]/30" />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col items-center gap-4 w-full">
          {candlesLit ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleBlowCandles}
              className="px-8 py-3.5 rounded-full bg-gradient-to-r from-[#F48FB1] via-[#F06292] to-[#E8DDF8] text-white font-bold text-sm shadow-md hover:shadow-xl transition-all flex items-center gap-2"
            >
              <Wind size={18} />
              <span>Blow Out the Candles! 💨</span>
            </motion.button>
          ) : (
            <div className="space-y-4 w-full">
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="p-4 bg-[#FFF0F5] rounded-2xl border border-[#F48FB1]/40 text-[#75445A]"
              >
                <p className="font-romantic text-3xl font-bold text-[#F48FB1] mb-1">
                  Candles Extinguished! ✨
                </p>
                <p className="font-handwriting text-2xl text-[#75445A] leading-snug">
                  May every single wish you just made find its way to you this year! You deserve all the happiness in the galaxy.
                </p>
              </motion.div>

              <div className="flex items-center justify-center gap-3">
                {!cakeCut ? (
                  <button
                    onClick={() => {
                      setCakeCut(true);
                      triggerBirthdayConfetti();
                    }}
                    className="px-5 py-2.5 rounded-full bg-[#F48FB1] hover:bg-[#ec407a] text-white font-bold text-xs shadow-md transition-transform hover:scale-105"
                  >
                    🍰 Cut the First Slice!
                  </button>
                ) : (
                  <div className="p-3 bg-[#E8DDF8]/50 rounded-xl border border-[#D1C4E9] text-[#512DA8] text-xs font-semibold">
                    Here is the biggest slice for the Birthday Queen! 🍰💖
                  </div>
                )}

                <button
                  onClick={relightCandles}
                  className="p-2.5 rounded-full bg-[#FFF0F5] hover:bg-[#FCE4EC] text-[#75445A] transition-colors"
                  title="Relight Candles to wish again"
                >
                  <RotateCcw size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Heartfelt Birthday Message from Best Friend */}
          <div className="mt-8 pt-6 border-t border-[#F48FB1]/20 w-full text-center">
            <h4 className="font-romantic text-3xl sm:text-4xl text-[#75445A] font-bold mb-3">
              One last thing, {recipientName}...
            </h4>
            <div className="space-y-2 font-handwriting text-2xl text-[#75445A] leading-relaxed max-w-md mx-auto">
              <p>You are loved more than words can explain.</p>
              <p>Thank you for being you.</p>
              <p>Keep smiling, keep dreaming, and never forget how special you are.</p>
              <p className="font-bold text-[#F48FB1] text-3xl pt-2">
                HAPPY BIRTHDAY, MY MACHAAA! ❤️
              </p>
            </div>

            {/* Jump to final surprise button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={scrollToSurprise}
              className="mt-6 px-8 py-3.5 rounded-full bg-gradient-to-r from-[#F48FB1] to-[#F06292] text-white font-bold text-sm shadow-md hover:shadow-xl transition-all flex items-center gap-2 mx-auto"
            >
              <span>OPEN YOUR LAST SURPRISE 🎁</span>
            </motion.button>
          </div>
        </div>
      </div>
    </section>
  );
};
