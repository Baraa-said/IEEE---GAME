import React, { useState, useEffect } from 'react';
import { ROLES } from '../shared/constants';

/**
 * NightPanel – Night action UI for Hackers, Security Lead, and Admin.
 * - Security Lead can investigate 2 players
 * - Hackers must agree unanimously (shows vote status)
 * - Developers see a "waiting" message
 */
export default function NightPanel({
  myRole,
  myId,
  alivePlayers,
  onNightAction,
  investigationResult,
  fellowHackers,
  amAlive,
  hackerVoteStatus,
}) {
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  // Reset on hacker vote disagreement
  useEffect(() => {
    if (hackerVoteStatus?.disagreement) {
      setSubmitted(false);
      setSelectedTarget(null);
    }
  }, [hackerVoteStatus]);

  const handleSubmit = () => {
    if (!selectedTarget) return;
    onNightAction(selectedTarget);
    setSubmitted(true);
  };

  // What targets can this role pick?
  const getTargets = () => {
    switch (myRole) {
      case ROLES.HACKER:
        return alivePlayers.filter(p => !fellowHackers.find(h => h.id === p.id) && p.id !== myId);
      case ROLES.SECURITY_LEAD:
        // Exclude self only
        return alivePlayers.filter(p => p.id !== myId);
      case ROLES.ADMIN:
        return alivePlayers;
      default:
        return [];
    }
  };

  const targets = getTargets();

  const getActionLabel = () => {
    if (myRole === ROLES.SECURITY_LEAD) {
      return {
        action: 'Investigate Player',
        icon: '🔍',
        color: 'cyber-yellow',
      };
    }
    const labels = {
      [ROLES.HACKER]: { action: 'Inject Critical Bug', icon: '🕷️', color: 'cyber-red' },
      [ROLES.ADMIN]: { action: 'Debug (Protect) Player', icon: '🛠️', color: 'cyber-green' },
      [ROLES.DEVELOPER]: { action: 'Sleep', icon: '💤', color: 'gray-400' },
    };
    return labels[myRole] || labels[ROLES.DEVELOPER];
  };

  const config = getActionLabel();

  if (!amAlive) {
    return (
      <div className="cyber-card text-center">
        <p className="text-gray-500 text-sm py-4">
          ☠️ You have been eliminated. Watch the night unfold…
        </p>
      </div>
    );
  }

  // Developer has no night action
  if (myRole === ROLES.DEVELOPER) {
    return (
      <div className="cyber-card text-center">
        <p className="text-6xl mb-3">💤</p>
        <p className="text-gray-400 text-sm">
          You are a Developer. Rest while the night passes…
        </p>
        <p className="text-gray-600 text-xs mt-2">
          Hope the Admin protects you!
        </p>
      </div>
    );
  }

  return (
    <div className="cyber-card">
      <h3 className={`text-xs uppercase tracking-wider text-${config.color} font-bold mb-3`}>
        {config.icon} {config.action}
      </h3>

      {/* Investigation results from previous night (array format) */}
      {myRole === ROLES.SECURITY_LEAD && investigationResult && Array.isArray(investigationResult) && investigationResult.length > 0 && (
        <div className="mb-3 space-y-1">
          {investigationResult.map((res, i) => (
            <div key={i} className={`p-2 rounded text-xs ${
              res.isHacker
                ? 'bg-cyber-red/10 border border-cyber-red/30 text-cyber-red'
                : 'bg-cyber-green/10 border border-cyber-green/30 text-cyber-green'
            }`}>
              Investigation: <strong>{res.targetName}</strong> is{' '}
              {res.isHacker ? '🕷️ a HACKER!' : '✅ NOT a Hacker.'}
            </div>
          ))}
        </div>
      )}

      {/* Legacy single investigation result support */}
      {myRole === ROLES.SECURITY_LEAD && investigationResult && !Array.isArray(investigationResult) && (
        <div className={`mb-3 p-2 rounded text-xs ${
          investigationResult.isHacker
            ? 'bg-cyber-red/10 border border-cyber-red/30 text-cyber-red'
            : 'bg-cyber-green/10 border border-cyber-green/30 text-cyber-green'
        }`}>
          Last investigation: <strong>{investigationResult.targetName}</strong> is{' '}
          {investigationResult.isHacker ? '🕷️ a HACKER!' : '✅ NOT a Hacker.'}
        </div>
      )}
      {myRole === ROLES.HACKER && hackerVoteStatus && (
        <div className={`mb-3 p-2 rounded text-xs border ${
          hackerVoteStatus.disagreement
            ? 'bg-cyber-red/10 border-cyber-red/30'
            : 'bg-cyber-darker border-cyber-red/20'
        }`}>
          {hackerVoteStatus.disagreement && (
            <p className="text-cyber-red font-bold mb-1">⚠️ You must ALL agree on the same target! Votes reset.</p>
          )}
          {Object.values(hackerVoteStatus.votes || {}).map((v, i) => (
            <p key={i} className="text-gray-400">
              🕷️ {v.hackerName} → <span className="text-cyber-red">{v.targetName}</span>
            </p>
          ))}
          {!hackerVoteStatus.disagreement && (
            <p className="text-gray-500 mt-1 text-[10px]">
              {hackerVoteStatus.allVoted
                ? '✓ All hackers voted'
                : `${Object.keys(hackerVoteStatus.votes || {}).length}/${hackerVoteStatus.totalHackers} hackers voted`}
            </p>
          )}
        </div>
      )}

      {submitted ? (
        <div className="text-center py-4">
          <p className="text-cyber-green text-sm">✓ Action submitted. Waiting for others…</p>
        </div>
      ) : (
        <>
          <div className="space-y-1.5 mb-3 max-h-48 overflow-y-auto">
            {targets.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedTarget(p.id)}
                className={`w-full flex items-center justify-between rounded px-3 py-2 text-sm transition-all
                  ${selectedTarget === p.id
                    ? `bg-${config.color}/20 border border-${config.color}/40 text-${config.color}`
                    : 'bg-cyber-darker border border-transparent hover:border-cyber-border text-gray-300'
                  }
                `}
              >
                <span>{p.name}</span>
              </button>
            ))}
          </div>

          <button
            onClick={handleSubmit}
            disabled={!selectedTarget}
            className={`w-full cyber-btn ${
              myRole === ROLES.HACKER ? 'cyber-btn-red' :
              myRole === ROLES.ADMIN ? 'cyber-btn-green' :
              'cyber-btn-blue'
            }`}
          >
            Confirm {config.action}
          </button>
        </>
      )}
    </div>
  );
}
