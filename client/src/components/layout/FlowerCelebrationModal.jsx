import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, Trophy, CheckCircle2, ArrowRight } from 'lucide-react';

export const FlowerCelebrationModal = ({ isOpen, onClose, minutes = 25, taskTitle }) => {
  useEffect(() => {
    if (isOpen) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#FF8B76', '#FFE7A0', '#74C99A', '#FF9856'],
        });
      } catch (e) {}
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#342D2B]/30 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full text-center shadow-2xl border border-peach-200 animate-in zoom-in-95 duration-200">
        {/* Animated Blooming Flower Graphic */}
        <div className="w-24 h-24 mx-auto mb-4 relative flex items-center justify-center">
          <svg
            className="w-20 h-20 animate-spin-slow"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Flower Petals */}
            <circle cx="50" cy="24" r="14" fill="#FF8B76" fillOpacity="0.8" />
            <circle cx="76" cy="50" r="14" fill="#FFAE7A" fillOpacity="0.8" />
            <circle cx="50" cy="76" r="14" fill="#FF8B76" fillOpacity="0.8" />
            <circle cx="24" cy="50" r="14" fill="#FFAE7A" fillOpacity="0.8" />
            <circle cx="68" cy="32" r="12" fill="#FFE7A0" fillOpacity="0.9" />
            <circle cx="68" cy="68" r="12" fill="#FFE7A0" fillOpacity="0.9" />
            <circle cx="32" cy="68" r="12" fill="#FFE7A0" fillOpacity="0.9" />
            <circle cx="32" cy="32" r="12" fill="#FFE7A0" fillOpacity="0.9" />
            {/* Flower Center */}
            <circle cx="50" cy="50" r="13" fill="#FF9856" />
            <circle cx="50" cy="50" r="7" fill="#FFFDF9" />
          </svg>
          <div className="absolute -top-1 -right-1">
            <Sparkles className="w-6 h-6 text-amber-400 animate-bounce" />
          </div>
        </div>

        <span className="inline-block px-3 py-1 bg-green-50 text-successGreen-dark font-bold text-xs rounded-full uppercase tracking-wider mb-2">
          Focus Session Complete!
        </span>

        <h3 className="text-xl font-bold font-display text-mainText mb-1">
          Blooming Progress!
        </h3>
        <p className="text-xs text-mainText-muted mb-4">
          You concentrated for <strong className="text-coral font-bold">{minutes} minutes</strong>
          {taskTitle ? ` on "${taskTitle}"` : ''}. Your streak and study analytics have been recorded on the server.
        </p>

        <button
          onClick={onClose}
          className="w-full py-2.5 px-4 rounded-xl bg-coral hover:bg-coral-dark text-white font-semibold text-sm shadow-soft-peach transition-all flex items-center justify-center gap-2"
        >
          <span>Continue Studying</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default FlowerCelebrationModal;
