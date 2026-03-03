import React, { useMemo } from 'react';
import { PHASES } from '../shared/constants';

/**
 * SkyBackground – Animated sky with sun/moon that moves based on phase.
 * 
 * Night: dark sky with moon and stars
 * Sunrise: gradient horizon with rising sun
 * Day: bright sky with sun high up
 */
export default function SkyBackground({ phase }) {
  // Determine celestial body position and sky state based on phase
  const skyState = useMemo(() => {
    switch (phase) {
      case PHASES.NIGHT:
        return {
          body: 'moon',
          bodyX: 75,      // % from left
          bodyY: 20,      // % from top
          skyGradient: 'from-[#0a0e1a] via-[#0f1629] to-[#1a1040]',
          glowColor: 'rgba(180, 200, 255, 0.15)',
          glowSize: 80,
          bodySize: 40,
          showStars: true,
          opacity: 0.7,
        };
      case PHASES.SUNRISE:
        return {
          body: 'sun',
          bodyX: 50,
          bodyY: 70,      // near horizon
          skyGradient: 'from-[#1a1040] via-[#4a2040] to-[#ff6b35]',
          glowColor: 'rgba(255, 140, 50, 0.3)',
          glowSize: 120,
          bodySize: 50,
          showStars: false,
          opacity: 0.6,
        };
      case PHASES.DAY_DISCUSSION:
        return {
          body: 'sun',
          bodyX: 40,
          bodyY: 15,
          skyGradient: 'from-[#1a2a4a] via-[#2a4a6a] to-[#3a6a8a]',
          glowColor: 'rgba(255, 220, 100, 0.2)',
          glowSize: 100,
          bodySize: 45,
          showStars: false,
          opacity: 0.4,
        };
      case PHASES.DAY_VOTING:
        return {
          body: 'sun',
          bodyX: 55,
          bodyY: 20,
          skyGradient: 'from-[#1a2a4a] via-[#2a4a6a] to-[#3a6a8a]',
          glowColor: 'rgba(255, 220, 100, 0.2)',
          glowSize: 100,
          bodySize: 45,
          showStars: false,
          opacity: 0.4,
        };
      case PHASES.DAY_DEFENSE:
        return {
          body: 'sun',
          bodyX: 65,
          bodyY: 30,
          skyGradient: 'from-[#1a2a4a] via-[#3a4a5a] to-[#5a3a2a]',
          glowColor: 'rgba(255, 180, 80, 0.2)',
          glowSize: 90,
          bodySize: 45,
          showStars: false,
          opacity: 0.45,
        };
      default:
        return {
          body: 'none',
          bodyX: 50,
          bodyY: 50,
          skyGradient: 'from-[#0a0e1a] to-[#1a1a2e]',
          glowColor: 'transparent',
          glowSize: 0,
          bodySize: 0,
          showStars: false,
          opacity: 0.3,
        };
    }
  }, [phase]);

  // Generate random stars (static between renders of same phase)
  const stars = useMemo(() => {
    if (!skyState.showStars) return [];
    const result = [];
    for (let i = 0; i < 50; i++) {
      result.push({
        x: Math.random() * 100,
        y: Math.random() * 60,
        size: Math.random() * 2 + 0.5,
        delay: Math.random() * 3,
        duration: Math.random() * 2 + 1.5,
      });
    }
    return result;
  }, [skyState.showStars]);

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 0 }}
    >
      {/* Sky gradient overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-b ${skyState.skyGradient} transition-all duration-[3000ms] ease-in-out`}
        style={{ opacity: skyState.opacity }}
      />

      {/* Stars */}
      {stars.map((star, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white animate-pulse"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            animationDelay: `${star.delay}s`,
            animationDuration: `${star.duration}s`,
            opacity: 0.6,
          }}
        />
      ))}

      {/* Celestial body container with smooth transition */}
      {skyState.body !== 'none' && (
        <div
          className="absolute transition-all duration-[3000ms] ease-in-out"
          style={{
            left: `${skyState.bodyX}%`,
            top: `${skyState.bodyY}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {/* Outer glow */}
          <div
            className="absolute rounded-full transition-all duration-[3000ms] ease-in-out"
            style={{
              width: `${skyState.glowSize}px`,
              height: `${skyState.glowSize}px`,
              background: `radial-gradient(circle, ${skyState.glowColor}, transparent 70%)`,
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          />

          {/* The celestial body */}
          {skyState.body === 'moon' ? (
            /* Moon */
            <div
              className="relative transition-all duration-[3000ms] ease-in-out"
              style={{
                width: `${skyState.bodySize}px`,
                height: `${skyState.bodySize}px`,
              }}
            >
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'radial-gradient(circle at 40% 40%, #e8e8f0, #c0c0d0 50%, #a0a0b8)',
                  boxShadow: '0 0 20px rgba(180, 200, 255, 0.3), inset -5px -3px 10px rgba(0,0,0,0.15)',
                }}
              />
              {/* Moon craters */}
              <div
                className="absolute rounded-full"
                style={{
                  width: '8px',
                  height: '8px',
                  top: '30%',
                  left: '25%',
                  background: 'rgba(0,0,0,0.08)',
                  borderRadius: '50%',
                }}
              />
              <div
                className="absolute rounded-full"
                style={{
                  width: '5px',
                  height: '5px',
                  top: '55%',
                  left: '55%',
                  background: 'rgba(0,0,0,0.06)',
                  borderRadius: '50%',
                }}
              />
              <div
                className="absolute rounded-full"
                style={{
                  width: '6px',
                  height: '6px',
                  top: '20%',
                  left: '60%',
                  background: 'rgba(0,0,0,0.07)',
                  borderRadius: '50%',
                }}
              />
            </div>
          ) : (
            /* Sun */
            <div
              className="relative transition-all duration-[3000ms] ease-in-out"
              style={{
                width: `${skyState.bodySize}px`,
                height: `${skyState.bodySize}px`,
              }}
            >
              {/* Sun rays - rotating */}
              <div
                className="absolute inset-[-50%] animate-spin"
                style={{
                  animationDuration: '30s',
                }}
              >
                {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
                  <div
                    key={angle}
                    className="absolute"
                    style={{
                      width: '2px',
                      height: '100%',
                      left: '50%',
                      top: '0',
                      transform: `translateX(-50%) rotate(${angle}deg)`,
                      background: `linear-gradient(to bottom, transparent 10%, rgba(255,200,50,0.15) 30%, transparent 50%, rgba(255,200,50,0.15) 70%, transparent 90%)`,
                    }}
                  />
                ))}
              </div>
              {/* Sun body */}
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'radial-gradient(circle at 45% 40%, #fff8e0, #ffd700 40%, #ff8c00 80%, #ff6b00)',
                  boxShadow: '0 0 30px rgba(255, 200, 50, 0.4), 0 0 60px rgba(255, 150, 0, 0.2)',
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* Horizon line for sunrise */}
      {phase === PHASES.SUNRISE && (
        <div
          className="absolute bottom-0 left-0 right-0 transition-all duration-[3000ms]"
          style={{
            height: '30%',
            background: 'linear-gradient(to top, rgba(255,100,30,0.15), transparent)',
          }}
        />
      )}
    </div>
  );
}
