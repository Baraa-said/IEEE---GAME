import React, { useMemo } from 'react';
import { PHASES } from '../shared/constants';

/* ── inline keyframe styles (injected once) ── */
const STYLE_ID = 'sky-bg-keyframes';
if (typeof document !== 'undefined' && !document.getElementById(STYLE_ID)) {
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes twinkle   { 0%,100%{opacity:.15} 50%{opacity:.9} }
    @keyframes float-up  { 0%{transform:translateY(0) scale(1);opacity:.6} 100%{transform:translateY(-100vh) scale(.3);opacity:0} }
    @keyframes aurora     { 0%{transform:translateX(-30%) skewX(-15deg);opacity:.12} 50%{transform:translateX(30%) skewX(15deg);opacity:.22} 100%{transform:translateX(-30%) skewX(-15deg);opacity:.12} }
    @keyframes drift      { 0%{transform:translateX(0)} 100%{transform:translateX(110vw)} }
    @keyframes pulse-glow { 0%,100%{opacity:.35} 50%{opacity:.55} }
    @keyframes sway       { 0%,100%{transform:rotate(-2deg)} 50%{transform:rotate(2deg)} }
  `;
  document.head.appendChild(style);
}

/**
 * SkyBackground – Immersive animated background per game phase.
 *
 * NIGHT   : City skyline silhouette, crescent moon, twinkling stars, aurora, floating particles
 * SUNRISE : Warm horizon glow, scattered clouds, fading stars
 * DAY     : Clean blue gradient, drifting clouds, bright sun with lens flare
 */
export default function SkyBackground({ phase }) {
  const isNight   = phase === PHASES.NIGHT;
  const isSunrise = phase === PHASES.SUNRISE;
  const isDay     = [PHASES.DAY_DISCUSSION, PHASES.DAY_VOTING, PHASES.DAY_DEFENSE].includes(phase);

  /* ── stars ── */
  const stars = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 80; i++) {
      arr.push({
        x: Math.random() * 100,
        y: Math.random() * 70,
        size: Math.random() * 2.5 + 0.5,
        delay: Math.random() * 4,
        dur: Math.random() * 3 + 2,
      });
    }
    return arr;
  }, []);

  /* ── floating particles (night) ── */
  const particles = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 20; i++) {
      arr.push({
        x: Math.random() * 100,
        size: Math.random() * 3 + 1,
        delay: Math.random() * 12,
        dur: Math.random() * 10 + 10,
        color: ['#00ff88','#00bbff','#aa66ff','#ff66aa'][Math.floor(Math.random()*4)],
      });
    }
    return arr;
  }, []);

  /* ── clouds (day / sunrise) ── */
  const clouds = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 6; i++) {
      arr.push({
        y: 8 + Math.random() * 30,
        w: 120 + Math.random() * 200,
        h: 30 + Math.random() * 40,
        delay: Math.random() * 30,
        dur: 40 + Math.random() * 50,
        opacity: 0.15 + Math.random() * 0.2,
      });
    }
    return arr;
  }, []);

  /* ── city buildings (night skyline) ── */
  const buildings = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 28; i++) {
      const w = 18 + Math.random() * 40;
      const h = 60 + Math.random() * 160;
      arr.push({ x: i * (100 / 28), w, h, windows: Math.floor(h / 20) });
    }
    return arr;
  }, []);

  /* ── pick sky gradient ── */
  let skyGrad = '';
  let skyOpacity = 0.7;
  if (isNight) {
    skyGrad = 'linear-gradient(180deg, #020010 0%, #06061a 25%, #0c1445 50%, #15104a 75%, #1a0a3a 100%)';
    skyOpacity = 0.95;
  } else if (isSunrise) {
    skyGrad = 'linear-gradient(180deg, #0f0a2a 0%, #2a1848 25%, #6a2c5a 50%, #d45a3a 80%, #ff8844 100%)';
    skyOpacity = 0.85;
  } else if (isDay) {
    skyGrad = 'linear-gradient(180deg, #0d2137 0%, #15426e 15%, #1e6da8 35%, #2888c8 55%, #45a5dd 75%, #6abfe8 100%)';
    skyOpacity = 0.9;
  } else {
    skyGrad = 'linear-gradient(180deg, #020010 0%, #0a0e1a 100%)';
    skyOpacity = 0.6;
  }

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>

      {/* ── Sky Gradient ── */}
      <div className="absolute inset-0 transition-all duration-[2000ms]" style={{ background: skyGrad, opacity: skyOpacity }} />

      {/* ════════ NIGHT-ONLY ELEMENTS ════════ */}
      {(isNight || isSunrise) && (
        <>
          {/* Twinkling stars */}
          {stars.map((s, i) => (
            <div
              key={`s${i}`}
              className="absolute rounded-full"
              style={{
                left: `${s.x}%`,
                top: `${s.y}%`,
                width: s.size,
                height: s.size,
                background: '#fff',
                animation: `twinkle ${s.dur}s ${s.delay}s ease-in-out infinite`,
                opacity: isSunrise ? 0.3 : 0.6,
              }}
            />
          ))}
        </>
      )}

      {isNight && (
        <>
          {/* Aurora borealis bands */}
          {[0, 1].map(i => (
            <div
              key={`aurora${i}`}
              className="absolute"
              style={{
                top: `${10 + i * 15}%`,
                left: '-20%',
                width: '140%',
                height: '80px',
                background: i === 0
                  ? 'linear-gradient(90deg, transparent, rgba(0,255,136,0.15), rgba(0,187,255,0.1), transparent)'
                  : 'linear-gradient(90deg, transparent, rgba(170,100,255,0.12), rgba(255,100,170,0.08), transparent)',
                borderRadius: '50%',
                filter: 'blur(30px)',
                animation: `aurora ${18 + i * 6}s ${i * 4}s ease-in-out infinite`,
              }}
            />
          ))}

          {/* Floating particles */}
          {particles.map((p, i) => (
            <div
              key={`p${i}`}
              className="absolute rounded-full"
              style={{
                left: `${p.x}%`,
                bottom: '10%',
                width: p.size,
                height: p.size,
                background: p.color,
                boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
                animation: `float-up ${p.dur}s ${p.delay}s linear infinite`,
                opacity: 0.6,
              }}
            />
          ))}

          {/* Crescent Moon */}
          <div className="absolute" style={{ top: '8%', right: '12%' }}>
            {/* Moon glow */}
            <div
              className="absolute rounded-full"
              style={{
                width: 140,
                height: 140,
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                background: 'radial-gradient(circle, rgba(180,200,255,0.2), transparent 65%)',
              }}
            />
            {/* Moon body */}
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'radial-gradient(circle at 35% 35%, #f0f0ff, #c8c8e0 60%, #a0a0c0)',
                boxShadow: '0 0 30px rgba(180,200,255,0.35), 0 0 60px rgba(140,160,220,0.15)',
              }}
            />
            {/* Crescent shadow */}
            <div
              className="absolute rounded-full"
              style={{
                width: 40,
                height: 48,
                top: 0,
                left: 10,
                background: '#06061a',
                borderRadius: '50%',
              }}
            />
          </div>

          {/* City skyline silhouette — behind fog */}
          <div className="absolute bottom-0 left-0 right-0" style={{ height: '22%', opacity: 0.35 }}>
            {buildings.map((b, i) => (
              <div
                key={`b${i}`}
                className="absolute bottom-0"
                style={{
                  left: `${b.x}%`,
                  width: b.w,
                  height: b.h * 0.7,
                  background: 'linear-gradient(180deg, rgba(8,8,26,0.4), rgba(4,4,16,0.6))',
                  borderRadius: '2px 2px 0 0',
                  filter: 'blur(1.5px)',
                }}
              >
                {Array.from({ length: b.windows }).map((_, wi) => {
                  const lit = Math.random() > 0.55;
                  if (!lit) return null;
                  const col = Math.random() > 0.5 ? 0.3 : 0.65;
                  return (
                    <div
                      key={wi}
                      className="absolute"
                      style={{
                        width: 3,
                        height: 4,
                        left: `${col * 100}%`,
                        bottom: wi * 20 + 8,
                        background: Math.random() > 0.3
                          ? 'rgba(255,220,100,0.5)'
                          : 'rgba(100,180,255,0.35)',
                        borderRadius: 1,
                        boxShadow: '0 0 6px rgba(255,200,80,0.2)',
                        filter: 'blur(0.5px)',
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
          {/* Heavy fog layers over the city */}
          <div
            className="absolute bottom-0 left-0 right-0"
            style={{
              height: '30%',
              background: 'linear-gradient(to top, rgba(6,6,26,0.9) 0%, rgba(10,15,40,0.7) 30%, rgba(15,20,50,0.4) 60%, transparent 100%)',
              backdropFilter: 'blur(2px)',
            }}
          />
          <div
            className="absolute bottom-0 left-0 right-0"
            style={{
              height: '15%',
              background: 'linear-gradient(to top, rgba(12,20,60,0.6), transparent)',
              filter: 'blur(8px)',
            }}
          />
        </>
      )}

      {/* ════════ SUNRISE ELEMENTS ════════ */}
      {isSunrise && (
        <>
          {/* Horizon glow */}
          <div
            className="absolute bottom-0 left-0 right-0"
            style={{
              height: '45%',
              background: 'linear-gradient(to top, rgba(255,100,30,0.25), rgba(255,150,60,0.1), transparent)',
            }}
          />
          {/* Sun rising at horizon */}
          <div
            className="absolute"
            style={{
              bottom: '18%',
              left: '50%',
              transform: 'translateX(-50%)',
            }}
          >
            <div
              className="rounded-full"
              style={{
                width: 60,
                height: 60,
                background: 'radial-gradient(circle at 45% 40%, #fff8e0, #ffd700 40%, #ff8c00 75%)',
                boxShadow: '0 0 60px rgba(255,150,30,0.5), 0 0 120px rgba(255,100,0,0.25)',
                animation: 'pulse-glow 4s ease-in-out infinite',
              }}
            />
          </div>
          {/* A few soft clouds near horizon */}
          {clouds.slice(0, 3).map((c, i) => (
            <div
              key={`sc${i}`}
              className="absolute"
              style={{
                top: `${55 + i * 8}%`,
                left: '-15%',
                width: c.w,
                height: c.h * 0.7,
                background: 'linear-gradient(90deg, transparent, rgba(255,180,120,0.2), rgba(255,150,80,0.15), transparent)',
                borderRadius: '50%',
                filter: 'blur(12px)',
                animation: `drift ${c.dur}s ${c.delay}s linear infinite`,
                opacity: c.opacity,
              }}
            />
          ))}
        </>
      )}

      {/* ════════ DAY ELEMENTS ════════ */}
      {isDay && (
        <>
          {/* Sun with big glow + light rays */}
          <div className="absolute" style={{ top: '5%', right: '15%' }}>
            {/* Outer massive glow */}
            <div
              className="absolute rounded-full"
              style={{
                width: 400,
                height: 400,
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                background: 'radial-gradient(circle, rgba(255,245,200,0.2) 0%, rgba(255,220,120,0.08) 35%, transparent 65%)',
                animation: 'pulse-glow 6s ease-in-out infinite',
              }}
            />
            {/* Mid glow ring */}
            <div
              className="absolute rounded-full"
              style={{
                width: 180,
                height: 180,
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                background: 'radial-gradient(circle, rgba(255,240,180,0.35), rgba(255,200,80,0.1) 50%, transparent 75%)',
              }}
            />
            {/* Sun body */}
            <div
              className="rounded-full"
              style={{
                width: 65,
                height: 65,
                background: 'radial-gradient(circle at 42% 38%, #fffff0, #ffe066 30%, #ffbb33 60%, #ff9900)',
                boxShadow: '0 0 50px rgba(255,220,80,0.7), 0 0 120px rgba(255,180,0,0.35), 0 0 200px rgba(255,150,0,0.15)',
              }}
            />
          </div>

          {/* Diagonal light rays from the sun */}
          <div
            className="absolute"
            style={{
              top: 0,
              right: '10%',
              width: '50%',
              height: '100%',
              background: 'linear-gradient(215deg, rgba(255,240,180,0.06) 0%, transparent 40%)',
              pointerEvents: 'none',
            }}
          />
          <div
            className="absolute"
            style={{
              top: 0,
              right: '20%',
              width: '35%',
              height: '100%',
              background: 'linear-gradient(200deg, rgba(255,220,150,0.04) 0%, transparent 50%)',
              pointerEvents: 'none',
            }}
          />

          {/* Drifting clouds — bigger and fluffier */}
          {clouds.map((c, i) => (
            <div
              key={`dc${i}`}
              className="absolute"
              style={{
                top: `${c.y}%`,
                left: '-20%',
                width: c.w * 1.5,
                height: c.h * 1.3,
                background: `radial-gradient(ellipse, rgba(255,255,255,${c.opacity * 1.2}) 0%, rgba(220,235,255,${c.opacity * 0.6}) 40%, transparent 70%)`,
                borderRadius: '50%',
                filter: 'blur(10px)',
                animation: `drift ${c.dur}s ${c.delay}s linear infinite`,
              }}
            />
          ))}

          {/* Extra small accent clouds */}
          {clouds.slice(0, 3).map((c, i) => (
            <div
              key={`ac${i}`}
              className="absolute"
              style={{
                top: `${45 + i * 12}%`,
                left: '-10%',
                width: c.w * 0.8,
                height: c.h * 0.6,
                background: `radial-gradient(ellipse, rgba(200,230,255,0.12) 0%, transparent 60%)`,
                borderRadius: '50%',
                filter: 'blur(6px)',
                animation: `drift ${c.dur + 15}s ${c.delay + 10}s linear infinite`,
              }}
            />
          ))}

          {/* Bottom atmospheric haze */}
          <div
            className="absolute bottom-0 left-0 right-0"
            style={{
              height: '25%',
              background: 'linear-gradient(to top, rgba(15,50,100,0.15), rgba(30,80,140,0.05) 50%, transparent)',
            }}
          />

          {/* Top-to-bottom subtle vignette */}
          <div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse at 50% 0%, transparent 50%, rgba(8,20,50,0.15) 100%)',
            }}
          />
        </>
      )}
    </div>
  );
}
