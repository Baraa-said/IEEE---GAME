import React from 'react';
import { PHASES, ROLES } from '../shared/constants';
import PhaseIndicator from './PhaseIndicator';
import PlayerList from './PlayerList';
import ChatPanel from './ChatPanel';
import VotingPanel from './VotingPanel';
import NightPanel from './NightPanel';
import { getAvatarForRole } from '../utils/avatars';

/**
 * GameScreen – Main game view. Orchestrates all sub-panels based on the
 * current phase, role, and alive status.
 */
export default function GameScreen({
  myId,
  myRole,
  amAlive,
  phase,
  phaseMessage,
  phaseDuration,
  phaseEndTime,
  gameState,
  alivePlayers,
  deadPlayers,
  defenders,
  // Voting
  voteTally,
  votesCast,
  totalVoters,
  onCastVote,
  individualVotes,
  // Night
  onNightAction,
  investigationResult,
  nightResult,
  fellowHackers,
  hackerVoteStatus,
  // Chat
  messages,
  hackerMessages,
  onSendChat,
  onSendHackerChat,
  // Elimination log
  eliminationLog,
  // Skip
  skipCount,
  totalAliveForSkip,
  hasSkipped,
  onSkipPhase,
}) {
  const isNight = phase === PHASES.NIGHT;
  const isVoting = phase === PHASES.DAY_VOTING;
  const isDefense = phase === PHASES.DAY_DEFENSE;
  const isDay = [PHASES.DAY_DISCUSSION, PHASES.DAY_VOTING, PHASES.DAY_DEFENSE].includes(phase);
  const isHacker = myRole === ROLES.HACKER;

  // Theme based on role
  const themeClass = myRole === ROLES.HACKER ? 'shadow-[inset_0_0_80px_rgba(255,0,0,0.05)]' :
                     myRole === ROLES.ADMIN ? 'shadow-[inset_0_0_80px_rgba(0,255,100,0.05)]' :
                     myRole === ROLES.SECURITY_LEAD ? 'shadow-[inset_0_0_80px_rgba(255,200,50,0.05)]' :
                     'shadow-[inset_0_0_80px_rgba(0,150,255,0.05)]';

  return (
    <div className={`min-h-screen flex flex-col ${themeClass}`}>
      {/* Top bar */}
      <header className="bg-cyber-darker/90 backdrop-blur-md border-b border-cyber-border px-4 py-2 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-bold text-cyber-green neon-text-green tracking-widest drop-shadow-[0_0_5px_rgba(0,255,100,0.5)]">⚔️ CODE WARS</h1>
          <span className="text-xs text-gray-500 font-mono bg-black/40 px-2 py-0.5 rounded">R:{gameState?.roomId}</span>
        </div>
        <div className="flex items-center gap-3">
          {/* Role badge */}
          <div className={`text-xs px-3 py-1.5 rounded-full border flex items-center gap-2 shadow-lg ${
            myRole === ROLES.HACKER
              ? 'bg-cyber-red/10 border-cyber-red/30 text-cyber-red'
              : myRole === ROLES.ADMIN
              ? 'bg-cyber-green/10 border-cyber-green/30 text-cyber-green'
              : myRole === ROLES.SECURITY_LEAD
              ? 'bg-cyber-yellow/10 border-yellow-500/30 text-cyber-yellow'
              : 'bg-cyber-blue/10 border-cyber-blue/30 text-cyber-blue'
          }`}>
            <img src={getAvatarForRole(myRole)} alt={myRole} className="w-5 h-5 rounded-full" />
            <span className="font-bold tracking-wider">{myRole?.replace('_', ' ')}</span>
          </div>
          {!amAlive && (
            <span className="text-xs bg-red-900/60 text-red-400 font-bold px-2 py-1.5 rounded uppercase tracking-widest border border-red-500/30">TERMINATED</span>
          )}
        </div>
      </header>

      {/* Main grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 p-3 overflow-hidden">
        {/* Left: Player list */}
        <div className="lg:col-span-3 overflow-y-auto">
          <PlayerList
            alivePlayers={alivePlayers}
            deadPlayers={deadPlayers}
            myId={myId}
            defenders={defenders}
            voteTally={voteTally}
          />

          {/* Night result notification */}
          {nightResult && (
            <div className={`cyber-card mt-3 text-xs ${
              nightResult.eliminated
                ? 'border-cyber-red/30 bg-cyber-red/5'
                : nightResult.protectionSaved
                ? 'border-cyber-green/30 bg-cyber-green/5'
                : 'border-cyber-border'
            }`}>
              <p className="font-bold text-gray-300 mb-1">Last Night:</p>
              <p className="text-gray-400">{nightResult.message}</p>
            </div>
          )}

          {/* Elimination log */}
          {eliminationLog.length > 0 && (
            <div className="cyber-card mt-3">
              <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">
                Elimination Log
              </p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {eliminationLog.map((e, i) => (
                  <p key={i} className="text-xs text-gray-400">
                    {e.role === 'Hacker' ? '🕷️' : '👨‍💻'} {e.name} ({e.role}) – {e.reason}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Center: Phase content */}
        <div className="lg:col-span-5 flex flex-col overflow-y-auto">
          <PhaseIndicator
            phase={phase}
            sprint={gameState?.sprint}
            systemStability={gameState?.systemStability}
            advancedMode={gameState?.advancedMode}
            message={phaseMessage}
            phaseEndTime={phaseEndTime}
          />

          {/* Skip Button */}
          {amAlive && [PHASES.DAY_DISCUSSION, PHASES.DAY_VOTING, PHASES.DAY_DEFENSE, PHASES.NIGHT].includes(phase) && (
            <div className="cyber-card py-2 flex items-center justify-between">
              <span className="text-xs text-gray-400">
                ⏭️ Skip: {skipCount}/{totalAliveForSkip || alivePlayers.length} ready
              </span>
              <button
                onClick={onSkipPhase}
                disabled={hasSkipped}
                className={`text-xs px-3 py-1 rounded transition-all ${
                  hasSkipped
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-cyber-blue/20 border border-cyber-blue/40 text-cyber-blue hover:bg-cyber-blue/30'
                }`}
              >
                {hasSkipped ? '✓ Ready to Skip' : '⏭️ Skip Phase'}
              </button>
            </div>
          )}

          {/* Phase-specific content */}
          {isVoting && (
            <VotingPanel
              alivePlayers={alivePlayers}
              myId={myId}
              voteTally={voteTally}
              votesCast={votesCast}
              totalVoters={totalVoters}
              onCastVote={onCastVote}
              amAlive={amAlive}
              individualVotes={individualVotes}
            />
          )}

          {isDefense && defenders.length > 0 && (
            <div className="cyber-card border-cyber-purple/30">
              <h3 className="text-xs uppercase tracking-wider text-cyber-purple font-bold mb-2">
                🛡️ Defense Phase
              </h3>
              <p className="text-sm text-gray-300">
                The following players must defend themselves:
              </p>
              <div className="mt-2 space-y-1">
                {defenders.map(dId => {
                  const dp = alivePlayers.find(p => p.id === dId);
                  return dp ? (
                    <p key={dId} className="text-sm text-cyber-yellow font-semibold">
                      ⚠️ {dp.name}
                    </p>
                  ) : null;
                })}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Use the chat to argue your innocence!
              </p>
            </div>
          )}

          {isNight && (
            <NightPanel
              myRole={myRole}
              myId={myId}
              alivePlayers={alivePlayers}
              onNightAction={onNightAction}
              investigationResult={investigationResult}
              fellowHackers={fellowHackers}
              amAlive={amAlive}
              hackerVoteStatus={hackerVoteStatus}
            />
          )}

          {phase === PHASES.DAY_DISCUSSION && (
            <div className="cyber-card flex-1">
              <h3 className="text-xs uppercase tracking-wider text-cyber-yellow font-bold mb-2">
                ☀️ Discussion Phase
              </h3>
              <p className="text-sm text-gray-400">
                Discuss with your team who might be a Hacker. Use the chat to share suspicions.
                Voting will begin shortly.
              </p>
            </div>
          )}
        </div>

        {/* Right: Chat */}
        <div className="lg:col-span-4 flex flex-col min-h-0">
          <ChatPanel
            messages={messages}
            hackerMessages={hackerMessages}
            onSendChat={onSendChat}
            onSendHackerChat={onSendHackerChat}
            isNight={isNight}
            isHacker={isHacker}
            amAlive={amAlive}
            myId={myId}
          />
        </div>
      </div>
    </div>
  );
}
