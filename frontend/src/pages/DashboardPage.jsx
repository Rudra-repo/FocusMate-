import React, { useState, useEffect } from 'react';
import { WelcomeBanner } from '../components/dashboard/WelcomeBanner';
import { WeeklyProductivityChart } from '../components/dashboard/WeeklyProductivityChart';
import { TaskPerformanceRing } from '../components/dashboard/TaskPerformanceRing';
import { BlockListCard } from '../components/dashboard/BlockListCard';
import { TodaysTasksCard } from '../components/dashboard/TodaysTasksCard';
import { PomodoroCard } from '../components/dashboard/PomodoroCard';
import { FlowerCelebrationModal } from '../components/layout/FlowerCelebrationModal';
import { ExamAlertsBanner } from '../components/dashboard/ExamAlertsBanner';
import { AiPlannerModal } from '../components/dashboard/AiPlannerModal';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Brain, ArrowRight, Zap, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export const DashboardPage = () => {
  const { startFullFocusMode } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [celebration, setCelebration] = useState({ isOpen: false, minutes: 25, taskTitle: '' });
  const [isAiPlannerOpen, setIsAiPlannerOpen] = useState(false);
  const navigate = useNavigate();

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/dashboard');
      if (res.data.success) {
        setDashboardData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleSessionComplete = (minutes, taskTitle) => {
    setCelebration({
      isOpen: true,
      minutes,
      taskTitle: taskTitle || 'Focus Session',
    });
    fetchDashboard();
  };

  if (loading && !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full border-4 border-coral border-t-transparent animate-spin" />
          <p className="text-sm font-semibold text-mainText-muted">Loading your study workspace...</p>
        </div>
      </div>
    );
  }

  const {
    user,
    greeting,
    todayTasks = [],
    weeklyProductivity = [],
    taskPerformance = {},
    blockList = [],
    timerConfig = {},
    topRecommendation,
  } = dashboardData || {};

  return (
    <div className="space-y-6 pb-8">
      {/* 1. Exam Countdown & Imminent Deadlines Alert Hub with AI Mode Button */}
      <ExamAlertsBanner onOpenAiPlanner={() => setIsAiPlannerOpen(true)} />

      {/* 2. Adaptive Learning Recommendation Banner */}
      {topRecommendation && (
        <div className="bg-gradient-to-r from-[#FFF2EB] via-white to-[#FFF9F2] rounded-3xl p-4 md:p-5 border border-[#FFD4BF] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-coral/15 flex items-center justify-center text-coral shrink-0 mt-0.5">
              <Brain className="w-5 h-5 text-coral" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-coral">
                  Adaptive Learning Recommendation
                </span>
                <span className="text-[10px] bg-coral-100 text-coral-600 font-bold px-2 py-0.5 rounded-full">
                  Score {topRecommendation.score}/100
                </span>
              </div>
              <p className="text-xs md:text-sm font-bold text-mainText mt-0.5">
                {topRecommendation.reason}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/plan')}
            className="px-4 py-2 rounded-2xl bg-coral hover:bg-coral-dark text-white font-bold text-xs shadow-sm hover:shadow transition-all shrink-0 flex items-center gap-1.5"
          >
            <span>View Full Plan</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 3. Main Reference Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Banner, Chart, Performance, Block List */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6 flex flex-col justify-between">
          {/* Welcome Banner with Sunrise art & Mini Calendar */}
          <WelcomeBanner
            greeting={greeting}
            user={user}
            onReadyClick={() =>
              startFullFocusMode({
                targetMinutes: 25,
                taskTitle: todayTasks[0]?.title || '',
                subjectName: todayTasks[0]?.subject?.name || 'Academic Focus',
              })
            }
          />

          {/* Middle Row: Weekly Productivity Analysis & Task Performance */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-6">
            <div className="sm:col-span-7">
              <WeeklyProductivityChart data={weeklyProductivity} />
            </div>
            <div className="sm:col-span-5">
              <TaskPerformanceRing
                percentage={taskPerformance.percentage || 72}
                label={taskPerformance.label || 'Productive Hours'}
              />
            </div>
          </div>

          {/* Block List Card */}
          <BlockListCard
            blockedItems={blockList}
            onUpdateList={(updated) => {
              setDashboardData((prev) => ({ ...prev, blockList: updated }));
            }}
          />
        </div>

        {/* Right Column (5 cols or 4 cols): Today's Tasks & Pomodoro Timer */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6 flex flex-col justify-between">
          {/* Today's Tasks with "Speak to Add Task" Voice Feature */}
          <div className="flex-1 min-h-[360px]">
            <TodaysTasksCard
              tasks={todayTasks}
              subjects={timerConfig.subjects || []}
              onTasksUpdated={fetchDashboard}
            />
          </div>

          {/* Pomodoro Timer centerpiece */}
          <div className="min-h-[290px]">
            <PomodoroCard
              subjects={timerConfig.subjects || []}
              onSessionComplete={handleSessionComplete}
            />
          </div>
        </div>
      </div>

      {/* Blooming Flower Celebration Modal */}
      <FlowerCelebrationModal
        isOpen={celebration.isOpen}
        minutes={celebration.minutes}
        taskTitle={celebration.taskTitle}
        onClose={() => setCelebration({ isOpen: false, minutes: 25, taskTitle: '' })}
      />

      {/* AI Study Mode Planner Modal */}
      <AiPlannerModal
        isOpen={isAiPlannerOpen}
        onClose={() => setIsAiPlannerOpen(false)}
      />
    </div>
  );
};

export default DashboardPage;
