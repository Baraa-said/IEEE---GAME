import React from 'react';
import { ROLES } from '../shared/constants';
import { getAvatarForRole } from '../utils/avatars';
import { getTheme } from '../utils/themes';

/**
 * RoleRevealModal – Full-screen overlay that reveals the player's role
 * at the start of the game with role-themed visuals.
 */
export default function RoleRevealModal({ role, description, fellowHackers, onClose }) {
  const theme = getTheme(role);

  const borderMap = {
    [ROLES.DEVELOPER]: 'border-cyber-blue/40',
    [ROLES.HACKER]: 'border-cyber-red/40',
    [ROLES.SECURITY_LEAD]: 'border-cyber-yellow/40',
    [ROLES.ADMIN]: 'border-cyber-green/40',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className={`cyber-card max-w-sm w-full mx-4 border-2 ${borderMap[role] || borderMap[ROLES.DEVELOPER]} animate-slide-up`}
        style={{ boxShadow: `0 0 60px ${theme.primary}15, inset 0 0 60px ${theme.primary}08` }}
      >
        {/* Role-themed top stripe */}
        <div className="h-1 rounded-full mb-6 mx-8" style={{ background: `linear-gradient(90deg, transparent, ${theme.primary}, transparent)` }} />

        {/* Role Avatar */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <img src={getAvatarForRole(role)} alt={role} className="w-32 h-32 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" />
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-2xl">{theme.icon}</div>
          </div>
        </div>

        {/* Role Name */}
        <h2 className={`text-2xl font-bold text-center ${theme.titleColor} ${theme.titleGlow} mb-1 uppercase tracking-widest`}>
          {role.replace('_', ' ')}
        </h2>
        <p className={`text-xs text-center ${theme.subtitleColor} mb-4 tracking-wider`}>
          {role === ROLES.HACKER ? 'Infiltrate & Corrupt' :
           role === ROLES.ADMIN ? 'Protect & Repair' :
           role === ROLES.SECURITY_LEAD ? 'Investigate & Expose' :
           'Build & Survive'}
        </p>

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
        <button onClick={onClose} className={`${theme.btnClass} w-full`}>
          I Understand My Role
        </button>
      </div>
    </div>
  );
}
