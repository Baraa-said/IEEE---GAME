import React, { useState, useEffect } from 'react';
import { ROLES } from '../shared/constants';
import { getAvatarForPlayer } from '../utils/avatars';
import { Search, Bug, Wrench, Moon, Skull, CheckCircle, AlertTriangle, Crosshair } from 'lucide-react';

/**
 * NightPanel – Night action UI for Hackers, QA, and Admin.
 * - QA can investigate 2 players
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
        Icon: Search,
        color: 'cyber-yellow',
      };
    }
    const labels = {
      [ROLES.HACKER]: { action: 'Inject Critical Bug', Icon: Bug, color: 'cyber-red' },
      [ROLES.ADMIN]: { action: 'Debug (Protect) Player', Icon: Wrench, color: 'cyber-green' },
      [ROLES.DEVELOPER]: { action: 'Sleep', Icon: Moon, color: 'gray-400' },
    };
    return labels[myRole] || labels[ROLES.DEVELOPER];
  };

  const config = getActionLabel();

  if (!amAlive) {
    return (
      <div className="cyber-card text-center animate-fade-in">
        <p className="text-gray-500 text-sm py-4 flex items-center justify-center gap-2">
          <Skull size={16} /> You have been eliminated. Watch the night unfold…
        </p>
      </div>
    );
  }

  // Developer has no night action
  if (myRole === ROLES.DEVELOPER) {
    return (
      <div className="cyber-card text-center animate-slide-up">
        <p className="text-6xl mb-3 animate-float flex justify-center"><Moon size={48} /></p>
        <p className="text-gray-400 text-sm">
          You are a Developer. Rest while the night passes…
        </p>
        <p className="text-gray-600 text-xs mt-2">
          Hope the Admin protects you!
        </p>
      </div>
    );
  }

  // QA — waits during night, acts at sunrise
  if (myRole === ROLES.SECURITY_LEAD) {
    return (
      <div className="cyber-card text-center animate-slide-up">
        <p className="text-5xl mb-3 flex justify-center"><Search size={40} /></p>
        <p className="text-gray-400 text-sm">
          Night is active… The hackers are making their move.
        </p>
        <p className="text-yellow-400 text-xs mt-2 font-semibold">
          At sunrise, you'll investigate the code. Stay alert!
        </p>
      </div>
    );
  }

  // Admin — waits during night, acts at sunrise
  if (myRole === ROLES.ADMIN) {
    return (
      <div className="cyber-card text-center animate-slide-up">
        <p className="text-5xl mb-3 animate-float flex justify-center"><Wrench size={40} /></p>
        <p className="text-gray-400 text-sm">
          Night is active… The hackers are making their move.
        </p>
        <p className="text-green-400 text-xs mt-2 font-semibold">
          At sunrise, you'll review code, repair bugs, and choose who to protect!
        </p>
      </div>
    );
  }

  return (
    <div className="cyber-card animate-slide-up">
      <h3 className={`text-xs uppercase tracking-wider text-${config.color} font-bold mb-3 flex items-center gap-1.5`}>
        {config.Icon && <config.Icon size={14} />} {config.action}
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
              {res.isHacker ? <><Bug size={12} className="inline" /> a HACKER!</> : <><CheckCircle size={12} className="inline" /> NOT a Hacker.</>}
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
          {investigationResult.isHacker ? <><Bug size={12} className="inline" /> a HACKER!</> : <><CheckCircle size={12} className="inline" /> NOT a Hacker.</>}
        </div>
      )}
      {myRole === ROLES.HACKER && hackerVoteStatus && (
        <div className={`mb-3 p-2 rounded text-xs border ${
          hackerVoteStatus.disagreement
            ? 'bg-cyber-red/10 border-cyber-red/30'
            : 'bg-cyber-darker border-cyber-red/20'
        }`}>
          {hackerVoteStatus.disagreement && (
            <p className="text-cyber-red font-bold mb-1 flex items-center gap-1"><AlertTriangle size={12} /> You must ALL agree on the same target! Votes reset.</p>
          )}
          {Object.values(hackerVoteStatus.votes || {}).map((v, i) => (
            <p key={i} className="text-gray-400 flex items-center gap-1">
              <Bug size={12} /> {v.hackerName} → <span className="text-cyber-red">{v.targetName}</span>
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
        <div className="text-center py-6">
          <p className="text-4xl mb-2 animate-float flex justify-center"><Bug size={32} /></p>
          <p className="text-cyber-green text-sm font-semibold">✓ Vote submitted. Waiting for other hackers…</p>
        </div>
      ) : myRole === ROLES.HACKER ? (
        /* ── Hacker big fragment vote cards ── */
        <>
          <p className="text-xs text-gray-500 mb-3 text-center">Choose your target — all hackers must agree:</p>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {targets.map((p, idx) => {
              const isSelected = selectedTarget === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => { setSelectedTarget(p.id); setSubmitted(false); }}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all hover:scale-105 animate-slide-up
                    ${isSelected
                      ? 'border-cyber-red bg-cyber-red/20 text-cyber-red shadow-lg shadow-cyber-red/20'
                      : 'border-cyber-border bg-cyber-darker text-gray-300 hover:border-cyber-red/50 hover:bg-cyber-red/5'
                    }
                  `}
                  style={{ animationDelay: `${idx * 70}ms`, animationFillMode: 'both' }}
                >
                  <img src={getAvatarForPlayer(p.name)} alt={p.name} className={`w-14 h-14 rounded-full border-2 ${isSelected ? 'border-cyber-red' : 'border-gray-700'}`} />
                  <span className="font-bold text-sm">{p.name}</span>
                  {isSelected && <span className="text-xs text-cyber-red animate-pulse flex items-center gap-1"><Crosshair size={12} /> Selected</span>}
                </button>
              );
            })}
          </div>
          <button
            onClick={handleSubmit}
            disabled={!selectedTarget}
            className="w-full cyber-btn cyber-btn-red disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Bug size={14} className="inline-block mr-1" /> Cast Vote — Inject Bug
          </button>
        </>
      ) : (
        /* ── Other roles (QA during night — shouldn't render, but fallback) ── */
        <>
          <div className="space-y-1.5 mb-3 max-h-48 overflow-y-auto">
            {targets.map((p, idx) => (
              <button
                key={p.id}
                onClick={() => setSelectedTarget(p.id)}
                className={`w-full flex items-center gap-3 rounded px-3 py-2 text-sm transition-all animate-slide-right
                  ${selectedTarget === p.id
                    ? `bg-${config.color}/20 border border-${config.color}/40 text-${config.color}`
                    : 'bg-cyber-darker border border-transparent hover:border-cyber-border text-gray-300'
                  }
                `}
                style={{ animationDelay: `${idx * 60}ms`, animationFillMode: 'both' }}
              >
                <img src={getAvatarForPlayer(p.name)} alt={p.name} className="w-8 h-8 rounded-full bg-black/40" />
                <span>{p.name}</span>
              </button>
            ))}
          </div>
          <button
            onClick={handleSubmit}
            disabled={!selectedTarget}
            className={`w-full cyber-btn ${myRole === ROLES.ADMIN ? 'cyber-btn-green' : 'cyber-btn-blue'}`}
          >
            Confirm {config.action}
          </button>
        </>
      )}
    </div>
  );
}
