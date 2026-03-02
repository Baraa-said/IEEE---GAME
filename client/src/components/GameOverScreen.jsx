import React from 'react';

/**
 * GameOverScreen – Shown when the game ends.
 * Reveals all roles and announces the winners.
 */
export default function GameOverScreen({ data, myId }) {
  const { winner, reason, players } = data;
  const isHackerWin = winner === 'hackers';

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="cyber-card max-w-lg w-full animate-fade-in text-center">
        {/* Winner banner */}
        <div className={`mb-6 py-6 rounded-lg ${
          isHackerWin
            ? 'bg-cyber-red/10 border border-cyber-red/30'
            : 'bg-cyber-green/10 border border-cyber-green/30'
        }`}>
          <p className="text-5xl mb-3">{isHackerWin ? '🕷️' : '🛡️'}</p>
          <h1 className={`text-2xl font-bold ${
            isHackerWin ? 'text-cyber-red neon-text-red' : 'text-cyber-green neon-text-green'
          }`}>
            {isHackerWin ? 'HACKERS WIN!' : 'DEVELOPERS WIN!'}
          </h1>
          <p className="text-gray-400 text-sm mt-2 px-4">{reason}</p>
        </div>

        {/* All players revealed */}
        <div className="mb-6">
          <h3 className="text-xs uppercase tracking-wider text-gray-400 mb-3 font-bold">
            All Players Revealed
          </h3>
          <div className="space-y-1.5">
            {players.map(p => {
              const roleIcons = {
                Developer: '👨‍💻',
                Hacker: '🕷️',
                'Security Lead': '🔍',
                Admin: '🛠️',
              };
              const isMe = p.id === myId;
              return (
                <div
                  key={p.id}
                  className={`flex items-center justify-between rounded px-3 py-2 text-sm
                    ${isMe ? 'bg-cyber-green/10 border border-cyber-green/20' : 'bg-cyber-darker'}
                  `}
                >
                  <span className="flex items-center gap-2">
                    <span>{roleIcons[p.role] || '❓'}</span>
                    <span className={`${!p.alive ? 'line-through text-gray-500' : 'text-gray-300'}`}>
                      {p.name}
                    </span>
                    {isMe && <span className="text-[10px] text-cyber-green/60">(you)</span>}
                  </span>
                  <span className={`text-xs font-semibold ${
                    p.role === 'Hacker' ? 'text-cyber-red' : 'text-cyber-blue'
                  }`}>
                    {p.role}
                    {!p.alive && ' ☠️'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Play again hint */}
        <p className="text-gray-500 text-xs">
          Refresh the page to start a new game.
        </p>
      </div>
    </div>
  );
}
