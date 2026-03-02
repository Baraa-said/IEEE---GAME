import React from 'react';
import { ROLES } from '../shared/constants';
import { getAvatarForPlayer, getAvatarForRole } from '../utils/avatars';

/**
 * PlayerList – Displays alive / dead players with role badges for dead ones.
 */
export default function PlayerList({ alivePlayers, deadPlayers, myId, defenders, voteTally }) {
  const roleIcons = {
    [ROLES.DEVELOPER]: '👨‍💻',
    [ROLES.HACKER]: '🕷️',
    [ROLES.SECURITY_LEAD]: '🔍',
    [ROLES.ADMIN]: '🛠️',
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
                {p.isHost && <span className="text-[10px]">👑</span>}
                {isMe && <span className="text-[10px] text-cyber-green/60">(you)</span>}
              </span>
              {voteCount > 0 && (
                <span className="text-xs text-cyber-red font-bold">{voteCount} votes</span>
              )}
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
