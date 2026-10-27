import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Sparkles,
  Flame,
  CheckCircle2,
  Clock,
  BookOpen,
  Coffee,
  Bell,
  ArrowRight,
} from 'lucide-react';
import { FlowerCelebrationModal } from '../components/layout/FlowerCelebrationModal';
import { useAuth } from '../context/AuthContext';
import { playChimeBell } from '../utils/audioChime';
import api from '../services/api';

export const FocusRoomPage = () => {
  const { startFullFocusMode } = useAuth();
  const location = useLocation();
  const preselected = location.state || {};

  const [subjects, setSubjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [topics, setTopics] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState(preselected.subjectId || '');
  const [selectedTaskId, setSelectedTaskId] = useState(preselected.taskId || '');
  const [selectedTopicId, setSelectedTopicId] = useState(preselected.topicId || '');
  const [mode, setMode] = useState('focus'); // 'focus', 'short_break', 'long_break'
  const [showBreakOverModal, setShowBreakOverModal] = useState(false);

  const [targetMinutes, setTargetMinutes] = useState(25);
  const [secondsRemaining, setSecondsRemaining] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [ambientSound, setAmbientSound] = useState('none'); // 'none', 'rain', 'whitenoise', 'forest'
  const [sessionHistory, setSessionHistory] = useState([]);
  const [celebration, setCelebration] = useState({ isOpen: false, minutes: 25, taskTitle: '' });

  const timerRef = useRef(null);
  const audioContextRef = useRef(null);
  const noiseNodeRef = useRef(null);

  // Fetch initial data
  const fetchData = async () => {
    try {
      const [subsRes, tasksRes, histRes] = await Promise.all([
        api.get('/subjects'),
        api.get('/tasks', { params: { status: 'pending' } }),
        api.get('/focus-sessions/history', { params: { limit: 10 } }),
      ]);
      if (subsRes.data.success) {
        setSubjects(subsRes.data.subjects);
        if (!selectedSubjectId && subsRes.data.subjects.length > 0) {
          setSelectedSubjectId(subsRes.data.subjects[0]._id);
        }
      }
      if (tasksRes.data.success) setTasks(tasksRes.data.tasks);
      if (histRes.data.success) setSessionHistory(histRes.data.sessions);
    } catch (err) {
      console.error('Failed to load focus room data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch topics whenever selectedSubjectId changes
  useEffect(() => {
    if (!selectedSubjectId) {
      setTopics([]);
      return;
    }
    api
      .get('/topics', { params: { subjectId: selectedSubjectId } })
      .then((res) => {
        if (res.data.success && res.data.topics) {
          setTopics(res.data.topics);
          if (res.data.topics.length > 0 && !selectedTopicId) {
            setSelectedTopicId(res.data.topics[0]._id);
          }
        }
      })
      .catch((err) => console.error('Failed to load subject topics:', err));
  }, [selectedSubjectId]);

  // Timer interval
  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleSessionEnd(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isActive]);

  const switchMode = (newMode, minutes) => {
    setIsActive(false);
    setMode(newMode);
    setTargetMinutes(minutes);
    setSecondsRemaining(minutes * 60);
    setSessionStartTime(null);
  };

  const handleStart = () => {
    // If Short Break or Long Break: run standard on-page relaxing timer (NO focus lockdown)
    if (mode === 'short_break' || mode === 'long_break') {
      setIsActive(true);
      if (!sessionStartTime) setSessionStartTime(new Date());
      return;
    }

    // mode === 'focus' -> Launch Full Screen Focus Mode
    const taskObj = tasks.find((t) => t._id === selectedTaskId);
    const subObj = subjects.find((s) => s._id === selectedSubjectId);
    const topicObj = topics.find((t) => t._id === selectedTopicId);
    startFullFocusMode({
      targetMinutes,
      taskTitle: taskObj?.title || (topicObj ? topicObj.name : ''),
      subjectName: subObj?.name || 'General Study',
      subjectId: selectedSubjectId || null,
      taskId: selectedTaskId || null,
      topicId: selectedTopicId || null,
      topicName: topicObj?.name || '',
      notes: topicObj?.notes || '',
      resources: topicObj?.resources || [],
    });
  };

  const handlePause = () => {
    setIsActive(false);
  };

  const handleReset = () => {
    setIsActive(false);
    setSessionStartTime(null);
    setSecondsRemaining(targetMinutes * 60);
  };

  const handleSessionEnd = async (completed = true) => {
    setIsActive(false);
    const endTime = new Date();
    const startTime = sessionStartTime || new Date(endTime.getTime() - targetMinutes * 60 * 1000);

    const taskObj = tasks.find((t) => t._id === selectedTaskId);

    try {
      // Important: Save start and end timestamps in database for server calculation
      await api.post('/focus-sessions', {
        startedAt: startTime.toISOString(),
        endedAt: endTime.toISOString(),
        taskId: selectedTaskId || null,
        subjectId: selectedSubjectId || null,
        sessionType: mode,
        targetMinutes,
        notes: taskObj ? `Focused on ${taskObj.title}` : `${mode === 'focus' ? 'Focus Block' : 'Break Block'}`,
      });

      if (completed) {
        if (mode === 'focus') {
          setCelebration({
            isOpen: true,
            minutes: targetMinutes,
            taskTitle: taskObj?.title || 'Academic Session',
          });
        } else {
          // Play melodious Tibet chime bell to ring break is over!
          playChimeBell();
          setShowBreakOverModal(true);
        }
      }

      fetchData();
    } catch (err) {
      console.error('Failed to record session:', err);
    } finally {
      setSessionStartTime(null);
      setSecondsRemaining(targetMinutes * 60);
    }
  };

  // Web Audio synthesizer for ambient sound (zero external asset dependency!)
  useEffect(() => {
    if (ambientSound !== 'none') {
      try {
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
        filter.frequency.setValueAtTime(ambientSound === 'rain' ? 800 : 350, ctx.currentTime);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.12, ctx.currentTime);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        noise.start();
        noiseNodeRef.current = { noise, ctx };
      } catch (err) {
        console.warn('Ambient sound audio error', err);
      }
    } else {
      if (noiseNodeRef.current) {
        try {
          noiseNodeRef.current.noise.stop();
          noiseNodeRef.current.ctx.close();
        } catch (e) {}
        noiseNodeRef.current = null;
      }
    }

    return () => {
      if (noiseNodeRef.current) {
        try {
          noiseNodeRef.current.noise.stop();
          noiseNodeRef.current.ctx.close();
        } catch (e) {}
      }
    };
  }, [ambientSound]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Progress ring math
  const totalSeconds = targetMinutes * 60;
  const progressPct = ((totalSeconds - secondsRemaining) / totalSeconds) * 100;
  const radius = 130;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPct / 100) * circumference;

  const mins = Math.floor(secondsRemaining / 60);
  const secs = secondsRemaining % 60;
  const formattedTime = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  return (
    <div className={`space-y-6 pb-12 ${isFullscreen ? 'fixed inset-0 z-50 bg-[#FFF0E8] p-8 overflow-y-auto' : ''}`}>
      {/* Top Controller Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-2 bg-white/80 p-1.5 rounded-2xl border border-peach-200 shadow-sm">
          <button
            onClick={() => switchMode('focus', 25)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              mode === 'focus' ? 'bg-coral text-white shadow-soft-peach' : 'text-mainText-muted hover:text-mainText'
            }`}
          >
            Focus (25m)
          </button>
          <button
            onClick={() => switchMode('short_break', 5)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              mode === 'short_break' ? 'bg-successGreen text-white shadow-sm' : 'text-mainText-muted hover:text-mainText'
            }`}
          >
            Short Break (5m)
          </button>
          <button
            onClick={() => switchMode('long_break', 15)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              mode === 'long_break' ? 'bg-amber-500 text-white shadow-sm' : 'text-mainText-muted hover:text-mainText'
            }`}
          >
            Long Break (15m)
          </button>
        </div>

        {/* Ambient Sound & Fullscreen controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-white/80 px-3 py-1.5 rounded-2xl border border-peach-200 text-xs font-semibold">
            {ambientSound === 'none' ? <VolumeX className="w-4 h-4 text-mainText-muted" /> : <Volume2 className="w-4 h-4 text-coral" />}
            <select
              value={ambientSound}
              onChange={(e) => setAmbientSound(e.target.value)}
              className="bg-transparent text-mainText focus:outline-none cursor-pointer"
            >
              <option value="none">Mute Sound</option>
              <option value="rain">Rainfall Sound</option>
              <option value="whitenoise">Brown Noise</option>
            </select>
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-2xl bg-white/80 hover:bg-white text-mainText-muted hover:text-coral border border-peach-200 transition-colors shadow-sm"
            title="Distraction-Free Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Focus Centerpiece */}
      <div className="bg-white/95 rounded-4xl p-8 md:p-12 shadow-soft-card border border-[#FFE2D3]/70 flex flex-col items-center justify-center text-center relative overflow-hidden">
        {mode !== 'focus' && (
          <div className="flex items-center gap-2 bg-successGreen/15 border border-successGreen/30 text-successGreen-dark px-4 py-2 rounded-full text-xs font-bold mb-4 animate-in fade-in">
            <Coffee className="w-4 h-4 text-successGreen-dark" />
            <span>☕ Relaxing Break — Timer running smoothly on screen. (No full screen lockdown)</span>
          </div>
        )}

        {/* Active Task / Subject Selection */}
        <div className="flex items-center gap-3 flex-wrap justify-center mb-6">
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            disabled={isActive}
            className="text-xs font-bold px-3 py-1.5 rounded-xl border border-peach-200 bg-peach-50 text-coral-dark focus:outline-none"
          >
            {subjects.map((sub) => (
              <option key={sub._id} value={sub._id}>
                Course: {sub.name}
              </option>
            ))}
          </select>

          <select
            value={selectedTaskId}
            onChange={(e) => setSelectedTaskId(e.target.value)}
            disabled={isActive}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-peach-200 bg-white text-mainText focus:outline-none max-w-xs truncate"
          >
            <option value="">No Specific Task</option>
            {tasks.map((t) => (
              <option key={t._id} value={t._id}>
                Task: {t.title}
              </option>
            ))}
          </select>

          {topics.length > 0 && (
            <select
              value={selectedTopicId}
              onChange={(e) => setSelectedTopicId(e.target.value)}
              disabled={isActive}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-peach-200 bg-peach-50/50 text-mainText focus:outline-none max-w-xs truncate"
            >
              <option value="">Choose Topic (Notes & Drive)</option>
              {topics.map((top) => (
                <option key={top._id} value={top._id}>
                  Topic: {top.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Large Progress Ring Timer */}
        <div className="relative w-72 h-72 md:w-80 md:h-80 flex items-center justify-center my-4">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 320 320">
            {/* Background circle */}
            <circle
              cx="160"
              cy="160"
              r={radius}
              stroke="#FFF0E8"
              strokeWidth="16"
              fill="transparent"
            />
            {/* Active animated progress ring */}
            <circle
              cx="160"
              cy="160"
              r={radius}
              stroke={mode === 'focus' ? '#FF8B76' : '#74C99A'}
              strokeWidth="16"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-1000 ease-linear"
            />
          </svg>

          {/* Centered Large Digits */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
            <span className="text-5xl md:text-6xl font-extrabold font-display tracking-tight text-mainText">
              {formattedTime}
            </span>
            <span className="text-xs font-semibold text-coral uppercase tracking-widest mt-1">
              {mode.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Timer Control Buttons */}
        <div className="flex items-center gap-4 mt-6">
          <button
            onClick={isActive ? handlePause : handleStart}
            className="px-10 py-3.5 rounded-full bg-coral hover:bg-coral-dark text-white font-extrabold text-base shadow-soft-peach transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            {isActive ? (
              <>
                <Pause className="w-5 h-5 fill-white" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-white ml-0.5" />
                <span>Start Focus</span>
              </>
            )}
          </button>

          <button
            onClick={handleReset}
            className="w-12 h-12 rounded-full bg-peach-100 hover:bg-peach-200 text-coral flex items-center justify-center transition-all hover:scale-105"
            title="Reset"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          {isActive && (
            <button
              onClick={() => handleSessionEnd(true)}
              className="px-4 py-2.5 rounded-2xl bg-green-100 hover:bg-green-200 text-green-700 text-xs font-bold transition-all"
            >
              Complete Now
            </button>
          )}
        </div>
      </div>

      {/* Session History Log Table */}
      <div className="bg-white/95 rounded-3xl p-6 shadow-soft-card border border-[#FFE2D3]/60">
        <h3 className="text-sm md:text-base font-bold text-mainText font-display mb-4">
          Recent Focus Sessions Log (Server-Verified Duration)
        </h3>

        <div className="space-y-2.5">
          {sessionHistory.length === 0 ? (
            <div className="text-center py-6 text-xs text-mainText-muted">
              No sessions completed yet. Start your first session above!
            </div>
          ) : (
            sessionHistory.map((s) => (
              <div
                key={s._id}
                className="flex items-center justify-between p-3 rounded-2xl bg-peach-50/40 border border-peach-100 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-peach-100 text-coral flex items-center justify-center font-bold">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-mainText block">
                      {s.notes || (s.sessionType === 'focus' ? 'Focus Session' : 'Break')}
                    </span>
                    <span className="text-[11px] text-mainText-muted">
                      {new Date(s.startedAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-bold text-coral-dark bg-white px-2.5 py-1 rounded-xl border border-peach-200">
                    {s.elapsedMinutes || Math.round(s.durationSeconds / 60)} mins
                  </span>
                  <span className="text-successGreen-dark font-semibold text-[11px]">
                    ✓ Recorded
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Flower Celebration Modal */}
      <FlowerCelebrationModal
        isOpen={celebration.isOpen}
        minutes={celebration.minutes}
        taskTitle={celebration.taskTitle}
        onClose={() => setCelebration({ isOpen: false, minutes: 25, taskTitle: '' })}
      />

      {/* Break Time Over Modal with Bell Ring Notification */}
      {showBreakOverModal && (
        <div className="fixed inset-0 z-50 bg-[#342D2B]/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full text-center shadow-2xl border border-peach-200 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4 shadow-sm animate-bounce text-2xl">
              🔔
            </div>
            <h3 className="text-xl font-bold font-display text-mainText">
              Break Time is Over!
            </h3>
            <p className="text-xs md:text-sm text-mainText-muted mt-2 mb-6">
              Your break has concluded. Ready to jump back into your academic focus block?
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  setShowBreakOverModal(false);
                  switchMode('focus', 25);
                  const taskObj = tasks.find((t) => t._id === selectedTaskId);
                  const subObj = subjects.find((s) => s._id === selectedSubjectId);
                  const topicObj = topics.find((t) => t._id === selectedTopicId);
                  startFullFocusMode({
                    targetMinutes: 25,
                    taskTitle: taskObj?.title || (topicObj ? topicObj.name : ''),
                    subjectName: subObj?.name || 'General Study',
                    subjectId: selectedSubjectId || null,
                    taskId: selectedTaskId || null,
                    topicId: selectedTopicId || null,
                    topicName: topicObj?.name || '',
                    notes: topicObj?.notes || '',
                    resources: topicObj?.resources || [],
                  });
                }}
                className="w-full py-3 rounded-2xl bg-coral hover:bg-coral-dark text-white font-bold text-xs md:text-sm shadow-soft-peach transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
              >
                <span>Back to Study (25m Focus Block)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowBreakOverModal(false)}
                className="w-full py-2.5 rounded-2xl text-xs font-semibold text-mainText-muted hover:bg-peach-50"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FocusRoomPage;
