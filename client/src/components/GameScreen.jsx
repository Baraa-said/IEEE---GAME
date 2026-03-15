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
import { Bug, Code2, AlertTriangle, CheckCircle, Search, Shield, Skull, Sun, Sunrise as SunriseIcon, File, Crosshair, XCircle, SkipForward } from 'lucide-react';

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
  const adminLastScanAtRef = React.useRef(0);

  // Reset admin guess state when scan target changes
  React.useEffect(() => {
    setAdminFileGuessIdx(null);
  }, [adminScanResult?.targetId]);

  React.useEffect(() => {
    adminLastScanAtRef.current = 0;
  }, [phase, gameState?.hackerInjected]);

  const isNight = phase === PHASES.NIGHT;
  const isSunrise = phase === PHASES.SUNRISE;
  const isNightReview = isNight && !!gameState?.hackerInjected;
  const isVoting = phase === PHASES.DAY_VOTING;
  const isDefense = phase === PHASES.DAY_DEFENSE;
  const isDay = [PHASES.DAY_DISCUSSION, PHASES.DAY_VOTING, PHASES.DAY_DEFENSE].includes(phase);
  const isHacker = myRole === ROLES.HACKER;

  React.useEffect(() => {
    const canAutoScan =
      (isSunrise || isNightReview) &&
      myRole === ROLES.ADMIN &&
      amAlive &&
      !!gameState?.hackerInjected &&
      !adminScanResult &&
      Date.now() - adminLastScanAtRef.current > 1200;

    if (!canAutoScan) return;
    adminLastScanAtRef.current = Date.now();
    onAdminScanCorruption();
  }, [
    amAlive,
    myRole,
    isSunrise,
    isNightReview,
    gameState?.hackerInjected,
    adminScanResult,
    onAdminScanCorruption,
  ]);

  // Get role-specific theme
  const theme = getTheme(myRole);

  return (
    <div className={`min-h-screen flex flex-col ${theme.insetShadow} relative z-10`}>
      {/* Top bar */}
  <header className={`${theme.headerBg} backdrop-blur-md border-b ${theme.headerBorder} px-4 py-2 grid grid-cols-3 items-center z-10`}>

  {/* Left - Logo */}
  <div className="flex items-center gap-3 justify-start">
    <img src="/logo.svg" alt="Computer Society Mafia Night" className="h-8 hidden sm:block" />
    <span className="text-xs text-gray-500 font-mono bg-black/40 px-2 py-0.5 rounded">
      R:{gameState?.roomId}
    </span>
  </div>

  {/* Center - Title */}
  <div className="text-center">
    <h1 className={`text-sm font-bold ${theme.titleColor} ${theme.titleGlow} tracking-widest`}>
      COMPUTER SOCIETY MAFIA NIGHT - IEEE EDITION
    </h1>
  </div>

  {/* Right - Role */}
  <div className="flex items-center gap-3 justify-end">
    
    <div className={`text-xs px-3 py-1.5 rounded-full border flex items-center gap-2 shadow-lg ${theme.badgeBg} ${theme.badgeBorder} ${theme.badgeText}`}>
      <img src={getAvatarForRole(myRole)} alt={myRole} className="w-5 h-5 rounded-full" />
      <span className="font-bold tracking-wider">
        {myRole?.replace('_', ' ')}
      </span>
    </div>

    {!amAlive && (
      <span className="text-xs bg-red-900/60 text-red-400 font-bold px-2 py-1.5 rounded uppercase tracking-widest border border-red-500/30">
        TERMINATED
      </span>
    )}

  </div>

</header>

      {/* Main grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 p-3 overflow-hidden">
        {/* Left: Player list */}
        <div className="lg:col-span-3 flex flex-col h-full overflow-y-auto">
          <PlayerList
            alivePlayers={alivePlayers}
            deadPlayers={deadPlayers}
            myId={myId}
            myRole={myRole}
            fellowHackers={fellowHackers}
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
                    {e.role === 'Hacker' ? <Bug size={12} className="inline" /> : <Code2 size={12} className="inline" />} {e.name} ({e.role}) – {e.reason}
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
            timerEnabled={false}
            showSkip={true}
            onSkipPhase={onSkipPhase}
            hasSkipped={hasSkipped}
            amAlive={amAlive}
          />

          

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
              <h3 className="text-xs uppercase tracking-wider text-cyber-purple font-bold mb-2 flex items-center gap-1.5">
                <Shield size={14} /> Defense Phase
              </h3>
              <p className="text-sm text-gray-300">
                The following players must defend themselves:
              </p>
              <div className="mt-2 space-y-1">
                {defenders.map(dId => {
                  const dp = alivePlayers.find(p => p.id === dId);
                  return dp ? (
                    <p key={dId} className="text-sm text-cyber-yellow font-semibold flex items-center gap-1">
                      <AlertTriangle size={12} /> {dp.name}
                    </p>
                  ) : null;
                })}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Use the chat to argue your innocence!
              </p>
            </div>
          )}

          {isNight && !isNightReview && (
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

          {(isSunrise || isNightReview) && (
            <div className="space-y-3 animate-slide-up mb-6">
              {/* Admin review panel */}
              {myRole === ROLES.ADMIN && amAlive && (
                <div className="space-y-3">

                  <div className="cyber-card border-blue-500/30 bg-blue-900/10">
                    <h3 className="text-xs uppercase tracking-wider text-blue-400 font-bold mb-2 flex items-center gap-1.5">
                      <Search size={14} /> Admin Review
                    </h3>
                    <p className="text-sm text-gray-300">
                      If you want to save the developer, fix the attack.
                    </p>
                  </div>

                  {!adminScanResult && (isSunrise || isNightReview) && (
                    <div className="p-2 rounded border border-blue-500/30 bg-blue-900/10 text-blue-300 text-xs text-center animate-fade-in space-y-2">
                      <div>
                        <Search size={12} className="inline mr-1" /> Loading attacked code...
                      </div>
                      <button
                        onClick={() => onAdminScanCorruption()}
                        className="px-3 py-1 rounded border border-blue-400/40 bg-blue-900/30 text-blue-200 hover:bg-blue-800/40 transition-all"
                      >
                        Show Attacked Code
                      </button>
                    </div>
                  )}

                  {adminScanResult && !adminScanResult.corrupted && (
                    <div className="p-2 rounded border border-green-500/30 bg-green-900/10 text-green-400 text-xs text-center animate-fade-in">
                      <CheckCircle size={12} className="inline mr-1" /> No active attack was found for this round.
                    </div>
                  )}

                  {adminScanResult?.corrupted && (
                    <div className="cyber-card border-red-500/40 bg-red-900/10 animate-slide-up space-y-3">
                      <div>
                        <h3 className="text-xs uppercase tracking-wider text-red-400 font-bold flex items-center gap-1.5">
                          <AlertTriangle size={14} /> Step 2 — Review Corrupted Code
                        </h3>
                        <p className="text-[11px] text-gray-400 mt-1">
                          If you want to save the developer, correct the following code.
                        </p>
                      </div>

                      {adminScanResult.files?.length > 0 && (
                        <div className="space-y-2">
                          {adminScanResult.files.map((file, fIdx) => (
                            <div key={fIdx} className="rounded border overflow-hidden transition-all border-gray-700/50 bg-[#0d1117]">
                              <div className="font-mono text-[10px] leading-4 whitespace-pre overflow-auto max-h-36 px-2 py-2 border-gray-700/30">
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

                      <div className="space-y-2">
                        <p className="text-[10px] uppercase tracking-wider text-green-300/80 font-bold">Correction options</p>
                        {(adminScanResult.repairOptions || []).flatMap((option) =>
                          (option.fixes || []).map((fix, idx) => (
                            <button
                              key={`${option.fileIdx}-${idx}`}
                              onClick={() => onAdminRepair(adminScanResult.targetId)}
                              className="w-full py-3 rounded-lg border-2 font-bold text-sm transition-all border-green-500/60 bg-green-900/30 text-green-300 hover:bg-green-700/50 hover:border-green-300 hover:scale-[1.02]"
                            >
                              <CheckCircle size={14} className="inline-block mr-1" /> Correction Option — {fix.desc}
                            </button>
                          ))
                        )}

                        {(!adminScanResult.repairOptions || adminScanResult.repairOptions.length === 0) && (
                          <button
                            onClick={() => onAdminRepair(adminScanResult.targetId)}
                            className="w-full py-3 rounded-lg border-2 font-bold text-sm transition-all border-green-500/60 bg-green-900/30 text-green-300 hover:bg-green-700/50 hover:border-green-300 hover:scale-[1.02]"
                          >
                            <CheckCircle size={14} className="inline-block mr-1" /> Repair Code
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {adminRepairResult && (
                    <div className={`cyber-card animate-slide-up space-y-2 ${
                      adminRepairResult.repaired
                        ? 'border-green-500/40 bg-green-900/10'
                        : 'border-yellow-500/40 bg-yellow-900/10'
                    }`}>
                      <h3 className={`text-xs uppercase tracking-wider font-bold flex items-center gap-1.5 ${
                        adminRepairResult.repaired ? 'text-green-400' : 'text-yellow-400'
                      }`}>
                        <CheckCircle size={14} /> Repair Result
                      </h3>
                      <p className={`text-sm ${adminRepairResult.repaired ? 'text-green-300' : 'text-yellow-300'}`}>
                        {adminRepairResult.repaired
                          ? 'The corrupted code has been repaired successfully.'
                          : 'No corrupted code was available to repair.'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* QA sunrise panel */}
              {myRole === ROLES.SECURITY_LEAD && amAlive && (
                <div className="cyber-card border-yellow-500/30 bg-yellow-900/10 space-y-3">
                  <h3 className="text-xs uppercase tracking-wider text-yellow-400 font-bold mb-2 flex items-center gap-1.5">
                    <SunriseIcon size={14} /> QA — Scan Suspects
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
                        <span className="text-[10px] text-yellow-400/70 flex items-center gap-1"><Search size={10} /> Scan</span>
                      </button>
                    ))}
                  </div>
                  {/* Scan result */}
                  {securityScanResult && (
                    <div className={`mt-2 p-3 rounded border text-xs space-y-3 ${
                      securityScanResult.isHacker
                        ? 'bg-red-900/20 border-red-500/40'
                        : 'bg-green-900/20 border-green-500/30'
                    }`}>
                      {securityScanResult.isHacker ? (
                        <p className="text-red-400 font-bold flex items-center gap-1"><AlertTriangle size={12} /> {securityScanResult.targetName} is a HACKER!</p>
                      ) : (
                        <p className="text-green-400 font-semibold flex items-center gap-1"><CheckCircle size={12} /> {securityScanResult.targetName} is NOT a Hacker.</p>
                      )}

                      {Array.isArray(securityScanResult.codeFiles) && securityScanResult.codeFiles.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-[10px] uppercase tracking-wider text-gray-300 font-bold">
                            Revealed C Code
                          </p>
                          {securityScanResult.codeFiles.map((file, idx) => (
                            <div key={`${file.name}-${idx}`} className="rounded border border-gray-700/60 bg-[#0d1117] overflow-hidden">
                              <div className="px-2 py-1 border-b border-gray-700/60 text-[10px] font-mono text-cyan-300">
                                {file.name}
                              </div>
                              <pre className="m-0 p-2 text-[11px] leading-5 text-gray-300 font-mono whitespace-pre-wrap break-words">
                                {file.code}
                              </pre>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  <button
                    onClick={onFinishSunrise}
                    className="w-full py-3 rounded-lg border border-yellow-400/50 bg-yellow-900/30 text-yellow-300 font-bold text-sm hover:bg-yellow-700/50 hover:border-yellow-300 hover:scale-[1.02] transition-all animate-bounce-in"
                  >
                    <CheckCircle size={14} className="inline-block mr-1" /> Finish Review — I'm Done
                  </button>
                </div>
              )}

              {/* Developer / Hacker sunrise panel */}
              {myRole !== ROLES.ADMIN && myRole !== ROLES.SECURITY_LEAD && amAlive && (
                <div className="cyber-card border-gray-600/30">
                  <h3 className="text-xs uppercase tracking-wider text-gray-400 font-bold mb-2 flex items-center gap-1.5">
                    <SunriseIcon size={14} /> {isNightReview ? 'Night Review' : 'Sunrise'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {isNightReview
                      ? 'The Admin and QA are reviewing the corrupted code... Wait for the day phase.'
                      : 'The Admin and QA are reviewing code... Wait for the day phase.'}
                  </p>
                </div>
              )}

              {!amAlive && (
                <div className="cyber-card border-gray-600/30">
                  <h3 className="text-xs uppercase tracking-wider text-red-400 font-bold mb-2 flex items-center gap-1.5">
                    <Skull size={14} /> Eliminated
                  </h3>
                  <p className="text-sm text-gray-500">
                    {isNightReview
                      ? 'You have been terminated. Observe the night review in silence.'
                      : 'You have been terminated. Observe the sunrise in silence.'}
                  </p>
                </div>
              )}
            </div>
          )}

          {phase === PHASES.DAY_DISCUSSION && (
            <div className="cyber-card flex-1">
              <h3 className="text-xs uppercase tracking-wider text-cyber-yellow font-bold mb-2 flex items-center gap-1.5">
                <Sun size={14} /> Discussion Phase
              </h3>
              <p className="text-sm text-gray-400">
                Discuss with your team who might be a Hacker. Browse player code folders below to look for clues!
              </p>
            </div>
          )}

          {/* Code Browser – always visible during game */}
          {!isVoting && !(myRole === ROLES.ADMIN && (isSunrise || isNightReview)) && codeFiles && Object.keys(codeFiles).length > 0 && (
            <div className="mt-4">
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
              hackerInjected={!!gameState?.hackerInjected}
              fellowHackers={fellowHackers}
              nightResult={nightResult}
              phaseEndTime={phaseEndTime}
              />
            </div>
          )}
        </div>

        {/* Right: Chat */}
<div className="lg:col-span-4">
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
