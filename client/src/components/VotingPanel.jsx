import React, { useState } from 'react';

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
}) {
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);

  const handleVote = () => {
    if (!selectedTarget) return;
    onCastVote(selectedTarget);
    setHasVoted(true);
  };

  // Players I can vote for (everyone alive except me)
  const targets = alivePlayers.filter(p => p.id !== myId);

  return (
    <div className="cyber-card">
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
            {targets.map(p => {
              const votes = voteTally?.[p.id] || 0;
              const isSelected = selectedTarget === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => { setSelectedTarget(p.id); setHasVoted(false); }}
                  className={`w-full flex items-center justify-between rounded px-3 py-2 text-sm transition-all
                    ${isSelected
                      ? 'bg-cyber-red/20 border border-cyber-red/40 text-cyber-red'
                      : 'bg-cyber-darker border border-transparent hover:border-cyber-border text-gray-300'
                    }
                  `}
                >
                  <span>{p.name}</span>
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
    </div>
  );
}
