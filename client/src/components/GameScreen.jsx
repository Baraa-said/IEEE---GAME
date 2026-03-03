import React from 'react';
import { PHASES, ROLES } from '../shared/constants';
import PhaseIndicator from './PhaseIndicator';
import PlayerList from './PlayerList';
import ChatPanel from './ChatPanel';
import VotingPanel from './VotingPanel';
import NightPanel from './NightPanel';
import CodeBrowser from './CodeBrowser';
import { getAvatarForRole } from '../utils/avatars';
import { getTheme } from '../utils/themes';

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
  // Code
  codeFiles,
  onSecurityScan,
  securityScanResult,
  onHackerInject,
  hackerInjectResult,
  onHackerInjectVote,
  hackerInjectVoteStatus,
  onAdminRepair,
  adminRepairResult,
  onAdminScanCorruption,
  adminScanResult,
  onGetPlayerCode,
  playerCodeData,
}) {
  const isNight = phase === PHASES.NIGHT;
  const isSunrise = phase === PHASES.SUNRISE;
  const isVoting = phase === PHASES.DAY_VOTING;
  const isDefense = phase === PHASES.DAY_DEFENSE;
  const isDay = [PHASES.DAY_DISCUSSION, PHASES.DAY_VOTING, PHASES.DAY_DEFENSE].includes(phase);
  const isHacker = myRole === ROLES.HACKER;

  // Get role-specific theme
  const theme = getTheme(myRole);

  return (
    <div className={`min-h-screen flex flex-col ${theme.insetShadow} relative z-10`}>
      {/* Top bar */}
      <header className={`${theme.headerBg} backdrop-blur-md border-b ${theme.headerBorder} px-4 py-2 flex items-center justify-between z-10`}>
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="IEEE Code Wars" className="h-8 hidden sm:block" />
          <h1 className={`text-sm font-bold ${theme.titleColor} ${theme.titleGlow} tracking-widest`}>IEEE CODE WARS</h1>
          <span className="text-xs text-gray-500 font-mono bg-black/40 px-2 py-0.5 rounded">R:{gameState?.roomId}</span>
        </div>
        <div className="flex items-center gap-3">
          {/* Role badge */}
          <div className={`text-xs px-3 py-1.5 rounded-full border flex items-center gap-2 shadow-lg ${theme.badgeBg} ${theme.badgeBorder} ${theme.badgeText}`}>
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
            <div className={`cyber-card mt-3 text-xs animate-slide-right ${
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
                  <p key={i} className="text-xs text-gray-400 animate-slide-left" style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'both' }}>
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
          {amAlive && [PHASES.DAY_DISCUSSION, PHASES.DAY_VOTING, PHASES.DAY_DEFENSE, PHASES.NIGHT, PHASES.SUNRISE].includes(phase) && (
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
            <div className="cyber-card border-cyber-purple/30 animate-slide-up">
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

          {isSunrise && (
            <div className="space-y-3 animate-slide-up">
              {/* Admin sunrise panel */}
              {myRole === ROLES.ADMIN && amAlive && (
                <div className="space-y-3">
                  {/* Section 1: Protect a player */}
                  <div className="cyber-card border-green-500/30 bg-green-900/10">
                    <h3 className="text-xs uppercase tracking-wider text-green-400 font-bold mb-2">
                      🌅 Admin — Choose Who to Protect
                    </h3>
                    <p className="text-xs text-gray-400 mb-2">
                      Select one player to shield from the hacker's nightly attack:
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {alivePlayers.filter(p => p.id !== myId).map(p => (
                        <button
                          key={p.id}
                          onClick={() => onNightAction(p.id)}
                          className="text-xs px-3 py-2 rounded border border-green-500/30 bg-green-900/20 text-green-300 hover:bg-green-700/30 hover:border-green-400/50 transition-all"
                        >
                          🛡️ Protect {p.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Section 2: Scan player code for corruption */}
                  <div className="cyber-card border-blue-500/30 bg-blue-900/10">
                    <h3 className="text-xs uppercase tracking-wider text-blue-400 font-bold mb-2">
                      🔍 Admin — Scan Code for Corruption
                    </h3>
                    <p className="text-xs text-gray-400 mb-2">
                      Scan up to 2 players. If corrupted, you'll see the infected code and can repair it.
                      If clean, the code stays hidden.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {alivePlayers.filter(p => p.id !== myId).map(p => (
                        <button
                          key={p.id}
                          onClick={() => onAdminScanCorruption(p.id)}
                          className="text-xs px-3 py-2 rounded border border-blue-500/30 bg-blue-900/20 text-blue-300 hover:bg-blue-700/30 hover:border-blue-400/50 transition-all"
                        >
                          🔍 Scan {p.name}
                        </button>
                      ))}
                    </div>

                    {/* Scan result */}
                    {adminScanResult && (
                      <div className={`mt-3 p-3 rounded border text-xs ${
                        adminScanResult.corrupted
                          ? 'bg-red-900/20 border-red-500/40'
                          : 'bg-green-900/20 border-green-500/30'
                      }`}>
                        {adminScanResult.corrupted ? (
                          <>
                            <p className="text-red-400 font-bold mb-1">
                              ⚠️ CORRUPTION DETECTED in {adminScanResult.targetName}'s code!
                            </p>
                            <p className="text-gray-400">
                              Infected file: <span className="font-mono text-red-300">{adminScanResult.fileName}</span>
                            </p>
                            <p className="text-gray-400">
                              Bug: <span className="text-red-300">{adminScanResult.corruptionDesc}</span>
                            </p>
                            <p className="text-gray-500 mt-1">↓ See Code Browser below to inspect and repair.</p>
                          </>
                        ) : (
                          <p className="text-green-400 font-semibold">
                            ✅ {adminScanResult.targetName}'s code is clean — no corruption found.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Security Lead sunrise panel */}
              {myRole === ROLES.SECURITY_LEAD && amAlive && (
                <div className="cyber-card border-yellow-500/30 bg-yellow-900/10">
                  <h3 className="text-xs uppercase tracking-wider text-yellow-400 font-bold mb-2">
                    \ud83c\udf05 Security Lead Sunrise Actions
                  </h3>
                  <p className="text-sm text-gray-400">
                    Browse up to 2 players' code in the Code Browser below. <br/>
                    Look for <span className="text-yellow-300 font-semibold">suspicious function names</span> that indicate hacker code.
                    Use the Scan button to investigate suspects!
                  </p>
                </div>
              )}

              {/* Developer / Hacker sunrise panel */}
              {myRole !== ROLES.ADMIN && myRole !== ROLES.SECURITY_LEAD && amAlive && (
                <div className="cyber-card border-gray-600/30">
                  <h3 className="text-xs uppercase tracking-wider text-gray-400 font-bold mb-2">
                    \ud83c\udf05 Sunrise
                  </h3>
                  <p className="text-sm text-gray-500">
                    The Admin and Security Lead are reviewing code... Wait for the day phase.
                  </p>
                </div>
              )}

              {!amAlive && (
                <div className="cyber-card border-gray-600/30">
                  <h3 className="text-xs uppercase tracking-wider text-red-400 font-bold mb-2">
                    \u2620\ufe0f Eliminated
                  </h3>
                  <p className="text-sm text-gray-500">
                    You have been terminated. Observe the sunrise in silence.
                  </p>
                </div>
              )}
            </div>
          )}

          {phase === PHASES.DAY_DISCUSSION && (
            <div className="cyber-card flex-1">
              <h3 className="text-xs uppercase tracking-wider text-cyber-yellow font-bold mb-2">
                ☀️ Discussion Phase
              </h3>
              <p className="text-sm text-gray-400">
                Discuss with your team who might be a Hacker. Browse player code folders below to look for clues!
              </p>
            </div>
          )}

          {/* Code Browser – always visible during game */}
          {codeFiles && Object.keys(codeFiles).length > 0 && (
            <CodeBrowser
              codeFiles={codeFiles}
              myId={myId}
              myRole={myRole}
              alivePlayers={alivePlayers}
              phase={phase}
              isNight={isNight}
              isSunrise={isSunrise}
              onHackerInjectVote={onHackerInjectVote}
              hackerInjectResult={hackerInjectResult}
              hackerVoteStatus={hackerVoteStatus}
              hackerInjectVoteStatus={hackerInjectVoteStatus}
              onAdminRepair={onAdminRepair}
              adminRepairResult={adminRepairResult}
              onAdminScanCorruption={onAdminScanCorruption}
              adminScanResult={adminScanResult}
              securityScanResult={securityScanResult}
              onGetPlayerCode={onGetPlayerCode}
              playerCodeData={playerCodeData}
              fellowHackers={fellowHackers}
            />
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
            isSunrise={isSunrise}
            isHacker={isHacker}
            amAlive={amAlive}
            myId={myId}
          />
        </div>
      </div>
    </div>
  );
}
