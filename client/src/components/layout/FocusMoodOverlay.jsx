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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const FocusMoodOverlay = () => {
  const { user, focusMood, toggleFocusMood, updatePreferences } = useAuth();

  // Full focus countdown state
  const [secondsRemaining, setSecondsRemaining] = useState(25 * 60);
  const [isActive, setIsActive] = useState(true);
  const [isPlayingAudio, setIsPlayingAudio] = useState(true);
  const [soundType, setSoundType] = useState('rain'); // 'rain', 'whitenoise'
  const [blockedNotification, setBlockedNotification] = useState(null);
  const [distractionAttempts, setDistractionAttempts] = useState(0);
  const [newAppName, setNewAppName] = useState('');
  const [showAddApp, setShowAddApp] = useState(false);

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

  // Start sound & timer on enter
  useEffect(() => {
    if (focusMood) {
      setSecondsRemaining((user?.preferences?.focusDuration || 25) * 60);
      setIsActive(true);
      startAudio('rain');
    } else {
      stopAudio();
    }
  }, [focusMood]);

  // Countdown timer
  useEffect(() => {
    if (focusMood && isActive) {
      timerRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
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

  // Intercept when student leaves the tab or switches app
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && focusMood) {
        setDistractionAttempts((prev) => prev + 1);
      } else if (!document.hidden && focusMood) {
        setBlockedNotification({
          title: '⚠️ Window Switch Intercepted',
          message: 'Focus Lock is strictly active! Distraction window was shielded.',
        });
        setTimeout(() => setBlockedNotification(null), 4000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [focusMood]);

  // Simulate clicking on a blocked distraction
  const handleSimulateOpenApp = (app) => {
    setDistractionAttempts((prev) => prev + 1);
    setBlockedNotification({
      title: `🚫 ${app.name} Access Shielded!`,
      message: `${app.name} is currently blocked by your Focus Lock. Return to your academic session!`,
    });
    setTimeout(() => setBlockedNotification(null), 4500);
  };

  // Add new app to block list
  const handleAddNewApp = async (e) => {
    e.preventDefault();
    if (!newAppName.trim()) return;

    const newItem = {
      id: newAppName.toLowerCase().replace(/\s+/g, '-'),
      name: newAppName.trim(),
      category: 'Distraction',
    };

    const updated = [...blockList, newItem];
    setBlockList(updated);
    setNewAppName('');
    setShowAddApp(false);
    await updatePreferences({ blockedItems: updated });
  };

  const removeBlockedApp = async (id) => {
    const updated = blockList.filter((item) => item.id !== id && item._id !== id);
    setBlockList(updated);
    await updatePreferences({ blockedItems: updated });
  };

  if (!focusMood) return null;

  const mins = Math.floor(secondsRemaining / 60);
  const secs = secondsRemaining % 60;
  const timeFormatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-50 bg-[#1E1917]/95 backdrop-blur-xl text-white flex flex-col justify-between p-6 md:p-10 animate-in fade-in duration-300 overflow-y-auto">
      {/* Top Status Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-coral/20 border border-coral text-coral flex items-center justify-center">
            <Lock className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-coral">
                Strict Focus Lockdown Active
              </span>
              <span className="w-2 h-2 rounded-full bg-successGreen animate-ping" />
            </div>
            <p className="text-xs text-white/60">
              All distracting websites and notifications are actively shielded.
            </p>
          </div>
        </div>

        {/* Exit Button */}
        <button
          onClick={toggleFocusMood}
          className="px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 transition-all flex items-center gap-2"
        >
          <Unlock className="w-3.5 h-3.5 text-coral" />
          <span>Exit Focus Mode</span>
        </button>
      </div>

      {/* Intercept Alert Banner (if distraction attempted) */}
      {blockedNotification && (
        <div className="max-w-md mx-auto my-3 p-4 rounded-3xl bg-red-950/80 border-2 border-red-500 text-red-200 text-center shadow-2xl animate-in zoom-in-95 duration-150">
          <ShieldAlert className="w-8 h-8 text-red-400 mx-auto mb-1 animate-bounce" />
          <h4 className="text-sm font-bold text-white">{blockedNotification.title}</h4>
          <p className="text-xs mt-1 text-red-300">{blockedNotification.message}</p>
        </div>
      )}

      {/* Main Centerpiece Countdown */}
      <div className="flex flex-col items-center justify-center my-6 text-center">
        <span className="text-xs font-semibold tracking-widest text-coral uppercase mb-2">
          Deep Focus Session
        </span>
        <div className="text-7xl md:text-9xl font-black font-display tracking-tight text-white select-none">
          {timeFormatted}
        </div>

        {/* Ambient Noise Selector */}
        <div className="mt-6 flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
          <button
            onClick={() => (isPlayingAudio ? stopAudio() : startAudio(soundType))}
            className="text-coral hover:text-white transition-colors"
          >
            {isPlayingAudio ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 text-white/50" />}
          </button>
          <span className="text-xs font-semibold text-white/80">Ambient Frequency:</span>
          <select
            value={soundType}
            onChange={(e) => {
              setSoundType(e.target.value);
              startAudio(e.target.value);
            }}
            className="bg-transparent text-xs font-bold text-coral focus:outline-none cursor-pointer"
          >
            <option value="rain" className="bg-[#1E1917] text-white">Rainfall</option>
            <option value="whitenoise" className="bg-[#1E1917] text-white">Brown Noise</option>
          </select>
        </div>

        {distractionAttempts > 0 && (
          <span className="mt-3 text-xs text-amber-400 font-semibold bg-amber-950/50 px-3 py-1 rounded-full border border-amber-800">
            ⚠️ {distractionAttempts} distraction attempts shielded
          </span>
        )}
      </div>

      {/* Bottom Blocked Apps Interceptor Panel */}
      <div className="bg-white/10 backdrop-blur-md rounded-3xl p-5 border border-white/10 max-w-4xl mx-auto w-full">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-successGreen" />
            <span className="text-xs font-bold text-white tracking-wide">
              Shielded Distractions ({blockList.length} Apps Blocked)
            </span>
          </div>

          <button
            onClick={() => setShowAddApp(!showAddApp)}
            className="text-xs font-bold text-coral hover:text-white flex items-center gap-1 bg-coral/20 px-3 py-1 rounded-xl border border-coral/30"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Block Another App/Site</span>
          </button>
        </div>

        {/* Add app inline form */}
        {showAddApp && (
          <form onSubmit={handleAddNewApp} className="mb-3 flex items-center gap-2">
            <input
              type="text"
              placeholder="e.g. Netflix, Discord, Reddit, TikTok..."
              value={newAppName}
              onChange={(e) => setNewAppName(e.target.value)}
              className="flex-1 text-xs px-3 py-2 rounded-xl bg-white/20 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-coral"
              autoFocus
            />
            <button
              type="submit"
              className="text-xs font-bold px-4 py-2 rounded-xl bg-coral hover:bg-coral-dark text-white"
            >
              Add to Block List
            </button>
          </form>
        )}

        {/* Interactive App Badges */}
        <div className="flex items-center gap-3 flex-wrap">
          {blockList.map((app) => (
            <div
              key={app.id || app._id}
              onClick={() => handleSimulateOpenApp(app)}
              className="group flex items-center gap-2 bg-white/10 hover:bg-red-500/20 px-3 py-2 rounded-2xl border border-white/10 hover:border-red-400 cursor-pointer transition-all"
              title={`Click to test blocking ${app.name}`}
            >
              <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              <span className="text-xs font-bold text-white group-hover:text-red-200">
                {app.name}
              </span>
              <span className="text-[10px] text-white/50 bg-white/10 px-1.5 py-0.5 rounded-md">
                Locked
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FocusMoodOverlay;
