import React from 'react';
import { PHASES } from '../shared/constants';

/**
 * PhaseIndicator – Displays the current phase, sprint number, and timer.
 */
export default function PhaseIndicator({ phase, sprint, systemStability, advancedMode, message }) {
  const phaseDisplay = {
    [PHASES.DAY_DISCUSSION]: { label: '☀️ STANDUP MEETING', color: 'text-cyber-yellow', bg: 'bg-cyber-yellow/10', border: 'border-cyber-yellow/30' },
    [PHASES.DAY_VOTING]: { label: '🗳️ VOTING', color: 'text-cyber-blue', bg: 'bg-cyber-blue/10', border: 'border-cyber-blue/30' },
    [PHASES.DAY_DEFENSE]: { label: '🛡️ DEFENSE', color: 'text-cyber-purple', bg: 'bg-cyber-purple/10', border: 'border-cyber-purple/30' },
    [PHASES.NIGHT]: { label: '🌙 NIGHT OPS', color: 'text-cyber-red', bg: 'bg-cyber-red/10', border: 'border-cyber-red/30' },
    [PHASES.GAME_OVER]: { label: '🏁 GAME OVER', color: 'text-white', bg: 'bg-gray-800', border: 'border-gray-600' },
  };

  const config = phaseDisplay[phase] || { label: phase, color: 'text-gray-400', bg: 'bg-gray-800', border: 'border-gray-600' };

  return (
    <div className={`${config.bg} border ${config.border} rounded-lg p-3 mb-4`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-xs uppercase tracking-wider ${config.color} font-bold`}>
            {config.label}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            Sprint {sprint || 1}
          </p>
        </div>
        {advancedMode && (
          <div className="text-right">
            <p className="text-xs text-gray-400">System Stability</p>
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
      {message && (
        <p className="text-xs text-gray-400 mt-2 italic">{message}</p>
      )}
    </div>
  );
}
