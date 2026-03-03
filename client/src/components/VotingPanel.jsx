import React, { useState } from 'react';
import { getAvatarForPlayer } from '../utils/avatars';
import { playVoteCast, playClick } from '../utils/sounds';

/**
 * VotingPanel – UI for casting votes during the Day voting phase.
 */
export default function VotingPanel({
  alivePlayers,
  myId,
  voteTally,
  votesCast,
  totalVoters,
  onCastVote,
  amAlive,
  individualVotes = {},
}) {
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);

  const handleVote = () => {
    if (!selectedTarget) return;
    onCastVote(selectedTarget);
    setHasVoted(true);
    try { playVoteCast(); } catch(_) {}
  };

  // Players I can vote for (everyone alive except me)
  const targets = alivePlayers.filter(p => p.id !== myId);

  return (
    <div className="cyber-card animate-slide-up">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs uppercase tracking-wider text-cyber-blue font-bold">
          🗳️ Vote to Suspend Account
        </h3>
        <span className="text-xs text-gray-400">
          {votesCast}/{totalVoters} voted
        </span>
      </div>

      {!amAlive ? (
        <p className="text-gray-500 text-sm text-center py-4">
          You have been eliminated and cannot vote.
        </p>
      ) : (
        <>
          <div className="space-y-1.5 mb-3 max-h-48 overflow-y-auto">
            {targets.map((p, i) => {
              const votes = voteTally?.[p.id] || 0;
              const isSelected = selectedTarget === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => { setSelectedTarget(p.id); setHasVoted(false); try { playClick(); } catch(_) {} }}
                  className={`w-full flex items-center justify-between rounded px-3 py-2 text-sm transition-all animate-slide-right
                    ${isSelected
                      ? 'bg-cyber-red/20 border border-cyber-red/40 text-cyber-red'
                      : 'bg-cyber-darker border border-transparent hover:border-cyber-border text-gray-300'
                    }
                  `}
                  style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'both' }}
                >
                  <div className="flex items-center gap-3">
                    <img src={getAvatarForPlayer(p.name)} alt={p.name} className="w-8 h-8 rounded-full bg-black/40" />
                    <span>{p.name}</span>
                  </div>
                  {votes > 0 && (
                    <span className="text-xs text-cyber-red font-bold">
                      {votes} vote{votes > 1 ? 's' : ''}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <button
            onClick={handleVote}
            disabled={!selectedTarget}
            className="cyber-btn-red w-full"
          >
            {hasVoted ? '✓ Vote Submitted (click to change)' : 'Cast Vote'}
          </button>
        </>
      )}

      {/* Individual vote mapping */}
      {Object.keys(individualVotes).length > 0 && (
        <div className="mt-3 border-t border-cyber-border pt-2">
          <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1.5">
            Who Voted for Whom
          </p>
          <div className="space-y-0.5 max-h-32 overflow-y-auto">
            {Object.entries(individualVotes).map(([voterId, { voterName, targetName }]) => (
              <div key={voterId} className="text-xs flex items-center gap-1">
                <span className={`font-semibold ${voterId === myId ? 'text-cyber-green' : 'text-cyber-blue'}`}>
                  {voterName}
                </span>
                <span className="text-gray-600">→</span>
                <span className="text-cyber-red font-semibold">{targetName}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
