import React from 'react';
import { Calendar as CalendarIcon, ArrowRight, Sun } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const WelcomeBanner = ({ greeting, user, onReadyClick }) => {
  const navigate = useNavigate();

  // Days of week header matching the mockup: M T W T F S S
  const daysOfWeek = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  // Current calendar date generation
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.toLocaleString('default', { month: 'short' });
  const currentYear = today.getFullYear();

  // Generate 28 or 31 calendar days for visual representation
  const daysInMonth = new Date(currentYear, today.getMonth() + 1, 0).getDate();
  const firstDayIndex = (new Date(currentYear, today.getMonth(), 1).getDay() + 6) % 7; // Monday-based index

  const calendarCells = [];
  for (let i = 0; i < firstDayIndex; i++) {
    calendarCells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push(d);
  }

  return (
    <div className="rounded-3xl p-5 md:p-6 shadow-soft-card border border-[#FFE2D3]/70 overflow-hidden relative banner-gradient-bg transition-all">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
        {/* Left Side: Greeting, Illustration & Ready Button */}
        <div className="md:col-span-7 flex flex-col justify-between h-full z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-coral-dark/90 flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                FocusMate OS
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold font-display text-mainText tracking-tight">
              {greeting?.text || `Good morning, ${user?.name || 'Taly'}!`}
            </h2>
            <p className="text-sm font-medium text-mainText/75 mt-1">
              {greeting?.subtitle || 'You have 3 tasks for today'}
            </p>
          </div>

          {/* Morning Sunset Skyline Pastel Illustration (inline SVG) */}
          <div className="my-3 py-1 relative">
            <svg
              className="w-full h-24 rounded-2xl shadow-inner object-cover"
              viewBox="0 0 400 110"
              preserveAspectRatio="none"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#FFA695" />
                  <stop offset="50%" stopColor="#FFD494" />
                  <stop offset="100%" stopColor="#FFE7A0" />
                </linearGradient>
                <linearGradient id="sunGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="100%" stopColor="#FFD6A5" />
                </linearGradient>
                <linearGradient id="bldgGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#B36B66" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#8C4F4A" stopOpacity="0.7" />
                </linearGradient>
                <linearGradient id="bldgGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#7A5255" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#5E383C" stopOpacity="0.85" />
                </linearGradient>
              </defs>

              {/* Sky Background */}
              <rect width="400" height="110" rx="16" fill="url(#skyGrad)" />

              {/* Glowing Sun */}
              <circle cx="160" cy="55" r="24" fill="url(#sunGrad)" fillOpacity="0.9" />
              <circle cx="160" cy="55" r="32" fill="#FFFFFF" fillOpacity="0.25" />

              {/* Distant Spire & Academic Rooftops Silhouette */}
              <path
                d="M10 110 L10 70 L25 50 L40 70 L40 110 Z
                   M50 110 L50 65 L60 65 L65 35 L70 65 L80 65 L80 110 Z
                   M95 110 L95 80 L115 60 L135 80 L135 110 Z
                   M150 110 L150 75 L165 75 L165 110 Z
                   M180 110 L180 82 L200 68 L220 82 L220 110 Z
                   M235 110 L235 55 L245 40 L255 55 L255 110 Z
                   M270 110 L270 70 L290 55 L310 70 L310 110 Z
                   M325 110 L325 60 L335 30 L345 60 L355 60 L355 110 Z
                   M370 110 L370 78 L390 62 L400 70 L400 110 Z"
                fill="url(#bldgGrad1)"
              />

              {/* Foreground Architecture Silhouette */}
              <path
                d="M0 110 L0 85 L20 72 L35 85 L35 110 Z
                   M45 110 L45 78 L55 78 L60 52 L65 78 L75 78 L75 110 Z
                   M90 110 L90 86 L110 74 L130 86 L130 110 Z
                   M145 110 L145 80 L170 80 L170 110 Z
                   M185 110 L185 88 L205 76 L225 88 L225 110 Z
                   M240 110 L240 68 L250 50 L260 68 L260 110 Z
                   M280 110 L280 82 L300 70 L320 82 L320 110 Z
                   M340 110 L340 75 L350 48 L360 75 L370 75 L370 110 Z
                   M385 110 L385 88 L400 80 L400 110 Z"
                fill="url(#bldgGrad2)"
              />
            </svg>
          </div>

          <div className="flex items-center gap-3 mt-1">
            <button
              onClick={onReadyClick || (() => navigate('/focus'))}
              className="px-6 py-2.5 rounded-full bg-white hover:bg-peach-50 text-coral-600 font-bold text-sm shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5"
            >
              <span>Ready!</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
            <span className="text-xs text-mainText/70 font-medium hidden sm:inline">
              Start your next focus block
            </span>
          </div>
        </div>

        {/* Right Side: Integrated Mini Calendar matching the reference */}
        <div className="md:col-span-5 bg-white/70 backdrop-blur-md rounded-2xl p-4 border border-white/60 shadow-inner flex flex-col justify-center">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-xs font-bold text-mainText tracking-wider uppercase">
              {currentMonth} {currentYear}
            </span>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-coral"></span>
              <span className="text-[10px] text-mainText-muted font-medium">Today</span>
            </div>
          </div>

          {/* Calendar Days Header: M T W T F S S */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
            {daysOfWeek.map((day, idx) => (
              <span
                key={idx}
                className="text-[11px] font-bold text-mainText-muted select-none"
              >
                {day}
              </span>
            ))}
          </div>

          {/* Calendar Grid Numbers */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {calendarCells.slice(0, 28).map((dayNum, idx) => {
              if (dayNum === null) {
                return <div key={`empty-${idx}`} className="h-6 w-6 mx-auto" />;
              }
              const isToday = dayNum === currentDay;
              const hasTask = dayNum === 17 || dayNum === currentDay; // Matches mockup highlight 17

              return (
                <div
                  key={dayNum}
                  className="h-6 w-6 mx-auto flex items-center justify-center relative select-none"
                >
                  <span
                    className={`text-xs font-medium w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                      isToday
                        ? 'bg-coral text-white font-bold shadow-sm scale-110'
                        : hasTask
                        ? 'bg-peach-200/80 text-coral-dark font-semibold'
                        : 'text-mainText/80 hover:bg-white/80'
                    }`}
                  >
                    {dayNum}
                  </span>
                  {hasTask && !isToday && (
                    <span className="w-1 h-1 rounded-full bg-coral absolute -bottom-0.5" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeBanner;
