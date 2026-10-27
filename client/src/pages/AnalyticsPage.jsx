import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Flame,
  Clock,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  AlertTriangle,
  Award,
  Calendar,
  Zap,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

export const AnalyticsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get('/analytics/overview');
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 rounded-full border-4 border-coral border-t-transparent animate-spin" />
      </div>
    );
  }

  const {
    totalFocusHours = 0,
    totalSessionsCount = 0,
    completionRate = 100,
    streak = { current: 1, longest: 1 },
    weeklyTrends = [],
    subjectAccuracy = [],
    weakTopics = [],
    topicsNeedingDiagnostic = [],
    mostProductiveDay = 'Th',
    todayTasksSummary = {},
    totalTasksCompleted = 0,
    totalTasksCount = 0,
  } = data;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div>
        <h2 className="text-xl md:text-2xl font-bold font-display text-mainText">
          Learning Analytics & Habit Insights
        </h2>
        <p className="text-xs md:text-sm text-mainText-muted mt-0.5">
          Actionable metrics calculated from your real study sessions, task completions, and quiz submissions.
        </p>
      </div>

      {/* Top 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Focus Hours */}
        <div className="bg-white/95 rounded-3xl p-4 sm:p-5 shadow-soft-card border border-[#FFE2D3]/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-mainText-muted">Total Focus Hours</span>
            <div className="w-8 h-8 rounded-xl bg-peach-100 text-coral flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-extrabold font-display text-mainText mt-2">
            {totalFocusHours}
            <span className="text-xs font-semibold text-mainText-muted ml-1">hrs</span>
          </div>
          <span className="text-[11px] text-successGreen-dark font-semibold mt-1 block">
            Across {totalSessionsCount} sessions
          </span>
        </div>

        {/* Task Completion Rate */}
        <div className="bg-white/95 rounded-3xl p-5 shadow-soft-card border border-[#FFE2D3]/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-mainText-muted">Tasks Completed</span>
            <div className="w-8 h-8 rounded-xl bg-green-100 text-successGreen flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-extrabold font-display text-mainText mt-2">
            {totalTasksCompleted}
            <span className="text-xs font-semibold text-mainText-muted ml-1">/ {totalTasksCount}</span>
          </div>
          <span className="text-[11px] text-mainText-muted font-semibold mt-1 block">
            {todayTasksSummary.performanceRate || 72}% today rate
          </span>
        </div>

        {/* Study Streak */}
        <div className="bg-white/95 rounded-3xl p-5 shadow-soft-card border border-[#FFE2D3]/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-mainText-muted">Active Streak</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <Flame className="w-4 h-4 fill-amber-500" />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-extrabold font-display text-mainText mt-2">
            {streak.current || 1}
            <span className="text-xs font-semibold text-mainText-muted ml-1">days</span>
          </div>
          <span className="text-[11px] text-coral-dark font-semibold mt-1 block">
            Longest record: {streak.longest || 1} days
          </span>
        </div>

        {/* Focus Completion Rate */}
        <div className="bg-white/95 rounded-3xl p-5 shadow-soft-card border border-[#FFE2D3]/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-mainText-muted">Completion Rate</span>
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-extrabold font-display text-mainText mt-2">
            {completionRate}%
          </div>
          <span className="text-[11px] text-mainText-muted font-semibold mt-1 block">
            Peak Day: {mostProductiveDay}
          </span>
        </div>
      </div>

      {/* Middle Row: Weekly Trend Chart & Subject Accuracy */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Weekly Productivity Trend (7 cols) */}
        <div className="lg:col-span-7 bg-white/95 rounded-3xl p-6 shadow-soft-card border border-[#FFE2D3]/60">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-mainText font-display">
                Weekly Productivity Trends
              </h3>
              <p className="text-xs text-mainText-muted">Daily focused minutes over the past 7 days</p>
            </div>
            <span className="text-xs font-semibold text-coral bg-peach-50 px-2.5 py-1 rounded-full border border-peach-200">
              Goal: 2h/day
            </span>
          </div>

          <div className="w-full h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyTrends} margin={{ top: 15, right: 10, left: -25, bottom: 0 }}>
                <ReferenceLine y={120} stroke="#FFAB88" strokeDasharray="3 3" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#7E7571', fontSize: 12, fontWeight: 600 }} dy={5} />
                <YAxis hide domain={[0, 300]} />
                <Tooltip
                  formatter={(val) => [`${val} mins (${Math.round((val / 60) * 10) / 10}h)`, 'Focus Time']}
                  cursor={{ fill: 'rgba(255, 139, 118, 0.08)' }}
                />
                <Bar dataKey="minutes" fill="#74C99A" radius={[8, 8, 8, 8]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quiz Accuracy by Subject (5 cols) */}
        <div className="lg:col-span-5 bg-white/95 rounded-3xl p-6 shadow-soft-card border border-[#FFE2D3]/60">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-mainText font-display">
                Subject Quiz Accuracy
              </h3>
              <p className="text-xs text-mainText-muted">Calculated from recent test attempts</p>
            </div>
          </div>

          <div className="space-y-4">
            {subjectAccuracy.length === 0 ? (
              <div className="text-center py-8 text-xs text-mainText-muted">
                No quiz attempts logged yet.
              </div>
            ) : (
              subjectAccuracy.map((sub) => (
                <div key={sub.subjectId} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-mainText">{sub.name}</span>
                    <span className="text-coral-dark">
                      {sub.accuracy !== null ? `${sub.accuracy}%` : 'No data'}
                    </span>
                  </div>
                  <div className="h-2 bg-peach-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${sub.accuracy || 10}%`,
                        backgroundColor: sub.color || '#FF8B76',
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Weakest Topics & Diagnostic Prompts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Weak Topics */}
        <div className="bg-white/95 rounded-3xl p-6 shadow-soft-card border border-[#FFE2D3]/60">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-mainText font-display flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>Identified Weak Topics</span>
              </h3>
              <p className="text-xs text-mainText-muted">Topics with quiz accuracy under 65%</p>
            </div>
          </div>

          <div className="space-y-3">
            {weakTopics.length === 0 ? (
              <div className="py-6 text-center text-xs text-successGreen-dark font-semibold">
                ✓ No weak topics identified. Your retention across tested topics is strong!
              </div>
            ) : (
              weakTopics.map((top) => (
                <div
                  key={top.id}
                  className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200/80 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <span className="font-bold text-mainText block">{top.name}</span>
                    <span className="text-[11px] text-mainText-muted">{top.subjectName}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                      {top.accuracy}% Acc
                    </span>
                    <button
                      onClick={() => navigate('/plan')}
                      className="px-3 py-1 rounded-xl bg-coral text-white font-bold text-[11px] shadow-sm hover:bg-coral-dark"
                    >
                      Revise
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Diagnostic Quiz Prompt (per PRD requirement) */}
        <div className="bg-white/95 rounded-3xl p-6 shadow-soft-card border border-[#FFE2D3]/60 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-mainText font-display flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-coral" />
              <span>Diagnostic Recommendations</span>
            </h3>
            <p className="text-xs text-mainText-muted mb-4">
              FocusMate only flags topics as weak when verified by quiz data. Complete a diagnostic test to evaluate topics without score data:
            </p>

            <div className="space-y-2.5">
              {topicsNeedingDiagnostic.map((t) => (
                <div
                  key={t.id}
                  className="p-3 rounded-2xl bg-peach-50/60 border border-peach-200 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-mainText block">{t.name}</span>
                    <span className="text-[11px] text-mainText-muted">{t.subjectName}</span>
                  </div>
                  <button
                    onClick={() => navigate('/quizzes')}
                    className="px-3 py-1 rounded-xl bg-white border border-peach-300 text-coral font-bold text-[11px] hover:bg-coral hover:text-white transition-colors"
                  >
                    Take Quiz
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-peach-100 text-[11px] text-mainText-muted text-center">
            Diagnostics take only 5–8 minutes and optimize your adaptive study schedule.
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
