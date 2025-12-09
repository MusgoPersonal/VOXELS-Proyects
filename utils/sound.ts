// Simple synth for sound effects to avoid external assets
const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
const ctx = new AudioContext();

const playTone = (freq: number, type: OscillatorType, duration: number, vol: number = 0.1) => {
  if (ctx.state === 'suspended') ctx.resume();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  
  gain.gain.setValueAtTime(vol, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start();
  osc.stop(ctx.currentTime + duration);
};

export const playSound = {
  pop: () => {
    // Bubble pop sound
    playTone(600, 'sine', 0.1, 0.15);
    setTimeout(() => playTone(800, 'sine', 0.1, 0.1), 50);
  },
  delete: () => {
    // Crunch/Static sound
    playTone(150, 'sawtooth', 0.15, 0.05);
  },
  click: () => {
    // High mechanic click
    playTone(1200, 'square', 0.05, 0.02);
  },
  error: () => {
    playTone(150, 'sawtooth', 0.3, 0.1);
  }
};