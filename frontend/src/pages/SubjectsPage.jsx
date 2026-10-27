import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Sparkles,
  CheckCircle2,
  Clock,
  HelpCircle,
  Edit3,
  Trash2,
  X,
  ChevronRight,
  Folder,
  FileText,
  Lock,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { TopicStudyMaterialsModal } from '../components/subjects/TopicStudyMaterialsModal';
import { TopicStudyPlannerModal } from '../components/subjects/TopicStudyPlannerModal';
import { AiQuizModal } from '../components/quizzes/AiQuizModal';

// In-memory module cache for subjects and topics
let cachedSubjects = null;
let cachedTopicsMap = {}; // { [subjectId]: topicsArray }
let cachedSelectedSubject = null;

export const SubjectsPage = () => {
  const { startFullFocusMode } = useAuth();
  const location = useLocation();
  const navState = location.state || {};

  const [subjects, setSubjects] = useState(cachedSubjects || []);
  const [selectedSubject, setSelectedSubject] = useState(() => {
    if (navState.selectedSubjectId && cachedSubjects) {
      return cachedSubjects.find((s) => s._id === navState.selectedSubjectId) || cachedSubjects[0];
    }
    return cachedSelectedSubject || (cachedSubjects ? cachedSubjects[0] : null);
  });
  const [topics, setTopics] = useState(() => {
    const activeSub = navState.selectedSubjectId && cachedSubjects
      ? cachedSubjects.find((s) => s._id === navState.selectedSubjectId)
      : (cachedSelectedSubject || (cachedSubjects ? cachedSubjects[0] : null));
    return (activeSub && cachedTopicsMap[activeSub._id]) || [];
  });
  const [loading, setLoading] = useState(!cachedSubjects);
  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false);
  const [isAddTopicOpen, setIsAddTopicOpen] = useState(false);

  // Topic planner modal (shows recommendation, custom duration, enter focus mode)
  const [selectedTopicForPlanner, setSelectedTopicForPlanner] = useState(null);

  // Topic materials modal state
  const [selectedTopicForModal, setSelectedTopicForModal] = useState(null);

  // AI Quiz modal state
  const [isAiQuizOpen, setIsAiQuizOpen] = useState(false);
  const [aiQuizTopic, setAiQuizTopic] = useState('');
  const [aiQuizSubjectId, setAiQuizSubjectId] = useState('');

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

  const handleSelectSubject = async (sub, silent = false) => {
    setSelectedSubject(sub);
    cachedSelectedSubject = sub;

    // Instant render if topics exist in cache
    if (cachedTopicsMap[sub._id]) {
      setTopics(cachedTopicsMap[sub._id]);
    }

    try {
      const res = await api.get(`/subjects/${sub._id}`);
      if (res.data.success) {
        const loadedTopics = res.data.topics || [];
        cachedTopicsMap[sub._id] = loadedTopics;
        setTopics(loadedTopics);

        // If navigated with openTopicModal or targetTopicName, auto open planner modal
        if (navState.openTopicModal && loadedTopics.length > 0) {
          const matched = navState.targetTopicName
            ? loadedTopics.find(
                (t) =>
                  t.name.toLowerCase().includes(navState.targetTopicName.toLowerCase()) ||
                  navState.targetTopicName.toLowerCase().includes(t.name.toLowerCase())
              )
            : null;
          setSelectedTopicForPlanner(matched || loadedTopics[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load topics for subject:', err);
    }
  };

  const fetchSubjects = async () => {
    if (!cachedSubjects) setLoading(true);
    try {
      const res = await api.get('/subjects');
      if (res.data.success) {
        cachedSubjects = res.data.subjects;
        setSubjects(res.data.subjects);
        if (res.data.subjects.length > 0) {
          const targetSub = navState.selectedSubjectId
            ? res.data.subjects.find((s) => s._id === navState.selectedSubjectId)
            : null;
          const initialSub = targetSub || cachedSelectedSubject || res.data.subjects[0];
          handleSelectSubject(initialSub, true);
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
    <div className="space-y-4 sm:space-y-6 pb-12 w-full min-w-0 max-w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full min-w-0">
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
          className="px-4 sm:px-5 py-2.5 rounded-2xl bg-coral hover:bg-coral-dark text-white font-bold text-xs md:text-sm shadow-soft-peach flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add Subject</span>
        </button>
      </div>

      {/* Main Grid: Subjects List on Left, Topic Detail on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 w-full min-w-0 max-w-full">
        {/* Left Column (5 cols): Subjects Cards */}
        <div className="lg:col-span-4 space-y-3 w-full min-w-0">
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
                  className={`p-3.5 sm:p-4 rounded-3xl cursor-pointer border transition-all w-full min-w-0 max-w-full overflow-hidden ${
                    isSelected
                      ? 'bg-white shadow-soft-card border-coral ring-2 ring-coral/20'
                      : 'bg-white/80 hover:bg-white border-[#FFE2D3]/60 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div
                        className="w-4 h-4 rounded-full shrink-0"
                        style={{ backgroundColor: sub.color || '#FF8B76' }}
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-bold text-mainText truncate">{sub.name}</h4>
                        <span className="text-[11px] text-mainText-muted">{sub.code || 'General'}</span>
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 shrink-0 transition-transform ${
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
        <div className="lg:col-span-8 w-full min-w-0">
          {selectedSubject ? (
            <div className="bg-white/95 rounded-3xl p-3.5 sm:p-6 shadow-soft-card border border-[#FFE2D3]/60 space-y-4 sm:space-y-6 w-full min-w-0 max-w-full overflow-hidden">
              {/* Subject Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-peach-100 w-full min-w-0">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="px-2.5 py-0.5 rounded-full text-xs font-bold text-white shadow-sm shrink-0"
                      style={{ backgroundColor: selectedSubject.color }}
                    >
                      {selectedSubject.code || 'Course'}
                    </span>
                    <h3 className="text-lg sm:text-xl font-bold font-display text-mainText truncate">
                      {selectedSubject.name}
                    </h3>
                  </div>
                  {selectedSubject.description && (
                    <p className="text-xs text-mainText-muted mt-1 break-words">
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
              <div className="space-y-3 w-full min-w-0">
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
                      className="p-3.5 sm:p-4 rounded-2xl bg-peach-50/40 border border-peach-200/70 hover:bg-peach-50/80 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 group w-full min-w-0 max-w-full overflow-hidden"
                    >
                      <div className="flex-1 min-w-0 w-full cursor-pointer" onClick={() => setSelectedTopicForPlanner(t)}>
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          <h5 className="text-sm font-bold text-mainText group-hover:text-coral transition-colors break-words">
                            {t.name}
                          </h5>
                          {getMasteryBadge(t.masteryLevel)}
                          {t.quizAccuracy !== null && t.quizAccuracy !== undefined && (
                            <span className="text-[10px] font-bold text-coral-dark bg-white px-2 py-0.5 rounded-full border border-peach-200">
                              {t.quizAccuracy}% Accuracy
                            </span>
                          )}
                        </div>

                        {t.notes && (
                          <p className="text-xs text-mainText-muted mt-1 line-clamp-2 break-words">
                            {t.notes}
                          </p>
                        )}

                        <div className="flex items-center gap-2 mt-2 flex-wrap text-[11px] text-mainText-muted">
                          {t.resources?.length > 0 && (
                            <span className="text-[10px] font-bold text-coral bg-white px-2 py-0.5 rounded-full border border-peach-200 flex items-center gap-1 shadow-2xs">
                              <Folder className="w-3 h-3 text-coral" />
                              {t.resources.length} materials
                            </span>
                          )}
                          {t.notes && (
                            <span className="text-[10px] font-bold text-amber-700 bg-white px-2 py-0.5 rounded-full border border-peach-200 flex items-center gap-1 shadow-2xs">
                              <FileText className="w-3 h-3 text-amber-500" />
                              Notes
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-coral" />
                            {t.timeSpentMinutes || 0}m
                          </span>
                          <span>•</span>
                          <span className="capitalize">{t.difficulty}</span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-2.5 md:pt-0 border-t md:border-t-0 border-peach-200/60 w-full md:w-auto">
                        {/* Open Notes & Materials Hub */}
                        <button
                          type="button"
                          onClick={() => setSelectedTopicForModal(t)}
                          className="flex-1 sm:flex-none justify-center px-2.5 py-1.5 rounded-xl bg-white hover:bg-peach-100 text-mainText border border-peach-200 text-xs font-bold transition-all flex items-center gap-1 shadow-2xs"
                          title="Open Study Notes, Drive Links & Photos"
                        >
                          <Folder className="w-3.5 h-3.5 text-coral" />
                          <span>Materials</span>
                        </button>

                        {/* Direct Focus Mode / Study Plan */}
                        <button
                          type="button"
                          onClick={() => setSelectedTopicForPlanner(t)}
                          className="flex-1 sm:flex-none justify-center px-2.5 py-1.5 rounded-xl bg-coral/10 hover:bg-coral text-coral hover:text-white border border-coral/30 text-xs font-bold transition-all flex items-center gap-1"
                          title="View Topic Study Plan & Set Focus Time"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span className="whitespace-nowrap">Plan & Focus</span>
                        </button>

                        {/* AI Quiz Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setAiQuizTopic(t.name);
                            setAiQuizSubjectId(selectedSubject._id);
                            setIsAiQuizOpen(true);
                          }}
                          className="p-1.5 rounded-xl bg-peach-50 text-coral hover:bg-coral hover:text-white border border-peach-200 transition-colors shrink-0"
                          title="Generate AI Quiz on this topic"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                        </button>

                        {/* Mastery selector */}
                        <select
                          value={t.masteryLevel}
                          onChange={(e) => handleUpdateMastery(t._id, e.target.value)}
                          className="w-full sm:w-auto mt-1 sm:mt-0 text-xs font-semibold py-1 px-2 rounded-xl border border-peach-300 bg-white text-mainText focus:outline-none focus:border-coral"
                        >
                          <option value="not_started">Not Started</option>
                          <option value="learning">Learning</option>
                          <option value="revision">Needs Revision</option>
                          <option value="mastered">Mastered</option>
                        </select>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white/80 rounded-3xl p-8 sm:p-12 text-center border border-peach-200">
              <BookOpen className="w-12 h-12 text-peach-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-mainText">Select a subject to view syllabus</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Subject Modal */}
      {isAddSubjectOpen && (
        <div className="fixed inset-0 z-50 bg-[#342D2B]/35 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-4 sm:p-6 max-w-md w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-peach-200 animate-in zoom-in-95 duration-200 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-peach-100 mb-4">
              <h3 className="text-base sm:text-lg font-bold font-display text-mainText">Add New Course / Subject</h3>
              <button onClick={() => setIsAddSubjectOpen(false)} className="w-8 h-8 rounded-full bg-peach-50 text-mainText-muted hover:text-coral flex items-center justify-center shrink-0">
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
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-peach-200 focus:outline-none focus:border-coral bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-mainText block mb-1">Course Code</label>
                  <input
                    type="text"
                    placeholder="e.g. CS-301"
                    value={newSubject.code}
                    onChange={(e) => setNewSubject({ ...newSubject, code: e.target.value })}
                    className="w-full text-xs px-3.5 py-2 rounded-xl border border-peach-200 focus:outline-none focus:border-coral bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-mainText block mb-1">Target Hours</label>
                  <input
                    type="number"
                    min="1"
                    value={newSubject.targetHours}
                    onChange={(e) => setNewSubject({ ...newSubject, targetHours: Number(e.target.value) })}
                    className="w-full text-xs px-3.5 py-2 rounded-xl border border-peach-200 focus:outline-none focus:border-coral bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-mainText block mb-1">Theme Color</label>
                <div className="flex flex-wrap items-center gap-2.5">
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
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-peach-200 focus:outline-none focus:border-coral bg-white"
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
        <div className="fixed inset-0 z-50 bg-[#342D2B]/35 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-4 sm:p-6 max-w-md w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-peach-200 animate-in zoom-in-95 duration-200 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-peach-100 mb-4">
              <h3 className="text-base sm:text-lg font-bold font-display text-mainText truncate pr-2">Add Topic to {selectedSubject?.name}</h3>
              <button onClick={() => setIsAddTopicOpen(false)} className="w-8 h-8 rounded-full bg-peach-50 text-mainText-muted hover:text-coral flex items-center justify-center shrink-0">
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
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-peach-200 focus:outline-none focus:border-coral bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-mainText block mb-1">Initial Mastery</label>
                  <select
                    value={newTopic.masteryLevel}
                    onChange={(e) => setNewTopic({ ...newTopic, masteryLevel: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-peach-200 focus:outline-none focus:border-coral bg-white"
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

      {/* Topic Study Planner Modal (shows recommendation, custom duration, enter focus mode) */}
      <TopicStudyPlannerModal
        isOpen={!!selectedTopicForPlanner}
        onClose={() => setSelectedTopicForPlanner(null)}
        topic={selectedTopicForPlanner}
        subject={selectedSubject}
        onOpenMaterials={(top) => {
          setSelectedTopicForPlanner(null);
          setSelectedTopicForModal(top);
        }}
        onOpenAiQuiz={(topName, subId) => {
          setSelectedTopicForPlanner(null);
          setAiQuizTopic(topName);
          setAiQuizSubjectId(subId);
          setIsAiQuizOpen(true);
        }}
      />

      {/* Topic Study Materials & Notes Modal */}
      <TopicStudyMaterialsModal
        isOpen={!!selectedTopicForModal}
        onClose={() => setSelectedTopicForModal(null)}
        topic={selectedTopicForModal}
        subject={selectedSubject}
        onTopicUpdated={(updated) => {
          setTopics((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
          setSelectedTopicForModal(updated);
        }}
        onOpenAiQuiz={(topName, subId) => {
          setAiQuizTopic(topName);
          setAiQuizSubjectId(subId);
          setIsAiQuizOpen(true);
        }}
      />

      {/* AI Quiz Generator Modal */}
      <AiQuizModal
        isOpen={isAiQuizOpen}
        onClose={() => setIsAiQuizOpen(false)}
        initialTopic={aiQuizTopic}
        initialSubjectId={aiQuizSubjectId}
        onQuizGenerated={(newQuiz) => {
          navigate('/quizzes');
        }}
      />
    </div>
  );
};

export default SubjectsPage;
