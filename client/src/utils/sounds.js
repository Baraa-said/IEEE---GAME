/**
 * sounds.js – Comprehensive Web Audio API sound effects for Code Wars.
 * All sounds synthesized — no external audio files required.
 */

let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

/* ── Primitives ─────────────────────────────────────────────── */
function _osc(c, type, freq, start, dur, gainVal = 0.15) {
  const o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, start);
  g.gain.setValueAtTime(gainVal, start);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  o.connect(g); g.connect(c.destination);
  o.start(start); o.stop(start + dur + 0.01);
}
function _sweep(c, type, f0, f1, start, dur, gainVal = 0.15) {
  const o = c.createOscillator(), g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, start);
  o.frequency.exponentialRampToValueAtTime(f1, start + dur);
  g.gain.setValueAtTime(gainVal, start);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  o.connect(g); g.connect(c.destination);
  o.start(start); o.stop(start + dur + 0.01);
}
function _noise(c, start, dur, gainVal = 0.08, hipass = 0) {
  const buf = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource(), g = c.createGain();
  g.gain.setValueAtTime(gainVal, start);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  if (hipass > 0) {
    const f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hipass;
    src.connect(f); f.connect(g);
  } else { src.connect(g); }
  g.connect(c.destination); src.buffer = buf;
  src.start(start); src.stop(start + dur + 0.01);
}

/* ── Exported Sounds ─────────────────────────────────────────── */

/** Countdown tick */
export function playTick() {
  try { const c = getAudioContext(), t = c.currentTime; _sweep(c, 'sine', 900, 700, t, 0.06, 0.08); } catch (_) {}
}

/** High-urgency tick (last 5 s) */
export function playUrgentTick() {
  try {
    const c = getAudioContext(), t = c.currentTime;
    _sweep(c, 'square', 1200, 900, t, 0.04, 0.1);
    _sweep(c, 'sine', 1400, 1000, t + 0.03, 0.04, 0.06);
  } catch (_) {}
}

/** Ascending chime when joining/creating a room */
export function playJoinRoom() {
  try {
    const c = getAudioContext(), t = c.currentTime;
    [523.25, 659.25, 783.99].forEach((f, i) => _osc(c, 'sine', f, t + i * 0.12, 0.4, 0.12));
  } catch (_) {}
}

/** Short pop when another player joins the lobby */
export function playPlayerJoined() {
  try { const c = getAudioContext(), t = c.currentTime; _sweep(c, 'sine', 440, 660, t, 0.15, 0.1); } catch (_) {}
}

/** Dramatic startup fanfare */
export function playGameStart() {
  try {
    const c = getAudioContext(), t = c.currentTime;
    [[261.6,0],[329.6,0.1],[392,0.2],[523.2,0.3],[659.2,0.45]].forEach(([f,d]) => _osc(c, 'square', f, t+d, 0.3, 0.14));
    _sweep(c, 'sawtooth', 110, 55, t + 0.45, 0.5, 0.18);
    _noise(c, t + 0.45, 0.6, 0.05, 5000);
  } catch (_) {}
}

/** Mysterious shimmer for role reveal */
export function playRoleReveal() {
  try {
    const c = getAudioContext(), t = c.currentTime;
    for (let i = 0; i < 6; i++) _osc(c, 'sine', 300 + Math.random() * 800, t + i * 0.07, 0.5, 0.05);
    _sweep(c, 'sine', 200, 800, t, 0.8, 0.1);
  } catch (_) {}
}

/** Phase change sound */
export function playPhaseChange(isNight) {
  try {
    const c = getAudioContext(), t = c.currentTime;
    if (isNight) {
      _sweep(c, 'sine', 600, 200, t, 0.7, 0.15);
      _sweep(c, 'sine', 400, 150, t + 0.1, 0.6, 0.08);
    } else {
      _sweep(c, 'sine', 200, 600, t, 0.6, 0.15);
      _osc(c, 'sine', 660, t + 0.55, 0.25, 0.12);
    }
  } catch (_) {}
}

/** Sunrise chime */
export function playSunrise() {
  try {
    const c = getAudioContext(), t = c.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => _osc(c, 'sine', f, t + i * 0.14, 0.5, 0.1));
  } catch (_) {}
}

/** Incoming chat notification */
export function playChatNotif() {
  try {
    const c = getAudioContext(), t = c.currentTime;
    _osc(c, 'sine', 520, t, 0.18, 0.07);
    _osc(c, 'sine', 780, t + 0.07, 0.14, 0.05);
  } catch (_) {}
}

/** Click sound when sending a chat message */
export function playSendMessage() {
  try { const c = getAudioContext(), t = c.currentTime; _sweep(c, 'sine', 600, 800, t, 0.06, 0.06); } catch (_) {}
}

/** Hacker private chat pop */
export function playHackerChat() {
  try {
    const c = getAudioContext(), t = c.currentTime;
    _osc(c, 'sawtooth', 120, t, 0.12, 0.06);
    _osc(c, 'sine', 220, t + 0.05, 0.1, 0.05);
  } catch (_) {}
}

/** Click for casting a vote */
export function playVoteCast() {
  try {
    const c = getAudioContext(), t = c.currentTime;
    _sweep(c, 'square', 300, 200, t, 0.08, 0.12);
    _noise(c, t, 0.06, 0.04, 3000);
  } catch (_) {}
}

/** Tense sting when vote results revealed */
export function playVoteResult() {
  try {
    const c = getAudioContext(), t = c.currentTime;
    [440, 523, 622].forEach((f, i) => _sweep(c, 'sawtooth', f, f * 0.8, t + i * 0.05, 0.6, 0.08));
  } catch (_) {}
}

/** Ominous elimination sound */
export function playElimination() {
  try {
    const c = getAudioContext(), t = c.currentTime;
    _sweep(c, 'sawtooth', 400, 80, t, 1.0, 0.12);
    _sweep(c, 'sine', 300, 60, t + 0.05, 0.9, 0.08);
    _noise(c, t + 0.7, 0.4, 0.04);
  } catch (_) {}
}

/** Swoosh for skipping phase */
export function playSkip() {
  try {
    const c = getAudioContext(), t = c.currentTime;
    _sweep(c, 'sine', 400, 900, t, 0.15, 0.1);
    _noise(c, t, 0.1, 0.03, 4000);
  } catch (_) {}
}

/** Dark confirmation for hacker target selection */
export function playNightAction() {
  try {
    const c = getAudioContext(), t = c.currentTime;
    _sweep(c, 'sawtooth', 180, 90, t, 0.4, 0.12);
    _osc(c, 'sine', 130, t + 0.15, 0.35, 0.08);
  } catch (_) {}
}

/** Sinister glitch for code injection */
export function playHackerInject() {
  try {
    const c = getAudioContext(), t = c.currentTime;
    for (let i = 0; i < 5; i++) _osc(c, 'sawtooth', 80 + Math.random() * 200, t + i * 0.07, 0.1, 0.15);
    _sweep(c, 'square', 600, 100, t + 0.05, 0.4, 0.1);
    _noise(c, t, 0.5, 0.05, 2000);
  } catch (_) {}
}

/** Scanning beep sequence */
export function playScanStart() {
  try {
    const c = getAudioContext(), t = c.currentTime;
    [0, 0.1, 0.2].forEach(d => _sweep(c, 'sine', 880, 1100, t + d, 0.08, 0.08));
  } catch (_) {}
}

/** Clean scan result */
export function playScanClean() {
  try {
    const c = getAudioContext(), t = c.currentTime;
    [660, 880, 1100].forEach((f, i) => _osc(c, 'sine', f, t + i * 0.1, 0.35, 0.1));
  } catch (_) {}
}

/** Corruption detected alert */
export function playScanCorrupted() {
  try {
    const c = getAudioContext(), t = c.currentTime;
    [0, 0.12, 0.24].forEach(d => _sweep(c, 'sawtooth', 440, 200, t + d, 0.1, 0.14));
    _osc(c, 'square', 150, t + 0.1, 0.4, 0.1);
  } catch (_) {}
}

/** Code repaired success */
export function playRepair() {
  try {
    const c = getAudioContext(), t = c.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => _osc(c, 'sine', f, t + i * 0.1, 0.4, 0.12));
    _osc(c, 'triangle', 2093, t + 0.42, 0.4, 0.1);
  } catch (_) {}
}

/** Tense chord for defense phase */
export function playDefenseStart() {
  try {
    const c = getAudioContext(), t = c.currentTime;
    [220, 277, 330].forEach((f, i) => _sweep(c, 'sawtooth', f, f * 0.9, t + i * 0.04, 0.8, 0.08));
    _noise(c, t, 0.15, 0.05, 6000);
  } catch (_) {}
}

/** Protection saved — triumphant */
export function playProtectionSaved() {
  try {
    const c = getAudioContext(), t = c.currentTime;
    _sweep(c, 'sine', 330, 660, t, 0.3, 0.15);
    [523, 659, 784].forEach((f, i) => _osc(c, 'sine', f, t + 0.25 + i * 0.1, 0.35, 0.12));
  } catch (_) {}
}

/** Admin protect action */
export function playAdminProtect() {
  try {
    const c = getAudioContext(), t = c.currentTime;
    _sweep(c, 'sine', 440, 660, t, 0.2, 0.12);
    _osc(c, 'triangle', 880, t + 0.18, 0.25, 0.1);
  } catch (_) {}
}

/** Error / denied buzz */
export function playError() {
  try {
    const c = getAudioContext(), t = c.currentTime;
    [0, 0.1].forEach(d => _osc(c, 'square', 220, t + d, 0.09, 0.14));
  } catch (_) {}
}

/** Win fanfare */
export function playWin() {
  try {
    const c = getAudioContext(), t = c.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5, 1047];
    notes.forEach((f, i) => {
      _osc(c, 'sine', f, t + i * 0.14, 0.5, 0.15);
      _osc(c, 'triangle', f * 2, t + i * 0.14, 0.5, 0.06);
    });
  } catch (_) {}
}

/** Lose — sad descending */
export function playLose() {
  try {
    const c = getAudioContext(), t = c.currentTime;
    [392, 330, 277, 220, 185].forEach((f, i) => _sweep(c, 'sawtooth', f, f * 0.85, t + i * 0.18, 0.5, 0.1));
  } catch (_) {}
}

/** Generic UI click */
export function playClick() {
  try {
    const c = getAudioContext(), t = c.currentTime;
    _noise(c, t, 0.04, 0.08, 4000);
    _osc(c, 'sine', 1000, t, 0.04, 0.06);
  } catch (_) {}
}

