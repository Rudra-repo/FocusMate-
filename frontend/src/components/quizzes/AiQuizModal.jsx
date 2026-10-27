import React, { useState, useEffect } from 'react';
import { Sparkles, X, BookOpen, Layers, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import api from '../../services/api';

export const AiQuizModal = ({
  isOpen,
  onClose,
  initialTopic = '',
  initialSubjectId = '',
  onQuizGenerated,
}) => {
  const [topicName, setTopicName] = useState(initialTopic);
  const [subjectId, setSubjectId] = useState(initialSubjectId);
  const [difficulty, setDifficulty] = useState('medium');
  const [subjects, setSubjects] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Sample prompt suggestions for quick picking
  const popularTopics = [
    'SQL Joins & Normalization',
    'Binary Search Trees & AVL Balances',
    'Deadlock Coffman Conditions & Banker\'s Algorithm',
    'B+ Tree Indexing in Relational Databases',
    'Operating System Virtual Memory & Paging',
    'React Hooks & Virtual DOM Reconciliation',
  ];

  useEffect(() => {
    if (isOpen) {
      setTopicName(initialTopic || '');
      setSubjectId(initialSubjectId || '');
      setErrorMsg('');
      fetchSubjects();
    }
  }, [isOpen, initialTopic, initialSubjectId]);

  const fetchSubjects = async () => {
    try {
      setLoadingSubjects(true);
      const res = await api.get('/subjects');
      if (res.data.success && res.data.subjects) {
        setSubjects(res.data.subjects);
        if (!subjectId && res.data.subjects.length > 0) {
          setSubjectId(res.data.subjects[0]._id);
        }
      }
    } catch (err) {
      console.error('Failed to load subjects for quiz generator:', err);
    } finally {
      setLoadingSubjects(false);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!topicName.trim()) {
      setErrorMsg('Please enter or select a topic to test.');
      return;
    }

    setIsGenerating(true);
    setErrorMsg('');

    try {
      const res = await api.post('/ai/generate-quiz', {
        topicName: topicName.trim(),
        subjectId: subjectId || null,
        difficulty,
      });

      if (res.data.success && res.data.quiz) {
        if (onQuizGenerated) {
          onQuizGenerated(res.data.quiz);
        }
        onClose();
      } else {
        setErrorMsg(res.data.message || 'Failed to generate quiz. Please try again.');
      }
    } catch (err) {
      console.error('AI quiz generation error:', err);
      setErrorMsg(err.response?.data?.message || 'Error communicating with AI Quiz generator.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#342D2B]/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-5 sm:p-6 md:p-8 max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-peach-200 my-auto animate-in zoom-in-95 duration-200 relative">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-peach-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-coral/10 border border-coral/20 flex items-center justify-center text-coral shadow-sm">
              <Sparkles className="w-5 h-5 fill-coral/20" />
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-bold font-display text-mainText flex items-center gap-2">
                <span>Generate Quiz with AI</span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-peach-100 text-coral">
                  Diagnostic
                </span>
              </h3>
              <p className="text-xs text-mainText-muted mt-0.5">
                Automatically synthesizes MCQs with verified answer keys & explanations.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-peach-50 text-mainText-muted hover:text-coral flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleGenerate} className="space-y-4 mt-5">
          {/* Topic Input */}
          <div>
            <label className="text-xs font-bold text-mainText block mb-1.5">
              Topic or Syllabus Concept *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. SQL Joins, B+ Trees, Deadlocks, React Lifecycle..."
              value={topicName}
              onChange={(e) => setTopicName(e.target.value)}
              className="w-full text-xs md:text-sm px-4 py-2.5 rounded-2xl border border-peach-200 focus:outline-none focus:border-coral bg-peach-50/20"
            />

            {/* Quick Suggestions Chips */}
            <div className="mt-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-mainText-muted block mb-1.5">
                Suggested Topics:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {popularTopics.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setTopicName(item)}
                    className={`text-[11px] px-2.5 py-1 rounded-xl border transition-all text-left ${
                      topicName === item
                        ? 'bg-coral text-white border-coral font-bold shadow-sm'
                        : 'bg-white hover:bg-peach-50 border-peach-200/80 text-mainText-muted'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Associated Subject Dropdown */}
          <div>
            <label className="text-xs font-bold text-mainText block mb-1.5">
              Assign to Course / Subject
            </label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full text-xs md:text-sm px-3.5 py-2.5 rounded-2xl border border-peach-200 focus:outline-none focus:border-coral bg-white"
            >
              {subjects.map((sub) => (
                <option key={sub._id} value={sub._id}>
                  {sub.name} {sub.code ? `(${sub.code})` : ''}
                </option>
              ))}
              {subjects.length === 0 && (
                <option value="">General Academic Study</option>
              )}
            </select>
          </div>

          {/* Difficulty Level Selector */}
          <div>
            <label className="text-xs font-bold text-mainText block mb-1.5">
              Assessment Difficulty
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { id: 'easy', label: 'Easy', desc: 'Core fundamentals' },
                { id: 'medium', label: 'Medium', desc: 'Standard exam level' },
                { id: 'hard', label: 'Hard', desc: 'Tricky edge cases' },
              ].map((diff) => (
                <div
                  key={diff.id}
                  onClick={() => setDifficulty(diff.id)}
                  className={`p-3 rounded-2xl border cursor-pointer text-center transition-all ${
                    difficulty === diff.id
                      ? 'border-coral bg-coral-50/60 text-coral-dark font-bold shadow-sm'
                      : 'border-peach-200 hover:border-peach-300 text-mainText bg-white'
                  }`}
                >
                  <span className="text-xs font-bold block">{diff.label}</span>
                  <span className="text-[10px] text-mainText-muted mt-0.5 block">{diff.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Action Buttons */}
          <div className="pt-4 border-t border-peach-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isGenerating}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-mainText-muted hover:bg-peach-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isGenerating || !topicName.trim()}
              className="px-6 py-2.5 rounded-2xl bg-coral hover:bg-coral-dark text-white text-xs md:text-sm font-bold shadow-soft-peach flex items-center gap-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Questions...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 fill-white" />
                  <span>Generate Quiz</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AiQuizModal;
