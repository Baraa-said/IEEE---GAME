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
  onAdminBugGuess,
  adminBugGuessResult,
  onGetPlayerCode,
  playerCodeData,
  onFinishSunrise,
}) {
  const [adminProtectChoice, setAdminProtectChoice] = React.useState(null);
  const [adminCodeExpanded, setAdminCodeExpanded] = React.useState(false);
  const [adminFileGuessIdx, setAdminFileGuessIdx] = React.useState(null);

  // Reset admin guess state when scan target changes
  React.useEffect(() => {
    setAdminFileGuessIdx(null);
  }, [adminScanResult?.targetId]);

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

                  {/* STEP 1: Scan a player for corruption */}
                  <div className="cyber-card border-blue-500/30 bg-blue-900/10">
                    <h3 className="text-xs uppercase tracking-wider text-blue-400 font-bold mb-2">
                      🔍 Step 1 — Scan for Corruption
                    </h3>
                    <p className="text-xs text-gray-500 mb-3">Choose a player to scan their code for hacker injections:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {alivePlayers.filter(p => p.id !== myId).map((p, idx) => {
                        const isScanned = adminScanResult?.targetId === p.id;
                        const isCorrupted = isScanned && adminScanResult?.corrupted;
                        const isClean = isScanned && !adminScanResult?.corrupted;
                        return (
                          <button
                            key={p.id}
                            onClick={() => { onAdminScanCorruption(p.id); setAdminCodeExpanded(false); setAdminFileGuessIdx(null); }}
                            disabled={adminBugGuessResult != null}
                            className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all hover:scale-105 animate-slide-up ${
                              isCorrupted ? 'border-red-500 bg-red-900/30 text-red-200 shadow-lg shadow-red-900/30'
                              : isClean ? 'border-green-500/60 bg-green-900/20 text-green-300'
                              : 'border-blue-500/30 bg-blue-900/20 text-blue-300 hover:bg-blue-700/30 hover:border-blue-400/50'
                            } ${adminBugGuessResult ? 'opacity-50 cursor-not-allowed' : ''}`}
                            style={{ animationDelay: `${idx * 60}ms`, animationFillMode: 'both' }}
                          >
                            <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(p.name)}`} alt={p.name} className={`w-12 h-12 rounded-full bg-black/40 border-2 ${isCorrupted ? 'border-red-500' : isClean ? 'border-green-400' : 'border-blue-600/30'}`} />
                            <span className="font-semibold text-sm">{p.name}</span>
                            {isCorrupted && <span className="text-[10px] text-red-400 animate-pulse">⚠️ Corrupted!</span>}
                            {isClean && <span className="text-[10px] text-green-400">✅ Clean</span>}
                            {!isScanned && <span className="text-[10px] text-blue-400/60">🔍 Scan</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Clean scan result */}
                  {adminScanResult && !adminScanResult.corrupted && (
                    <div className="p-2 rounded border border-green-500/30 bg-green-900/10 text-green-400 text-xs text-center animate-fade-in">
                      ✅ {adminScanResult.targetName}'s code is clean — no corruption found. Your task stops here.
                    </div>
                  )}

                  {/* STEP 2: Corruption found — show files, pick which one has the bug */}
                  {adminScanResult?.corrupted && !adminBugGuessResult && (
                    <div className="cyber-card border-red-500/40 bg-red-900/10 animate-slide-up space-y-3">
                      <div>
                        <h3 className="text-xs uppercase tracking-wider text-red-400 font-bold">
                          ⚠️ Step 2 — Find the Bug!
                        </h3>
                        <p className="text-[11px] text-gray-400 mt-1">
                          <span className="text-red-300 font-semibold">{adminScanResult.targetName}</span>'s code is corrupted!
                          Review their files below and choose which file contains the bug.
                        </p>
                        <p className="text-[10px] text-yellow-400/90 mt-1 font-bold">
                          ⚠️ You only get ONE guess! Correct → protect the player. Wrong → the player dies.
                        </p>
                      </div>

                      {/* Show all files for inspection */}
                      {adminScanResult.files?.length > 0 && (
                        <div className="space-y-2">
                          {adminScanResult.files.map((file, fIdx) => (
                            <div key={fIdx} className={`rounded border overflow-hidden transition-all ${
                              adminFileGuessIdx === fIdx
                                ? 'border-yellow-500/60 bg-yellow-900/10 shadow-lg shadow-yellow-900/20'
                                : 'border-gray-700/50 bg-[#0d1117]'
                            }`}>
                              <button
                                onClick={() => setAdminFileGuessIdx(fIdx)}
                                className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-all hover:bg-white/5 ${
                                  adminFileGuessIdx === fIdx ? 'bg-yellow-900/20' : ''
                                }`}
                              >
                                <span className="text-sm">📄</span>
                                <span className="text-[11px] font-mono text-gray-300 flex-1">{file.name}</span>
                                {adminFileGuessIdx === fIdx
                                  ? <span className="text-[10px] text-yellow-400 font-bold animate-pulse">🎯 Selected</span>
                                  : <span className="text-[10px] text-gray-500">Click to select</span>
                                }
                              </button>
                              {/* Inline code preview */}
                              <div className="font-mono text-[10px] leading-4 whitespace-pre overflow-auto max-h-36 px-2 pb-2 border-t border-gray-700/30">
                                {file.code?.split('\n').map((line, i) => (
                                  <div key={i} className="flex hover:bg-white/5">
                                    <span className="select-none text-gray-600 text-right pr-2 pl-1 min-w-[2rem] border-r border-gray-700/30 text-[9px]">{i + 1}</span>
                                    <span className="pl-2 text-gray-400">{line}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Submit guess button */}
                      <button
                        onClick={() => { if (adminFileGuessIdx !== null) onAdminBugGuess(adminScanResult.targetId, adminFileGuessIdx); }}
                        disabled={adminFileGuessIdx === null}
                        className={`w-full py-3 rounded-lg border-2 font-bold text-sm transition-all ${
                          adminFileGuessIdx !== null
                            ? 'border-yellow-500/60 bg-yellow-900/30 text-yellow-300 hover:bg-yellow-700/50 hover:border-yellow-300 hover:scale-[1.02]'
                            : 'border-gray-600/30 bg-gray-800/30 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        🎯 Submit Guess — This File Has the Bug
                      </button>
                    </div>
                  )}

                  {/* STEP 3: Bug guess result */}
                  {adminBugGuessResult && (
                    <div className={`cyber-card animate-slide-up space-y-2 ${
                      adminBugGuessResult.correct
                        ? 'border-green-500/40 bg-green-900/10'
                        : 'border-red-500/40 bg-red-900/10'
                    }`}>
                      {adminBugGuessResult.correct ? (
                        <>
                          <h3 className="text-xs uppercase tracking-wider text-green-400 font-bold">
                            ✅ Correct! Player Protected
                          </h3>
                          <p className="text-sm text-green-300">
                            You correctly identified <span className="font-mono font-bold">{adminBugGuessResult.actualFileName}</span> as the corrupted file.
                            <span className="font-semibold"> {adminBugGuessResult.targetName}</span> is now protected from tonight's hacker attack!
                          </p>
                        </>
                      ) : (
                        <>
                          <h3 className="text-xs uppercase tracking-wider text-red-400 font-bold">
                            ❌ Wrong File! Player Eliminated
                          </h3>
                          <p className="text-sm text-red-300">
                            You chose <span className="font-mono font-bold">{adminBugGuessResult.guessedFileName}</span> but the bug was in{' '}
                            <span className="font-mono font-bold">{adminBugGuessResult.actualFileName}</span>.
                            <span className="font-semibold"> {adminBugGuessResult.targetName}</span> will be eliminated.
                          </p>
                        </>
                      )}
                    </div>
                  )}

                  {/* Finish Sunrise button — Admin */}
                  <button
                    onClick={onFinishSunrise}
                    className="w-full py-3 rounded-lg border border-green-400/50 bg-green-900/30 text-green-300 font-bold text-sm hover:bg-green-700/50 hover:border-green-300 hover:scale-[1.02] transition-all animate-bounce-in"
                  >
                    ✅ Finish Sunrise — I'm Done
                  </button>
                </div>
              )}

              {/* Security Lead sunrise panel */}
              {myRole === ROLES.SECURITY_LEAD && amAlive && (
                <div className="cyber-card border-yellow-500/30 bg-yellow-900/10 space-y-3">
                  <h3 className="text-xs uppercase tracking-wider text-yellow-400 font-bold mb-2">
                    🌅 Security Lead — Scan Suspects
                  </h3>
                  <p className="text-xs text-gray-400 mb-3">
                    Select a player to scan their code for hacker injections:
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {alivePlayers.filter(p => p.id !== myId).map((p, idx) => (
                      <button
                        key={p.id}
                        onClick={() => onSecurityScan(p.id)}
                        className="flex flex-col items-center gap-2 p-4 rounded-lg border border-yellow-500/30 bg-yellow-900/20 text-yellow-300 hover:bg-yellow-700/40 hover:border-yellow-400/60 hover:scale-105 transition-all animate-slide-up"
                        style={{ animationDelay: `${idx * 60}ms`, animationFillMode: 'both' }}
                      >
                        <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(p.name)}`} alt={p.name} className="w-12 h-12 rounded-full bg-black/40 border border-yellow-500/30" />
                        <span className="font-semibold text-sm">{p.name}</span>
                        <span className="text-[10px] text-yellow-400/70">🔍 Scan</span>
                      </button>
                    ))}
                  </div>
                  {/* Scan result */}
                  {securityScanResult && (
                    <div className={`mt-2 p-3 rounded border text-xs ${
                      securityScanResult.isHacker
                        ? 'bg-red-900/20 border-red-500/40'
                        : 'bg-green-900/20 border-green-500/30'
                    }`}>
                      {securityScanResult.isHacker ? (
                        <p className="text-red-400 font-bold">⚠️ {securityScanResult.targetName} is a HACKER!</p>
                      ) : (
                        <p className="text-green-400 font-semibold">✅ {securityScanResult.targetName} is NOT a Hacker.</p>
                      )}
                    </div>
                  )}
                  <button
                    onClick={onFinishSunrise}
                    className="w-full py-3 rounded-lg border border-yellow-400/50 bg-yellow-900/30 text-yellow-300 font-bold text-sm hover:bg-yellow-700/50 hover:border-yellow-300 hover:scale-[1.02] transition-all animate-bounce-in"
                  >
                    ✅ Finish Sunrise — I'm Done
                  </button>
                </div>
              )}

              {/* Developer / Hacker sunrise panel */}
              {myRole !== ROLES.ADMIN && myRole !== ROLES.SECURITY_LEAD && amAlive && (
                <div className="cyber-card border-gray-600/30">
                  <h3 className="text-xs uppercase tracking-wider text-gray-400 font-bold mb-2">
                    🌅 Sunrise
                  </h3>
                  <p className="text-sm text-gray-500">
                    The Admin and Security Lead are reviewing code... Wait for the day phase.
                  </p>
                </div>
              )}

              {!amAlive && (
                <div className="cyber-card border-gray-600/30">
                  <h3 className="text-xs uppercase tracking-wider text-red-400 font-bold mb-2">
                    ☠️ Eliminated
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
