import React, { useState } from 'react';
import {
  X,
  Clock,
  Lock,
  Sparkles,
  Folder,
  Minus,
  Plus,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Award,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const TopicStudyPlannerModal = ({
  isOpen,
  onClose,
  topic,
  subject,
  onOpenMaterials,
  onOpenAiQuiz,
}) => {
  const { startFullFocusMode } = useAuth();

  // Dynamic recommendation based on difficulty and quiz accuracy
  const calculateRecommendation = () => {
    if (!topic) return { minutes: 25, reason: 'Standard academic study block.' };

    const accuracy = topic.quizAccuracy !== null && topic.quizAccuracy !== undefined ? topic.quizAccuracy : 50;
    const isWeak = topic.masteryLevel === 'revision' || accuracy < 60;
    const isHard = topic.difficulty === 'hard';
    const isMastered = topic.masteryLevel === 'mastered' || accuracy >= 85;

    if (isMastered) {
      return {
        minutes: 15,
        level: 'Flash Review',
        reason: `High topic mastery (${accuracy}% accuracy). A brief 15-20 min revision is ideal to maintain high exam retention.`,
      };
    }

    if (isWeak || isHard) {
      return {
        minutes: 45,
        level: 'Deep Focus & Problem Solving',
        reason: `Marked for revision with ${accuracy}% accuracy on ${topic.difficulty} difficulty. An intensive 45-60 min focus block is recommended to master key equations and problem types.`,
      };
    }

    return {
      minutes: 30,
      level: 'Concept Practice',
      reason: `Moderate retention (${accuracy}% accuracy). A solid 30 min focus session will reinforce comprehension and algorithm application.`,
    };
  };

  const recommendation = calculateRecommendation();
  const [selectedMinutes, setSelectedMinutes] = useState(recommendation.minutes);

  // Update selectedMinutes when topic changes
  React.useEffect(() => {
    if (topic) {
      const rec = calculateRecommendation();
      setSelectedMinutes(rec.minutes);
    }
  }, [topic]);

  if (!isOpen || !topic) return null;

  const handleAdjustMinutes = (delta) => {
    setSelectedMinutes((prev) => Math.max(5, Math.min(180, prev + delta)));
  };

  const handleStartFocus = () => {
    onClose();
    startFullFocusMode({
      targetMinutes: selectedMinutes,
      topicId: topic._id,
      topicName: topic.name,
      subjectId: subject?._id || topic.subjectId?._id || null,
      subjectName: subject?.name || topic.subjectId?.name || 'Academic Study',
      notes: topic.notes || '',
      resources: topic.resources || [],
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#342D2B]/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-5 sm:p-6 md:p-8 max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-peach-200 my-auto animate-in zoom-in-95 duration-200 relative">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-peach-100">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span
                className="px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white shadow-sm"
                style={{ backgroundColor: subject?.color || '#FF8B76' }}
              >
                {subject?.name || 'Course'}
              </span>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-peach-100 text-coral">
                Syllabus Topic Plan
              </span>
            </div>
            <h3 className="text-xl md:text-2xl font-bold font-display text-mainText">
              {topic.name}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-peach-50 text-mainText-muted hover:text-coral flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Topic Stats Row */}
        <div className="grid grid-cols-3 gap-2.5 my-4 p-3 rounded-2xl bg-peach-50/50 border border-peach-200/80 text-center">
          <div>
            <span className="text-[10px] font-bold text-mainText-muted uppercase block">Mastery</span>
            <span className="text-xs font-bold text-coral capitalize mt-0.5 block">
              {topic.masteryLevel?.replace('_', ' ')}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-mainText-muted uppercase block">Accuracy</span>
            <span className="text-xs font-bold text-mainText mt-0.5 block">
              {topic.quizAccuracy !== null && topic.quizAccuracy !== undefined ? `${topic.quizAccuracy}%` : 'Not tested'}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-mainText-muted uppercase block">Time Logged</span>
            <span className="text-xs font-bold text-mainText mt-0.5 block">
              {topic.timeSpentMinutes || 0} mins
            </span>
          </div>
        </div>

        {/* AI Study Time Recommendation Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-peach-100/70 to-peach-50 border border-peach-200/90 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-coral flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>Recommended Study Time: {recommendation.minutes} Mins</span>
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-coral-dark shadow-2xs">
              {recommendation.level}
            </span>
          </div>

          <p className="text-xs text-mainText/80 leading-relaxed">
            {recommendation.reason}
          </p>
        </div>

        {/* Custom Duration Selector */}
        <div className="mt-5 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-mainText block">
              How much time do you want to give it?
            </label>
            <span className="text-xs font-black font-display text-coral text-base">
              {selectedMinutes} minutes
            </span>
          </div>

          {/* Quick presets */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {[15, 25, 35, 45, 60, 90].map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => setSelectedMinutes(mins)}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all text-center ${
                  selectedMinutes === mins
                    ? 'bg-coral text-white shadow-soft-peach font-extrabold'
                    : 'bg-peach-50/60 hover:bg-peach-100 text-mainText border border-peach-200/80'
                }`}
              >
                {mins}m
              </button>
            ))}
          </div>

          {/* Stepper with custom input */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-peach-50/40 border border-peach-200/80 mt-2">
            <span className="text-[11px] font-bold text-mainText-muted pl-2">
              Fine-tune duration:
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleAdjustMinutes(-5)}
                disabled={selectedMinutes <= 5}
                className="w-7 h-7 rounded-lg bg-white hover:bg-peach-100 text-mainText flex items-center justify-center font-bold border border-peach-200 disabled:opacity-40"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="5"
                  max="180"
                  value={selectedMinutes}
                  onChange={(e) => setSelectedMinutes(Math.max(5, Math.min(180, Number(e.target.value) || 5)))}
                  className="w-14 text-center text-xs font-bold py-1 rounded-lg border border-peach-200 bg-white focus:outline-none focus:border-coral"
                />
                <span className="text-xs font-semibold text-mainText-muted">mins</span>
              </div>

              <button
                type="button"
                onClick={() => handleAdjustMinutes(5)}
                disabled={selectedMinutes >= 180}
                className="w-7 h-7 rounded-lg bg-white hover:bg-peach-100 text-mainText flex items-center justify-center font-bold border border-peach-200 disabled:opacity-40"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="mt-6 pt-4 border-t border-peach-100 space-y-2.5">
          {/* 1. Enter Focus Mode Button */}
          <button
            onClick={handleStartFocus}
            className="w-full py-3 rounded-2xl bg-coral hover:bg-coral-dark text-white font-bold text-sm shadow-soft-peach flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Lock className="w-4 h-4" />
            <span>Enter Focus Mode ({selectedMinutes} mins)</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* 2. Secondary Actions: AI Quiz & Study Materials */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => {
                onClose();
                if (onOpenAiQuiz) onOpenAiQuiz(topic.name, subject?._id);
              }}
              className="py-2.5 px-3 rounded-xl bg-peach-50 hover:bg-peach-100 text-coral border border-peach-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 fill-coral" />
              <span>Take AI Quiz</span>
            </button>

            <button
              onClick={() => {
                onClose();
                if (onOpenMaterials) onOpenMaterials(topic);
              }}
              className="py-2.5 px-3 rounded-xl bg-white hover:bg-peach-50 text-mainText border border-peach-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
            >
              <Folder className="w-3.5 h-3.5 text-coral" />
              <span>Notes & Materials</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopicStudyPlannerModal;
