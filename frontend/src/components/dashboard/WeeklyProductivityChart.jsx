import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

export const WeeklyProductivityChart = ({ data = [] }) => {
  // Format matching mockup: S S M Tu W Th F
  const defaultData = [
    { day: 'S', minutes: 120, hours: 2.0 },
    { day: 'S', minutes: 80, hours: 1.3 },
    { day: 'M', minutes: 180, hours: 3.0 },
    { day: 'Tu', minutes: 240, hours: 4.0 },
    { day: 'W', minutes: 190, hours: 3.2 },
    { day: 'Th', minutes: 280, hours: 4.6 },
    { day: 'F', minutes: 140, hours: 2.3 },
  ];

  const chartData = data && data.length > 0 ? data : defaultData;

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-[#342D2B] text-white text-xs px-2.5 py-1.5 rounded-xl shadow-lg border border-white/10">
          <p className="font-bold">{item.hours || Math.round((item.minutes / 60) * 10) / 10} hrs focused</p>
          <p className="text-[10px] text-peach-200">{item.minutes} minutes</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white/95 rounded-3xl p-5 shadow-soft-card border border-[#FFE2D3]/60 flex flex-col justify-between h-full transition-all">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm md:text-base font-bold text-mainText font-display">
          Weekly Productivity Analysis
        </h3>
        <span className="text-[11px] font-semibold text-coral bg-peach-50 px-2 py-0.5 rounded-full border border-peach-200">
          Target: 10h
        </span>
      </div>

      {/* Bar Chart Container */}
      <div className="w-full h-44 mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 15, right: 10, left: -25, bottom: 0 }}>
            {/* Target dashed reference line matching the mockup */}
            <ReferenceLine
              y={240}
              stroke="#B8C5D0"
              strokeDasharray="3 3"
              label={{
                value: '10h',
                position: 'left',
                fill: '#94A3B8',
                fontSize: 10,
                fontWeight: 600,
              }}
            />
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#7E7571', fontSize: 11, fontWeight: 600 }}
              dy={5}
            />
            <YAxis hide domain={[0, 320]} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 139, 118, 0.06)' }} />
            <Bar
              dataKey="minutes"
              fill="#74C99A"
              radius={[8, 8, 8, 8]}
              barSize={18}
              animationDuration={800}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-peach-100 text-[11px] text-mainText-muted">
        <span>Daily study duration</span>
        <span className="font-semibold text-successGreen-dark">● Consistent streak</span>
      </div>
    </div>
  );
};

export default WeeklyProductivityChart;
