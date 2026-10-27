/**
 * Melodious Bell Chime Generator via Web Audio API
 * Generates an offline Tibetan / meditation bell chord (C5, E5, G5, B5, C6)
 * with a natural resonant decay envelope. No external MP3 file needed.
 */
export const playChimeBell = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    // Harmonious bell frequencies (C5, E5, G5, B5, C6)
    const tones = [523.25, 659.25, 783.99, 987.77, 1046.5];

    tones.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      const delay = idx * 0.06; // pleasant micro-arpeggio chime strike
      const startTime = ctx.currentTime + delay;

      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.linearRampToValueAtTime(0.3 / (idx + 1), startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.00001, startTime + 3.0);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 3.1);
    });
  } catch (err) {
    console.warn('Audio chime sound error:', err);
  }
};

export default playChimeBell;
