import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, Key, X, Check, ShieldAlert } from 'lucide-react';
import { verifyAdminPin, setAdminUnlocked } from '../utils/supabaseClient';

interface AdminPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlocked: () => void;
}

export const AdminPinModal: React.FC<AdminPinModalProps> = ({ isOpen, onClose, onUnlocked }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyAdminPin(pin)) {
      setSuccess(true);
      setError(false);
      setTimeout(() => {
        onUnlocked();
        onClose();
        setSuccess(false);
        setPin('');
      }, 700);
    } else {
      setError(true);
      setSuccess(false);
    }
  };

  const handleLockAgain = () => {
    setAdminUnlocked(false);
    onUnlocked();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-white rounded-3xl max-w-sm w-full p-6 sm:p-8 shadow-2xl border border-[#F48FB1]/40 text-center relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-full text-[#75445A]/50 hover:text-[#75445A] hover:bg-[#FFF0F5] transition-colors"
            >
              <X size={18} />
            </button>

            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#FFF0F5] border border-[#F48FB1]/30 flex items-center justify-center text-[#F48FB1] shadow-inner">
              {success ? <Unlock size={28} className="text-emerald-500" /> : <Lock size={28} />}
            </div>

            <h3 className="font-romantic text-3xl font-bold text-[#75445A] mb-1">
              Admin Controls 🔒
            </h3>
            <p className="font-handwriting text-xl text-[#75445A]/80 mb-6">
              Enter your Bestie Security PIN to upload, edit or delete memories.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <input
                  type="password"
                  maxLength={10}
                  autoFocus
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value);
                    setError(false);
                  }}
                  placeholder="Enter Secret PIN"
                  className="w-full text-center text-2xl tracking-widest font-mono py-2.5 px-4 rounded-xl border border-[#F48FB1]/40 focus:outline-[#F48FB1] bg-[#FFF0F5]/50 text-[#75445A]"
                />
                <Key size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#F48FB1]/60" />
              </div>

              {error && (
                <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-600 text-xs flex items-center justify-center gap-1.5 animate-shake">
                  <ShieldAlert size={14} />
                  <span>Incorrect PIN! (Hint: Date 2608)</span>
                </div>
              )}

              {success && (
                <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-600 text-xs flex items-center justify-center gap-1.5">
                  <Check size={14} />
                  <span>Access Granted! Unlocking controls...</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-full bg-gradient-to-r from-[#F48FB1] to-[#F06292] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all"
              >
                Unlock Admin Mode ✨
              </button>
            </form>

            <div className="mt-5 pt-4 border-t border-pink-100 flex items-center justify-between text-[11px] text-[#75445A]/60">
              <span>Visitors can view without login</span>
              <button
                onClick={handleLockAgain}
                className="text-pink-600 hover:underline"
              >
                Lock Controls
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
