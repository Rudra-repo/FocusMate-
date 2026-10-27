import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  VolumeX,
  Shield,
  ShieldAlert,
  Play,
  Pause,
  Sparkles,
  Wind,
  CheckCircle2,
  Clock,
  Plus,
  AlertTriangle,
  Lock,
  Unlock,
  Radio,
  BookOpen,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { FlowerCelebrationModal } from './FlowerCelebrationModal';
import { FocusNotesDrawer } from './FocusNotesDrawer';
import api from '../../services/api';

export const FocusMoodOverlay = () => {
  const { user, focusMood, stopFullFocusMode, focusSessionConfig = {}, updatePreferences } = useAuth();

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
  const [isNotesDrawerOpen, setIsNotesDrawerOpen] = useState(false);

  const audioContextRef = useRef(null);
  const noiseNodeRef = useRef(null);
  const timerRef = useRef(null);
  const isViewingStudyResourceRef = useRef(false);

  const defaultBlockedApps = user?.preferences?.blockedItems || [
    { id: 'telegram', name: 'Telegram', category: 'Chat' },
    { id: 'instagram', name: 'Instagram', category: 'Social' },
    { id: 'x', name: 'X / Twitter', category: 'Social' },
    { id: 'youtube', name: 'YouTube', category: 'Video' },
    { id: 'reddit', name: 'Reddit', category: 'Forum' },
  ];

  const [blockList, setBlockList] = useState(defaultBlockedApps);

  useEffect(() => {
    if (user?.preferences?.blockedItems) {
      setBlockList(user.preferences.blockedItems);
    }
  }, [user]);

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

  // On opening focus mode: initialize countdown and ambient audio
  useEffect(() => {
    if (focusMood) {
      const initialSeconds = (focusSessionConfig.targetMinutes || 25) * 60;
      setSecondsRemaining(initialSeconds);
      setIsActive(true);
      setSessionStartTime(new Date());
      setDistractionAttempts(0);
      setShowExitConfirm(false);
      startAudio('rain');
    } else {
      stopAudio();
    }
  }, [focusMood, focusSessionConfig.targetMinutes]);

  // Countdown timer
  useEffect(() => {
    if (focusMood && isActive) {
      timerRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
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

  // Record session to backend using real start and end timestamps
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
        notes: focusSessionConfig.taskTitle || `Focus block on ${focusSessionConfig.subjectName || 'Study'}`,
      });

      if (naturalComplete) {
        setCelebration({
          isOpen: true,
          minutes: focusSessionConfig.targetMinutes || 25,
          taskTitle: focusSessionConfig.taskTitle || focusSessionConfig.subjectName,
        });
      }
    } catch (err) {
      console.error('Failed to save focus session:', err);
    }
  };

  const handleOpenStudyResource = (resource) => {
    isViewingStudyResourceRef.current = true;
    setBlockedNotification({
      title: `📖 Opened Academic Resource: ${resource.title}`,
      message: 'Authorized study material. Pomodoro timer remains active!',
    });
    setTimeout(() => {
      isViewingStudyResourceRef.current = false;
      setBlockedNotification(null);
    }, 25000);
  };

  // Intercept window switch / blur
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && focusMood) {
        if (!isViewingStudyResourceRef.current) {
          setDistractionAttempts((prev) => prev + 1);
        }
      } else if (!document.hidden && focusMood) {
        if (isViewingStudyResourceRef.current) {
          setBlockedNotification({
            title: '📖 Welcome Back from Topic Reference',
            message: 'Academic study material referenced. Streak maintained!',
          });
          setTimeout(() => setBlockedNotification(null), 3500);
        } else {
          setBlockedNotification({
            title: '⚠️ Window Switch Intercepted',
            message: 'Focus Lock is strictly active! Stay on FocusMate to maintain your streak.',
          });
          setTimeout(() => setBlockedNotification(null), 4000);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [focusMood]);

  const handleSimulateOpenApp = (app) => {
    setDistractionAttempts((prev) => prev + 1);
    setBlockedNotification({
      title: `🚫 ${app.name} Access Shielded!`,
      message: `${app.name} is currently blocked by your Focus Lock. Return to your academic session!`,
    });
    setTimeout(() => setBlockedNotification(null), 4500);
  };

  const handleExitSession = async () => {
    await handleCompleteSession(false);
    stopFullFocusMode();
  };

  if (!focusMood) return null;

  const totalSeconds = (focusSessionConfig.targetMinutes || 25) * 60;
  const progressPercent = Math.min(100, Math.round(((totalSeconds - secondsRemaining) / totalSeconds) * 100));

  const mins = Math.floor(secondsRemaining / 60);
  const secs = secondsRemaining % 60;
  const timeFormatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-50 bg-[#161211] text-white flex flex-col justify-between p-6 sm:p-10 select-none overflow-hidden animate-in fade-in duration-300">
      {/* Background Breathing Glow Radial */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-30">
        <div className="w-[500px] h-[500px] rounded-full bg-gradient-to-r from-coral/40 via-sidebarOrange/20 to-transparent blur-3xl animate-pulse" />
      </div>

      {/* Top Header Bar */}
      <div className="relative z-10 flex items-center justify-between">
        {/* Active Task / Course pill */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-coral/20 border border-coral text-coral flex items-center justify-center shadow-lg">
            <Lock className="w-5 h-5 animate-pulse text-coral" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-coral">
                Strict Focus Lockdown
              </span>
              <span className="w-2 h-2 rounded-full bg-successGreen animate-ping" />
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-white/90 truncate max-w-xs sm:max-w-md">
              {focusSessionConfig.taskTitle ? `📖 ${focusSessionConfig.taskTitle}` : `📖 ${focusSessionConfig.subjectName || 'Academic Focus'}`}
            </h3>
          </div>
        </div>

        {/* Ambient Noise & Exit Controls */}
        <div className="flex items-center gap-3">
          {/* Topic Notes & Materials Button */}
          <button
            onClick={() => setIsNotesDrawerOpen(!isNotesDrawerOpen)}
            className={`px-3.5 py-1.5 rounded-2xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
              isNotesDrawerOpen
                ? 'bg-coral text-white border-coral shadow-soft-peach'
                : 'bg-white/10 hover:bg-white/20 text-white border-white/15'
            }`}
            title="Open topic notes, drive links, and study materials"
          >
            <BookOpen className="w-3.5 h-3.5 text-coral" />
            <span>Notes & Materials</span>
          </button>

          <div className="hidden sm:flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/10 text-xs">
            <button
              onClick={() => (isPlayingAudio ? stopAudio() : startAudio(soundType))}
              className="text-coral hover:text-white"
            >
              {isPlayingAudio ? <Volume2 className="w-4 h-4 text-coral" /> : <VolumeX className="w-4 h-4 text-white/50" />}
            </button>
            <select
              value={soundType}
              onChange={(e) => {
                setSoundType(e.target.value);
                startAudio(e.target.value);
              }}
              className="bg-transparent text-xs font-semibold text-white/90 focus:outline-none cursor-pointer"
            >
              <option value="rain" className="bg-[#181413] text-white">Rainfall</option>
              <option value="whitenoise" className="bg-[#181413] text-white">Brown Noise</option>
            </select>
          </div>

          <button
            onClick={() => setShowExitConfirm(true)}
            className="px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 transition-all flex items-center gap-1.5"
          >
            <Unlock className="w-3.5 h-3.5 text-coral" />
            <span>End Session</span>
          </button>
        </div>
      </div>

      {/* Intercept Alert Banner (if user tries to leave or switch) */}
      {blockedNotification && (
        <div className="relative z-20 max-w-md mx-auto my-2 p-4 rounded-3xl bg-red-950/90 border-2 border-red-500 text-red-200 text-center shadow-2xl animate-in zoom-in-95 duration-150">
          <ShieldAlert className="w-7 h-7 text-red-400 mx-auto mb-1 animate-bounce" />
          <h4 className="text-sm font-bold text-white">{blockedNotification.title}</h4>
          <p className="text-xs mt-1 text-red-300">{blockedNotification.message}</p>
        </div>
      )}

      {/* Main Focus Center: GIANT TIME DISPLAY */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto text-center">
        {/* Progress indicator */}
        <div className="mb-4 flex items-center gap-2 text-xs font-bold text-coral bg-coral/10 px-4 py-1 rounded-full border border-coral/20">
          <span>{progressPercent}% Complete</span>
          <span>•</span>
          <span>{mins} mins remaining</span>
        </div>

        {/* Huge Countdown Digits */}
        <div className="text-7xl sm:text-9xl md:text-[11rem] lg:text-[13rem] font-black font-display tracking-tight text-white select-none leading-none drop-shadow-2xl">
          {timeFormatted}
        </div>

        {/* Controls: Play/Pause Stepper */}
        <div className="mt-8 flex items-center gap-4">
          <button
            onClick={() => setIsActive(!isActive)}
            className="w-16 h-16 rounded-full bg-coral hover:bg-coral-dark text-white flex items-center justify-center shadow-glow-coral transition-all hover:scale-105 active:scale-95"
            title={isActive ? 'Pause Timer' : 'Resume Timer'}
          >
            {isActive ? (
              <Pause className="w-7 h-7 fill-white" />
            ) : (
              <Play className="w-7 h-7 fill-white ml-1" />
            )}
          </button>

          <button
            onClick={() => handleCompleteSession(true)}
            className="px-5 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 transition-all flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-successGreen" />
            <span>Mark Complete</span>
          </button>
        </div>

        {distractionAttempts > 0 && (
          <span className="mt-4 text-xs text-amber-400 font-semibold bg-amber-950/60 px-3.5 py-1 rounded-full border border-amber-800 animate-pulse">
            ⚠️ {distractionAttempts} distraction attempts shielded
          </span>
        )}

        {/* Quick link to open notes & materials */}
        <button
          onClick={() => setIsNotesDrawerOpen(true)}
          className="mt-4 text-xs font-semibold text-white/70 hover:text-white transition-all flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-2xl border border-white/15"
        >
          <BookOpen className="w-3.5 h-3.5 text-coral" />
          <span>Access Topic Notes, Drive Links & Diagrams</span>
        </button>
      </div>

      {/* Bottom Distraction Shield Bar */}
      <div className="relative z-10 max-w-3xl mx-auto w-full bg-white/5 backdrop-blur-md rounded-3xl p-4 border border-white/10 flex items-center justify-between gap-4 flex-wrap">
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

      {/* Exit Confirmation Dialog */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1F1A18] rounded-3xl p-6 max-w-sm w-full text-center border-2 border-peach-200/20 shadow-2xl animate-in zoom-in-95 duration-150">
            <h4 className="text-base font-bold text-white mb-2">End Focus Session Early?</h4>
            <p className="text-xs text-white/60 mb-6">
              You still have {mins} minutes remaining in your study block. Exiting early will stop your continuous focus streak.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-coral hover:bg-coral-dark text-white font-bold text-xs"
              >
                Keep Focusing
              </button>
              <button
                onClick={handleExitSession}
                className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15"
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

      {/* Topic Study Notes & Materials Drawer in Focus Mode */}
      <FocusNotesDrawer
        isOpen={isNotesDrawerOpen}
        onClose={() => setIsNotesDrawerOpen(false)}
        initialTopicId={focusSessionConfig.topicId}
        subjectId={focusSessionConfig.subjectId}
        subjectName={focusSessionConfig.subjectName || focusSessionConfig.taskTitle}
        timeFormatted={timeFormatted}
        onOpenStudyResource={handleOpenStudyResource}
      />
    </div>
  );
};

export default FocusMoodOverlay;
