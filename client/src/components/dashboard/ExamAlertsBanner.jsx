import React, { useState, useEffect } from 'react';
import { AlertCircle, Clock, Calendar, Sparkles, ArrowRight, Zap, Trophy, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export const ExamAlertsBanner = ({ onOpenAiPlanner }) => {
  const [scheduleData, setScheduleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const res = await api.post('/ai/arrange-schedule');
        if (res.data.success) {
          setScheduleData(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load exam alerts:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, []);

  if (loading || !scheduleData) return null;

  const { alerts = [], examCountdownList = [] } = scheduleData;
  const primaryAlert = alerts[0];
  const imminentExam = examCountdownList[0];

  return (
    <div className="space-y-4">
      {/* Imminent Exam & Deadline Alert Hub */}
      <div className="bg-gradient-to-r from-[#FFF0E8] via-[#FFEBE0] to-[#FFF6F0] rounded-3xl p-5 md:p-6 border-2 border-coral/30 shadow-soft-peach relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Left Side: Exam Alert Info */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-coral text-white flex items-center justify-center shrink-0 shadow-md">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-extrabold uppercase tracking-wider bg-red-100 text-red-600 px-2.5 py-0.5 rounded-full border border-red-200">
                  Priority Exam Countdown
                </span>
                {imminentExam && (
                  <span className="text-[11px] font-bold text-coral-dark bg-white px-2.5 py-0.5 rounded-full border border-peach-200 shadow-sm">
                    ⏱️ {imminentExam.daysLeft} Days Until {imminentExam.title}
                  </span>
                )}
              </div>

              <h3 className="text-base md:text-lg font-black font-display text-mainText mt-1.5">
                {imminentExam?.title || 'Upcoming Semester Midterm Exam'}
              </h3>

              <p className="text-xs md:text-sm text-mainText-muted mt-1 max-w-2xl font-medium">
                💡 <strong className="text-mainText font-bold">Exam Score Maximizer:</strong>{' '}
                {imminentExam?.priorityAdvice || 'Revise SQL Joins practice set and take the diagnostic mock test to ensure top grades.'}
              </p>
            </div>
          </div>

          {/* Right Side Action Buttons */}
          <div className="flex items-center gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-peach-200">
            <button
              onClick={onOpenAiPlanner}
              className="px-4 py-2.5 rounded-2xl bg-white border-2 border-coral text-coral-dark hover:bg-peach-50 font-extrabold text-xs shadow-sm flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-coral animate-spin-slow" />
              <span>AI Study Mode</span>
            </button>

            <button
              onClick={() => navigate('/plan')}
              className="px-5 py-2.5 rounded-2xl bg-coral hover:bg-coral-dark text-white font-extrabold text-xs shadow-soft-peach flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95"
            >
              <span>View Full Plan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamAlertsBanner;
