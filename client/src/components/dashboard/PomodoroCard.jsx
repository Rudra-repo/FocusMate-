import React, { useState, useEffect } from 'react';
import { ChevronDown, Minus, Plus, Play } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const PomodoroCard = ({ subjects = [] }) => {
  const { startFullFocusMode } = useAuth();
  const [selectedSubjectId, setSelectedSubjectId] = useState(() => subjects[0]?._id || '');
  const [targetMinutes, setTargetMinutes] = useState(25);
  const [mode, setMode] = useState('focus'); // 'focus', 'short_break', 'long_break'

  useEffect(() => {
    if (subjects.length > 0 && !selectedSubjectId) {
      setSelectedSubjectId(subjects[0]._id);
    }
  }, [subjects]);

  const adjustMinutes = (delta) => {
    const nextMin = Math.max(5, Math.min(120, targetMinutes + delta));
    setTargetMinutes(nextMin);
  };

  // Launch Full Focus Mode directly upon clicking Start
  const handleStart = () => {
    const subObj = subjects.find((s) => s._id === selectedSubjectId);
    startFullFocusMode({
      targetMinutes,
      subjectName: subObj?.name || 'Math practice',
      subjectId: selectedSubjectId || null,
    });
  };

  const formatTime = (minutes) => {
    return `${minutes.toString().padStart(2, '0')}:00`;
  };

  return (
    <div className="rounded-3xl p-5 md:p-6 shadow-timer-glow relative overflow-hidden flex flex-col justify-between h-full gradient-timer-bg text-mainText transition-all">
      {/* Header and Subject Dropdown */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-base md:text-lg font-bold font-display text-mainText">
            Pomodoro Timer
          </h3>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/60 text-coral-dark uppercase tracking-wider">
            {mode === 'focus' ? 'Focus Mode' : 'Break'}
          </span>
        </div>

        {/* Subject selector pill dropdown */}
        <div className="relative inline-block mt-1">
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="text-xs font-bold text-mainText/90 bg-transparent hover:bg-white/30 rounded-xl py-1 pl-1 pr-6 cursor-pointer focus:outline-none appearance-none transition-colors"
          >
            {subjects.map((sub) => (
              <option key={sub._id} value={sub._id} className="text-mainText bg-white">
                {sub.name}
              </option>
            ))}
            {subjects.length === 0 && (
              <option value="" className="text-mainText bg-white">
                Math practice
              </option>
            )}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-mainText/70 absolute right-1 top-2 pointer-events-none" />
        </div>
      </div>

      {/* Centerpiece Hourglass Illustration Graphic matching the mockup */}
      <div className="flex items-center justify-center my-3">
        <div className="relative group cursor-pointer" onClick={handleStart}>
          <svg
            className="w-14 h-16 drop-shadow-md transition-transform group-hover:scale-105"
            viewBox="0 0 70 80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Hourglass Caps */}
            <path
              d="M10 8 C10 6, 12 4, 15 4 L55 4 C58 4, 60 6, 60 8 L60 12 L10 12 Z"
              fill="#E09F5E"
            />
            <path
              d="M10 72 L60 72 L60 76 C60 78, 58 80, 55 80 L15 80 C12 80, 10 78, 10 76 Z"
              fill="#E09F5E"
            />
            {/* Glass Body */}
            <path
              d="M15 12 C15 32, 30 38, 35 40 C40 38, 55 32, 55 12 Z
                 M15 68 C15 48, 30 42, 35 40 C40 42, 55 48, 55 68 Z"
              fill="#FFFFFF"
              fillOpacity="0.8"
              stroke="#DDA575"
              strokeWidth="1.5"
            />
            {/* Sand (Teal/Green matching mockup) */}
            <path
              d="M20 20 C20 30, 32 36, 35 37 C38 36, 50 30, 50 20 Z"
              fill="#74C99A"
            />
            <path
              d="M22 66 C22 58, 32 54, 35 54 C38 54, 48 58, 48 66 Z"
              fill="#74C99A"
            />
          </svg>
        </div>
      </div>

      {/* Stepper & Timer Display: [-] 25:00 [+] */}
      <div className="flex items-center justify-center gap-4 my-1">
        <button
          onClick={() => adjustMinutes(-5)}
          disabled={targetMinutes <= 5}
          className="w-7 h-7 rounded-full bg-white/70 hover:bg-white text-mainText flex items-center justify-center shadow-sm disabled:opacity-30 transition-all hover:scale-105 active:scale-95"
          title="Decrease 5 minutes"
        >
          <Minus className="w-3.5 h-3.5 stroke-[3]" />
        </button>

        <span className="text-2xl md:text-3xl font-extrabold font-display tracking-tight text-mainText select-none min-w-[90px] text-center">
          {formatTime(targetMinutes)}
        </span>

        <button
          onClick={() => adjustMinutes(5)}
          disabled={targetMinutes >= 120}
          className="w-7 h-7 rounded-full bg-white/70 hover:bg-white text-mainText flex items-center justify-center shadow-sm disabled:opacity-30 transition-all hover:scale-105 active:scale-95"
          title="Increase 5 minutes"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
        </button>
      </div>

      {/* Large Start Pill Button: Launches full focus mode immediately */}
      <div className="mt-3">
        <button
          onClick={handleStart}
          className="w-full py-2.5 px-6 rounded-full bg-white hover:bg-peach-50 text-mainText font-bold text-sm shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <Play className="w-4 h-4 fill-mainText ml-0.5" />
          <span>Start Full Focus</span>
        </button>
      </div>
    </div>
  );
};

export default PomodoroCard;
