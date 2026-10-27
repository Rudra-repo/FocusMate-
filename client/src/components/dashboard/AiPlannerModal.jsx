import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Clock,
  Calendar,
  CheckCircle2,
  X,
  ArrowRight,
  ShieldAlert,
  Flame,
  Zap,
  Target,
  BookOpen,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export const AiPlannerModal = ({ isOpen, onClose }) => {
  const { startFullFocusMode } = useAuth();
  const [activeTab, setActiveTab] = useState('today'); // 'today', 'tomorrow', 'exams'
  const [scheduleData, setScheduleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdopted, setIsAdopted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      const fetchAiSchedule = async () => {
        setLoading(true);
        try {
          const res = await api.post('/ai/arrange-schedule');
          if (res.data.success) {
            setScheduleData(res.data.data);
          }
        } catch (err) {
          console.error('Failed to arrange schedule:', err);
        } finally {
          setLoading(false);
        }
      };

      fetchAiSchedule();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const { todayPlan = [], tomorrowPlan = [], examCountdownList = [], quickSummary = '' } = scheduleData || {};

  const handleStartBlock = (block) => {
    onClose();
    startFullFocusMode({
      targetMinutes: block.estimatedMinutes || 25,
      taskTitle: block.title,
      subjectName: block.subject?.name || 'Academic Focus',
      taskId: block.taskId,
    });
  };

  const handleAdoptSchedule = () => {
    setIsAdopted(true);
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#342D2B]/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl p-6 md:p-8 max-w-3xl w-full shadow-2xl border-2 border-peach-200 my-8 animate-in zoom-in-95 duration-200 text-left">
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-peach-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-coral to-sidebarOrange text-white flex items-center justify-center shadow-soft-peach">
              <Sparkles className="w-6 h-6 text-softYellow animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-coral">
                  AI Study Mode Active
                </span>
                <span className="text-[10px] bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">
                  Optimized for Exam Scores
                </span>
              </div>
              <h3 className="text-xl md:text-2xl font-bold font-display text-mainText mt-0.5">
                AI Structured Study Plan
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-peach-50 text-mainText-muted hover:text-coral flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* AI Summary Banner */}
        {quickSummary && (
          <div className="my-4 p-3.5 rounded-2xl bg-peach-50 border border-peach-200 text-xs text-mainText font-medium flex items-center gap-2.5">
            <Zap className="w-4 h-4 text-coral shrink-0" />
            <span>{quickSummary}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mb-5">
          <button
            onClick={() => setActiveTab('today')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'today'
                ? 'bg-coral text-white shadow-soft-peach'
                : 'bg-peach-50 text-mainText-muted hover:bg-peach-100'
            }`}
          >
            📅 Today's Time-Blocked Plan
          </button>
          <button
            onClick={() => setActiveTab('tomorrow')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'tomorrow'
                ? 'bg-coral text-white shadow-soft-peach'
                : 'bg-peach-50 text-mainText-muted hover:bg-peach-100'
            }`}
          >
            🌅 Tomorrow's Strategy
          </button>
          <button
            onClick={() => setActiveTab('exams')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'exams'
                ? 'bg-coral text-white shadow-soft-peach'
                : 'bg-peach-50 text-mainText-muted hover:bg-peach-100'
            }`}
          >
            🚨 Exam Dates & Countdown
          </button>
        </div>

        {/* Content Tabs */}
        {loading ? (
          <div className="py-16 text-center text-xs text-mainText-muted">
            Analyzing deadlines, syllabus topics, and quiz accuracy...
          </div>
        ) : (
          <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
            {/* 1. Today's Plan Tab */}
            {activeTab === 'today' && (
              <div className="space-y-3">
                {todayPlan.map((slot) => (
                  <div
                    key={slot.slotId}
                    className="p-4 rounded-2xl bg-white border border-peach-200 hover:border-coral/50 shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-xs font-bold text-coral-dark bg-peach-50 px-2.5 py-1 rounded-xl border border-peach-200">
                          {slot.startTime} – {slot.endTime}
                        </span>
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                          style={{ backgroundColor: slot.subject?.color || '#FF8B76' }}
                        >
                          {slot.subject?.name}
                        </span>
                        <span className="text-[11px] font-semibold text-mainText-muted uppercase">
                          {slot.blockLabel}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-mainText mt-2">
                        {slot.title}
                      </h4>

                      <p className="text-xs text-mainText-muted mt-1 bg-peach-50/60 p-2 rounded-xl border border-peach-100">
                        🎯 <strong className="text-mainText font-semibold">Tip:</strong> {slot.scoreBoostTip}
                      </p>
                    </div>

                    <button
                      onClick={() => handleStartBlock(slot)}
                      className="px-4 py-2 rounded-xl bg-coral hover:bg-coral-dark text-white font-bold text-xs shadow-soft-peach flex items-center justify-center gap-1.5 shrink-0 transition-all hover:scale-105 active:scale-95"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Start Block</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 2. Tomorrow's Strategy Tab */}
            {activeTab === 'tomorrow' && (
              <div className="space-y-3">
                {tomorrowPlan.map((tm, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-peach-50/50 border border-peach-200 space-y-1.5"
                  >
                    <span className="font-mono text-xs font-bold text-coral-dark bg-white px-2 py-0.5 rounded-lg border border-peach-200">
                      {tm.timeBlock}
                    </span>
                    <h4 className="text-sm font-bold text-mainText pt-1">{tm.focus}</h4>
                    <p className="text-xs text-mainText-muted">{tm.objective}</p>
                  </div>
                ))}
              </div>
            )}

            {/* 3. Exam Dates & Countdown Tab */}
            {activeTab === 'exams' && (
              <div className="space-y-3">
                {examCountdownList.map((ex, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-white border-2 border-peach-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-bold text-white shadow-sm"
                          style={{ backgroundColor: ex.color }}
                        >
                          {ex.subjectName}
                        </span>
                        <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                          ⏱️ {ex.daysLeft} Days Remaining
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-mainText mt-1.5">
                        {ex.title} (Exam Date: {ex.examDate})
                      </h4>

                      <p className="text-xs text-mainText-muted mt-1 bg-peach-50/70 p-2.5 rounded-xl border border-peach-200 font-medium">
                        💡 <strong className="text-mainText font-bold">Priority Advice:</strong> {ex.priorityAdvice}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-mainText-muted uppercase font-bold block">
                        Readiness
                      </span>
                      <span className="text-2xl font-black font-display text-coral">
                        {ex.readinessScore}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal Bottom Actions */}
        <div className="mt-6 pt-4 border-t border-peach-100 flex items-center justify-between">
          <span className="text-xs text-mainText-muted">
            AI updates dynamically as you complete tasks.
          </span>

          <button
            onClick={handleAdoptSchedule}
            className="px-6 py-2.5 rounded-xl bg-coral hover:bg-coral-dark text-white text-xs font-bold shadow-soft-peach flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
          >
            {isAdopted ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Schedule Adopted!</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Adopt AI Schedule</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiPlannerModal;
