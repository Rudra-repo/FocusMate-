import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  FileText,
  Folder,
  Image,
  ExternalLink,
  Plus,
  Trash2,
  Save,
  Check,
  Eye,
  BookOpen,
  ChevronDown,
  Layers,
  Sparkles,
  Upload,
  Link2,
  HelpCircle,
  Award,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Loader2,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import api from '../../services/api';
import { InScreenStudyViewer } from '../subjects/InScreenStudyViewer';

export const FocusNotesDrawer = ({
  isOpen,
  onClose,
  initialTopicId = null,
  subjectId = null,
  subjectName = '',
  timeFormatted = '25:00',
  onOpenStudyResource = () => {},
}) => {
  const [topics, setTopics] = useState([]);
  const [selectedTopicId, setSelectedTopicId] = useState(initialTopicId || '');
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [activeTab, setActiveTab] = useState('notes'); // 'notes' | 'materials' | 'quizzes'
  const [notesText, setNotesText] = useState('');
  const [resources, setResources] = useState([]);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesSavedToast, setNotesSavedToast] = useState(false);
  const [viewerResource, setViewerResource] = useState(null);

  // New resource state (file upload or URL)
  const [attachMode, setAttachMode] = useState('file'); // 'file' | 'link'
  const [isAddingResource, setIsAddingResource] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newType, setNewType] = useState('drive');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [loading, setLoading] = useState(false);

  // Quiz state in Focus Mode
  const [topicQuizzes, setTopicQuizzes] = useState([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);
  const [isGeneratingAiQuiz, setIsGeneratingAiQuiz] = useState(false);

  const fileInputRef = useRef(null);

  // Fetch topics
  useEffect(() => {
    if (!isOpen) return;

    const fetchTopics = async () => {
      try {
        setLoading(true);
        const params = {};
        if (subjectId) params.subjectId = subjectId;
        const res = await api.get('/topics', { params });
        if (res.data.success && res.data.topics) {
          setTopics(res.data.topics);
          const found = res.data.topics.find((t) => t._id === (selectedTopicId || initialTopicId));
          if (found) {
            setSelectedTopicId(found._id);
            setSelectedTopic(found);
            setNotesText(found.notes || '');
            setResources(found.resources || []);
          } else if (res.data.topics.length > 0) {
            setSelectedTopicId(res.data.topics[0]._id);
            setSelectedTopic(res.data.topics[0]);
            setNotesText(res.data.topics[0].notes || '');
            setResources(res.data.topics[0].resources || []);
          }
        }
      } catch (err) {
        console.error('Failed to load topics in focus drawer:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTopics();
  }, [isOpen, subjectId, initialTopicId]);

  // Load quizzes when topic or quizzes tab changes
  useEffect(() => {
    if (!isOpen || activeTab !== 'quizzes') return;

    const fetchQuizzes = async () => {
      try {
        setLoadingQuizzes(true);
        const res = await api.get('/quizzes');
        if (res.data.success) {
          // Filter by selected topic or subject
          const filtered = res.data.quizzes.filter((q) => {
            if (selectedTopicId && q.topicId === selectedTopicId) return true;
            if (selectedTopic?.name && q.title?.toLowerCase().includes(selectedTopic.name.toLowerCase().split(' ')[0])) return true;
            if (subjectId && (q.subjectId?._id === subjectId || q.subjectId === subjectId)) return true;
            return false;
          });
          setTopicQuizzes(filtered.length > 0 ? filtered : res.data.quizzes);
        }
      } catch (err) {
        console.error('Failed to fetch quizzes:', err);
      } finally {
        setLoadingQuizzes(false);
      }
    };

    fetchQuizzes();
  }, [isOpen, activeTab, selectedTopicId, subjectId]);

  // Handle changing topic from dropdown
  const handleSelectTopicChange = (topicId) => {
    setSelectedTopicId(topicId);
    const found = topics.find((t) => t._id === topicId);
    if (found) {
      setSelectedTopic(found);
      setNotesText(found.notes || '');
      setResources(found.resources || []);
      setNotesSavedToast(false);
      setActiveQuiz(null);
      setQuizResult(null);
    }
  };

  // Save notes to database
  const handleSaveNotes = async () => {
    if (!selectedTopic) return;
    try {
      setIsSavingNotes(true);
      const res = await api.patch(`/topics/${selectedTopic._id}`, {
        notes: notesText,
      });
      if (res.data.success && res.data.topic) {
        setSelectedTopic(res.data.topic);
        setNotesSavedToast(true);
        setTimeout(() => setNotesSavedToast(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save focus notes:', err);
    } finally {
      setIsSavingNotes(false);
    }
  };

  // Handle file select in focus drawer
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setUploadError('');

    if (!newTitle.trim()) {
      const clean = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      setNewTitle(clean);
    }

    if (file.type.startsWith('image/')) {
      setNewType('image');
    } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      setNewType('pdf');
    }
  };

  // Save or upload resource
  const handleAddOrUploadResource = async (e) => {
    e.preventDefault();
    if (!selectedTopic) return;
    setUploadError('');

    if (attachMode === 'file') {
      if (!selectedFile) {
        setUploadError('Please select a local PDF or image file.');
        return;
      }

      try {
        setIsAddingResource(true);
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const base64Data = reader.result;
            const upRes = await api.post('/uploads', {
              fileName: selectedFile.name,
              fileData: base64Data,
              fileType: selectedFile.type,
            });

            if (upRes.data.success) {
              const item = {
                title: newTitle.trim() || selectedFile.name,
                url: upRes.data.url,
                resourceType: upRes.data.resourceType,
              };

              const updated = [...resources, item];
              const res = await api.patch(`/topics/${selectedTopic._id}`, {
                resources: updated,
              });

              if (res.data.success && res.data.topic) {
                setSelectedTopic(res.data.topic);
                setResources(res.data.topic.resources || updated);
                setNewTitle('');
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }
            }
          } catch (err) {
            console.error('Upload error:', err);
            setUploadError(err.response?.data?.message || 'File upload failed.');
          } finally {
            setIsAddingResource(false);
          }
        };

        reader.onerror = () => {
          setUploadError('Error reading file.');
          setIsAddingResource(false);
        };

        reader.readAsDataURL(selectedFile);
      } catch (err) {
        console.error('Failed upload:', err);
        setIsAddingResource(false);
      }
    } else {
      if (!newTitle.trim() || !newUrl.trim()) return;

      const item = {
        title: newTitle.trim(),
        url: newUrl.trim(),
        resourceType: newType,
      };

      const updated = [...resources, item];
      try {
        setIsAddingResource(true);
        const res = await api.patch(`/topics/${selectedTopic._id}`, {
          resources: updated,
        });
        if (res.data.success && res.data.topic) {
          setSelectedTopic(res.data.topic);
          setResources(res.data.topic.resources || updated);
          setNewTitle('');
          setNewUrl('');
        }
      } catch (err) {
        console.error('Failed to add resource:', err);
      } finally {
        setIsAddingResource(false);
      }
    }
  };

  // Delete a study material
  const handleDeleteResource = async (idxToDelete) => {
    if (!selectedTopic) return;
    const updated = resources.filter((_, idx) => idx !== idxToDelete);
    try {
      const res = await api.patch(`/topics/${selectedTopic._id}`, {
        resources: updated,
      });
      if (res.data.success && res.data.topic) {
        setSelectedTopic(res.data.topic);
        setResources(res.data.topic.resources || updated);
      }
    } catch (err) {
      console.error('Failed to remove resource in focus drawer:', err);
    }
  };

  // Start taking a quiz inside Focus Mode
  const handleStartQuiz = async (quiz) => {
    try {
      const res = await api.get(`/quizzes/${quiz._id}`);
      if (res.data.success) {
        setActiveQuiz(res.data.quiz);
        setSelectedAnswers({});
        setQuizResult(null);
      }
    } catch (err) {
      console.error('Failed to load quiz in focus mode:', err);
    }
  };

  // Submit quiz inside Focus Mode
  const handleSubmitQuiz = async () => {
    if (!activeQuiz) return;
    setIsSubmittingQuiz(true);

    const answersPayload = activeQuiz.questions.map((q, idx) => ({
      questionIndex: idx,
      selectedOption: selectedAnswers[idx] !== undefined ? selectedAnswers[idx] : -1,
    }));

    try {
      const res = await api.post(`/quizzes/${activeQuiz._id}/attempts`, {
        answers: answersPayload,
        timeSpentSeconds: 60,
      });

      if (res.data.success) {
        setQuizResult(res.data.result);
      }
    } catch (err) {
      console.error('Failed to grade quiz:', err);
    } finally {
      setIsSubmittingQuiz(false);
    }
  };

  // Generate Instant AI Quiz inside Focus Mode
  const handleGenerateAiQuiz = async () => {
    const topicToTest = selectedTopic?.name || subjectName || 'Core Fundamentals';
    try {
      setIsGeneratingAiQuiz(true);
      const res = await api.post('/ai/generate-quiz', {
        topicName: topicToTest,
        subjectId: selectedTopic?.subjectId?._id || subjectId || null,
        difficulty: 'medium',
      });

      if (res.data.success && res.data.quiz) {
        setTopicQuizzes((prev) => [res.data.quiz, ...prev]);
        handleStartQuiz(res.data.quiz);
      }
    } catch (err) {
      console.error('AI quiz generation error:', err);
    } finally {
      setIsGeneratingAiQuiz(false);
    }
  };

  const getResourceIcon = (type) => {
    switch (type) {
      case 'drive':
        return (
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center shrink-0">
            <Folder className="w-3.5 h-3.5" />
          </div>
        );
      case 'pdf':
        return (
          <div className="w-7 h-7 rounded-lg bg-red-500/20 text-red-300 border border-red-500/30 flex items-center justify-center shrink-0">
            <FileText className="w-3.5 h-3.5" />
          </div>
        );
      case 'image':
        return (
          <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center shrink-0">
            <Image className="w-3.5 h-3.5" />
          </div>
        );
      default:
        return (
          <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center justify-center shrink-0">
            <ExternalLink className="w-3.5 h-3.5" />
          </div>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[500px] bg-[#1A1513]/98 backdrop-blur-2xl border-l border-white/10 shadow-2xl flex flex-col text-white animate-in slide-in-from-right duration-300">
        {/* Header Bar */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-coral/20 border border-coral text-coral flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-coral">
                  In-Focus Study Hub
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/90 font-mono font-bold">
                  ⏱️ {timeFormatted}
                </span>
              </div>
              <h4 className="text-sm font-bold text-white/90 truncate max-w-[240px]">
                {selectedTopic?.name || subjectName || 'Study Materials'}
              </h4>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-colors"
            title="Close Drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Topic Selector Switcher */}
        <div className="px-5 py-2.5 bg-white/5 border-b border-white/10 shrink-0">
          <label className="text-[10px] font-bold uppercase tracking-wider text-white/50 block mb-1">
            Current Syllabus Topic
          </label>
          <div className="relative">
            <select
              value={selectedTopicId}
              onChange={(e) => handleSelectTopicChange(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-[#251E1C] border border-white/15 text-white focus:outline-none focus:border-coral appearance-none pr-8 cursor-pointer"
            >
              {topics.map((t) => (
                <option key={t._id} value={t._id} className="bg-[#251E1C] text-white">
                  {t.name} {t.subjectId?.name ? `(${t.subjectId.name})` : ''}
                </option>
              ))}
              {topics.length === 0 && (
                <option value="">No topics created yet</option>
              )}
            </select>
            <ChevronDown className="w-4 h-4 text-white/50 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>

        {/* 3 Tabs: Notes vs Materials vs Quizzes */}
        <div className="px-5 pt-3 pb-2 border-b border-white/10 flex items-center gap-1.5 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('notes')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'notes'
                ? 'bg-coral text-white shadow-sm'
                : 'bg-white/5 text-white/60 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Notes</span>
          </button>

          <button
            onClick={() => setActiveTab('materials')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'materials'
                ? 'bg-coral text-white shadow-sm'
                : 'bg-white/5 text-white/60 hover:text-white'
            }`}
          >
            <Folder className="w-3.5 h-3.5" />
            <span>Materials ({resources.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('quizzes')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'quizzes'
                ? 'bg-coral text-white shadow-sm'
                : 'bg-white/5 text-white/60 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Practice Quiz</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* TAB 1: NOTES */}
          {activeTab === 'notes' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white/80">
                  Topic Revision Notes & Scratchpad
                </span>

                <div className="flex items-center gap-2">
                  {notesSavedToast && (
                    <span className="text-[11px] font-bold text-successGreen flex items-center gap-1 animate-in fade-in">
                      <Check className="w-3.5 h-3.5" /> Saved
                    </span>
                  )}
                  <button
                    onClick={handleSaveNotes}
                    disabled={isSavingNotes || !selectedTopic}
                    className="px-3 py-1 rounded-xl bg-coral hover:bg-coral-dark text-white text-xs font-bold transition-all flex items-center gap-1 disabled:opacity-50"
                  >
                    <Save className="w-3 h-3" />
                    <span>{isSavingNotes ? 'Saving...' : 'Save Notes'}</span>
                  </button>
                </div>
              </div>

              <textarea
                rows="15"
                placeholder="Formulas, algorithm steps, key definitions, or scratchpad points... Edit and save notes directly in Focus Mode!"
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
                className="w-full text-xs leading-relaxed p-3.5 rounded-2xl bg-[#251E1C] border border-white/15 text-white placeholder-white/40 focus:outline-none focus:border-coral font-mono resize-none"
              />

              <p className="text-[11px] text-white/50 leading-normal">
                💡 <strong className="text-white/80">Note:</strong> Your notes are saved to your syllabus topic in real-time.
              </p>
            </div>
          )}

          {/* TAB 2: MATERIALS (DRIVE, PDF, PHOTOS, LINKS) */}
          {activeTab === 'materials' && (
            <div className="space-y-4">
              {/* Add / Upload Material Box */}
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white/90">
                    Attach Study Material
                  </span>

                  <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-xl border border-white/10">
                    <button
                      type="button"
                      onClick={() => setAttachMode('file')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                        attachMode === 'file' ? 'bg-coral text-white' : 'text-white/60 hover:text-white'
                      }`}
                    >
                      Upload File
                    </button>
                    <button
                      type="button"
                      onClick={() => setAttachMode('link')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                        attachMode === 'link' ? 'bg-coral text-white' : 'text-white/60 hover:text-white'
                      }`}
                    >
                      Drive / Web URL
                    </button>
                  </div>
                </div>

                {uploadError && (
                  <div className="p-2 rounded-xl bg-red-950/60 border border-red-500/50 text-red-200 text-xs flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}

                <form onSubmit={handleAddOrUploadResource} className="space-y-2.5">
                  {attachMode === 'file' ? (
                    <div>
                      <label className="text-[10px] text-white/60 block mb-1">
                        Select Diagram Photo or PDF from Device *
                      </label>
                      <input
                        type="file"
                        ref={fileInputRef}
                        required
                        accept="image/*,application/pdf,.pdf"
                        onChange={handleFileSelect}
                        className="w-full text-xs text-white file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:bg-white/10 file:text-coral hover:file:bg-white/20 cursor-pointer"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="text-[10px] text-white/60 block mb-1">
                        Google Drive or Web URL *
                      </label>
                      <input
                        type="url"
                        required
                        placeholder="https://drive.google.com/..."
                        value={newUrl}
                        onChange={(e) => setNewUrl(e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 rounded-xl bg-[#251E1C] border border-white/15 text-white focus:outline-none focus:border-coral"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-white/60 block mb-1">Label / Title</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Unit 3 Slides"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 rounded-xl bg-[#251E1C] border border-white/15 text-white focus:outline-none focus:border-coral"
                      />
                    </div>

                    {attachMode === 'link' && (
                      <div>
                        <label className="text-[10px] text-white/60 block mb-1">Type</label>
                        <select
                          value={newType}
                          onChange={(e) => setNewType(e.target.value)}
                          className="w-full text-xs px-2.5 py-1.5 rounded-xl bg-[#251E1C] border border-white/15 text-white focus:outline-none focus:border-coral"
                        >
                          <option value="drive">📁 Drive Link</option>
                          <option value="pdf">📄 PDF Document</option>
                          <option value="image">🖼️ Diagram / Photo</option>
                          <option value="link">🔗 Web Link</option>
                        </select>
                      </div>
                    )}

                    <div className={attachMode === 'file' ? 'col-span-2' : ''}>
                      <button
                        type="submit"
                        disabled={isAddingResource}
                        className="w-full py-1.5 rounded-xl bg-coral hover:bg-coral-dark text-white text-xs font-bold shadow-sm transition-all mt-1 disabled:opacity-50"
                      >
                        {isAddingResource ? 'Uploading & Attaching...' : attachMode === 'file' ? 'Upload & Save' : 'Attach Link'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* List of Materials with IN-SCREEN READ BUTTON */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-white/60 block">
                  Study Materials on Screen ({resources.length})
                </span>

                {resources.length === 0 ? (
                  <div className="py-8 text-center text-xs text-white/40 bg-white/5 rounded-2xl border border-white/10">
                    No materials attached. Upload lecture slides, PDF problem sets, or diagram photos above!
                  </div>
                ) : (
                  resources.map((res, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:border-coral/40 transition-all flex items-center justify-between gap-2.5 group"
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        {getResourceIcon(res.resourceType)}
                        <div className="overflow-hidden">
                          <h5 className="text-xs font-bold text-white/90 truncate">
                            {res.title}
                          </h5>
                          <span className="text-[10px] text-white/50 truncate block max-w-[190px]">
                            {res.url}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* IN-SCREEN VIEWER BUTTON: Opens right on screen with NO tab switch! */}
                        <button
                          type="button"
                          onClick={() => setViewerResource(res)}
                          className="px-2.5 py-1 rounded-xl bg-coral hover:bg-coral-dark text-white text-[11px] font-bold transition-all flex items-center gap-1 shadow-sm"
                          title="View on screen without leaving Focus Mode"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View on Screen</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteResource(index)}
                          className="p-1 rounded-lg text-white/40 hover:text-red-400 hover:bg-white/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: QUIZZES INSIDE FOCUS MODE */}
          {activeTab === 'quizzes' && (
            <div className="space-y-4">
              {/* If user is currently taking a quiz */}
              {activeQuiz ? (
                <div className="space-y-4 animate-in fade-in duration-150">
                  {/* Active Quiz Header */}
                  <div className="p-3.5 rounded-2xl bg-coral/10 border border-coral/30 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-coral block">
                        Assessment in Progress
                      </span>
                      <h4 className="text-xs font-bold text-white truncate max-w-[220px]">
                        {activeQuiz.title}
                      </h4>
                    </div>

                    <button
                      onClick={() => {
                        setActiveQuiz(null);
                        setQuizResult(null);
                      }}
                      className="text-xs font-semibold text-white/60 hover:text-white"
                    >
                      Exit Quiz
                    </button>
                  </div>

                  {/* Results banner if submitted */}
                  {quizResult && (
                    <div className="p-4 rounded-2xl bg-white/10 border border-white/20 text-center animate-in zoom-in-95">
                      <Award className="w-8 h-8 text-amber-400 mx-auto mb-1" />
                      <div className="text-2xl font-black text-coral">
                        {quizResult.percentage}% Score
                      </div>
                      <p className="text-[11px] text-white/70 mt-0.5">
                        {quizResult.score} of {quizResult.totalQuestions} questions correct.
                      </p>
                    </div>
                  )}

                  {/* Quiz Questions */}
                  <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                    {activeQuiz.questions.map((q, qIdx) => {
                      const graded = quizResult?.answers?.find((a) => a.questionIndex === qIdx);

                      return (
                        <div
                          key={qIdx}
                          className={`p-3.5 rounded-2xl border text-xs ${
                            graded
                              ? graded.isCorrect
                                ? 'bg-green-950/40 border-green-500/50'
                                : 'bg-red-950/40 border-red-500/50'
                              : 'bg-white/5 border-white/10'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-white/60 uppercase">
                              Q{qIdx + 1} of {activeQuiz.questions.length}
                            </span>
                            {graded && (
                              <span className={`text-[10px] font-bold flex items-center gap-1 ${graded.isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                                {graded.isCorrect ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                                {graded.isCorrect ? 'Correct' : 'Incorrect'}
                              </span>
                            )}
                          </div>

                          <p className="font-semibold text-white mb-2.5">
                            {q.questionText}
                          </p>

                          <div className="space-y-1.5">
                            {q.options.map((opt, optIdx) => {
                              const isSelected = selectedAnswers[qIdx] === optIdx;
                              const isCorrectOpt = graded && graded.correctOption === optIdx;

                              return (
                                <div
                                  key={optIdx}
                                  onClick={() => {
                                    if (!quizResult) {
                                      setSelectedAnswers((prev) => ({ ...prev, [qIdx]: optIdx }));
                                    }
                                  }}
                                  className={`p-2.5 rounded-xl border text-[11px] cursor-pointer transition-all flex items-center justify-between ${
                                    quizResult
                                      ? isCorrectOpt
                                        ? 'bg-green-900/60 border-green-500 text-green-200 font-bold'
                                        : isSelected
                                        ? 'bg-red-900/60 border-red-500 text-red-200 line-through'
                                        : 'bg-white/5 border-white/5 text-white/40'
                                      : isSelected
                                      ? 'bg-coral/30 border-coral text-white font-bold'
                                      : 'bg-white/5 border-white/10 hover:border-coral/50 text-white/80'
                                  }`}
                                >
                                  <span>{opt}</span>
                                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${isSelected ? 'border-coral bg-coral text-white' : 'border-white/30'}`}>
                                    {isSelected && <div className="w-1 h-1 rounded-full bg-white" />}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {graded?.explanation && (
                            <div className="mt-2.5 pt-2 border-t border-white/10 text-[11px] text-white/70 bg-white/5 p-2 rounded-xl">
                              💡 <strong>Explanation:</strong> {graded.explanation}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Submit / Done Button */}
                  <div className="pt-2">
                    {quizResult ? (
                      <button
                        onClick={() => {
                          setActiveQuiz(null);
                          setQuizResult(null);
                        }}
                        className="w-full py-2.5 rounded-xl bg-coral hover:bg-coral-dark text-white text-xs font-bold shadow-sm"
                      >
                        Finish Reviewing
                      </button>
                    ) : (
                      <button
                        onClick={handleSubmitQuiz}
                        disabled={isSubmittingQuiz}
                        className="w-full py-2.5 rounded-xl bg-coral hover:bg-coral-dark text-white text-xs font-bold shadow-sm disabled:opacity-50 transition-all hover:scale-[1.02]"
                      >
                        {isSubmittingQuiz ? 'Grading on Server...' : 'Submit Answers'}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                /* Quiz List & AI Generator Button */
                <div className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-coral/10 border border-coral/30 space-y-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-coral fill-coral" />
                      <h4 className="text-xs font-bold text-white">
                        Test Your Understanding in Focus Mode
                      </h4>
                    </div>
                    <p className="text-[11px] text-white/70">
                      Generate an instant AI quiz on {selectedTopic?.name || 'this topic'} with server-verified grading.
                    </p>
                    <button
                      onClick={handleGenerateAiQuiz}
                      disabled={isGeneratingAiQuiz}
                      className="w-full py-2 rounded-xl bg-coral hover:bg-coral-dark text-white text-xs font-bold shadow-soft-peach flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                    >
                      {isGeneratingAiQuiz ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Generating AI Questions...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 fill-white" />
                          <span>Generate Quiz on this Topic</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-white/60 block">
                      Available Quizzes ({topicQuizzes.length})
                    </span>

                    {loadingQuizzes ? (
                      <div className="py-6 text-center text-xs text-white/40">Loading quizzes...</div>
                    ) : topicQuizzes.length === 0 ? (
                      <div className="py-6 text-center text-xs text-white/40 bg-white/5 rounded-2xl border border-white/10">
                        No quizzes found. Click the button above to generate an instant diagnostic quiz!
                      </div>
                    ) : (
                      topicQuizzes.map((quiz) => (
                        <div
                          key={quiz._id}
                          className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:border-coral/40 transition-all flex items-center justify-between gap-2"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold uppercase text-coral bg-coral/10 px-2 py-0.5 rounded-full">
                                {quiz.difficulty}
                              </span>
                              <h5 className="text-xs font-bold text-white truncate max-w-[200px]">
                                {quiz.title}
                              </h5>
                            </div>
                            <span className="text-[10px] text-white/50 block mt-0.5">
                              {quiz.questionsCount || quiz.questions?.length || 3} questions • {quiz.timeLimitMinutes || 10}m
                            </span>
                          </div>

                          <button
                            onClick={() => handleStartQuiz(quiz)}
                            className="px-3 py-1.5 rounded-xl bg-coral hover:bg-coral-dark text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1 shrink-0"
                          >
                            <span>Take Quiz</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* In-Screen Study Viewer for PDFs, Diagram Photos, Google Drive links */}
      <InScreenStudyViewer
        isOpen={!!viewerResource}
        onClose={() => setViewerResource(null)}
        resource={viewerResource}
        onOpenExternal={onOpenStudyResource}
      />
    </>
  );
};

export default FocusNotesDrawer;
