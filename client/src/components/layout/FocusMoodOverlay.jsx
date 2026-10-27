import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  VolumeX,
  Shield,
  ShieldAlert,
  Play,
  Pause,
  Sparkles,
  CheckCircle2,
  Clock,
  Plus,
  AlertTriangle,
  Lock,
  Unlock,
  BookOpen,
  FileText,
  Folder,
  Image as ImageIcon,
  ExternalLink,
  ChevronDown,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Upload,
  Link2,
  Trash2,
  Save,
  HelpCircle,
  Award,
  Loader2,
  ArrowRight,
  X,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { FlowerCelebrationModal } from './FlowerCelebrationModal';
import { playChimeBell } from '../../utils/audioChime';
import api from '../../services/api';

export const FocusMoodOverlay = () => {
  const { user, focusMood, stopFullFocusMode, focusSessionConfig = {} } = useAuth();

  // Active view tab: 'timer' | 'notes' | 'materials' | 'quiz'
  const [viewMode, setViewMode] = useState('timer');

  const targetMinutes = focusSessionConfig.targetMinutes || 25;
  const [secondsRemaining, setSecondsRemaining] = useState(targetMinutes * 60);
  const [isActive, setIsActive] = useState(true);
  const [isPlayingAudio, setIsPlayingAudio] = useState(true);
  const [soundType, setSoundType] = useState('rain'); // 'rain', 'whitenoise'
  const [blockedNotification, setBlockedNotification] = useState(null);
  const [distractionAttempts, setDistractionAttempts] = useState(0);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [celebration, setCelebration] = useState({ isOpen: false, minutes: 25, taskTitle: '' });

  // Syllabus & Topics state
  const [topics, setTopics] = useState([]);
  const [selectedTopicId, setSelectedTopicId] = useState(focusSessionConfig.topicId || '');
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [notesText, setNotesText] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesSavedToast, setNotesSavedToast] = useState(false);

  // Materials & In-screen Viewer state
  const [resources, setResources] = useState([]);
  const [selectedResource, setSelectedResource] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isViewerFullscreen, setIsViewerFullscreen] = useState(false);
  const [isAddingResource, setIsAddingResource] = useState(false);
  const [resourceAttachMode, setResourceAttachMode] = useState('file'); // 'file' | 'link'
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newType, setNewType] = useState('drive');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Quiz in Focus Mode state
  const [topicQuizzes, setTopicQuizzes] = useState([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);
  const [isGeneratingAiQuiz, setIsGeneratingAiQuiz] = useState(false);

  const fileInputRef = useRef(null);
  const audioContextRef = useRef(null);
  const noiseNodeRef = useRef(null);
  const timerRef = useRef(null);

  const defaultBlockedApps = user?.preferences?.blockedItems || [
    { id: 'telegram', name: 'Telegram', category: 'Chat' },
    { id: 'instagram', name: 'Instagram', category: 'Social' },
    { id: 'x', name: 'X / Twitter', category: 'Social' },
    { id: 'youtube', name: 'YouTube', category: 'Video' },
    { id: 'reddit', name: 'Reddit', category: 'Forum' },
  ];
  const [blockList] = useState(defaultBlockedApps);

  // Audio synthesis via Web Audio API
  const startAudio = (type = soundType) => {
    try {
      if (noiseNodeRef.current) stopAudio();

      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContext();
      audioContextRef.current = ctx;

      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = data[i];
        data[i] *= 2.5;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(type === 'rain' ? 750 : 350, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.12, ctx.currentTime);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start();
      noiseNodeRef.current = { noise, ctx };
      setIsPlayingAudio(true);
    } catch (e) {
      console.warn('Audio synthesis not supported:', e);
    }
  };

  const stopAudio = () => {
    if (noiseNodeRef.current) {
      try {
        noiseNodeRef.current.noise.stop();
        noiseNodeRef.current.ctx.close();
      } catch (e) {}
      noiseNodeRef.current = null;
    }
    setIsPlayingAudio(false);
  };

  // Initialize Focus Mode timer and audio
  useEffect(() => {
    if (focusMood) {
      const initialSeconds = (focusSessionConfig.targetMinutes || 25) * 60;
      setSecondsRemaining(initialSeconds);
      setIsActive(true);
      setSessionStartTime(new Date());
      setDistractionAttempts(0);
      setShowExitConfirm(false);
      setViewMode('timer');
      startAudio('rain');
    } else {
      stopAudio();
    }
  }, [focusMood, focusSessionConfig.targetMinutes]);

  // Load topics for active session
  useEffect(() => {
    if (!focusMood) return;

    const fetchTopics = async () => {
      try {
        const params = {};
        if (focusSessionConfig.subjectId) {
          params.subjectId = focusSessionConfig.subjectId;
        }
        const res = await api.get('/topics', { params });
        if (res.data.success && res.data.topics) {
          setTopics(res.data.topics);
          const found = res.data.topics.find(
            (t) => t._id === (selectedTopicId || focusSessionConfig.topicId)
          );
          if (found) {
            setSelectedTopicId(found._id);
            setSelectedTopic(found);
            setNotesText(found.notes || focusSessionConfig.notes || '');
            const resList = found.resources || focusSessionConfig.resources || [];
            setResources(resList);
            if (resList.length > 0 && !selectedResource) {
              setSelectedResource(resList[0]);
            }
          } else if (res.data.topics.length > 0) {
            setSelectedTopicId(res.data.topics[0]._id);
            setSelectedTopic(res.data.topics[0]);
            setNotesText(res.data.topics[0].notes || '');
            setResources(res.data.topics[0].resources || []);
            if (res.data.topics[0].resources?.length > 0) {
              setSelectedResource(res.data.topics[0].resources[0]);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load focus topics:', err);
      }
    };

    fetchTopics();
  }, [focusMood, focusSessionConfig.subjectId, focusSessionConfig.topicId]);

  // Load quizzes when topic or quiz tab changes
  useEffect(() => {
    if (!focusMood || viewMode !== 'quiz') return;

    const fetchQuizzes = async () => {
      try {
        setLoadingQuizzes(true);
        const res = await api.get('/quizzes');
        if (res.data.success) {
          const filtered = res.data.quizzes.filter((q) => {
            if (selectedTopicId && q.topicId === selectedTopicId) return true;
            if (
              selectedTopic?.name &&
              q.title?.toLowerCase().includes(selectedTopic.name.toLowerCase().split(' ')[0])
            )
              return true;
            if (
              focusSessionConfig.subjectId &&
              (q.subjectId?._id === focusSessionConfig.subjectId ||
                q.subjectId === focusSessionConfig.subjectId)
            )
              return true;
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
  }, [focusMood, viewMode, selectedTopicId, focusSessionConfig.subjectId]);

  // Countdown timer loop
  useEffect(() => {
    if (focusMood && isActive) {
      timerRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            playChimeBell();
            handleCompleteSession(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [focusMood, isActive]);

  // Record session to backend
  const handleCompleteSession = async (naturalComplete = false) => {
    setIsActive(false);
    const endTime = new Date();
    const startTime = sessionStartTime || new Date(endTime.getTime() - targetMinutes * 60 * 1000);

    try {
      await api.post('/focus-sessions', {
        startedAt: startTime.toISOString(),
        endedAt: endTime.toISOString(),
        taskId: focusSessionConfig.taskId || null,
        subjectId: focusSessionConfig.subjectId || null,
        sessionType: 'focus',
        targetMinutes: focusSessionConfig.targetMinutes || 25,
        notes:
          focusSessionConfig.taskTitle ||
          `Focus block on ${selectedTopic?.name || focusSessionConfig.subjectName || 'Study'}`,
      });

      if (naturalComplete) {
        setCelebration({
          isOpen: true,
          minutes: focusSessionConfig.targetMinutes || 25,
          taskTitle: focusSessionConfig.taskTitle || selectedTopic?.name || focusSessionConfig.subjectName,
        });
      }
    } catch (err) {
      console.error('Failed to save focus session:', err);
    }
  };

  // Window switch detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && focusMood) {
        setDistractionAttempts((prev) => prev + 1);
      } else if (!document.hidden && focusMood) {
        setBlockedNotification({
          title: '⚠️ Window Switch Intercepted',
          message: 'Focus Lock is strictly active! Stay on FocusMate to maintain your streak.',
        });
        setTimeout(() => setBlockedNotification(null), 4000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [focusMood]);

  const handleSimulateOpenApp = (app) => {
    setDistractionAttempts((prev) => prev + 1);
    setBlockedNotification({
      title: `🚫 ${app.name} Access Shielded!`,
      message: `${app.name} is currently blocked by your Focus Lock. Return to your study session!`,
    });
    setTimeout(() => setBlockedNotification(null), 4500);
  };

  const handleExitSession = () => {
    setShowExitConfirm(false);
    stopFullFocusMode();
    handleCompleteSession(false).catch((err) => {
      console.warn('Session save notice:', err);
    });
  };

  // Switch topic
  const handleSelectTopicChange = (topicId) => {
    setSelectedTopicId(topicId);
    const found = topics.find((t) => t._id === topicId);
    if (found) {
      setSelectedTopic(found);
      setNotesText(found.notes || '');
      setResources(found.resources || []);
      setSelectedResource(found.resources?.[0] || null);
      setNotesSavedToast(false);
      setActiveQuiz(null);
      setQuizResult(null);
    }
  };

  // Save notes
  const handleSaveNotes = async () => {
    if (!selectedTopic) return;
    try {
      setIsSavingNotes(true);
      const res = await api.patch(`/topics/${selectedTopic._id}`, { notes: notesText });
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

  // File selection for materials
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setUploadError('');
    if (!newTitle.trim()) {
      const clean = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      setNewTitle(clean);
    }
  };

  // Upload or attach material to current topic
  const handleAddResource = async (e) => {
    e.preventDefault();
    if (!selectedTopic) return;

    if (resourceAttachMode === 'link') {
      if (!newTitle.trim() || !newUrl.trim()) {
        setUploadError('Title and URL are required.');
        return;
      }

      const resourcePayload = {
        title: newTitle.trim(),
        url: newUrl.trim(),
        resourceType: newType,
      };

      try {
        setIsUploading(true);
        const updatedResources = [...(resources || []), resourcePayload];
        const res = await api.patch(`/topics/${selectedTopic._id}`, {
          resources: updatedResources,
        });

        if (res.data.success && res.data.topic) {
          setSelectedTopic(res.data.topic);
          setResources(res.data.topic.resources || updatedResources);
          setSelectedResource(resourcePayload);
          setNewTitle('');
          setNewUrl('');
          setIsAddingResource(false);
        }
      } catch (err) {
        setUploadError('Failed to save resource link.');
      } finally {
        setIsUploading(false);
      }
    } else {
      // Local file upload
      if (!selectedFile) {
        setUploadError('Please select an image or PDF file to upload.');
        return;
      }

      try {
        setIsUploading(true);
        setUploadError('');

        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const base64Content = reader.result;
            const uploadRes = await api.post('/uploads', {
              base64: base64Content,
              filename: selectedFile.name,
              mimeType: selectedFile.type,
            });

            if (uploadRes.data.success) {
              const fileType = selectedFile.type.startsWith('image/') ? 'image' : 'pdf';
              const resourcePayload = {
                title: newTitle.trim() || selectedFile.name,
                url: uploadRes.data.url,
                resourceType: fileType,
              };

              const updatedResources = [...(resources || []), resourcePayload];
              const res = await api.patch(`/topics/${selectedTopic._id}`, {
                resources: updatedResources,
              });

              if (res.data.success && res.data.topic) {
                setSelectedTopic(res.data.topic);
                setResources(res.data.topic.resources || updatedResources);
                setSelectedResource(resourcePayload);
                setNewTitle('');
                setSelectedFile(null);
                setIsAddingResource(false);
              }
            }
          } catch (uploadErr) {
            setUploadError('Failed to upload file to server.');
          } finally {
            setIsUploading(false);
          }
        };

        reader.onerror = () => {
          setUploadError('Error reading file.');
          setIsUploading(false);
        };

        reader.readAsDataURL(selectedFile);
      } catch (err) {
        setUploadError('Upload failed.');
        setIsUploading(false);
      }
    }
  };

  const handleDeleteResource = async (idx) => {
    if (!selectedTopic) return;
    const updated = resources.filter((_, i) => i !== idx);
    try {
      const res = await api.patch(`/topics/${selectedTopic._id}`, { resources: updated });
      if (res.data.success) {
        setResources(updated);
        if (selectedResource === resources[idx]) {
          setSelectedResource(updated[0] || null);
        }
      }
    } catch (err) {
      console.error('Failed to remove resource:', err);
    }
  };

  // In-focus Quiz actions
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

  const handleGenerateAiQuiz = async () => {
    const topicToTest = selectedTopic?.name || focusSessionConfig.subjectName || 'Core Fundamentals';
    try {
      setIsGeneratingAiQuiz(true);
      const res = await api.post('/ai/generate-quiz', {
        topicName: topicToTest,
        subjectId: selectedTopic?.subjectId?._id || focusSessionConfig.subjectId || null,
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

  if (!focusMood) return null;

  const totalSeconds = (focusSessionConfig.targetMinutes || 25) * 60;
  const progressPercent = Math.min(100, Math.round(((totalSeconds - secondsRemaining) / totalSeconds) * 100));

  const mins = Math.floor(secondsRemaining / 60);
  const secs = secondsRemaining % 60;
  const timeFormatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  // Helper for embed URL
  const getEmbeddableUrl = (url) => {
    if (!url) return '';
    if (url.includes('drive.google.com/file/d/')) {
      return url.replace(/\/view(\?.*)?$/, '/preview');
    }
    if (url.includes('docs.google.com/')) {
      return url.replace(/\/edit(\?.*)?$/, '/preview');
    }
    if (url.startsWith('/uploads/')) {
      return `http://localhost:5001${url}`;
    }
    return url;
  };

  return (
    <div
      className="fixed inset-0 bg-[#14100E] text-white flex flex-col justify-between p-3 sm:p-5 select-none overflow-y-auto animate-in fade-in duration-300"
      style={{ zIndex: 9000 }}
    >
      {/* Background Breathing Glow Radial (only when in Zen Timer view) */}
      {viewMode === 'timer' && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-30">
          <div className="w-[450px] h-[450px] rounded-full bg-gradient-to-r from-coral/40 via-sidebarOrange/20 to-transparent blur-3xl animate-pulse" />
        </div>
      )}

      {/* TOP HEADER BAR: Always sticky and visible across all views */}
      <div className="relative z-30 flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10 shrink-0">
        {/* Left: Lock indicator & Topic Switcher */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-coral/20 border border-coral text-coral flex items-center justify-center shadow-lg shrink-0">
            <Lock className="w-4 h-4 text-coral animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-coral">
                Strict Focus Lockdown
              </span>
              <span className="w-2 h-2 rounded-full bg-successGreen animate-ping" />
            </div>

            {/* Quick syllabus topic switcher */}
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs font-bold text-white/90">
                {selectedTopic?.name || focusSessionConfig.taskTitle || focusSessionConfig.subjectName || 'Study Topic'}
              </span>
              {topics.length > 1 && (
                <div className="relative inline-block ml-1">
                  <select
                    value={selectedTopicId}
                    onChange={(e) => handleSelectTopicChange(e.target.value)}
                    className="text-[11px] font-semibold bg-white/10 hover:bg-white/20 text-white/80 py-0.5 px-2 rounded-lg border border-white/15 focus:outline-none cursor-pointer appearance-none pr-5"
                    title="Switch Topic"
                  >
                    {topics.map((t) => (
                      <option key={t._id} value={t._id} className="bg-[#1E1816] text-white">
                        {t.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3 h-3 text-white/50 absolute right-1.5 top-1.5 pointer-events-none" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Center: UNIFIED IN-SCREEN VIEW SWITCHER TABS */}
        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/10 shadow-inner">
          <button
            onClick={() => setViewMode('timer')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'timer'
                ? 'bg-coral text-white shadow-soft-peach'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Zen Clock</span>
          </button>

          <button
            onClick={() => setViewMode('notes')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'notes'
                ? 'bg-coral text-white shadow-soft-peach'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Notes</span>
          </button>

          <button
            onClick={() => setViewMode('materials')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'materials'
                ? 'bg-coral text-white shadow-soft-peach'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <Folder className="w-3.5 h-3.5" />
            <span>Materials ({resources.length})</span>
          </button>

          <button
            onClick={() => setViewMode('quiz')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'quiz'
                ? 'bg-coral text-white shadow-soft-peach'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>In-Focus Quiz</span>
          </button>
        </div>

        {/* Right: PERSISTENT RUNNING TIMER WIDGET & Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Top Bar Compact Running Countdown Widget (ALWAYS active and visible) */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl border transition-all ${
              viewMode !== 'timer'
                ? 'bg-coral/15 border-coral/40 text-coral shadow-soft-peach'
                : 'bg-white/10 border-white/15 text-white/90'
            }`}
          >
            <button
              onClick={() => setIsActive(!isActive)}
              className="text-coral hover:text-white transition-colors"
              title={isActive ? 'Pause Timer' : 'Resume Timer'}
            >
              {isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            </button>
            <span className="font-mono font-bold text-xs sm:text-sm tracking-wider">
              ⏱️ {timeFormatted}
            </span>
          </div>

          {/* Ambient Sound Selector */}
          <div className="hidden sm:flex items-center gap-1.5 bg-white/10 px-2.5 py-1.5 rounded-2xl border border-white/10 text-xs">
            <button
              onClick={() => (isPlayingAudio ? stopAudio() : startAudio(soundType))}
              className="text-coral hover:text-white"
              title="Toggle Ambient Audio"
            >
              {isPlayingAudio ? <Volume2 className="w-3.5 h-3.5 text-coral" /> : <VolumeX className="w-3.5 h-3.5 text-white/50" />}
            </button>
            <select
              value={soundType}
              onChange={(e) => {
                setSoundType(e.target.value);
                startAudio(e.target.value);
              }}
              className="bg-transparent text-xs font-semibold text-white/90 focus:outline-none cursor-pointer"
            >
              <option value="rain" className="bg-[#1E1816] text-white">Rain</option>
              <option value="whitenoise" className="bg-[#1E1816] text-white">Noise</option>
            </select>
          </div>

          {/* End Session Button */}
          <button
            onClick={() => setShowExitConfirm(true)}
            className="px-3.5 py-1.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 transition-all flex items-center gap-1.5"
          >
            <Unlock className="w-3.5 h-3.5 text-coral" />
            <span className="hidden sm:inline">End Session</span>
          </button>
        </div>
      </div>

      {/* Intercept Alert Banner */}
      {blockedNotification && (
        <div className="relative z-30 max-w-md mx-auto my-2 p-3.5 rounded-2xl bg-red-950/90 border-2 border-red-500 text-red-200 text-center shadow-2xl animate-in zoom-in-95 duration-150">
          <ShieldAlert className="w-6 h-6 text-red-400 mx-auto mb-1 animate-bounce" />
          <h4 className="text-xs font-bold text-white">{blockedNotification.title}</h4>
          <p className="text-[11px] mt-0.5 text-red-300">{blockedNotification.message}</p>
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW 1: ZEN TIMER (GIANT AMBIENT CLOCK)                   */}
      {/* ======================================================== */}
      {viewMode === 'timer' && (
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center my-auto py-2 text-center animate-in fade-in duration-200">
          {/* Progress indicator */}
          <div className="mb-2 sm:mb-4 flex items-center gap-2 text-xs font-bold text-coral bg-coral/10 px-4 py-1.5 rounded-full border border-coral/20">
            <span>{progressPercent}% Complete</span>
            <span>•</span>
            <span>{mins} mins remaining</span>
          </div>

          {/* Countdown Digits */}
          <div className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black font-display tracking-tight text-white select-none leading-none drop-shadow-2xl my-2 sm:my-4">
            {timeFormatted}
          </div>

          {/* Controls: Big Play/Pause, Mark Complete & End Session */}
          <div className="mt-4 sm:mt-6 flex items-center gap-3 sm:gap-4 flex-wrap justify-center">
            <button
              onClick={() => setIsActive(!isActive)}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-coral hover:bg-coral-dark text-white flex items-center justify-center shadow-glow-coral transition-all hover:scale-105 active:scale-95"
              title={isActive ? 'Pause Timer' : 'Resume Timer'}
            >
              {isActive ? (
                <Pause className="w-6 h-6 fill-white" />
              ) : (
                <Play className="w-6 h-6 fill-white ml-0.5" />
              )}
            </button>

            <button
              onClick={() => handleCompleteSession(true)}
              className="px-4 py-2.5 sm:px-5 sm:py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 transition-all flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-successGreen" />
              <span>Mark Complete</span>
            </button>

            <button
              onClick={() => setShowExitConfirm(true)}
              className="px-4 py-2.5 sm:px-5 sm:py-3 rounded-full bg-white/5 hover:bg-red-500/20 text-white/80 hover:text-red-300 font-bold text-xs border border-white/10 transition-all flex items-center gap-1.5"
              title="End Session"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>End Session</span>
            </button>
          </div>

          {distractionAttempts > 0 && (
            <span className="mt-4 text-xs text-amber-400 font-semibold bg-amber-950/60 px-3.5 py-1 rounded-full border border-amber-800 animate-pulse">
              ⚠️ {distractionAttempts} distraction attempts shielded
            </span>
          )}

          {/* Quick-Jump Workspaces directly on this screen */}
          <div className="mt-6 flex items-center gap-3 flex-wrap justify-center">
            <button
              onClick={() => setViewMode('notes')}
              className="px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <BookOpen className="w-3.5 h-3.5 text-coral" />
              <span>Open Topic Notes & Cheat Sheet</span>
            </button>

            <button
              onClick={() => setViewMode('materials')}
              className="px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Folder className="w-3.5 h-3.5 text-coral" />
              <span>View Diagrams, PDFs & Photos ({resources.length})</span>
            </button>

            <button
              onClick={() => setViewMode('quiz')}
              className="px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-coral" />
              <span>Test Knowledge with Quiz</span>
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW 2: NOTES & FORMULAS EDITOR (NO GIANT NUMBERS!)      */}
      {/* ======================================================== */}
      {viewMode === 'notes' && (
        <div className="relative z-10 flex-1 flex flex-col my-3 bg-[#1B1614] rounded-3xl p-4 sm:p-6 border border-white/10 shadow-2xl overflow-hidden animate-in fade-in duration-200">
          {/* Notes Top Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3 shrink-0 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-coral" />
              <h3 className="text-sm font-bold text-white">
                Topic Revision Notes & Formula Sheet
              </h3>
              <span className="text-[11px] text-white/50">
                ({selectedTopic?.name || 'General Notes'})
              </span>
            </div>

            <div className="flex items-center gap-2">
              {notesSavedToast && (
                <span className="text-xs text-successGreen font-bold flex items-center gap-1 animate-in fade-in">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Saved to Syllabus!</span>
                </span>
              )}
              <button
                onClick={handleSaveNotes}
                disabled={isSavingNotes || !selectedTopic}
                className="px-4 py-1.5 rounded-xl bg-coral hover:bg-coral-dark text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-soft-peach disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSavingNotes ? 'Saving...' : 'Save Notes'}</span>
              </button>
            </div>
          </div>

          {/* Quick Math / Equation Insertion Helper Chips */}
          <div className="flex items-center gap-1.5 pb-2.5 overflow-x-auto shrink-0 text-xs text-white/70">
            <span className="text-[10px] font-bold uppercase text-white/40 mr-1">Insert:</span>
            {['∑', '√', '∫', 'π', '≠', '≈', '→', 'λ', 'θ', 'Δ', '≤', '≥', '∞'].map((symbol) => (
              <button
                key={symbol}
                type="button"
                onClick={() => setNotesText((prev) => prev + ` ${symbol} `)}
                className="px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/15 text-white/90 font-mono text-xs border border-white/10"
              >
                {symbol}
              </button>
            ))}
          </div>

          {/* Textarea: Large, clean note space with NO background bleed-through */}
          <textarea
            value={notesText}
            onChange={(e) => setNotesText(e.target.value)}
            placeholder="Type your lecture notes, key formulas, pitfalls to avoid, or mnemonics here. Notes auto-sync with your syllabus..."
            className="flex-1 w-full bg-[#14100E] text-white/90 p-4 rounded-2xl border border-white/10 focus:outline-none focus:border-coral font-sans text-xs sm:text-sm leading-relaxed resize-none shadow-inner"
          />
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW 3: STUDY MATERIALS & IN-SCREEN VIEWER               */}
      {/* ======================================================== */}
      {viewMode === 'materials' && (
        <div className="relative z-10 flex-1 flex flex-col md:flex-row gap-4 my-3 overflow-hidden animate-in fade-in duration-200">
          {/* Left / Sidebar Column: Material Items List & Uploader */}
          <div className="w-full md:w-80 bg-[#1B1614] rounded-3xl p-4 border border-white/10 flex flex-col shrink-0 overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3 shrink-0">
              <div className="flex items-center gap-2">
                <Folder className="w-4 h-4 text-coral" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Materials ({resources.length})
                </h4>
              </div>
              <button
                onClick={() => setIsAddingResource(!isAddingResource)}
                className="p-1.5 rounded-xl bg-coral/10 hover:bg-coral text-coral hover:text-white transition-all text-xs font-bold flex items-center gap-1"
                title="Add New Document / Photo"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>

            {/* Upload or Link Form */}
            {isAddingResource && (
              <form onSubmit={handleAddResource} className="p-3 bg-white/5 rounded-2xl border border-white/10 space-y-2 mb-3">
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setResourceAttachMode('file')}
                    className={`flex-1 py-1 rounded-lg font-bold text-[11px] ${
                      resourceAttachMode === 'file' ? 'bg-coral text-white' : 'bg-white/5 text-white/60'
                    }`}
                  >
                    Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setResourceAttachMode('link')}
                    className={`flex-1 py-1 rounded-lg font-bold text-[11px] ${
                      resourceAttachMode === 'link' ? 'bg-coral text-white' : 'bg-white/5 text-white/60'
                    }`}
                  >
                    Drive Link
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="Material Title (e.g. Architecture Diagram)"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-[#14100E] border border-white/15 text-xs text-white placeholder-white/40 focus:outline-none focus:border-coral"
                />

                {resourceAttachMode === 'file' ? (
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept="image/*,application/pdf"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-2 px-3 rounded-xl border border-dashed border-coral/50 bg-coral/5 hover:bg-coral/10 text-white text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5 text-coral" />
                      <span className="truncate max-w-[180px]">
                        {selectedFile ? selectedFile.name : 'Choose Photo or PDF'}
                      </span>
                    </button>
                  </div>
                ) : (
                  <input
                    type="url"
                    placeholder="https://drive.google.com/..."
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-[#14100E] border border-white/15 text-xs text-white placeholder-white/40 focus:outline-none focus:border-coral"
                  />
                )}

                {uploadError && <p className="text-[10px] text-red-400">{uploadError}</p>}

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingResource(false)}
                    className="px-2.5 py-1 rounded-lg text-[11px] text-white/60 hover:bg-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUploading}
                    className="px-3 py-1 rounded-lg bg-coral hover:bg-coral-dark text-white text-[11px] font-bold disabled:opacity-50"
                  >
                    {isUploading ? 'Uploading...' : 'Save Material'}
                  </button>
                </div>
              </form>
            )}

            {/* List of Topic Resources */}
            <div className="space-y-1.5 flex-1">
              {resources.length === 0 ? (
                <div className="py-8 text-center text-xs text-white/40 bg-white/5 rounded-2xl p-3 border border-white/5">
                  No materials attached yet. Click "+ Add" to upload lecture photos, diagrams, or PDFs.
                </div>
              ) : (
                resources.map((res, idx) => {
                  const isSelected = selectedResource === res;
                  const isImage = res.resourceType === 'image' || res.url?.match(/\.(jpg|jpeg|png|webp|svg)/i);
                  const isPdf = res.resourceType === 'pdf' || res.url?.endsWith('.pdf');

                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedResource(res)}
                      className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2 group ${
                        isSelected
                          ? 'bg-coral/20 border-coral text-white shadow-soft-peach'
                          : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/80'
                      }`}
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                          {isImage ? (
                            <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
                          ) : isPdf ? (
                            <FileText className="w-3.5 h-3.5 text-red-400" />
                          ) : (
                            <Folder className="w-3.5 h-3.5 text-amber-400" />
                          )}
                        </div>
                        <div className="overflow-hidden">
                          <span className="text-xs font-bold block truncate">{res.title}</span>
                          <span className="text-[10px] text-white/50 block capitalize">
                            {res.resourceType}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteResource(idx);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-white/40 hover:text-red-400 transition-opacity"
                        title="Delete Material"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Main In-Screen Document & Diagram Viewer (FULL VIEWPORT, ZERO OVERLAPPING DIGITS) */}
          <div className="flex-1 bg-[#1B1614] rounded-3xl border border-white/10 flex flex-col overflow-hidden shadow-2xl">
            {selectedResource ? (
              <>
                {/* Viewer Header */}
                <div className="px-4 py-3 bg-white/5 border-b border-white/10 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="text-xs font-bold text-white truncate">
                      {selectedResource.title}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-coral px-2 py-0.5 rounded-full bg-coral/10">
                      {selectedResource.resourceType}
                    </span>
                  </div>

                  {/* Viewer Controls */}
                  <div className="flex items-center gap-2">
                    {/* Zoom controls for images */}
                    {(selectedResource.resourceType === 'image' || selectedResource.url?.match(/\.(jpg|jpeg|png|webp|svg)/i)) && (
                      <div className="flex items-center gap-1 bg-white/10 rounded-xl px-2 py-1 text-xs">
                        <button
                          onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
                          className="p-1 hover:text-coral transition-colors"
                          title="Zoom Out"
                        >
                          <ZoomOut className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-mono text-[11px] px-1 font-bold">
                          {Math.round(zoomLevel * 100)}%
                        </span>
                        <button
                          onClick={() => setZoomLevel((z) => Math.min(3, z + 0.25))}
                          className="p-1 hover:text-coral transition-colors"
                          title="Zoom In"
                        >
                          <ZoomIn className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setZoomLevel(1)}
                          className="p-1 hover:text-coral transition-colors ml-1"
                          title="Reset Zoom"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    {/* External Link */}
                    <a
                      href={selectedResource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center gap-1"
                      title="Open in new tab (Authorized study link)"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span className="hidden sm:inline">New Tab</span>
                    </a>
                  </div>
                </div>

                {/* Viewer Body: High-res Image or Embedded Document */}
                <div className="flex-1 bg-[#100D0C] overflow-auto flex items-center justify-center p-4 relative">
                  {selectedResource.resourceType === 'image' ||
                  selectedResource.url?.match(/\.(jpg|jpeg|png|webp|svg)/i) ? (
                    <div className="w-full h-full flex items-center justify-center overflow-auto">
                      <img
                        src={getEmbeddableUrl(selectedResource.url)}
                        alt={selectedResource.title}
                        style={{
                          transform: `scale(${zoomLevel})`,
                          transformOrigin: 'center center',
                          transition: 'transform 0.15s ease-out',
                        }}
                        className="max-w-full max-h-full object-contain rounded-xl shadow-2xl select-none"
                      />
                    </div>
                  ) : selectedResource.resourceType === 'pdf' || selectedResource.url?.endsWith('.pdf') ? (
                    <iframe
                      src={getEmbeddableUrl(selectedResource.url)}
                      title={selectedResource.title}
                      className="w-full h-full rounded-xl border border-white/10 bg-white"
                    />
                  ) : (
                    <iframe
                      src={getEmbeddableUrl(selectedResource.url)}
                      title={selectedResource.title}
                      className="w-full h-full rounded-xl border border-white/10 bg-white"
                      allow="autoplay"
                    />
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-white/50">
                <Folder className="w-12 h-12 text-white/20 mb-3" />
                <h4 className="text-sm font-bold text-white mb-1">No Study Material Selected</h4>
                <p className="text-xs max-w-sm text-white/40">
                  Select a document from the left list or upload lecture slides, photo diagrams, and formula cheat sheets to study distraction-free.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW 4: IN-FOCUS QUIZ & KNOWLEDGE CHECK                  */}
      {/* ======================================================== */}
      {viewMode === 'quiz' && (
        <div className="relative z-10 flex-1 flex flex-col my-3 bg-[#1B1614] rounded-3xl p-4 sm:p-6 border border-white/10 shadow-2xl overflow-y-auto animate-in fade-in duration-200">
          {activeQuiz ? (
            <div className="max-w-2xl mx-auto w-full space-y-5">
              {/* Quiz Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-coral/20 text-coral">
                      {activeQuiz.difficulty}
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-white">
                      {activeQuiz.title}
                    </h3>
                  </div>
                  <span className="text-[11px] text-white/50 block mt-0.5">
                    {activeQuiz.questions?.length || 0} Questions • Academic Self-Assessment
                  </span>
                </div>

                <button
                  onClick={() => {
                    setActiveQuiz(null);
                    setQuizResult(null);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all"
                >
                  Exit Quiz
                </button>
              </div>

              {/* Server Quiz Result Banner */}
              {quizResult && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-coral/20 via-sidebarOrange/20 to-coral/20 border-2 border-coral text-white text-center space-y-1 animate-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-center gap-2">
                    <Award className="w-5 h-5 text-coral" />
                    <h4 className="text-base font-bold">
                      Quiz Completed! Score: {quizResult.score} / {quizResult.totalQuestions} ({quizResult.percentage}%)
                    </h4>
                  </div>
                  <p className="text-xs text-white/80">
                    {quizResult.percentage >= 80
                      ? '🌟 Outstanding topic mastery! Concept retained.'
                      : quizResult.percentage >= 60
                      ? '👍 Solid comprehension. Review the explanations below.'
                      : '💡 Topic needs a bit more revision. Study the detailed solutions below.'}
                  </p>
                </div>
              )}

              {/* Questions List */}
              <div className="space-y-4">
                {activeQuiz.questions?.map((q, qIdx) => {
                  const graded = quizResult?.answers?.find((a) => a.questionIndex === qIdx);

                  return (
                    <div
                      key={qIdx}
                      className="p-4 rounded-2xl bg-[#14100E] border border-white/10 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <span className="w-6 h-6 rounded-lg bg-coral/20 text-coral text-xs font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                            {qIdx + 1}
                          </span>
                          <h4 className="text-sm font-semibold text-white/95 leading-relaxed">
                            {q.questionText || q.question}
                          </h4>
                        </div>
                        {graded && (
                          <span className="shrink-0">
                            {graded.isCorrect ? (
                              <CheckCircle2 className="w-5 h-5 text-successGreen" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-400" />
                            )}
                          </span>
                        )}
                      </div>

                      {/* Options */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.options?.map((opt, optIdx) => {
                          const isSelected = selectedAnswers[qIdx] === optIdx;
                          const correctIdx = graded?.correctOption !== undefined ? graded.correctOption : graded?.correctAnswer;
                          let optStyle = 'bg-white/5 border-white/10 hover:border-coral/50 text-white/80';

                          if (quizResult && graded) {
                            if (optIdx === correctIdx) {
                              optStyle = 'bg-successGreen/20 border-successGreen text-white font-bold';
                            } else if (isSelected && !graded.isCorrect) {
                              optStyle = 'bg-red-500/20 border-red-500 text-red-200';
                            }
                          } else if (isSelected) {
                            optStyle = 'bg-coral/20 border-coral text-white font-bold ring-1 ring-coral';
                          }

                          return (
                            <button
                              key={optIdx}
                              type="button"
                              disabled={!!quizResult}
                              onClick={() => setSelectedAnswers({ ...selectedAnswers, [qIdx]: optIdx })}
                              className={`p-3 rounded-xl border text-left text-xs transition-all flex items-center gap-2 ${optStyle}`}
                            >
                              <span className="w-5 h-5 rounded-full bg-white/10 text-[10px] font-bold flex items-center justify-center shrink-0">
                                {String.fromCharCode(65 + optIdx)}
                              </span>
                              <span className="flex-1">{opt}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Explanation box after submission */}
                      {graded?.explanation && (
                        <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-[11px] text-white/80">
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
                    className="w-full py-3 rounded-2xl bg-coral hover:bg-coral-dark text-white text-xs font-bold shadow-soft-peach"
                  >
                    Finish Review & Back to Quiz List
                  </button>
                ) : (
                  <button
                    onClick={handleSubmitQuiz}
                    disabled={isSubmittingQuiz}
                    className="w-full py-3 rounded-2xl bg-coral hover:bg-coral-dark text-white text-xs font-bold shadow-soft-peach disabled:opacity-50 transition-all hover:scale-[1.01]"
                  >
                    {isSubmittingQuiz ? 'Grading Answers on Server...' : 'Submit Answers for Instant Grading'}
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Quiz Home: AI Generator & List */
            <div className="max-w-2xl mx-auto w-full space-y-4">
              <div className="p-5 rounded-3xl bg-gradient-to-r from-coral/15 via-sidebarOrange/10 to-transparent border border-coral/30 space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-coral/20 border border-coral text-coral flex items-center justify-center">
                    <Sparkles className="w-4 h-4 fill-coral" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      Instant AI Knowledge Test
                    </h3>
                    <p className="text-xs text-white/70">
                      Generate an adaptive diagnostic quiz on <strong>{selectedTopic?.name || focusSessionConfig.subjectName || 'this topic'}</strong>.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleGenerateAiQuiz}
                  disabled={isGeneratingAiQuiz}
                  className="w-full py-2.5 rounded-2xl bg-coral hover:bg-coral-dark text-white text-xs font-bold shadow-soft-peach flex items-center justify-center gap-2 transition-all disabled:opacity-50 hover:scale-[1.01]"
                >
                  {isGeneratingAiQuiz ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generating AI Questions...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 fill-white" />
                      <span>Generate Instant AI Quiz on {selectedTopic?.name || 'Topic'}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Available Quizzes */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-white/50">
                  Available Quizzes ({topicQuizzes.length})
                </h4>

                {loadingQuizzes ? (
                  <div className="py-8 text-center text-xs text-white/40">Loading quizzes...</div>
                ) : topicQuizzes.length === 0 ? (
                  <div className="py-8 text-center text-xs text-white/40 bg-white/5 rounded-2xl border border-white/5">
                    No quizzes found yet. Click the button above to generate an instant diagnostic quiz!
                  </div>
                ) : (
                  topicQuizzes.map((quiz) => (
                    <div
                      key={quiz._id}
                      className="p-3.5 rounded-2xl bg-[#14100E] border border-white/10 hover:border-coral/40 transition-all flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase text-coral bg-coral/10 px-2 py-0.5 rounded-full">
                            {quiz.difficulty}
                          </span>
                          <h5 className="text-xs font-bold text-white">{quiz.title}</h5>
                        </div>
                        <span className="text-[11px] text-white/50 block mt-0.5">
                          {quiz.questionsCount || quiz.questions?.length || 3} questions • {quiz.timeLimitMinutes || 10}m limit
                        </span>
                      </div>

                      <button
                        onClick={() => handleStartQuiz(quiz)}
                        className="px-3.5 py-1.5 rounded-xl bg-coral hover:bg-coral-dark text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1 shrink-0"
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

      {/* ======================================================== */}
      {/* BOTTOM DISTRACTION SHIELD BAR (Visible in Zen Clock view) */}
      {/* ======================================================== */}
      {viewMode === 'timer' && (
        <div className="relative z-10 max-w-3xl mx-auto w-full bg-white/5 backdrop-blur-md rounded-3xl p-3 sm:p-4 border border-white/10 flex items-center justify-between gap-3 flex-wrap shrink-0">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-successGreen" />
            <span className="text-xs font-bold text-white/90">
              {blockList.length} Distracting Apps Shielded:
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {blockList.map((app) => (
              <span
                key={app.id || app._id}
                onClick={() => handleSimulateOpenApp(app)}
                className="text-[11px] font-semibold text-white/80 bg-white/10 hover:bg-red-500/20 hover:text-red-300 px-2.5 py-1 rounded-xl border border-white/10 cursor-pointer transition-all"
                title={`Simulate blocking ${app.name}`}
              >
                🔒 {app.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Exit Confirmation Dialog */}
      {showExitConfirm && (
        <div
          className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          style={{ zIndex: 99999 }}
        >
          <div className="bg-[#1C1614] rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center border-2 border-coral/30 shadow-2xl animate-in zoom-in-95 duration-150 relative">
            <button
              type="button"
              onClick={() => setShowExitConfirm(false)}
              className="absolute top-4 right-4 text-white/50 hover:text-white p-1 rounded-xl hover:bg-white/10 transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-coral/20 border border-coral text-coral flex items-center justify-center mx-auto mb-3 shadow-sm">
              <Clock className="w-6 h-6 text-coral" />
            </div>

            <h4 className="text-lg font-bold text-white mb-2">End Focus Session Early?</h4>
            <p className="text-xs text-white/70 mb-6 leading-relaxed">
              You still have <strong className="text-coral">{mins} minutes</strong> remaining in your study block. Exiting early will stop your continuous focus streak.
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 transition-all"
              >
                Keep Focusing
              </button>
              <button
                type="button"
                onClick={handleExitSession}
                className="flex-1 py-3 rounded-2xl bg-coral hover:bg-coral-dark text-white font-bold text-xs shadow-soft-peach transition-all"
              >
                End & Unlock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Flower Celebration Modal on Complete */}
      <FlowerCelebrationModal
        isOpen={celebration.isOpen}
        minutes={celebration.minutes}
        taskTitle={celebration.taskTitle}
        onClose={() => {
          setCelebration({ isOpen: false, minutes: 25, taskTitle: '' });
          stopFullFocusMode();
        }}
      />
    </div>
  );
};

export default FocusMoodOverlay;
