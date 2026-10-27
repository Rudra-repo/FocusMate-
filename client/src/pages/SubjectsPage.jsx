import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Sparkles, CheckCircle2, Clock, HelpCircle, Edit3, Trash2, X, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export const SubjectsPage = () => {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false);
  const [isAddTopicOpen, setIsAddTopicOpen] = useState(false);
  const navigate = useNavigate();

  // New subject form
  const [newSubject, setNewSubject] = useState({
    name: '',
    code: '',
    color: '#FF8B76',
    targetHours: 25,
    description: '',
  });

  // New topic form
  const [newTopic, setNewTopic] = useState({
    name: '',
    masteryLevel: 'not_started',
    difficulty: 'medium',
    notes: '',
  });

  const fetchSubjects = async () => {
    try {
      const res = await api.get('/subjects');
      if (res.data.success) {
        setSubjects(res.data.subjects);
        if (res.data.subjects.length > 0 && !selectedSubject) {
          handleSelectSubject(res.data.subjects[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load subjects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleSelectSubject = async (sub) => {
    setSelectedSubject(sub);
    try {
      const res = await api.get(`/subjects/${sub._id}`);
      if (res.data.success) {
        setTopics(res.data.topics || []);
      }
    } catch (err) {
      console.error('Failed to load topics for subject:', err);
    }
  };

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    if (!newSubject.name.trim()) return;
    try {
      const res = await api.post('/subjects', newSubject);
      if (res.data.success) {
        setIsAddSubjectOpen(false);
        setNewSubject({ name: '', code: '', color: '#FF8B76', targetHours: 25, description: '' });
        fetchSubjects();
      }
    } catch (err) {
      console.error('Failed to create subject:', err);
    }
  };

  const handleCreateTopic = async (e) => {
    e.preventDefault();
    if (!newTopic.name.trim() || !selectedSubject) return;
    try {
      const res = await api.post('/topics', {
        ...newTopic,
        subjectId: selectedSubject._id,
      });
      if (res.data.success) {
        setIsAddTopicOpen(false);
        setNewTopic({ name: '', masteryLevel: 'not_started', difficulty: 'medium', notes: '' });
        handleSelectSubject(selectedSubject);
        fetchSubjects();
      }
    } catch (err) {
      console.error('Failed to create topic:', err);
    }
  };

  const handleUpdateMastery = async (topicId, masteryLevel) => {
    try {
      await api.patch(`/topics/${topicId}`, { masteryLevel });
      handleSelectSubject(selectedSubject);
    } catch (err) {
      console.error('Failed to update mastery:', err);
    }
  };

  const getMasteryBadge = (level) => {
    switch (level) {
      case 'mastered':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700">Mastered</span>;
      case 'learning':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">Learning</span>;
      case 'revision':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">Needs Revision</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600">Not Started</span>;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold font-display text-mainText">
            Subjects & Topic Mastery
          </h2>
          <p className="text-xs md:text-sm text-mainText-muted mt-0.5">
            Track learning hours, topic retention status, and diagnostic quiz accuracy.
          </p>
        </div>

        <button
          onClick={() => setIsAddSubjectOpen(true)}
          className="px-5 py-2.5 rounded-2xl bg-coral hover:bg-coral-dark text-white font-bold text-xs md:text-sm shadow-soft-peach flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add Subject</span>
        </button>
      </div>

      {/* Main Grid: Subjects List on Left, Topic Detail on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 cols): Subjects Cards */}
        <div className="lg:col-span-4 space-y-3">
          <span className="text-xs font-bold text-mainText-muted uppercase tracking-wider block px-1">
            Enrolled Subjects ({subjects.length})
          </span>

          {loading ? (
            <div className="text-center py-8 text-xs text-mainText-muted">Loading subjects...</div>
          ) : (
            subjects.map((sub) => {
              const isSelected = selectedSubject?._id === sub._id;
              return (
                <div
                  key={sub._id}
                  onClick={() => handleSelectSubject(sub)}
                  className={`p-4 rounded-3xl cursor-pointer border transition-all ${
                    isSelected
                      ? 'bg-white shadow-soft-card border-coral ring-2 ring-coral/20'
                      : 'bg-white/80 hover:bg-white border-[#FFE2D3]/60 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: sub.color || '#FF8B76' }}
                      />
                      <div>
                        <h4 className="text-sm font-bold text-mainText">{sub.name}</h4>
                        <span className="text-[11px] text-mainText-muted">{sub.code || 'General'}</span>
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 transition-transform ${
                        isSelected ? 'text-coral translate-x-0.5' : 'text-mainText-muted'
                      }`}
                    />
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-mainText-muted">Study Hours</span>
                      <span className="font-bold text-mainText">
                        {sub.actualHours || 0} / {sub.targetHours}h
                      </span>
                    </div>
                    <div className="h-1.5 bg-peach-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${sub.progressPercentage || 0}%`,
                          backgroundColor: sub.color || '#FF8B76',
                        }}
                      />
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-peach-100 flex items-center justify-between text-[10px] text-mainText-muted">
                    <span>{sub.topicsCount || 0} Topics</span>
                    <span className="text-successGreen-dark font-semibold">
                      {sub.masteredTopicsCount || 0} Mastered
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column (8 cols): Active Subject Topics & Notes */}
        <div className="lg:col-span-8">
          {selectedSubject ? (
            <div className="bg-white/95 rounded-3xl p-6 shadow-soft-card border border-[#FFE2D3]/60 space-y-6">
              {/* Subject Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-peach-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2.5 py-0.5 rounded-full text-xs font-bold text-white shadow-sm"
                      style={{ backgroundColor: selectedSubject.color }}
                    >
                      {selectedSubject.code || 'Course'}
                    </span>
                    <h3 className="text-xl font-bold font-display text-mainText">
                      {selectedSubject.name}
                    </h3>
                  </div>
                  {selectedSubject.description && (
                    <p className="text-xs text-mainText-muted mt-1">
                      {selectedSubject.description}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => setIsAddTopicOpen(true)}
                  className="px-4 py-2 rounded-2xl bg-coral hover:bg-coral-dark text-white font-bold text-xs shadow-soft-peach flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Add Topic</span>
                </button>
              </div>

              {/* Topics Breakdown */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-mainText">Syllabus Topics & Retention</h4>
                  <span className="text-xs text-mainText-muted">{topics.length} recorded</span>
                </div>

                {topics.length === 0 ? (
                  <div className="py-8 text-center text-xs text-mainText-muted bg-peach-50/50 rounded-2xl border border-peach-100">
                    No topics added yet. Click "+ Add Topic" to start tracking your syllabus!
                  </div>
                ) : (
                  topics.map((t) => (
                    <div
                      key={t._id}
                      className="p-4 rounded-2xl bg-peach-50/40 border border-peach-200/70 hover:bg-peach-50/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h5 className="text-sm font-bold text-mainText">{t.name}</h5>
                          {getMasteryBadge(t.masteryLevel)}
                          {t.quizAccuracy !== null && t.quizAccuracy !== undefined && (
                            <span className="text-[10px] font-bold text-coral-dark bg-white px-2 py-0.5 rounded-full border border-peach-200">
                              {t.quizAccuracy}% Accuracy
                            </span>
                          )}
                        </div>

                        {t.notes && (
                          <p className="text-xs text-mainText-muted mt-1 line-clamp-2">
                            {t.notes}
                          </p>
                        )}

                        <div className="flex items-center gap-3 mt-2 text-[11px] text-mainText-muted">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-coral" />
                            {t.timeSpentMinutes || 0} mins logged
                          </span>
                          <span>•</span>
                          <span className="capitalize">{t.difficulty} difficulty</span>
                        </div>
                      </div>

                      {/* Action selector */}
                      <div className="flex items-center gap-2 shrink-0">
                        <select
                          value={t.masteryLevel}
                          onChange={(e) => handleUpdateMastery(t._id, e.target.value)}
                          className="text-xs font-semibold py-1.5 px-2.5 rounded-xl border border-peach-300 bg-white text-mainText focus:outline-none focus:border-coral"
                        >
                          <option value="not_started">Not Started</option>
                          <option value="learning">Learning</option>
                          <option value="revision">Needs Revision</option>
                          <option value="mastered">Mastered</option>
                        </select>

                        <button
                          onClick={() => navigate('/quizzes')}
                          className="p-1.5 rounded-xl bg-white border border-peach-200 text-coral hover:bg-coral hover:text-white transition-colors"
                          title="Take Quiz on this topic"
                        >
                          <HelpCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white/80 rounded-3xl p-12 text-center border border-peach-200">
              <BookOpen className="w-12 h-12 text-peach-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-mainText">Select a subject to view syllabus</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Subject Modal */}
      {isAddSubjectOpen && (
        <div className="fixed inset-0 z-50 bg-[#342D2B]/35 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-peach-200 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-peach-100 mb-4">
              <h3 className="text-lg font-bold font-display text-mainText">Add New Course / Subject</h3>
              <button onClick={() => setIsAddSubjectOpen(false)} className="w-8 h-8 rounded-full bg-peach-50 text-mainText-muted hover:text-coral flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubject} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-mainText block mb-1">Subject Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Operating Systems"
                  value={newSubject.name}
                  onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-peach-200 focus:outline-none focus:border-coral"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-mainText block mb-1">Course Code</label>
                  <input
                    type="text"
                    placeholder="e.g. CS-301"
                    value={newSubject.code}
                    onChange={(e) => setNewSubject({ ...newSubject, code: e.target.value })}
                    className="w-full text-xs px-3.5 py-2 rounded-xl border border-peach-200 focus:outline-none focus:border-coral"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-mainText block mb-1">Target Hours</label>
                  <input
                    type="number"
                    min="1"
                    value={newSubject.targetHours}
                    onChange={(e) => setNewSubject({ ...newSubject, targetHours: Number(e.target.value) })}
                    className="w-full text-xs px-3.5 py-2 rounded-xl border border-peach-200 focus:outline-none focus:border-coral"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-mainText block mb-1">Theme Color</label>
                <div className="flex items-center gap-3">
                  {['#FF8B76', '#FF9856', '#74C99A', '#E8725C', '#E6A817', '#9370DB'].map((color) => (
                    <button
                      type="button"
                      key={color}
                      onClick={() => setNewSubject({ ...newSubject, color })}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        newSubject.color === color ? 'scale-125 ring-2 ring-offset-2 ring-coral' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-mainText block mb-1">Description</label>
                <textarea
                  rows="2"
                  placeholder="Key concepts, professor notes or syllabus summary..."
                  value={newSubject.description}
                  onChange={(e) => setNewSubject({ ...newSubject, description: e.target.value })}
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-peach-200 focus:outline-none focus:border-coral"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-peach-100">
                <button type="button" onClick={() => setIsAddSubjectOpen(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-mainText-muted hover:bg-peach-50">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-coral hover:bg-coral-dark text-white text-xs font-bold shadow-soft-peach">Create Subject</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Topic Modal */}
      {isAddTopicOpen && (
        <div className="fixed inset-0 z-50 bg-[#342D2B]/35 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-peach-200 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-peach-100 mb-4">
              <h3 className="text-lg font-bold font-display text-mainText">Add Topic to {selectedSubject?.name}</h3>
              <button onClick={() => setIsAddTopicOpen(false)} className="w-8 h-8 rounded-full bg-peach-50 text-mainText-muted hover:text-coral flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTopic} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-mainText block mb-1">Topic Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Virtual Memory & Paging"
                  value={newTopic.name}
                  onChange={(e) => setNewTopic({ ...newTopic, name: e.target.value })}
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-peach-200 focus:outline-none focus:border-coral"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-mainText block mb-1">Initial Mastery</label>
                  <select
                    value={newTopic.masteryLevel}
                    onChange={(e) => setNewTopic({ ...newTopic, masteryLevel: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-peach-200 focus:outline-none focus:border-coral"
                  >
                    <option value="not_started">Not Started</option>
                    <option value="learning">Learning</option>
                    <option value="revision">Needs Revision</option>
                    <option value="mastered">Mastered</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-mainText block mb-1">Difficulty</label>
                  <select
                    value={newTopic.difficulty}
                    onChange={(e) => setNewTopic({ ...newTopic, difficulty: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-peach-200 focus:outline-none focus:border-coral"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-mainText block mb-1">Study Notes</label>
                <textarea
                  rows="3"
                  placeholder="Formulas, key pitfalls to avoid, or mnemonics..."
                  value={newTopic.notes}
                  onChange={(e) => setNewTopic({ ...newTopic, notes: e.target.value })}
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-peach-200 focus:outline-none focus:border-coral"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-peach-100">
                <button type="button" onClick={() => setIsAddTopicOpen(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-mainText-muted hover:bg-peach-50">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-coral hover:bg-coral-dark text-white text-xs font-bold shadow-soft-peach">Save Topic</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectsPage;
