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
import { Bug, Code2, AlertTriangle, CheckCircle, Search, Shield, Skull, Sun, Sunrise as SunriseIcon, File, Crosshair, XCircle, SkipForward, Wrench } from 'lucide-react';

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
  const isNightReview = isSunrise && !!gameState?.hackerInjected;
  const isVoting = phase === PHASES.DAY_VOTING;
  const isDefense = phase === PHASES.DAY_DEFENSE;
  const isDay = [PHASES.DAY_DISCUSSION, PHASES.DAY_VOTING, PHASES.DAY_DEFENSE].includes(phase);

  const simplifyFixLabel = (rawLabel) => {
    if (!rawLabel) return '';

    // Expected format from server: Replace `wrong` with `correct`
    const replacePattern = /^Replace\s+`(.+?)`\s+with\s+`(.+?)`$/i;
    const match = rawLabel.match(replacePattern);
    if (match) {
      const wrongPart = match[1].trim();
      const correctPart = match[2].trim();
      return `Fix this: ${wrongPart} -> ${correctPart}`;
    }

    return rawLabel
      .replace(/`/g, '')
      .replace(/\s+[—-]\s+/g, ' ')
      .trim();
  };
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
            timerEnabled={true}
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

                  {/* Header banner — attack detected */}
                  <div className="cyber-card border-red-500/40 bg-red-950/30 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-red-900/10 via-transparent to-red-900/10 animate-pulse pointer-events-none" />
                    <div className="flex items-center gap-3 relative">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-900/40 border border-red-500/50 flex items-center justify-center">
                        <AlertTriangle size={20} className="text-red-400 animate-pulse" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-red-400 tracking-wide flex items-center gap-2">
                          ATTACK DETECTED — ADMIN REVIEW
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-red-900/50 border border-red-500/40 text-red-300 uppercase tracking-widest font-mono animate-pulse">Sunrise</span>
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5">
                          The hacker has corrupted a developer's code. Review and fix the attack to save them.
                        </p>
                      </div>
                    </div>
                  </div>

                  {!adminScanResult && (isSunrise || isNightReview) && (
                    <div className="p-4 rounded-lg border-2 border-dashed border-red-500/30 bg-red-950/20 text-center animate-fade-in space-y-3">
                      <div className="flex justify-center">
                        <div className="w-12 h-12 rounded-full bg-red-900/30 border border-red-500/40 flex items-center justify-center">
                          <Search size={20} className="text-red-400 animate-pulse" />
                        </div>
                      </div>
                      <p className="text-red-300 text-sm font-semibold">Scanning for corrupted code...</p>
                      <p className="text-gray-500 text-xs">Automatically loading the attacked file</p>
                      <button
                        onClick={() => onAdminScanCorruption()}
                        className="px-4 py-2 rounded-lg border border-red-400/40 bg-red-900/30 text-red-200 hover:bg-red-800/40 transition-all font-semibold text-sm"
                      >
                        <Search size={12} className="inline mr-1" /> Load Attacked Code
                      </button>
                    </div>
                  )}

                  {adminScanResult && !adminScanResult.corrupted && (
                    <div className="p-3 rounded-lg border border-green-500/30 bg-green-900/10 text-green-400 text-sm text-center animate-fade-in flex items-center justify-center gap-2">
                      <CheckCircle size={16} /> No active attack was found for this round. The night passes safely.
                    </div>
                  )}

                  {adminScanResult?.corrupted && (
                    <div className="space-y-3 animate-slide-up">
                      {/* Corrupted target info banner */}
                      <div className="cyber-card border-red-500/50 bg-gradient-to-b from-red-950/40 to-red-950/20 relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent" />
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Skull size={16} className="text-red-400" />
                            <div>
                              <p className="text-xs text-red-400 font-bold uppercase tracking-wider">Corrupted File Detected</p>
                              <p className="text-sm text-gray-300 mt-0.5">
                                Target: <span className="text-red-300 font-bold">{adminScanResult.targetName}</span>
                                {adminScanResult.files?.[0]?.name && (
                                  <span className="text-gray-500"> — <span className="font-mono text-red-300/80">{adminScanResult.files[0].name}</span></span>
                                )}
                              </p>
                            </div>
                          </div>
                          <span className="text-[9px] px-2 py-1 rounded border border-red-500/40 bg-red-900/40 text-red-300 font-mono uppercase tracking-widest">
                            Damaged
                          </span>
                        </div>
                      </div>

                      {/* Corrupted code display — no scroll, like hacker code view */}
                      {adminScanResult.files?.length > 0 && (
                        <div className="space-y-0">
                          {adminScanResult.files.map((file, fIdx) => (
                            <div key={fIdx} className="rounded-t-lg border-2 border-red-500/30 overflow-hidden bg-[#0d1117] shadow-lg shadow-red-900/10">
                              <div className="px-3 py-1.5 bg-red-950/40 border-b border-red-500/20 flex items-center justify-between">
                                <span className="text-[11px] font-mono text-red-300 flex items-center gap-1.5">
                                  <File size={11} className="text-red-400" /> {file.name}
                                </span>
                                <span className="text-[9px] px-2 py-0.5 rounded-full bg-red-900/50 border border-red-500/40 text-red-300 font-bold uppercase tracking-widest flex items-center gap-1">
                                  <AlertTriangle size={9} /> Corrupted
                                </span>
                              </div>
                              <div className="font-mono text-[10px] leading-5 whitespace-pre-wrap break-all px-0 py-2">
                                {file.code?.split('\n').map((line, i) => (
                                  <div key={i} className="flex hover:bg-red-500/5 group">
                                    <span className="select-none text-gray-600 text-right pr-3 pl-2 min-w-[2.5rem] border-r border-red-900/30 text-[10px]">{i + 1}</span>
                                    <span className="pl-3 text-gray-300 group-hover:text-gray-200">{line}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}

                          {adminScanResult.fixOptions?.length > 0 && !adminRepairResult && (
                            <div className="-mt-px border-x-2 border-b-2 border-red-500/30 rounded-b-lg overflow-hidden bg-[#0d1117]">
                              <div className="p-2 space-y-2">
                                {adminScanResult.fixOptions.map((fix) => (
                                  <button
                                    key={fix.fixIndex}
                                    onClick={() => onAdminRepair(adminScanResult.targetId, fix.fixIndex)}
                                    className="w-full text-left text-[11px] font-mono font-semibold tracking-wide px-4 py-3 rounded-[10px] border border-green-500/50 bg-[#112019] text-green-200 hover:bg-[#153025] hover:border-green-400/80 transition-all flex items-center gap-2.5 whitespace-nowrap overflow-hidden"
                                  >
                                    <span className="text-green-400 flex-shrink-0"><Wrench size={15} /></span>
                                    <span className="truncate">{simplifyFixLabel(fix.label)}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {adminRepairResult && (
                    <div className={`cyber-card animate-slide-up space-y-2 ${
                      adminRepairResult.repaired
                        ? 'border-green-500/40 bg-[#0d1117]'
                        : adminRepairResult.wrongFix
                        ? 'border-red-500/40 bg-[#0d1117]'
                        : 'border-yellow-500/40 bg-[#0d1117]'
                    }`}>
                      <h3 className={`text-xs uppercase tracking-wider font-bold flex items-center gap-1.5 ${
                        adminRepairResult.repaired ? 'text-green-400' : adminRepairResult.wrongFix ? 'text-red-400' : 'text-yellow-400'
                      }`}>
                        {adminRepairResult.repaired
                          ? <><CheckCircle size={14} /> Repair Successful</>
                          : adminRepairResult.wrongFix
                          ? <><XCircle size={14} /> Wrong Fix!</>
                          : <><CheckCircle size={14} /> Repair Result</>
                        }
                      </h3>
                      <p className={`text-sm ${adminRepairResult.repaired ? 'text-green-300' : adminRepairResult.wrongFix ? 'text-red-300' : 'text-yellow-300'}`}>
                        {adminRepairResult.repaired
                          ? `The corrupted code has been repaired successfully. ${adminRepairResult.targetName} is safe!`
                          : adminRepairResult.wrongFix
                          ? `Wrong fix chosen! ${adminRepairResult.targetName} has been eliminated due to the failed repair attempt.`
                          : 'No corrupted code was available to repair.'}
                      </p>
                    </div>
                  )}

                </div>
              )}

              {/* QA sunrise panel */}
              {myRole === ROLES.SECURITY_LEAD && amAlive && (
                <div className="cyber-card border-yellow-500/30 bg-[#0d1117] space-y-3">
                  <h3 className="text-xs uppercase tracking-wider text-yellow-400 font-bold mb-2 flex items-center gap-1.5">
                    <SunriseIcon size={14} /> QA — Scan Suspects
                  </h3>
                  <p className="text-sm text-red-400 font-bold text-center mb-3">
                    You have 1 chance to guess who is the hacker
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {alivePlayers.filter(p => p.id !== myId).map((p, idx) => (
                      <button
                        key={p.id}
                        onClick={() => onSecurityScan(p.id)}
                        className="flex flex-col items-center gap-2 p-4 rounded-lg border border-yellow-500/30 bg-[#121826] text-yellow-300 hover:bg-[#1a2338] hover:border-yellow-400/60 hover:scale-105 transition-all animate-slide-up"
                        style={{ animationDelay: `${idx * 60}ms`, animationFillMode: 'both' }}
                      >
                        <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(p.name)}`} alt={p.name} className="w-12 h-12 rounded-full bg-black/40 border border-yellow-500/30" />
                        <span className="font-semibold text-sm">{p.name}</span>
                        <span className="text-[10px] text-yellow-400/70 flex items-center gap-1"><Search size={10} /> Scan</span>
                      </button>
                    ))}
                  </div>
                  {/* Scan result code - independent box below all players */}
                  {securityScanResult && Array.isArray(securityScanResult.codeFiles) && securityScanResult.codeFiles.length > 0 && (
                    <div className="rounded border border-gray-700/60 bg-[#0d1117] overflow-hidden">
                      <div className="px-2 py-1 border-b border-gray-700/60 text-[10px] font-mono text-cyan-300">
                        {securityScanResult.codeFiles[0].name}
                      </div>
                      <pre className="m-0 p-2 text-[11px] leading-5 text-gray-300 font-mono whitespace-pre-wrap break-words">
                        {securityScanResult.codeFiles[0].code}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* Developer / Hacker panel during sunrise */}
              {myRole !== ROLES.ADMIN && myRole !== ROLES.SECURITY_LEAD && amAlive && (
                myRole === ROLES.DEVELOPER ? (
                  <div className="text-sm p-3 rounded-lg border border-blue-500/35 bg-blue-900/20 text-blue-200">
                    Read your code while you wait.
                  </div>
                ) : (
                  <div className={`cyber-card ${isNightReview ? 'border-red-900/30 bg-red-950/10' : 'border-orange-500/30 bg-orange-900/10'}`}>
                    <h3 className={`text-xs uppercase tracking-wider font-bold mb-2 flex items-center gap-1.5 ${isNightReview ? 'text-red-400' : 'text-orange-400'}`}>
                      {isNightReview ? <AlertTriangle size={14} /> : <SunriseIcon size={14} />} {isNightReview ? 'Attack Detected — Admin Reviewing' : 'Sunrise — Review Your Code'}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {isNightReview
                        ? 'An attack was detected. The Admin is reviewing the corrupted code…'
                        : 'Review your code below while the Admin and QA investigate.'}
                    </p>
                  </div>
                )
              )}

              {!amAlive && (
                <div className="cyber-card border-gray-600/30">
                  <h3 className="text-xs uppercase tracking-wider text-red-400 font-bold mb-2 flex items-center gap-1.5">
                    <Skull size={14} /> Eliminated
                  </h3>
                  <p className="text-sm text-gray-500">
                    {isNightReview
                      ? 'You have been terminated. The Admin is reviewing corrupted code in night mode.'
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
