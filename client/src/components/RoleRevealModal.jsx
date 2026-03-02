import React from 'react';
import { ROLES } from '../shared/constants';

/**
 * RoleRevealModal – Full-screen overlay that reveals the player's role
 * at the start of the game.
 */
export default function RoleRevealModal({ role, description, fellowHackers, onClose }) {
  const roleConfig = {
    [ROLES.DEVELOPER]: { icon: '👨‍💻', color: 'text-cyber-blue', glow: 'neon-text-green', border: 'border-cyber-blue/40' },
    [ROLES.HACKER]: { icon: '🕷️', color: 'text-cyber-red', glow: 'neon-text-red', border: 'border-cyber-red/40' },
    [ROLES.SECURITY_LEAD]: { icon: '🔍', color: 'text-cyber-yellow', glow: '', border: 'border-cyber-yellow/40' },
    [ROLES.ADMIN]: { icon: '🛠️', color: 'text-cyber-green', glow: 'neon-text-green', border: 'border-cyber-green/40' },
  };

  const config = roleConfig[role] || roleConfig[ROLES.DEVELOPER];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className={`cyber-card max-w-sm w-full mx-4 border-2 ${config.border} animate-slide-up`}>
        {/* Role Icon */}
        <div className="text-center mb-4">
          <span className="text-6xl">{config.icon}</span>
        </div>

        {/* Role Name */}
        <h2 className={`text-2xl font-bold text-center ${config.color} ${config.glow} mb-3`}>
          {role}
        </h2>

        {/* Description */}
        <p className="text-gray-300 text-sm text-center leading-relaxed mb-4">
          {description}
        </p>

        {/* Fellow Hackers (only shown to hackers) */}
        {role === ROLES.HACKER && fellowHackers.length > 0 && (
          <div className="bg-cyber-red/10 border border-cyber-red/20 rounded p-3 mb-4">
            <p className="text-xs text-cyber-red uppercase tracking-wider mb-2">Fellow Hackers</p>
            <div className="space-y-1">
              {fellowHackers.map(h => (
                <p key={h.id} className="text-sm text-gray-300">🕷️ {h.name}</p>
              ))}
            </div>
          </div>
        )}

        {/* Close */}
        <button onClick={onClose} className="cyber-btn-green w-full">
          I Understand My Role
        </button>
      </div>
    </div>
  );
}
