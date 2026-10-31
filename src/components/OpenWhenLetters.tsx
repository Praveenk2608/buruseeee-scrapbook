import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, X, Heart, Sparkles } from 'lucide-react';
import type { OpenWhenLetter } from '../types';
import { soundManager } from '../utils/audioSynthesizer';

interface OpenWhenLettersProps {
  letters: OpenWhenLetter[];
}

export const OpenWhenLetters: React.FC<OpenWhenLettersProps> = ({ letters }) => {
  const [selectedLetter, setSelectedLetter] = useState<OpenWhenLetter | null>(null);

  const openLetter = (letter: OpenWhenLetter) => {
    soundManager.playCardFlip();
    setSelectedLetter(letter);
  };

  return (
    <section id="letters" className="py-20 px-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-peach-100 text-orange-700 text-xs font-bold uppercase tracking-wider mb-3">
          <Mail size={13} />
          <span>Postcards from the Soul</span>
        </div>
        <h2 className="font-romantic text-4xl sm:text-5xl md:text-6xl text-orange-950 font-bold mb-3">
          Open-When Envelopes
        </h2>
        <p className="font-handwriting text-2xl text-neutral-600 max-w-xl mx-auto">
          Whenever you need comfort, laughter, or a reminder of how cherished you are, pick an envelope! 💌
        </p>
      </div>

      {/* Grid of Envelopes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {letters.map((letter) => (
          <motion.div
            key={letter.id}
            whileHover={{ y: -6, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => openLetter(letter)}
            className="cursor-pointer relative bg-white rounded-3xl p-6 scrapbook-shadow border-2 border-pink-100 transition-all hover:border-pink-300 flex flex-col justify-between h-56"
            style={{
              backgroundColor: letter.envelopeColor,
            }}
          >
            {/* Washi tape */}
            <div className="washi-tape washi-tape-pink -top-2 left-6 -rotate-3" />

            {/* Top Postage Stamp */}
            <div className="flex items-start justify-between">
              <span className="text-4xl">{letter.emoji}</span>
              <div className="w-10 h-12 bg-white/80 rounded border-2 border-dashed border-neutral-400 flex flex-col items-center justify-center p-1 shadow-xs">
                <span className="text-[10px] font-bold text-neutral-600">AIR MAIL</span>
                <Heart size={10} className="text-pink-500 fill-pink-500 mt-0.5" />
              </div>
            </div>

            {/* Title & Teaser */}
            <div>
              <h3 className="font-serif-vintage text-xl font-bold text-neutral-800 mb-1">
                {letter.title}
              </h3>
              <p className="text-xs text-neutral-600 line-clamp-2">
                {letter.teaser}
              </p>
            </div>

            {/* Bottom Seal Prompt */}
            <div className="flex items-center justify-between pt-2 border-t border-black/5 text-[11px] font-bold text-neutral-600">
              <span className="flex items-center gap-1 text-pink-600">
                <Sparkles size={11} />
                <span>Tap to Unseal Letter</span>
              </span>
              <span>{letter.sticker}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Full Letter Modal */}
      <AnimatePresence>
        {selectedLetter && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setSelectedLetter(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 30, opacity: 0 }}
              transition={{ type: 'spring', damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-lg bg-[#fffdf9] rounded-3xl p-6 sm:p-8 scrapbook-shadow border-2 border-pink-200 max-h-[85vh] overflow-y-auto lined-paper"
            >
              {/* Close button */}
              <button
                onClick={() => setSelectedLetter(null)}
                className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-pink-600 rounded-full hover:bg-pink-50"
              >
                <X size={20} />
              </button>

              {/* Envelope Header */}
              <div className="flex items-center gap-3 mb-6 border-b border-pink-200/60 pb-3">
                <span className="text-4xl">{selectedLetter.emoji}</span>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-pink-500">
                    Confidential Bestie Memo
                  </span>
                  <h3 className="font-serif-vintage text-2xl font-bold text-neutral-800">
                    {selectedLetter.title}
                  </h3>
                </div>
              </div>

              {/* Letter Text */}
              <div className="font-handwriting text-2xl sm:text-3xl text-neutral-800 whitespace-pre-line leading-relaxed mb-6">
                {selectedLetter.letter}
              </div>

              {/* Quote Footer */}
              <div className="p-3 bg-pink-50 rounded-xl border border-pink-200 text-center font-serif-vintage italic text-pink-700 text-sm">
                {selectedLetter.quote}
              </div>

              {/* Fold back button */}
              <div className="mt-6 text-center">
                <button
                  onClick={() => setSelectedLetter(null)}
                  className="px-6 py-2.5 rounded-full bg-pink-500 text-white font-bold text-xs shadow-md hover:bg-pink-600 transition-colors"
                >
                  Fold Letter & Place Back in Envelope
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
