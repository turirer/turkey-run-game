// audio.js — all sound is synthesized with WebAudio; the game ships no
// audio files. The context is created on the first user gesture (browsers
// refuse to start one earlier), and M toggles the mute, remembered in
// localStorage.

let ctx = null;
let master = null;
let muted = false;
try {
  muted = localStorage.getItem('turkeyRunMuted') === '1';
} catch { /* storage may be unavailable; sound still works */ }

export function initAudio() {
  if (ctx) {
    if (ctx.state === 'suspended') ctx.resume();
    return;
  }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = muted ? 0 : 0.45;
  master.connect(ctx.destination);
}

export function toggleMute() {
  muted = !muted;
  try { localStorage.setItem('turkeyRunMuted', muted ? '1' : '0'); } catch { /* ignore */ }
  if (master) master.gain.value = muted ? 0 : 0.45;
  return muted;
}

export function isMuted() {
  return muted;
}

// One oscillator note with a short envelope.
function note(freq, at, dur, type = 'square', vol = 0.5, slideTo = null) {
  if (!ctx || muted) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const t0 = ctx.currentTime + at;
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(30, slideTo), t0 + dur);
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(vol, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(gain);
  gain.connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

// A burst of filtered noise, for splashes and thuds.
function noise(at, dur, freq, vol = 0.4) {
  if (!ctx || muted) return;
  const t0 = ctx.currentTime + at;
  const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i += 1) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = freq;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(master);
  src.start(t0);
}

export function sfxJump() { note(320, 0, 0.16, 'square', 0.35, 620); }
export function sfxFlap() { note(520, 0, 0.14, 'triangle', 0.4, 880); noise(0, 0.1, 1800, 0.15); }
export function sfxDash() { noise(0, 0.22, 2400, 0.3); note(240, 0, 0.2, 'sawtooth', 0.18, 480); }
export function sfxCorn() { note(880, 0, 0.09, 'square', 0.3); note(1320, 0.07, 0.12, 'square', 0.3); }
export function sfxGolden() {
  [660, 880, 1100, 1320].forEach((f, i) => note(f, i * 0.07, 0.14, 'triangle', 0.4));
}
export function sfxHit() { note(160, 0, 0.25, 'sawtooth', 0.5, 60); noise(0, 0.18, 500, 0.5); }
export function sfxSplash() { noise(0, 0.3, 900, 0.5); note(300, 0, 0.2, 'sine', 0.3, 120); }
export function sfxStage() {
  [523, 659, 784].forEach((f, i) => note(f, i * 0.1, 0.18, 'triangle', 0.4));
}
export function sfxSpotted() { note(196, 0, 0.3, 'sawtooth', 0.4, 147); note(196, 0.32, 0.3, 'sawtooth', 0.4, 147); }

// The turkey's own voice: three quick warbling blips.
export function sfxGobble() {
  for (let i = 0; i < 3; i += 1) note(700 - i * 90, i * 0.09, 0.08, 'square', 0.35, 500 - i * 60);
}

export function sfxWin() {
  [523, 659, 784, 1046, 784, 1046].forEach((f, i) => note(f, i * 0.12, 0.22, 'triangle', 0.45));
  sfxGobble();
}

export function sfxLose() {
  [392, 330, 262, 196].forEach((f, i) => note(f, i * 0.16, 0.26, 'sawtooth', 0.35));
}
