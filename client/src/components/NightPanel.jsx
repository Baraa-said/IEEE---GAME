import React, { useState } from 'react';
import { ROLES, PHASES } from '../shared/constants';

/**
 * NightPanel – Night action UI for Hackers, Security Lead, and Admin.
 * Developers see a "waiting" message.
 */
export default function NightPanel({
  myRole,
  myId,
  alivePlayers,
  onNightAction,
  investigationResult,
  fellowHackers,
  amAlive,
}) {
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!selectedTarget) return;
    onNightAction(selectedTarget);
    setSubmitted(true);
  };

  // What targets can this role pick?
  const getTargets = () => {
    switch (myRole) {
      case ROLES.HACKER:
        // Can target anyone alive who is NOT a hacker
        return alivePlayers.filter(p => !fellowHackers.find(h => h.id === p.id) && p.id !== myId);
      case ROLES.SECURITY_LEAD:
        // Can investigate anyone alive except self
        return alivePlayers.filter(p => p.id !== myId);
      case ROLES.ADMIN:
        // Can protect anyone alive (including self)
        return alivePlayers;
      default:
        return [];
    }
  };

  const targets = getTargets();

  const roleActionLabel = {
    [ROLES.HACKER]: { action: 'Inject Critical Bug', icon: '🕷️', color: 'cyber-red' },
    [ROLES.SECURITY_LEAD]: { action: 'Investigate Player', icon: '🔍', color: 'cyber-yellow' },
    [ROLES.ADMIN]: { action: 'Debug (Protect) Player', icon: '🛠️', color: 'cyber-green' },
    [ROLES.DEVELOPER]: { action: 'Sleep', icon: '💤', color: 'gray-400' },
  };

  const config = roleActionLabel[myRole] || roleActionLabel[ROLES.DEVELOPER];

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

      {/* Investigation result from previous night */}
      {myRole === ROLES.SECURITY_LEAD && investigationResult && (
        <div className={`mb-3 p-2 rounded text-xs ${
          investigationResult.isHacker
            ? 'bg-cyber-red/10 border border-cyber-red/30 text-cyber-red'
            : 'bg-cyber-green/10 border border-cyber-green/30 text-cyber-green'
        }`}>
          Last investigation: <strong>{investigationResult.targetName}</strong> is{' '}
          {investigationResult.isHacker ? '🕷️ a HACKER!' : '✅ NOT a Hacker.'}
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
