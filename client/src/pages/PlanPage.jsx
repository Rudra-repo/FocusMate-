import React, { useState, useEffect } from 'react';
import { Brain, Sparkles, Clock, AlertTriangle, ArrowRight, BookOpen, CheckCircle, Zap, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AiPlannerModal } from '../components/dashboard/AiPlannerModal';
import api from '../services/api';

export const PlanPage = () => {
  const { startFullFocusMode } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formulaInfoOpen, setFormulaInfoOpen] = useState(true);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const navigate = useNavigate();

  const fetchRecommendations = async () => {
    try {
      const res = await api.get('/recommendations');
      if (res.data.success) {
        setRecommendations(res.data.recommendations);
      }
    } catch (err) {
      console.error('Failed to load recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const handleStartFocus = (rec) => {
    startFullFocusMode({
      targetMinutes: rec.recommendedMinutes || 25,
      taskId: rec.taskId,
      subjectId: rec.subjectId,
      taskTitle: rec.title,
      subjectName: rec.subjectName,
    });
  };

  const handleTakeQuiz = (rec) => {
    navigate('/quizzes', {
      state: {
        subjectId: rec.subjectId,
        topicName: rec.topicName,
      },
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Info Banner */}
      <div className="bg-white/95 rounded-3xl p-6 shadow-soft-card border border-[#FFE2D3]/60 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-coral/15 flex items-center justify-center text-coral shrink-0">
              <Brain className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-coral uppercase tracking-wider">
                  Adaptive Study Planner
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-peach-100 text-coral-dark text-[11px] font-semibold border border-peach-200">
                  Rule-Based Engine Active
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-extrabold font-display text-mainText mt-1">
                Personalized Revision & Study Priorities
              </h2>
              <p className="text-xs md:text-sm text-mainText-muted mt-1 max-w-2xl">
                FocusMate computes study priorities by evaluating upcoming exam deadlines, your past quiz accuracy, task importance weights, and overdue delays.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center">
            <button
              onClick={() => setIsAiModalOpen(true)}
              className="flex items-center gap-1.5 text-xs font-bold text-white bg-coral hover:bg-coral-dark px-4 py-2 rounded-2xl shadow-soft-peach transition-all hover:scale-105 active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-softYellow" />
              <span>Arrange with AI</span>
            </button>

            <button
              onClick={() => setFormulaInfoOpen(!formulaInfoOpen)}
              className="flex items-center gap-1.5 text-xs font-semibold text-coral hover:text-coral-dark bg-peach-50 px-3 py-2 rounded-2xl border border-peach-200"
            >
              <Info className="w-4 h-4" />
              <span>{formulaInfoOpen ? 'Hide Formula' : 'Formula'}</span>
            </button>
          </div>
        </div>

        {/* Scoring Formula Card */}
        {formulaInfoOpen && (
          <div className="mt-5 p-4 rounded-2xl bg-peach-50/70 border border-peach-200/80 animate-in fade-in duration-200">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
              <span className="text-xs font-bold text-mainText">Transparent Ranking Model</span>
              <span className="font-mono text-xs font-bold text-coral-dark bg-white px-2.5 py-1 rounded-xl border border-peach-200">
                Priority Score = 0.35·D + 0.30·W + 0.20·P + 0.15·A
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[11px] text-mainText-muted mt-3">
              <div className="bg-white p-2.5 rounded-xl border border-peach-100">
                <strong className="text-coral-dark block font-bold">D: Deadline Urgency (35%)</strong>
                Proximity of exam or assignment due dates.
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-peach-100">
                <strong className="text-coral-dark block font-bold">W: Topic Weakness (30%)</strong>
                Low quiz accuracy or topics marked for revision.
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-peach-100">
                <strong className="text-coral-dark block font-bold">P: Importance (20%)</strong>
                Task priority (High/Med/Low) & academic weight.
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-peach-100">
                <strong className="text-coral-dark block font-bold">A: Overdue Delay (15%)</strong>
                Accumulated backlog penalty for overdue tasks.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recommendations Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-base font-bold text-mainText font-display">
            Recommended Next Actions ({recommendations.length})
          </h3>
          <span className="text-xs font-medium text-mainText-muted">
            Sorted by highest priority score
          </span>
        </div>

        {loading ? (
          <div className="text-center py-12 text-sm text-mainText-muted">
            Evaluating academic factors...
          </div>
        ) : recommendations.length === 0 ? (
          <div className="bg-white/80 rounded-3xl p-10 text-center border border-peach-200">
            <CheckCircle className="w-12 h-12 text-successGreen mx-auto mb-3" />
            <h4 className="text-base font-bold text-mainText">All caught up!</h4>
            <p className="text-xs text-mainText-muted mt-1 max-w-sm mx-auto">
              You have no overdue assignments or weak topics flagged. Create a new task or take a diagnostic quiz to maintain your mastery.
            </p>
          </div>
        ) : (
          recommendations.map((rec, idx) => (
            <div
              key={rec.id}
              className="bg-white/95 rounded-3xl p-5 md:p-6 shadow-soft-card border border-[#FFE2D3]/60 transition-all hover:border-coral/50 group"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                {/* Details */}
                <div className="flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="w-6 h-6 rounded-full bg-peach-100 text-coral font-bold text-xs flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <span
                      className="px-2.5 py-0.5 rounded-full text-xs font-bold text-white shadow-sm"
                      style={{ backgroundColor: rec.subjectColor || '#FF8B76' }}
                    >
                      {rec.subjectName}
                    </span>
                    <span className="text-xs font-semibold text-mainText-muted">
                      {rec.topicName}
                    </span>
                    {rec.isOverdue && (
                      <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-[10px] font-bold">
                        Overdue
                      </span>
                    )}
                  </div>

                  <h4 className="text-base md:text-lg font-bold text-mainText mt-2 group-hover:text-coral transition-colors">
                    {rec.title}
                  </h4>

                  <p className="text-xs md:text-sm text-mainText-muted mt-1 bg-peach-50/50 p-2.5 rounded-2xl border border-peach-100">
                    💡 <strong className="text-mainText font-semibold">Why this:</strong> {rec.reason}
                  </p>

                  {/* Factor Breakdown Bars */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 pt-3 border-t border-peach-100">
                    <div>
                      <span className="text-[10px] text-mainText-muted block">Deadline Urgency (D)</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex-1 h-1.5 bg-peach-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-coral rounded-full"
                            style={{ width: `${rec.factors.deadlineUrgency}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-bold text-mainText">{rec.factors.deadlineUrgency}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-mainText-muted block">Weakness (W)</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex-1 h-1.5 bg-peach-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-400 rounded-full"
                            style={{ width: `${rec.factors.topicWeakness}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-bold text-mainText">{rec.factors.topicWeakness}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-mainText-muted block">Importance (P)</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex-1 h-1.5 bg-peach-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-400 rounded-full"
                            style={{ width: `${rec.factors.importance}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-bold text-mainText">{rec.factors.importance}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-mainText-muted block">Delay (A)</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex-1 h-1.5 bg-peach-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-red-400 rounded-full"
                            style={{ width: `${rec.factors.accumulatedDelay}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-bold text-mainText">{rec.factors.accumulatedDelay}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Score Pill & Action Buttons */}
                <div className="flex lg:flex-col items-center lg:items-end justify-between gap-3 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-peach-100">
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-mainText-muted block">Priority Score</span>
                    <span className="text-2xl font-black font-display text-coral">
                      {rec.score}
                      <span className="text-xs font-semibold text-mainText-muted ml-0.5">/100</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {rec.actionType === 'quiz' ? (
                      <button
                        onClick={() => handleTakeQuiz(rec)}
                        className="px-4 py-2 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>Take Quiz</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStartFocus(rec)}
                        className="px-4 py-2 rounded-2xl bg-coral hover:bg-coral-dark text-white font-bold text-xs shadow-soft-peach flex items-center gap-1.5 transition-all"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Focus 25m</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* AI Structured Plan Modal */}
      <AiPlannerModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
      />
    </div>
  );
};

export default PlanPage;
