import React, { useEffect, useRef, useCallback } from 'react';

/**
 * MenuBackground – Full-screen animated background for the landing page.
 * Features:
 *  - Canvas-based matrix / code-rain effect (green falling characters)
 *  - Pulsing radial glow orbs (CSS)
 *  - Ambient cyberpunk music via Web Audio API (toggle button)
 */

/* ─── Web Audio Ambient Music ─────────────────────────────────── */
class AmbientMusic {
  constructor() {
    this.ctx = null;
    this.nodes = [];
    this.running = false;
    this.arpInterval = null;
    this.drumInterval = null;
    this.masterGain = null;
  }

  start() {
    if (this.running) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(1, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);
    this.running = true;
    this._buildDrone();
    this._buildArp();
    this._buildDrum();
  }

  fadeOut(ms = 1500) {
    if (!this.running || !this.ctx || !this.masterGain) { this.stop(); return; }
    const duration = ms / 1000;
    this.masterGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + duration);
    setTimeout(() => this.stop(), ms + 100);
  }

  stop() {
    this.running = false;
    clearInterval(this.arpInterval);
    clearInterval(this.drumInterval);
    this.nodes.forEach(n => { try { n.stop?.(); n.disconnect?.(); } catch (_) {} });
    this.nodes = [];
    try { this.ctx?.close(); } catch (_) {}
    this.ctx = null;
    this.masterGain = null;
  }

  _node(n) { this.nodes.push(n); return n; }

  /* Slow sub-bass drone */
  _buildDrone() {
    const ctx = this.ctx;
    const master = this._node(ctx.createGain());
    master.gain.setValueAtTime(0.08, ctx.currentTime);
    master.connect(this.masterGain);

    [55, 110, 165].forEach((freq, i) => {
      const osc = this._node(ctx.createOscillator());
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      // slight detune per layer
      osc.detune.setValueAtTime(i * 4, ctx.currentTime);

      const filter = this._node(ctx.createBiquadFilter());
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(300, ctx.currentTime);
      filter.Q.setValueAtTime(1, ctx.currentTime);

      const lfo = this._node(ctx.createOscillator());
      lfo.frequency.setValueAtTime(0.15 + i * 0.07, ctx.currentTime);
      const lfoGain = this._node(ctx.createGain());
      lfoGain.gain.setValueAtTime(30, ctx.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfo.start();

      osc.connect(filter);
      filter.connect(master);
      osc.start();
    });
  }

  /* Cyberpunk arpeggio — pentatonic minor */
  _buildArp() {
    const ctx = this.ctx;
    const notes = [220, 261.6, 293.7, 349.2, 392, 440, 523.2];
    let step = 0;
    const master = this._node(ctx.createGain());
    master.gain.setValueAtTime(0.05, ctx.currentTime);
    master.connect(this.masterGain);

    const play = () => {
      if (!this.running || !this.ctx) return;
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(notes[step % notes.length], ctx.currentTime);
      env.gain.setValueAtTime(0, ctx.currentTime);
      env.gain.linearRampToValueAtTime(0.8, ctx.currentTime + 0.02);
      env.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.18);
      osc.connect(env);
      env.connect(master);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);
      step++;
    };

    this.arpInterval = setInterval(play, 280);
  }

  /* Kick + hi-hat rhythm */
  _buildDrum() {
    const ctx = this.ctx;

    const kick = (t) => {
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(120, t);
      osc.frequency.exponentialRampToValueAtTime(40, t + 0.15);
      env.gain.setValueAtTime(0.4, t);
      env.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      osc.connect(env);
      env.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.35);
    };

    const hihat = (t) => {
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(8000, t);
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.12, t);
      env.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      src.connect(filter);
      filter.connect(env);
      env.connect(this.masterGain);
      src.start(t);
    };

    // 4/4 pattern at ~120 bpm — 1 bar = 2s
    const beatLen = 2.0;
    const schedule = () => {
      if (!this.running || !this.ctx) return;
      const now = ctx.currentTime;
      kick(now);           kick(now + beatLen);
      hihat(now + 0.5);   hihat(now + 1.0);
      hihat(now + 1.5);   hihat(now + 2.0);
      hihat(now + 2.5);   hihat(now + 3.0);
      hihat(now + 3.5);
    };

    schedule();
    this.drumInterval = setInterval(schedule, beatLen * 2 * 1000);
  }
}

/* ─── Matrix Rain Canvas ─────────────────────────────────────── */
function MatrixCanvas() {
  const canvasRef = useRef(null);
  const animRef   = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const CHARS = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワン<>{}[];=+-*/\\|&^%$#@!?'.split('');
    const FONT_SIZE = 14;
    let cols, drops;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      cols  = Math.floor(canvas.width / FONT_SIZE);
      drops = Array.from({ length: cols }, () => Math.random() * -50);
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < drops.length; i++) {
        const char = CHARS[Math.floor(Math.random() * CHARS.length)];
        const y = drops[i] * FONT_SIZE;
        const x = i * FONT_SIZE;

        // Lead character is bright white, trail fades green
        const isLead = drops[i] === Math.floor(drops[i]);
        ctx.fillStyle = isLead ? '#ffffff' : `rgba(0, 255, 100, ${0.3 + Math.random() * 0.5})`;
        ctx.font = `${FONT_SIZE}px monospace`;
        ctx.fillText(char, x, y);

        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i] += 0.5;
      }
    };

    const loop = () => {
      draw();
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full opacity-25 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}

/* ─── Floating orbs ──────────────────────────────────────────── */
const ORBS = [
  { cx: '15%', cy: '30%', size: 300, color: '#00ff6480', delay: '0s',  dur: '8s'  },
  { cx: '80%', cy: '60%', size: 250, color: '#0070ff60', delay: '2s',  dur: '10s' },
  { cx: '50%', cy: '80%', size: 200, color: '#8800ff50', delay: '4s',  dur: '7s'  },
  { cx: '90%', cy: '10%', size: 180, color: '#ff004060', delay: '1s',  dur: '9s'  },
  { cx: '5%',  cy: '70%', size: 150, color: '#00eeff40', delay: '3s',  dur: '11s' },
];

/* ─── Main export ─────────────────────────────────────────────── */
export default function MenuBackground({ musicEnabled, onMusicToggle }) {
  const musicRef = useRef(null);

  useEffect(() => {
    if (musicEnabled) {
      if (!musicRef.current) musicRef.current = new AmbientMusic();
      musicRef.current.start();
    } else {
      musicRef.current?.fadeOut(1200);
    }
    return () => {};
  }, [musicEnabled]);

  // Cleanup on unmount
  useEffect(() => () => musicRef.current?.fadeOut(1500), []);

  return (
    <>
      {/* Matrix rain */}
      <MatrixCanvas />

      {/* Glowing orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
        {ORBS.map((orb, i) => (
          <div
            key={i}
            className="absolute rounded-full blur-3xl"
            style={{
              left: orb.cx,
              top: orb.cy,
              width: orb.size,
              height: orb.size,
              background: orb.color,
              transform: 'translate(-50%, -50%)',
              animation: `orb-pulse ${orb.dur} ${orb.delay} ease-in-out infinite alternate`,
            }}
          />
        ))}

        {/* Scanlines */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,100,0.5) 2px, rgba(0,255,100,0.5) 4px)',
            backgroundSize: '100% 4px',
            animation: 'scanline 8s linear infinite',
          }}
        />

        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(0,255,100,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,100,0.4) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Music toggle button */}
      <button
        onClick={onMusicToggle}
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono
          bg-black/60 border border-cyber-green/30 hover:border-cyber-green/70 text-cyber-green
          transition-all hover:bg-black/80 backdrop-blur-sm"
        title="Toggle ambient music"
      >
        {musicEnabled ? (
          <>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyber-green opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyber-green" />
            </span>
            ♫ Music ON
          </>
        ) : (
          <>
            <span className="w-2 h-2 rounded-full bg-gray-600" />
            ♪ Music OFF
          </>
        )}
      </button>

      {/* Keyframe styles */}
      <style>{`
        @keyframes orb-pulse {
          0%   { opacity: 0.4; transform: translate(-50%, -50%) scale(1); }
          100% { opacity: 0.9; transform: translate(-50%, -50%) scale(1.3); }
        }
        @keyframes scanline {
          0%   { background-position: 0 0; }
          100% { background-position: 0 100vh; }
        }
      `}</style>
    </>
  );
}
