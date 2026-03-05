import React, { useState, useEffect, useRef } from 'react';
import { PHASES } from '../shared/constants';
import { playTick } from '../utils/sounds';
import { Sun, Vote, Shield, Moon, Sunrise, Flag } from 'lucide-react';

/**
 * PhaseIndicator – Displays the current phase, sprint number, and countdown timer.
 */
export default function PhaseIndicator({ phase, sprint, systemStability, advancedMode, message, phaseEndTime }) {
  const [timeLeft, setTimeLeft] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!phaseEndTime) { setTimeLeft(0); return; }

    const update = () => {
      const remaining = Math.max(0, Math.ceil((phaseEndTime - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining > 0 && remaining <= 10) {
        try { playTick(); } catch(e) {}
      }
    };
    update();
    intervalRef.current = setInterval(update, 1000);
    return () => clearInterval(intervalRef.current);
  }, [phaseEndTime]);

  const phaseDisplay = {
    [PHASES.DAY_DISCUSSION]: { label: 'STANDUP MEETING', icon: Sun, color: 'text-cyber-yellow', bg: 'bg-cyber-yellow/10', border: 'border-cyber-yellow/30' },
    [PHASES.DAY_VOTING]: { label: 'VOTING', icon: Vote, color: 'text-cyber-blue', bg: 'bg-cyber-blue/10', border: 'border-cyber-blue/30' },
    [PHASES.DAY_DEFENSE]: { label: 'DEFENSE', icon: Shield, color: 'text-cyber-purple', bg: 'bg-cyber-purple/10', border: 'border-cyber-purple/30' },
    [PHASES.NIGHT]: { label: 'NIGHT OPS', icon: Moon, color: 'text-cyber-red', bg: 'bg-cyber-red/10', border: 'border-cyber-red/30' },
    [PHASES.SUNRISE]: { label: 'SUNRISE', icon: Sunrise, color: 'text-orange-400', bg: 'bg-orange-900/10', border: 'border-orange-500/30' },
    [PHASES.GAME_OVER]: { label: 'GAME OVER', icon: Flag, color: 'text-white', bg: 'bg-gray-800', border: 'border-gray-600' },
  };

  const config = phaseDisplay[phase] || { label: phase, icon: null, color: 'text-gray-400', bg: 'bg-gray-800', border: 'border-gray-600' };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const isUrgent = timeLeft > 0 && timeLeft <= 10;

  return (
    <div className={`bg-[#0b1117] border ${config.border} rounded-lg p-3 mb-5`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-xs uppercase tracking-wider ${config.color} font-bold flex items-center gap-1.5`}>
            {config.icon && <config.icon size={14} />}
            {config.label}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            Sprint {sprint || 1}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {phaseEndTime && timeLeft > 0 && (
            <div className={`text-lg font-mono font-bold ${
              isUrgent ? 'text-cyber-red animate-pulse' : config.color
            }`}>
              {formatTime(timeLeft)}
            </div>
          )}
          {advancedMode && (
            <div className="text-right">
              <p className="text-xs text-gray-400">Stability</p>
              <div className="flex gap-1 mt-1">
                {[1, 2, 3].map(i => (
                  <div
                    key={i}
                    className={`w-4 h-4 rounded-sm ${
                      i <= (systemStability ?? 3)
                        ? 'bg-cyber-green shadow-[0_0_6px_rgba(0,255,136,0.5)]'
                        : 'bg-gray-700'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      {message && (
        <p className="text-xs text-gray-400 mt-2 italic">{message}</p>
      )}
    </div>
  );
}
