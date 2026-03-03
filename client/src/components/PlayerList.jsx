import React from 'react';
import { ROLES } from '../shared/constants';
import { getAvatarForPlayer, getAvatarForRole } from '../utils/avatars';
import { Bug, Wrench, Search, Code2, Crown } from 'lucide-react';

/**
 * PlayerList – Displays alive / dead players with role badges.
 * Shows your own role, and if you're a Hacker, highlights fellow hackers.
 */
export default function PlayerList({ alivePlayers, deadPlayers, myId, myRole, fellowHackers, defenders, voteTally }) {
  const roleIcons = {
    [ROLES.DEVELOPER]: Code2,
    [ROLES.HACKER]: Bug,
    [ROLES.SECURITY_LEAD]: Search,
    [ROLES.ADMIN]: Wrench,
  };

  const roleColors = {
    [ROLES.DEVELOPER]: 'text-blue-400',
    [ROLES.HACKER]: 'text-cyber-red',
    [ROLES.SECURITY_LEAD]: 'text-cyan-400',
    [ROLES.ADMIN]: 'text-yellow-400',
  };

  // Build set of fellow hacker IDs for quick lookup
  const hackerIds = new Set((fellowHackers || []).map(h => h.id || h));
  const iAmHacker = myRole === ROLES.HACKER;

  // Determine visible role for a player
  const getVisibleRole = (player) => {
    if (player.id === myId) return myRole; // Always see own role
    if (iAmHacker && hackerIds.has(player.id)) return ROLES.HACKER; // Hackers see each other
    return null; // Unknown
  };

  const RoleBadge = ({ role }) => {
    if (!role) return null;
    const Icon = roleIcons[role];
    const color = roleColors[role] || 'text-gray-400';
    return (
      <span className={`flex items-center gap-0.5 text-[10px] ${color} bg-black/30 rounded px-1 py-0.5`}>
        {Icon && <Icon size={10} />}
        <span className="capitalize">{role}</span>
      </span>
    );
  };

  return (
    <div className="cyber-card">
      <h3 className="text-xs uppercase tracking-wider text-gray-400 mb-3 font-bold">
        Players
      </h3>

      {/* Alive */}
      <div className="space-y-1.5 mb-4">
        <p className="text-[10px] uppercase tracking-widest text-cyber-green/70">
          Alive ({alivePlayers.length})
        </p>
        {alivePlayers.map(p => {
          const isMe = p.id === myId;
          const isDefender = defenders?.includes(p.id);
          const voteCount = voteTally?.[p.id] || 0;
          const visibleRole = getVisibleRole(p);
          return (
            <div
              key={p.id}
              className={`flex items-center justify-between rounded px-2 py-1.5 text-sm
                ${isMe ? 'bg-cyber-green/10 border border-cyber-green/20' : 'bg-cyber-darker'}
                ${isDefender ? 'ring-1 ring-cyber-yellow/50' : ''}
              `}
            >
              <span className="flex items-center gap-1.5">
                <img src={getAvatarForPlayer(p.name)} alt={p.name} className="w-6 h-6 rounded-full bg-black/40" />
                <span className={isMe ? 'text-cyber-green font-semibold' : 'text-gray-300'}>
                  {p.name}
                </span>
                {p.isHost && <span className="text-[10px]"><Crown size={12} /></span>}
                {isMe && <span className="text-[10px] text-cyber-green/60">(you)</span>}
              </span>
              <span className="flex items-center gap-1.5">
                {visibleRole && <RoleBadge role={visibleRole} />}
                {voteCount > 0 && (
                  <span className="text-xs text-cyber-red font-bold">{voteCount} votes</span>
                )}
              </span>
            </div>
          );
        })}
      </div>

      {/* Dead */}
      {deadPlayers.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] uppercase tracking-widest text-cyber-red/70">
            Eliminated ({deadPlayers.length})
          </p>
          {deadPlayers.map(p => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded px-2 py-1.5 text-sm bg-cyber-darker opacity-50"
            >
              <div className="flex items-center gap-1.5">
                <img src={getAvatarForPlayer(p.name)} alt={p.name} className="w-5 h-5 rounded-full grayscale opacity-50 bg-black/40" />
                <span className="text-gray-500 line-through">{p.name}</span>
              </div>
              {p.role && (
                <div className="flex items-center gap-1">
                  <img src={getAvatarForRole(p.role)} alt={p.role} className="w-4 h-4 rounded-full" />
                  <span className="text-[10px] text-gray-400 capitalize">{p.role.replace('_', ' ')}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
