import React from 'react';

export const TaskPerformanceRing = ({ percentage = 72, label = 'Productive Hours' }) => {
  // SVG Circular progress math
  const radius = 52;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="bg-white/95 rounded-3xl p-5 shadow-soft-card border border-[#FFE2D3]/60 flex flex-col justify-between h-full transition-all">
      <div>
        <h3 className="text-sm md:text-base font-bold text-mainText font-display">
          Task Performance
        </h3>
        <span className="text-[11px] font-medium text-mainText-muted block mt-0.5">
          Today
        </span>
      </div>

      {/* Circular Progress Ring */}
      <div className="flex items-center justify-center my-3 relative">
        <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 130 130">
          {/* Background circle */}
          <circle
            cx="65"
            cy="65"
            r={radius}
            fill="transparent"
            stroke="#EBF7F0"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx="65"
            cy="65"
            r={radius}
            fill="transparent"
            stroke="#74C99A"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Centered Percentage Value */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-3xl font-extrabold font-display text-mainText tracking-tight">
            {percentage}%
          </span>
        </div>
      </div>

      {/* Bottom Subtitle Indicator */}
      <div className="flex items-center justify-center gap-1.5 pt-2 border-t border-peach-100 text-xs font-semibold text-mainText">
        <span className="w-2 h-2 rounded-full bg-successGreen"></span>
        <span>{label}</span>
      </div>
    </div>
  );
};

export default TaskPerformanceRing;
