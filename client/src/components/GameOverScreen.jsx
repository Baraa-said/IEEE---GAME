import React from 'react';
import { Bug, Shield, Code2, Wrench, Search, Skull, HelpCircle } from 'lucide-react';

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
        {/* Logo */}
        <img src="/logo.svg" alt="IEEE Code Wars" className="h-12 mx-auto mb-4 opacity-60" />

        {/* Winner banner */}
        <div className={`mb-6 py-6 rounded-lg animate-bounce-in ${
          isHackerWin
            ? 'bg-cyber-red/10 border border-cyber-red/30'
            : 'bg-cyber-green/10 border border-cyber-green/30'
        }`}>
          <p className="text-5xl mb-3 animate-scale-in animate-float flex justify-center">{isHackerWin ? <Bug size={48} /> : <Shield size={48} />}</p>
          <h1 className={`text-2xl font-bold animate-glow-pulse ${
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
            {players.map((p, i) => {
              const roleIcons = {
                Developer: Code2,
                Hacker: Bug,
                'Security Lead': Search,
                Admin: Wrench,
              };
              const isMe = p.id === myId;
              return (
                <div
                  key={p.id}
                  className={`flex items-center justify-between rounded px-3 py-2 text-sm animate-slide-left
                    ${isMe ? 'bg-cyber-green/10 border border-cyber-green/20' : 'bg-cyber-darker'}
                  `}
                  style={{ animationDelay: `${i * 90 + 300}ms`, animationFillMode: 'both' }}
                >
                  <span className="flex items-center gap-2">
                    {(() => { const Icon = roleIcons[p.role] || HelpCircle; return <Icon size={14} />; })()}
                    <span className={`${!p.alive ? 'line-through text-gray-500' : 'text-gray-300'}`}>
                      {p.name}
                    </span>
                    {isMe && <span className="text-[10px] text-cyber-green/60">(you)</span>}
                  </span>
                  <span className={`text-xs font-semibold ${
                    p.role === 'Hacker' ? 'text-cyber-red' : 'text-cyber-blue'
                  }`}>
                    {p.role}
                    {!p.alive && <Skull size={12} className="inline ml-1" />}
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
