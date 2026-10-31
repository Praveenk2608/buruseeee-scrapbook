import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Gamepad2, HelpCircle, Grid, RotateCcw, 
  CheckCircle2, XCircle, Award, Disc3, Ticket 
} from 'lucide-react';
import type { QuizQuestion, WheelPrize } from '../types';
import { soundManager } from '../utils/audioSynthesizer';
import { triggerBirthdayConfetti } from '../utils/confetti';

interface GamesSectionProps {
  quizQuestions: QuizQuestion[];
  wheelPrizes: WheelPrize[];
  recipientName: string;
}

export const GamesSection: React.FC<GamesSectionProps> = ({ 
  quizQuestions, 
  wheelPrizes, 
  recipientName 
}) => {
  const [activeTab, setActiveTab] = useState<'quiz' | 'match' | 'scratch' | 'wheel'>('quiz');

  // ==========================================
  // GAME 1: FRIENDSHIP QUIZ STATE
  // ==========================================
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  const handleSelectQuizOption = (optionIdx: number) => {
    if (selectedOption !== null) return;
    setSelectedOption(optionIdx);

    const isCorrect = optionIdx === quizQuestions[quizIndex].correctAnswer;
    if (isCorrect) {
      soundManager.playQuizCorrect();
      setQuizScore((prev) => prev + 1);
    } else {
      soundManager.playQuizWrong();
    }
  };

  const nextQuizQuestion = () => {
    if (quizIndex < quizQuestions.length - 1) {
      setQuizIndex((prev) => prev + 1);
      setSelectedOption(null);
    } else {
      setQuizFinished(true);
      triggerBirthdayConfetti();
    }
  };

  const resetQuiz = () => {
    setQuizIndex(0);
    setSelectedOption(null);
    setQuizScore(0);
    setQuizFinished(false);
  };

  // ==========================================
  // GAME 2: MEMORY MATCHING GAME STATE
  // ==========================================
  const cardIcons = ['🧁', '📸', '🧋', '💖', '🎀', '💌', '👑', '🍕'];
  interface MatchCard {
    id: number;
    icon: string;
    isFlipped: boolean;
    isMatched: boolean;
  }

  const [cards, setCards] = useState<MatchCard[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [matchMoves, setMatchMoves] = useState(0);
  const [matchWon, setMatchWon] = useState(false);

  const initMatchGame = () => {
    const paired = [...cardIcons, ...cardIcons]
      .sort(() => Math.random() - 0.5)
      .map((icon, id) => ({
        id,
        icon,
        isFlipped: false,
        isMatched: false,
      }));
    setCards(paired);
    setFlippedIndices([]);
    setMatchMoves(0);
    setMatchWon(false);
  };

  useEffect(() => {
    initMatchGame();
  }, []);

  const handleCardClick = (index: number) => {
    if (cards[index].isFlipped || cards[index].isMatched || flippedIndices.length >= 2) return;

    soundManager.playCardFlip();
    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setMatchMoves((m) => m + 1);
      const [firstIdx, secondIdx] = newFlipped;
      if (cards[firstIdx].icon === cards[secondIdx].icon) {
        // Matched!
        setTimeout(() => {
          const matchedCards = [...cards];
          matchedCards[firstIdx].isMatched = true;
          matchedCards[secondIdx].isMatched = true;
          setCards(matchedCards);
          setFlippedIndices([]);

          if (matchedCards.every((c) => c.isMatched)) {
            setMatchWon(true);
            triggerBirthdayConfetti();
          }
        }, 500);
      } else {
        // No match
        setTimeout(() => {
          const resetFlipped = [...cards];
          resetFlipped[firstIdx].isFlipped = false;
          resetFlipped[secondIdx].isFlipped = false;
          setCards(resetFlipped);
          setFlippedIndices([]);
        }, 900);
      }
    }
  };

  // ==========================================
  // GAME 3: SCRATCH AND REVEAL STATE
  // ==========================================
  const scratchCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isScratched, setIsScratched] = useState(false);
  const [scratchPercent, setScratchPercent] = useState(0);
  const isDrawingRef = useRef(false);

  const initScratchCanvas = () => {
    const canvas = scratchCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 400;
    canvas.height = 220;

    // Golden / Holographic glitter overlay
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, '#fbcfe8');
    grad.addColorStop(0.5, '#e9d5ff');
    grad.addColorStop(1, '#fed7aa');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Decorative pattern & text
    ctx.fillStyle = '#ec4899';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✨ SCRATCH WITH COIN / FINGER ✨', canvas.width / 2, canvas.height / 2 - 10);
    ctx.font = '13px sans-serif';
    ctx.fillStyle = '#6b7280';
    ctx.fillText('Scratch to reveal your secret birthday coupon!', canvas.width / 2, canvas.height / 2 + 18);

    setIsScratched(false);
    setScratchPercent(0);
  };

  useEffect(() => {
    if (activeTab === 'scratch') {
      setTimeout(initScratchCanvas, 50);
    }
  }, [activeTab]);

  const scratchAt = (x: number, y: number) => {
    const canvas = scratchCanvasRef.current;
    if (!canvas || isScratched) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fill();

    // Check scratch percentage occasionally
    if (Math.random() < 0.25) {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let transparentPixels = 0;
      for (let i = 3; i < imgData.data.length; i += 16) {
        if (imgData.data[i] === 0) transparentPixels++;
      }
      const totalSampled = imgData.data.length / 16;
      const pct = Math.round((transparentPixels / totalSampled) * 100);
      setScratchPercent(pct);

      if (pct > 40 && !isScratched) {
        setIsScratched(true);
        triggerBirthdayConfetti();
      }
    }
  };

  // ==========================================
  // GAME 4: SPIN THE BESTIE WHEEL STATE
  // ==========================================
  const wheelCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [wonPrize, setWonPrize] = useState<WheelPrize | null>(null);
  const rotationRef = useRef(0);

  const drawWheel = (rotationAngle: number) => {
    const canvas = wheelCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 360;
    const height = 360;
    canvas.width = width;
    canvas.height = height;

    const numPrizes = wheelPrizes.length;
    const arc = (Math.PI * 2) / numPrizes;
    const radius = width / 2 - 10;
    const cx = width / 2;
    const cy = height / 2;

    ctx.clearRect(0, 0, width, height);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotationAngle);

    wheelPrizes.forEach((prize, i) => {
      const angle = i * arc;

      // Slice wedge
      ctx.beginPath();
      ctx.fillStyle = prize.color;
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, angle, angle + arc);
      ctx.lineTo(0, 0);
      ctx.fill();

      // Border line
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Text and emoji inside wedge
      ctx.save();
      ctx.rotate(angle + arc / 2);
      ctx.fillStyle = '#374151';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${prize.text.substring(0, 14)}`, radius - 20, 4);
      ctx.restore();
    });

    ctx.restore();

    // Center peg
    ctx.beginPath();
    ctx.arc(cx, cy, 22, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#ec4899';
    ctx.stroke();

    ctx.fillStyle = '#ec4899';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('💖', cx, cy + 5);

    // Pointer at top
    ctx.beginPath();
    ctx.fillStyle = '#f43f5e';
    ctx.moveTo(cx - 14, 8);
    ctx.lineTo(cx + 14, 8);
    ctx.lineTo(cx, 32);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  useEffect(() => {
    if (activeTab === 'wheel') {
      setTimeout(() => drawWheel(rotationRef.current), 50);
    }
  }, [activeTab, wheelPrizes]);

  const spinWheel = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setWonPrize(null);

    const spinRotations = 6 + Math.random() * 4;
    const totalDuration = 4500; // ms
    const startAngle = rotationRef.current;
    const targetAngle = startAngle + spinRotations * (Math.PI * 2);

    const startTime = performance.now();

    const animateWheel = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / totalDuration, 1);

      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const currentAngle = startAngle + (targetAngle - startAngle) * ease;
      rotationRef.current = currentAngle;
      drawWheel(currentAngle);

      if (progress < 1) {
        requestAnimationFrame(animateWheel);
      } else {
        setIsSpinning(false);
        // Calculate winning prize (pointer is at top: 3*PI/2)
        const normalized = (Math.PI * 1.5 - (currentAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        const arc = (Math.PI * 2) / wheelPrizes.length;
        const prizeIndex = Math.floor(normalized / arc) % wheelPrizes.length;
        const winningPrize = wheelPrizes[prizeIndex];

        setWonPrize(winningPrize);
        soundManager.playWheelWin();
        triggerBirthdayConfetti();
      }
    };

    requestAnimationFrame(animateWheel);
  };

  return (
    <section id="games" className="py-20 px-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-violet-100 text-violet-800 text-xs font-bold uppercase tracking-wider mb-3">
          <Gamepad2 size={13} />
          <span>Interactive Bestie Arcade</span>
        </div>
        <h2 className="font-romantic text-4xl sm:text-5xl md:text-6xl text-violet-900 font-bold mb-3">
          Four Games for {recipientName}
        </h2>
        <p className="font-handwriting text-2xl text-neutral-600 max-w-xl mx-auto">
          Test your memory, win friendship coupons, scratch secrets, and spin for prizes! 🎮✨
        </p>

        {/* Tab Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setActiveTab('quiz')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all ${
              activeTab === 'quiz'
                ? 'bg-pink-500 text-white shadow-md scale-105'
                : 'bg-white text-neutral-600 hover:bg-pink-50 border border-pink-200'
            }`}
          >
            <HelpCircle size={14} />
            <span>1. Bestie Quiz</span>
          </button>

          <button
            onClick={() => setActiveTab('match')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all ${
              activeTab === 'match'
                ? 'bg-purple-500 text-white shadow-md scale-105'
                : 'bg-white text-neutral-600 hover:bg-purple-50 border border-purple-200'
            }`}
          >
            <Grid size={14} />
            <span>2. Memory Match</span>
          </button>

          <button
            onClick={() => setActiveTab('scratch')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all ${
              activeTab === 'scratch'
                ? 'bg-rose-500 text-white shadow-md scale-105'
                : 'bg-white text-neutral-600 hover:bg-rose-50 border border-rose-200'
            }`}
          >
            <Ticket size={14} />
            <span>3. Scratch Card</span>
          </button>

          <button
            onClick={() => setActiveTab('wheel')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all ${
              activeTab === 'wheel'
                ? 'bg-amber-500 text-white shadow-md scale-105'
                : 'bg-white text-neutral-600 hover:bg-amber-50 border border-amber-200'
            }`}
          >
            <Disc3 size={14} />
            <span>4. Spin the Wheel</span>
          </button>
        </div>
      </div>

      {/* Main Game Screen */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 scrapbook-shadow border border-pink-100 min-h-[440px] flex flex-col justify-center">
        {/* ========================================================= */}
        {/* GAME 1: FRIENDSHIP QUIZ */}
        {/* ========================================================= */}
        {activeTab === 'quiz' && (
          <div className="max-w-xl mx-auto w-full">
            {!quizFinished ? (
              <div>
                {/* Progress bar */}
                <div className="flex items-center justify-between text-xs font-bold text-neutral-400 mb-2">
                  <span>Question {quizIndex + 1} of {quizQuestions.length}</span>
                  <span>Score: {quizScore}</span>
                </div>
                <div className="w-full h-2 bg-pink-100 rounded-full mb-6 overflow-hidden">
                  <div
                    className="h-full bg-pink-500 transition-all duration-300"
                    style={{ width: `${((quizIndex + 1) / quizQuestions.length) * 100}%` }}
                  />
                </div>

                {/* Question */}
                <h3 className="font-serif-vintage text-xl sm:text-2xl font-bold text-neutral-800 mb-6">
                  {quizQuestions[quizIndex].question}
                </h3>

                {/* Options */}
                <div className="space-y-3 mb-6">
                  {quizQuestions[quizIndex].options.map((opt, oIdx) => {
                    const isSelected = selectedOption === oIdx;
                    const isCorrect = oIdx === quizQuestions[quizIndex].correctAnswer;
                    let optStyle = 'border-pink-200 bg-white hover:bg-pink-50 text-neutral-700';

                    if (selectedOption !== null) {
                      if (isCorrect) {
                        optStyle = 'border-emerald-500 bg-emerald-50 text-emerald-800 font-bold';
                      } else if (isSelected) {
                        optStyle = 'border-rose-400 bg-rose-50 text-rose-800';
                      } else {
                        optStyle = 'border-neutral-200 opacity-50';
                      }
                    }

                    return (
                      <button
                        key={oIdx}
                        disabled={selectedOption !== null}
                        onClick={() => handleSelectQuizOption(oIdx)}
                        className={`w-full text-left p-3.5 rounded-2xl border-2 text-xs sm:text-sm font-semibold transition-all flex items-center justify-between ${optStyle}`}
                      >
                        <span>{opt}</span>
                        {selectedOption !== null && isCorrect && <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />}
                        {selectedOption !== null && isSelected && !isCorrect && <XCircle size={16} className="text-rose-500 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation / Commentary */}
                {selectedOption !== null && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3.5 rounded-2xl bg-pink-50 border border-pink-200 mb-6 text-xs text-neutral-700 font-sans"
                  >
                    <p className="font-bold mb-1">
                      {selectedOption === quizQuestions[quizIndex].correctAnswer
                        ? '🎉 Correct! ' + quizQuestions[quizIndex].explanation
                        : '😂 ' + quizQuestions[quizIndex].funnyFailMessage}
                    </p>
                  </motion.div>
                )}

                {/* Next button */}
                {selectedOption !== null && (
                  <button
                    onClick={nextQuizQuestion}
                    className="w-full py-3 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold text-xs uppercase tracking-wider shadow-md hover:scale-102 transition-transform"
                  >
                    {quizIndex < quizQuestions.length - 1 ? 'Next Question →' : 'See Bestie Certificate 🏆'}
                  </button>
                )}
              </div>
            ) : (
              /* Quiz Finished Certificate */
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center p-6 bg-gradient-to-b from-pink-50 to-purple-50 rounded-3xl border-2 border-pink-300"
              >
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-tr from-pink-400 to-purple-400 text-white flex items-center justify-center shadow-lg">
                  <Award size={32} />
                </div>
                <h3 className="font-romantic text-3xl sm:text-4xl text-pink-700 font-bold mb-1">
                  Official Bestie Certificate
                </h3>
                <p className="text-xs font-mono font-bold text-purple-600 uppercase tracking-widest mb-3">
                  Score: {quizScore} / {quizQuestions.length} — 100% Certified Soulmates
                </p>
                <p className="font-handwriting text-2xl text-neutral-700 max-w-md mx-auto mb-6">
                  {recipientName}, you passed the test! No one knows our friendship lore like you do. You are officially awarded lifetime bestie status with zero probation! 💖
                </p>
                <button
                  onClick={resetQuiz}
                  className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-pink-500 text-white font-bold text-xs shadow-md hover:bg-pink-600 transition-colors"
                >
                  <RotateCcw size={13} />
                  <span>Retake Quiz</span>
                </button>
              </motion.div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* GAME 2: MEMORY MATCHING GAME */}
        {/* ========================================================= */}
        {activeTab === 'match' && (
          <div className="max-w-md mx-auto w-full text-center">
            <div className="flex items-center justify-between text-xs font-bold text-neutral-500 mb-4 px-2">
              <span>Moves: {matchMoves}</span>
              <button
                onClick={initMatchGame}
                className="flex items-center gap-1 text-purple-600 hover:text-purple-700 font-bold text-xs"
              >
                <RotateCcw size={12} />
                <span>Reset</span>
              </button>
            </div>

            {/* 4x4 Grid of Cards */}
            <div className="grid grid-cols-4 gap-3 mb-6">
              {cards.map((card, idx) => (
                <button
                  key={card.id}
                  onClick={() => handleCardClick(idx)}
                  className={`aspect-square rounded-2xl text-2xl sm:text-3xl flex items-center justify-center font-bold shadow-md transition-all duration-300 ${
                    card.isFlipped || card.isMatched
                      ? 'bg-white border-2 border-purple-400 rotate-0'
                      : 'bg-gradient-to-tr from-purple-400 to-pink-400 text-transparent border-2 border-white rotate-3 hover:scale-105'
                  }`}
                >
                  {card.isFlipped || card.isMatched ? card.icon : '✨'}
                </button>
              ))}
            </div>

            {matchWon && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-purple-50 rounded-2xl border border-purple-200 text-purple-800"
              >
                <p className="font-romantic text-3xl font-bold mb-1">You Did It! 🎉</p>
                <p className="text-xs">
                  Matched all pairs in {matchMoves} moves! Perfect match, just like our friendship!
                </p>
              </motion.div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* GAME 3: SCRATCH AND REVEAL */}
        {/* ========================================================= */}
        {activeTab === 'scratch' && (
          <div className="max-w-md mx-auto w-full text-center flex flex-col items-center">
            <p className="font-handwriting text-2xl text-rose-800 mb-3">
              Use your mouse or finger to scratch off the foil! 🪙
            </p>

            <div className="relative w-[360px] sm:w-[400px] h-[220px] rounded-2xl overflow-hidden shadow-xl border-4 border-rose-200">
              {/* Underlying Secret Message (Revealed) */}
              <div className="absolute inset-0 bg-gradient-to-br from-rose-50 via-pink-100 to-purple-50 p-5 flex flex-col items-center justify-center text-center">
                <span className="text-3xl mb-1">🎟️</span>
                <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-rose-500">
                  BURUSEEEE BIRTHDAY VOUCHER
                </span>
                <h4 className="font-romantic text-2xl font-bold text-rose-800 my-1">
                  1 Unlimited Bestie Pass
                </h4>
                <p className="font-sans text-[11px] text-neutral-600 leading-tight">
                  Redeemable for: 1 Midnight Crisis Talk, Free Late-Night Food, and 100 Hugs.
                </p>
                <span className="text-[10px] font-bold text-pink-600 mt-2 bg-white/80 px-2.5 py-0.5 rounded-full border border-pink-200">
                  NO EXPIRATION DATE • LIFETIME VALIDITY
                </span>
              </div>

              {/* Canvas Foil Overlay */}
              <canvas
                ref={scratchCanvasRef}
                onMouseDown={() => (isDrawingRef.current = true)}
                onMouseUp={() => (isDrawingRef.current = false)}
                onMouseMove={(e) => {
                  if (!isDrawingRef.current) return;
                  const rect = scratchCanvasRef.current?.getBoundingClientRect();
                  if (!rect) return;
                  scratchAt(e.clientX - rect.left, e.clientY - rect.top);
                }}
                onTouchStart={() => (isDrawingRef.current = true)}
                onTouchEnd={() => (isDrawingRef.current = false)}
                onTouchMove={(e) => {
                  const touch = e.touches[0];
                  const rect = scratchCanvasRef.current?.getBoundingClientRect();
                  if (!rect) return;
                  scratchAt(touch.clientX - rect.left, touch.clientY - rect.top);
                }}
                className={`absolute inset-0 w-full h-full cursor-crosshair transition-opacity duration-500 ${
                  isScratched ? 'opacity-0 pointer-events-none' : 'opacity-100'
                }`}
              />
            </div>

            <div className="mt-4 flex items-center gap-3">
              <span className="text-xs text-neutral-500 font-mono">
                {scratchPercent}% Scratched
              </span>
              <button
                onClick={initScratchCanvas}
                className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1"
              >
                <RotateCcw size={12} />
                <span>Re-foil Card</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* GAME 4: SPIN THE BESTIE WHEEL */}
        {/* ========================================================= */}
        {activeTab === 'wheel' && (
          <div className="max-w-md mx-auto w-full text-center flex flex-col items-center">
            {/* Wheel Canvas */}
            <div className="relative mb-6">
              <canvas ref={wheelCanvasRef} className="rounded-full shadow-2xl" />
            </div>

            {/* Spin Button */}
            <button
              onClick={spinWheel}
              disabled={isSpinning}
              className="px-8 py-3 rounded-full bg-gradient-to-r from-amber-500 to-pink-500 text-white font-bold text-sm shadow-md hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <span>{isSpinning ? 'Spinning...' : 'Spin the Wheel! 🪄'}</span>
            </button>

            {/* Won Prize Modal / Banner */}
            {wonPrize && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="mt-6 p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-900 max-w-xs shadow-md"
              >
                <span className="text-3xl block mb-1">{wonPrize.emoji}</span>
                <h4 className="font-romantic text-2xl font-bold">{wonPrize.text}</h4>
                <p className="text-xs font-sans text-neutral-600 mt-1">{wonPrize.description}</p>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
