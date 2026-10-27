import React, { useState, useEffect } from 'react';
import { HelpCircle, Clock, CheckCircle2, XCircle, ArrowRight, RotateCcw, Award, ChevronRight, Zap } from 'lucide-react';
import api from '../services/api';

export const QuizzesPage = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bank'); // 'bank' or 'attempts'
  const [timeSpent, setTimeSpent] = useState(0);

  const fetchQuizzes = async () => {
    try {
      const [qRes, aRes] = await Promise.all([
        api.get('/quizzes'),
        api.get('/quizzes/attempts'),
      ]);
      if (qRes.data.success) setQuizzes(qRes.data.quizzes);
      if (aRes.data.success) setAttempts(aRes.data.attempts);
    } catch (err) {
      console.error('Failed to load quizzes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  // Timer while taking quiz
  useEffect(() => {
    let interval = null;
    if (activeQuiz && !quizResult) {
      interval = setInterval(() => {
        setTimeSpent((t) => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeQuiz, quizResult]);

  const handleStartQuiz = async (quiz) => {
    try {
      const res = await api.get(`/quizzes/${quiz._id}`);
      if (res.data.success) {
        setActiveQuiz(res.data.quiz);
        setSelectedAnswers({});
        setQuizResult(null);
        setTimeSpent(0);
      }
    } catch (err) {
      console.error('Failed to open quiz:', err);
    }
  };

  const handleSelectOption = (questionIndex, optionIndex) => {
    if (quizResult) return; // locked after submission
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionIndex]: optionIndex,
    }));
  };

  const handleSubmitQuiz = async () => {
    if (!activeQuiz) return;
    setIsSubmitting(true);

    const answersPayload = activeQuiz.questions.map((q, idx) => ({
      questionIndex: idx,
      selectedOption: selectedAnswers[idx] !== undefined ? selectedAnswers[idx] : -1,
    }));

    try {
      // Send to server for authoritative scoring
      const res = await api.post(`/quizzes/${activeQuiz._id}/attempts`, {
        answers: answersPayload,
        timeSpentSeconds: timeSpent,
      });

      if (res.data.success) {
        setQuizResult(res.data.result);
        fetchQuizzes();
      }
    } catch (err) {
      console.error('Failed to submit quiz:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseQuizRunner = () => {
    setActiveQuiz(null);
    setQuizResult(null);
    setSelectedAnswers({});
    setTimeSpent(0);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold font-display text-mainText">
            Quizzes & Assessments
          </h2>
          <p className="text-xs md:text-sm text-mainText-muted mt-0.5">
            Server-evaluated assessments. Answers and explanations are revealed after submission to prevent score tampering.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1 bg-white/80 p-1 rounded-2xl border border-peach-200">
          <button
            onClick={() => setActiveTab('bank')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'bank' ? 'bg-coral text-white shadow-sm' : 'text-mainText-muted'
            }`}
          >
            Quiz Bank
          </button>
          <button
            onClick={() => setActiveTab('attempts')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'attempts' ? 'bg-coral text-white shadow-sm' : 'text-mainText-muted'
            }`}
          >
            Attempt History
          </button>
        </div>
      </div>

      {/* Quiz Runner Modal / Active View */}
      {activeQuiz && (
        <div className="fixed inset-0 z-50 bg-[#342D2B]/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl border border-peach-200 my-8 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-peach-100 mb-6">
              <div>
                <span className="text-xs font-bold text-coral uppercase tracking-wider block">
                  {activeQuiz.subjectId?.name || 'Subject'} • {activeQuiz.difficulty}
                </span>
                <h3 className="text-lg md:text-xl font-bold font-display text-mainText mt-1">
                  {activeQuiz.title}
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 bg-peach-50 px-3 py-1.5 rounded-xl border border-peach-200 text-xs font-bold text-coral-dark">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{Math.floor(timeSpent / 60)}:{(timeSpent % 60).toString().padStart(2, '0')}</span>
                </div>
                <button
                  onClick={handleCloseQuizRunner}
                  className="text-xs font-bold text-mainText-muted hover:text-coral"
                >
                  Close
                </button>
              </div>
            </div>

            {/* If Results available: Show Score Summary */}
            {quizResult && (
              <div className="p-5 rounded-2xl bg-peach-50/80 border border-peach-200 mb-6 text-center animate-in fade-in duration-200">
                <div className="w-14 h-14 rounded-full bg-white shadow-sm mx-auto flex items-center justify-center text-coral mb-2">
                  <Award className="w-8 h-8 text-amber-500" />
                </div>
                <h4 className="text-lg font-bold text-mainText">Assessment Result</h4>
                <div className="text-3xl font-black font-display text-coral mt-1">
                  {quizResult.percentage}%
                </div>
                <p className="text-xs text-mainText-muted mt-1">
                  Scored {quizResult.score} out of {quizResult.totalQuestions} questions correct in {quizResult.timeSpentSeconds} seconds.
                </p>
              </div>
            )}

            {/* Questions List */}
            <div className="space-y-6 max-h-[460px] overflow-y-auto pr-2">
              {activeQuiz.questions.map((q, qIndex) => {
                const gradedAnswer = quizResult?.answers?.find((a) => a.questionIndex === qIndex);

                return (
                  <div
                    key={qIndex}
                    className={`p-5 rounded-2xl border transition-all ${
                      gradedAnswer
                        ? gradedAnswer.isCorrect
                          ? 'border-green-300 bg-green-50/30'
                          : 'border-red-300 bg-red-50/30'
                        : 'border-peach-200/80 bg-peach-50/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <span className="text-xs font-bold text-mainText block">
                        Question {qIndex + 1} of {activeQuiz.questions.length}
                      </span>
                      {gradedAnswer && (
                        <span
                          className={`text-xs font-bold flex items-center gap-1 ${
                            gradedAnswer.isCorrect ? 'text-green-600' : 'text-red-500'
                          }`}
                        >
                          {gradedAnswer.isCorrect ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                          {gradedAnswer.isCorrect ? 'Correct' : 'Incorrect'}
                        </span>
                      )}
                    </div>

                    <p className="text-sm font-semibold text-mainText mb-4">
                      {q.questionText}
                    </p>

                    {/* Options */}
                    <div className="space-y-2">
                      {q.options.map((opt, optIndex) => {
                        const isSelected = selectedAnswers[qIndex] === optIndex;
                        const isCorrectOption = gradedAnswer && gradedAnswer.correctOption === optIndex;
                        const isWrongSelection = gradedAnswer && !gradedAnswer.isCorrect && isSelected;

                        return (
                          <div
                            key={optIndex}
                            onClick={() => handleSelectOption(qIndex, optIndex)}
                            className={`p-3 rounded-xl border text-xs md:text-sm font-medium cursor-pointer transition-all flex items-center justify-between ${
                              quizResult
                                ? isCorrectOption
                                  ? 'bg-green-100 border-green-400 text-green-900 font-bold'
                                  : isWrongSelection
                                  ? 'bg-red-100 border-red-400 text-red-900 line-through'
                                  : 'bg-white/70 border-gray-200 text-mainText-muted'
                                : isSelected
                                ? 'bg-coral-50 border-coral text-coral-dark font-bold shadow-sm'
                                : 'bg-white border-peach-200 hover:border-coral/50 text-mainText'
                            }`}
                          >
                            <span>{opt}</span>
                            <div
                              className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                isSelected ? 'border-coral bg-coral text-white' : 'border-gray-300'
                              }`}
                            >
                              {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation Revealed after submission */}
                    {gradedAnswer?.explanation && (
                      <div className="mt-3.5 pt-3 border-t border-peach-200 text-xs text-mainText-muted bg-white/80 p-3 rounded-xl">
                        💡 <strong className="text-mainText font-semibold">Explanation:</strong> {gradedAnswer.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom Actions */}
            <div className="mt-6 pt-4 border-t border-peach-100 flex items-center justify-end gap-3">
              {quizResult ? (
                <button
                  onClick={handleCloseQuizRunner}
                  className="px-6 py-2.5 rounded-xl bg-coral hover:bg-coral-dark text-white text-xs font-bold shadow-soft-peach"
                >
                  Done Reviewing
                </button>
              ) : (
                <button
                  onClick={handleSubmitQuiz}
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-coral hover:bg-coral-dark text-white text-xs font-bold shadow-soft-peach transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? 'Evaluating on Server...' : 'Submit Answers for Grading'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Quiz Bank */}
      {activeTab === 'bank' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {loading ? (
            <div className="col-span-full py-12 text-center text-xs text-mainText-muted">Loading quizzes...</div>
          ) : quizzes.length === 0 ? (
            <div className="col-span-full bg-white/80 rounded-3xl p-12 text-center border border-peach-200">
              <HelpCircle className="w-12 h-12 text-peach-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-mainText">No quizzes available right now</p>
            </div>
          ) : (
            quizzes.map((quiz) => (
              <div
                key={quiz._id}
                className="bg-white/95 rounded-3xl p-5 shadow-soft-card border border-[#FFE2D3]/60 flex flex-col justify-between hover:border-coral/50 transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className="px-2.5 py-0.5 rounded-full text-[11px] font-bold text-white shadow-sm"
                      style={{ backgroundColor: quiz.subjectId?.color || '#FF8B76' }}
                    >
                      {quiz.subjectId?.name || 'General'}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-mainText-muted bg-peach-50 px-2 py-0.5 rounded-full border border-peach-200">
                      {quiz.difficulty}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-mainText group-hover:text-coral transition-colors mt-2">
                    {quiz.title}
                  </h3>

                  {quiz.description && (
                    <p className="text-xs text-mainText-muted mt-1 line-clamp-2">
                      {quiz.description}
                    </p>
                  )}

                  <div className="flex items-center gap-3 mt-4 text-[11px] text-mainText-muted">
                    <span>{quiz.questionsCount || quiz.questions?.length || 0} Questions</span>
                    <span>•</span>
                    <span>{quiz.timeLimitMinutes || 10} Mins</span>
                    {quiz.bestScore !== null && (
                      <>
                        <span>•</span>
                        <span className="font-bold text-coral-dark">Best: {quiz.bestScore}%</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-peach-100 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-mainText-muted">
                    {quiz.attemptsCount || 0} attempts
                  </span>
                  <button
                    onClick={() => handleStartQuiz(quiz)}
                    className="px-4 py-1.5 rounded-xl bg-coral hover:bg-coral-dark text-white text-xs font-bold shadow-sm transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5"
                  >
                    <span>Take Quiz</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab: Attempt History */}
      {activeTab === 'attempts' && (
        <div className="bg-white/95 rounded-3xl p-6 shadow-soft-card border border-[#FFE2D3]/60">
          <h3 className="text-base font-bold text-mainText font-display mb-4">
            Past Assessment Attempts
          </h3>

          <div className="space-y-3">
            {attempts.length === 0 ? (
              <div className="py-8 text-center text-xs text-mainText-muted">
                No quiz attempts recorded yet.
              </div>
            ) : (
              attempts.map((att) => (
                <div
                  key={att._id}
                  className="p-4 rounded-2xl bg-peach-50/40 border border-peach-200/70 flex items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white px-2 py-0.5 rounded-full" style={{ backgroundColor: att.subjectId?.color || '#FF8B76' }}>
                        {att.subjectId?.name || 'Course'}
                      </span>
                      <h4 className="text-sm font-bold text-mainText">
                        {att.quizId?.title || 'Quiz'}
                      </h4>
                    </div>
                    <span className="text-[11px] text-mainText-muted block mt-1">
                      Attempted on {new Date(att.attemptedAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-base font-extrabold text-coral block">
                      {att.percentage}%
                    </span>
                    <span className="text-[10px] text-mainText-muted">
                      {att.score}/{att.totalQuestions} correct
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizzesPage;
