import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, X, Play, Pause, Sparkles, Wind } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const FocusMoodOverlay = () => {
  const { focusMood, toggleFocusMood } = useAuth();
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [soundType, setSoundType] = useState('rain'); // 'rain', 'whitenoise', 'forest'
  const audioContextRef = useRef(null);
  const noiseNodeRef = useRef(null);

  // Synthesize relaxing ambient noise via Web Audio API (zero external audio download issues!)
  useEffect(() => {
    if (!focusMood && isPlayingAudio) {
      stopAudio();
    }
  }, [focusMood]);

  const startAudio = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContext();
      audioContextRef.current = ctx;

      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      // Pink / Brown noise synthesis for calming ambient background
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // Brown noise filter
        data[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = data[i];
        data[i] *= 2.5; // Gain boost
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      // Filter for rain / gentle ambient sound
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(soundType === 'rain' ? 800 : 450, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.15, ctx.currentTime);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start();
      noiseNodeRef.current = { noise, ctx };
      setIsPlayingAudio(true);
    } catch (err) {
      console.warn('Audio synthesis not supported or blocked:', err);
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

  const toggleSound = () => {
    if (isPlayingAudio) {
      stopAudio();
    } else {
      startAudio();
    }
  };

  if (!focusMood) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#342D2B]/40 backdrop-blur-md flex items-center justify-center p-4 transition-all">
      <div className="bg-white/95 rounded-3xl p-8 max-w-lg w-full text-center shadow-2xl border border-peach-200 animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-3xl bg-peach-100 mx-auto flex items-center justify-center text-coral mb-4 shadow-inner">
          <Wind className="w-8 h-8 animate-pulse text-coral" />
        </div>

        <span className="inline-block px-3 py-1 bg-green-100 text-green-700 font-bold text-xs rounded-full uppercase tracking-wider mb-2">
          Zen Focus Mood Active
        </span>

        <h2 className="text-2xl font-bold font-display text-mainText mb-2">
          Distraction-Free Workspace
        </h2>

        <p className="text-sm text-mainText-muted mb-6">
          Notifications are silenced. Blocked apps and social tabs are shielded so you can immerse in deep work.
        </p>

        {/* Ambient Sound Controller */}
        <div className="bg-peach-50 border border-peach-200 rounded-2xl p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSound}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                isPlayingAudio ? 'bg-coral text-white shadow-md' : 'bg-white text-mainText border border-gray-200'
              }`}
            >
              {isPlayingAudio ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
            <div className="text-left">
              <span className="text-xs font-bold text-mainText block">
                Calming Ambient Sound
              </span>
              <span className="text-[11px] text-mainText-muted">
                {isPlayingAudio ? 'Playing soothing rainfall frequency' : 'Sound currently muted'}
              </span>
            </div>
          </div>
          <button
            onClick={toggleSound}
            className="text-xs font-semibold text-coral hover:underline"
          >
            {isPlayingAudio ? 'Pause' : 'Play'}
          </button>
        </div>

        {/* Action Button */}
        <button
          onClick={toggleFocusMood}
          className="w-full py-3 px-6 rounded-2xl bg-[#FF8B76] hover:bg-[#E8725C] text-white font-semibold shadow-soft-peach transition-all hover:scale-[1.01] active:scale-[0.99]"
        >
          Exit Focus Mood & Return to Dashboard
        </button>
      </div>
    </div>
  );
};

export default FocusMoodOverlay;
