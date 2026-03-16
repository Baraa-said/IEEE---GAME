import React, { useState, useEffect } from 'react';
import { ROLES, PHASES } from '../shared/constants';
import { getAvatarForPlayer } from '../utils/avatars';
import { Folder, Bug, CheckCircle, Syringe, AlertTriangle, Search, File, Zap } from 'lucide-react';

/**
 * CodeBrowser – Interactive C-code file viewer with manual night actions.
 *
 * DAY  : Players see ONLY their own code.
 * NIGHT:
 *   - Hackers: After agreeing on a target, vote as a team on which corruption to inject.
 *   - Admin: Browse up to 2 players' code to visually find obvious bugs (runtime errors), then repair.
 *   - QA: Browse up to 2 players' code to manually look for hacker function names.
 */
export default function CodeBrowser({
  codeFiles,           // { [myId]: { playerName, files: [{name, code}] } }
  myId,
  myRole,
  alivePlayers,
  phase,
  isNight,
  isSunrise,
  // Hacker inject vote
  onHackerInjectVote,
  hackerInjectResult,
  hackerVoteStatus,          // { agreed, agreedTarget, agreedTargetName, injectionOptions, targetCode }
  hackerInjectVoteStatus,    // { votes, totalHackers, allVoted, disagreement }
  // Admin repair
  onAdminRepair,
  adminRepairResult,
  onAdminScanCorruption,
  adminScanResult,
  // QA (browse only)
  securityScanResult,
  // Browse other player's code
  onGetPlayerCode,
  playerCodeData,
  hackerInjected,
  fellowHackers,
  nightResult,
  phaseEndTime,
}) {
  const [now, setNow] = React.useState(Date.now());

  React.useEffect(() => {
    if (!phaseEndTime) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [phaseEndTime]);
  const [selectedPlayerId, setSelectedPlayerId] = useState(myId);
  const [selectedFileIdx, setSelectedFileIdx] = useState(0);
  const [showInjectPanel, setShowInjectPanel] = useState(true);

  // During day, always show own code
  useEffect(() => {
    if (!isNight && !isSunrise) {
      setSelectedPlayerId(myId);
      setSelectedFileIdx(0);
      setShowInjectPanel(true);
    }
  }, [isNight, isSunrise, myId]);

  // Reset file index when switching players
  useEffect(() => {
    setSelectedFileIdx(0);
  }, [selectedPlayerId]);

  // NIGHT: hackers should only see the agreed target after both hackers agree.
  useEffect(() => {
    if (isNight && myRole === ROLES.HACKER) {
      if (hackerVoteStatus?.agreed && hackerVoteStatus?.agreedTarget) {
        setSelectedPlayerId(hackerVoteStatus.agreedTarget);
      } else {
        setSelectedPlayerId(myId);
      }
      setSelectedFileIdx(0);
      setShowInjectPanel(true);
    }
  }, [isNight, myRole, myId, hackerVoteStatus?.agreed, hackerVoteStatus?.agreedTarget]);

  // When selecting a different player, request their code from the server
  useEffect(() => {
    if (selectedPlayerId && selectedPlayerId !== myId) {
      const canRequestCode = !isNight || myRole !== ROLES.HACKER
        || (hackerVoteStatus?.agreed && selectedPlayerId === hackerVoteStatus.agreedTarget);

      if (canRequestCode) {
        onGetPlayerCode?.(selectedPlayerId);
      }
    }
  }, [selectedPlayerId, isNight, isSunrise, myRole, myId, onGetPlayerCode, hackerVoteStatus?.agreed, hackerVoteStatus?.agreedTarget]);

  if (!codeFiles || Object.keys(codeFiles).length === 0) return null;

  const isNightReview = isNight && !!hackerInjected;

  // During NIGHT: hide code for everyone until the night resolution completes.
  // Exception: hackers who have already agreed on a target should be able to
  // view the agreed target's files (so they can choose the injection).
  if (isNight && !nightResult?.eliminated) {
    const isHacker = myRole === ROLES.HACKER;
    const qaCanReviewNow = myRole === ROLES.SECURITY_LEAD && isNightReview;

    // Once QA review starts, the QA panel is the source of truth; hide this placeholder.
    if (qaCanReviewNow) {
      return null;
    }

    // After hacker injection, let developers see their own code
    if (!isHacker && !(myRole === ROLES.DEVELOPER && hackerInjected)) {
      return (
        <div className="cyber-card p-3 text-xs text-gray-400">
          Code is hidden while the night is in progress. It will be revealed after hackers finish their action.
        </div>
      );
    }

    if (!hackerVoteStatus?.agreed || !hackerVoteStatus?.agreedTarget) {
      return (
        <div className="cyber-card p-3 text-xs text-gray-400">
          Hackers must both agree on one player first. After agreement, the selected player's code will appear here.
        </div>
      );
    }
  }

  // Admin: hide code at sunrise until a successful elimination occurred last night
  if (myRole === ROLES.ADMIN && isSunrise && !nightResult?.eliminated) {
    return (
      <div className="cyber-card p-3 text-xs text-gray-400">
        Code will be revealed after last night's elimination.
      </div>
    );
  }

  // Global: during sunrise, don't reveal code until scheduled `phaseEndTime`.
  if (isSunrise && phaseEndTime && now < phaseEndTime) {
    const secondsLeft = Math.max(0, Math.ceil((phaseEndTime - now) / 1000));
    return (
      <div className="cyber-card p-3 text-xs text-gray-400">
        Code will be revealed in {secondsLeft}s.
      </div>
    );
  }

  // Merge playerCodeData (from browse requests — QA, hacker, etc.)
  const viewableCode = { ...codeFiles };
  if (playerCodeData && playerCodeData.targetId && playerCodeData.files) {
    const pName = playerCodeData.playerName || 'Unknown';
    viewableCode[playerCodeData.targetId] = {
      playerName: pName,
      files: playerCodeData.files.map(f => ({
        ...f,
        name: pName.replace(/\s+/g, '_') + '.c',
      })),
    };
  }
  // For admin scan result: merge corrupted player's code if scan found corruption
  if (myRole === ROLES.ADMIN && adminScanResult?.corrupted && adminScanResult?.files) {
    viewableCode[adminScanResult.targetId] = {
      playerName: adminScanResult.targetName,
      files: adminScanResult.files,
    };
  }

  // For hackers with agreed target, merge the target code from vote status
  if (myRole === ROLES.HACKER && hackerVoteStatus?.agreed && hackerVoteStatus?.targetCode) {
    viewableCode[hackerVoteStatus.agreedTarget] = {
      playerName: hackerVoteStatus.agreedTargetName,
      files: hackerVoteStatus.targetCode.files,
    };
  }

  // Developers should only see a single C file named `developer.c`.
  if (myRole === ROLES.DEVELOPER) {
    Object.keys(viewableCode).forEach((pid) => {
      const player = viewableCode[pid];
      const origFiles = player?.files || [];
      // Prefer an existing .c file
      const cfile = origFiles.find(f => /\.c$/i.test(f.name));
      let code = '';
      if (cfile) {
        code = cfile.code;
      } else if (origFiles.length > 0) {
        // Fallback: concatenate other files with headers
        code = origFiles.map(f => `// ${f.name}\n${f.code}`).join('\n\n');
      } else {
        code = '// developer.c\n// No code available.';
      }
      const playerNameSafe = (player && player.playerName) ? player.playerName.replace(/\s+/g, '_') : 'developer';
      viewableCode[pid] = {
        ...player,
        files: [{ name: `${playerNameSafe}.c`, code }],
      };
    });
  }

  const displayedCode = (() => {
    if (isNight && myRole === ROLES.HACKER) {
      if (hackerVoteStatus?.agreed && hackerVoteStatus?.agreedTarget && viewableCode[hackerVoteStatus.agreedTarget]) {
        return {
          [hackerVoteStatus.agreedTarget]: viewableCode[hackerVoteStatus.agreedTarget],
        };
      }
      return {};
    }
    return viewableCode;
  })();

  const effectiveSelectedPlayerId =
    isNight && myRole === ROLES.HACKER && hackerVoteStatus?.agreed && hackerVoteStatus?.agreedTarget
      ? hackerVoteStatus.agreedTarget
      : selectedPlayerId;

  const selectedPlayer = effectiveSelectedPlayerId ? displayedCode[effectiveSelectedPlayerId] : null;
  const selectedFile = selectedPlayer?.files?.[selectedFileIdx];

  // Injection options — from hackerVoteStatus OR from playerCodeData (browse)
  const injectionOptions = 
    (hackerVoteStatus?.agreed && hackerVoteStatus?.injectionOptions) ||
    (playerCodeData?.injectionOptions && playerCodeData?.targetId === selectedPlayerId ? playerCodeData.injectionOptions : null) ||
    [];
  const alreadyInjected = hackerInjectResult?.success || playerCodeData?.alreadyInjected || false;

  // Get injection options for the currently selected file
  const currentFileInjections = injectionOptions.find(o => o.fileIdx === selectedFileIdx);

  // View counts for admin/security
  const viewsUsed = playerCodeData?.viewsUsed ?? 0;
  const viewsMax = playerCodeData?.viewsMax ?? 2;

  // C syntax highlighting
  function syntaxHighlightC(line) {
    let result = line
      .replace(/\b(int|float|char|void|double|long|short|unsigned|signed|const|static|struct|typedef|enum|union|extern|return|if|else|for|while|do|switch|case|break|continue|default|sizeof|NULL|FILE|EOF)\b/g, '%%KW%%$1%%/KW%%')
      .replace(/\b(printf|scanf|fprintf|fscanf|fopen|fclose|malloc|calloc|realloc|free|memset|memcpy|strlen|strcmp|strcpy|strcat|sprintf|fgetc|fputc|fread|fwrite|system|time|strftime|localtime)\b/g, '%%FN%%$1%%/FN%%')
      .replace(/(#include\s*<[^>]+>)/g, '%%PP%%$1%%/PP%%')
      .replace(/(#include\s*"[^"]+")/g, '%%PP%%$1%%/PP%%')
      .replace(/(#define\s+\w+)/g, '%%PP%%$1%%/PP%%')
      .replace(/\b(\d+\.?\d*[fF]?)\b/g, '%%NUM%%$1%%/NUM%%')
      .replace(/(\/\*.*?\*\/)/g, '%%CMT%%$1%%/CMT%%')
      .replace(/(\/\/.*$)/g, '%%CMT%%$1%%/CMT%%')
      .replace(/("[^"]*")/g, '%%STR%%$1%%/STR%%');

    const segments = result.split(/(%%\/?(?:KW|FN|PP|NUM|CMT|STR)%%)/g);
    let inTag = null;
    const rendered = [];
    for (let j = 0; j < segments.length; j++) {
      const seg = segments[j];
      if (seg === '%%KW%%') { inTag = 'kw'; continue; }
      if (seg === '%%/KW%%') { inTag = null; continue; }
      if (seg === '%%FN%%') { inTag = 'fn'; continue; }
      if (seg === '%%/FN%%') { inTag = null; continue; }
      if (seg === '%%PP%%') { inTag = 'pp'; continue; }
      if (seg === '%%/PP%%') { inTag = null; continue; }
      if (seg === '%%NUM%%') { inTag = 'num'; continue; }
      if (seg === '%%/NUM%%') { inTag = null; continue; }
      if (seg === '%%CMT%%') { inTag = 'cmt'; continue; }
      if (seg === '%%/CMT%%') { inTag = null; continue; }
      if (seg === '%%STR%%') { inTag = 'str'; continue; }
      if (seg === '%%/STR%%') { inTag = null; continue; }
      if (seg === '') continue;

      const cls = inTag === 'kw' ? 'text-purple-400'
        : inTag === 'fn' ? 'text-cyan-400'
        : inTag === 'pp' ? 'text-red-400'
        : inTag === 'num' ? 'text-orange-400'
        : inTag === 'cmt' ? 'text-gray-500 italic'
        : inTag === 'str' ? 'text-green-400'
        : '';
      rendered.push(cls ? <span key={j} className={cls}>{seg}</span> : <span key={j}>{seg}</span>);
    }
    return <>{rendered}</>;
  }

  function renderCode(code) {
    if (!code) return null;
    const lines = code.split('\n');
    return lines.map((line, i) => (
      <div key={i} className="flex hover:bg-white/5">
        <span className="select-none text-gray-600 text-right pr-3 pl-2 min-w-[3rem] border-r border-gray-700/50">
          {i + 1}
        </span>
        <span className="pl-3 text-gray-300">
          {syntaxHighlightC(line)}
        </span>
      </div>
    ));
  }

  // ── Who can be selected to view ──
  const getSelectablePlayers = () => {
    // Day: own code only
    if (!isNight && !isSunrise) {
      return [{ id: myId, name: alivePlayers?.find(p => p.id === myId)?.name || 'You' }];
    }

    // NIGHT: Hacker sees only the agreed target
    if (isNight && myRole === ROLES.HACKER) {
      if (hackerVoteStatus?.agreed && hackerVoteStatus?.agreedTarget) {
        return [{
          id: hackerVoteStatus.agreedTarget,
          name: hackerVoteStatus.agreedTargetName || displayedCode[hackerVoteStatus.agreedTarget]?.playerName || 'Selected Player',
        }];
      }
      return [];
    }

    // SUNRISE Admin: own code + scanned corrupted player (if any)
    if (isSunrise && myRole === ROLES.ADMIN) {
      const self = [{ id: myId, name: alivePlayers?.find(p => p.id === myId)?.name || 'You' }];
      if (adminScanResult?.corrupted && adminScanResult?.targetId) {
        self.push({ id: adminScanResult.targetId, name: adminScanResult.targetName });
      }
      return self;
    }

    // SUNRISE QA: can browse alive players
    if (isSunrise && myRole === ROLES.SECURITY_LEAD) {
      return alivePlayers || [];
    }

    // Everyone else: own code only
    return [{ id: myId, name: alivePlayers?.find(p => p.id === myId)?.name || 'You' }];
  };

  const selectablePlayers = getSelectablePlayers();

  // ─── Render ───
  return (
    <div className={`cyber-card flex flex-col h-full`}>
      {/* Header: centered title + filename for single-file cases */}
      <div className="flex flex-col items-center mb-2">
        <h3 className="text-xs uppercase tracking-wider text-gray-400 font-bold">CODE FILES</h3>
        {isSunrise && (myRole === ROLES.ADMIN || myRole === ROLES.SECURITY_LEAD) && (
          <span className="text-[10px] mt-1 px-2 py-0.5 rounded bg-cyber-darker border border-cyber-border text-gray-400">
            Views: {viewsUsed}/{viewsMax}
          </span>
        )}
      </div>

      <div className="flex flex-col flex-1 min-h-0 gap-2">
          {/* Player selector — show when >1 OR when a single hacker target is displayed */}
          {(selectablePlayers.length > 1 || (selectablePlayers.length === 1 && isNight && myRole === ROLES.HACKER)) && (
            <div className="flex gap-1 flex-wrap">
              {selectablePlayers.map((p) => {
              const pid = p.id;
              const pName = p.name || displayedCode[pid]?.playerName || 'Unknown';
              const isSelected = pid === effectiveSelectedPlayerId;
              const isMe = pid === myId;
              return (
                <button
                  key={pid}
                  onClick={() => setSelectedPlayerId(pid)}
                  className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded transition-all ${
                    isSelected
                      ? 'bg-cyber-green/20 text-cyber-green border border-cyber-green/40'
                      : 'bg-cyber-darker text-gray-400 hover:text-gray-200 border border-transparent'
                  } ${isMe ? 'ring-1 ring-cyber-blue/30' : ''}`}
                >
                  <img
                    src={getAvatarForPlayer(pName)}
                    alt={pName}
                    className="w-4 h-4 rounded-full"
                  />
                  <span>{pName}</span>
                  {isMe && <span className="text-[8px] text-cyber-blue">(you)</span>}
                </button>
              );
              })}
            </div>
          )}

          {/* ═══ HACKER: Injection Voting Panel ═══ */}
          {myRole === ROLES.HACKER && isNight && selectedPlayerId !== myId && (
            <div className="space-y-2">
              {alreadyInjected ? (
                <div className="text-xs p-3 rounded border bg-red-900/20 border-red-500/30 text-red-400">
                  <span className="flex items-center gap-1"><CheckCircle size={12} /> Injection complete! Code has been corrupted.</span>
                  {hackerInjectResult && (
                    <p className="mt-1 text-[10px] flex items-center gap-1"><Syringe size={10} /> {hackerInjectResult.desc} in <span className="font-mono">{hackerInjectResult.fileName}</span></p>
                  )}
                </div>
              ) : (
                <>
                  {/* Inject vote status */}
                  {hackerInjectVoteStatus && (
                    <div className={`text-xs p-2 rounded border ${
                      hackerInjectVoteStatus.disagreement
                        ? 'bg-red-900/10 border-red-500/30'
                        : 'bg-cyber-darker border-cyber-red/20'
                    }`}>
                      {hackerInjectVoteStatus.disagreement && (
                        <p className="text-cyber-red font-bold mb-1 flex items-center gap-1"><AlertTriangle size={12} /> You must ALL agree on the same injection! Votes reset.</p>
                      )}
                      {Object.values(hackerInjectVoteStatus.votes || {}).map((v, i) => (
                        <p key={i} className="text-gray-400 flex items-center gap-1">
                          <Bug size={10} /> {v.hackerName} → <span className="text-red-300 font-mono text-[10px]">{v.fileName}: {v.desc}</span>
                        </p>
                      ))}
                      {!hackerInjectVoteStatus.disagreement && (
                        <p className="text-gray-500 mt-1 text-[10px]">
                          {hackerInjectVoteStatus.allVoted
                            ? '✓ All hackers voted'
                            : `${Object.keys(hackerInjectVoteStatus.votes || {}).length}/${hackerInjectVoteStatus.totalHackers} hackers voted`}
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ═══ ADMIN: Code-view note (repair options are in the panel above) ═══ */}
          {myRole === ROLES.ADMIN && isSunrise && selectedPlayerId !== myId && (
            <div className="space-y-2">
              {(!adminScanResult || adminScanResult.targetId !== selectedPlayerId) && (
                <div className="text-xs p-3 rounded border bg-blue-900/10 border-blue-500/20 text-blue-300 flex items-center gap-1">
                  <Search size={12} /> Scan this player from the panel above to reveal their code.
                </div>
              )}
              {adminScanResult && adminScanResult.targetId === selectedPlayerId && !adminScanResult.corrupted && (
                <div className="text-xs p-3 rounded border bg-green-900/20 border-green-500/30 text-green-400 font-semibold flex items-center gap-1">
                  <CheckCircle size={12} /> Code is clean — no corruption found.
                </div>
              )}
              {adminScanResult && adminScanResult.targetId === selectedPlayerId && adminScanResult.corrupted && (
                <div className="text-xs p-2 rounded border bg-red-900/10 border-red-500/20 text-red-400">
                  <AlertTriangle size={12} className="inline mr-1" /> Corrupted code detected — use the correction options at the bottom.
                </div>
              )}
            </div>
          )}

          {/* ═══ QA: Manual Browse Panel ═══ */}
          {myRole === ROLES.SECURITY_LEAD && isSunrise && selectedPlayerId !== myId && (
            <div className="space-y-2">
              <div className="p-2 rounded border bg-yellow-900/10 border-yellow-500/20">
                <p className="text-[10px] uppercase tracking-wider text-cyber-yellow font-bold flex items-center gap-1">
                  <Search size={10} /> Reviewing {displayedCode[effectiveSelectedPlayerId]?.playerName || 'player'}'s code
                </p>
                <p className="text-[9px] text-gray-500 mt-1">
                  Look for suspicious function names like <span className="font-mono text-red-400">exploit_buffer</span>,
                  <span className="font-mono text-red-400"> rootkit_load</span>,
                  <span className="font-mono text-red-400"> backdoor_connect</span>,
                  <span className="font-mono text-red-400"> inject_shellcode</span>,
                  <span className="font-mono text-red-400"> steal_credentials</span>,
                  <span className="font-mono text-red-400"> keylogger_record</span>.
                  If you see any — that player is a Hacker!
                </p>
              </div>
            </div>
          )}

          {/* ═══ QA: Instruction when viewing own code ═══ */}
          {myRole === ROLES.SECURITY_LEAD && isSunrise && selectedPlayerId === myId && (
            <div className="text-xs p-2 rounded border bg-yellow-900/10 border-yellow-500/20 text-yellow-400">
              👆 Select up to {viewsMax} players above to browse their code and look for hacker signatures.
            </div>
          )}

          {/* ═══ ADMIN: Instruction when viewing own code ═══ */}
          {myRole === ROLES.ADMIN && isSunrise && selectedPlayerId === myId && (
            <div className="text-xs p-2 rounded border bg-blue-900/10 border-blue-500/20 text-blue-400">
              Use the <span className="font-semibold">Scan Code for Corruption</span> buttons in the panel above to investigate players.
              Only corrupted code will be revealed here.
            </div>
          )}

          {/* Code display — gated for admin: hidden when scan says clean */}
          {(myRole === ROLES.ADMIN && isSunrise && effectiveSelectedPlayerId !== myId &&
            adminScanResult && adminScanResult.targetId === effectiveSelectedPlayerId && !adminScanResult.corrupted)
            ? null
            : selectedPlayer ? (
                <>
                  {/* If only one file (developer), show the filename centered under the title. Otherwise show tabs. */}
                  {selectedPlayer.files.length === 1 ? (
                    <div className="flex justify-center">
                      <div className="mt-1 mb-1 px-4 py-1.5 bg-cyber-darker rounded-md text-[12px] font-mono text-gray-200 border border-cyber-border flex items-center gap-2 shadow-sm">
                        <File size={13} className="text-cyber-blue" />
                        {selectedPlayer.files[0]?.name}
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-1 bg-cyber-darker rounded p-1 overflow-x-auto">
                      {selectedPlayer.files.map((file, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedFileIdx(idx)}
                          className={`text-[10px] font-mono px-2 py-1 rounded whitespace-nowrap transition-all flex items-center gap-1 ${
                            selectedFileIdx === idx
                              ? 'bg-gray-700 text-white'
                              : 'text-gray-500 hover:text-gray-300'
                          }`}
                        >
                          <File size={10} /> {file.name}
                          {/* Highlight infected file */}
                          {myRole === ROLES.ADMIN && adminScanResult?.corrupted &&
                           adminScanResult?.fileIdx === idx && (
                            <span className="text-red-400 ml-1"><AlertTriangle size={10} /></span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Code display */}
                  <div className="flex-1 overflow-auto bg-[#0d1117] rounded border border-gray-800 min-h-0">
                    <div className="p-0 font-mono text-[10px] leading-5 whitespace-pre-wrap break-all">
                      {selectedFile && renderCode(selectedFile.code)}
                    </div>
                  </div>

                  {/* ═══ Hacker: Injection options below the code ═══ */}
                  {myRole === ROLES.HACKER && isNight && selectedPlayerId !== myId && !alreadyInjected && (
                    <div className="mt-3">
                      <button
                        onClick={() => setShowInjectPanel(!showInjectPanel)}
                        className="w-full text-center text-[12px] font-bold text-red-400 hover:text-red-300 px-3 py-2.5 rounded-lg bg-red-900/15 border-2 border-red-500/30 hover:border-red-500/50 hover:bg-red-900/25 flex items-center justify-center gap-2 transition-all shadow-md"
                      >
                        <Syringe size={14} />
                        {showInjectPanel ? '▲ Hide Injection Options' : `▼ Show Injection Options (${injectionOptions.reduce((sum, o) => sum + o.patches.length, 0)} bugs available)`}
                      </button>

                      {showInjectPanel && (
                        <div className="mt-2 space-y-1.5 p-2">
                          {injectionOptions.length === 0 ? (
                            <p className="text-xs text-gray-500 p-3 text-center">No injection options available for this player's code.</p>
                          ) : (
                            injectionOptions.flatMap((opt) =>
                              opt.patches.map((patch, i) => (
                                <button
                                  key={`${opt.fileIdx}-${i}`}
                                  onClick={() => onHackerInjectVote?.(opt.fileIdx, patch.patchIdx)}
                                  className="w-full text-left text-xs px-3 py-2.5 rounded-lg border border-red-500/25 bg-red-900/10 text-red-300 hover:bg-red-900/30 hover:border-red-500/50 transition-all flex items-center gap-2 shadow-sm"
                                >
                                  <span className="text-red-500 flex-shrink-0"><Zap size={14} /></span>
                                  <span>{patch.desc}</span>
                                </button>
                              ))
                            )
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-xs text-gray-500 text-center py-4">No code to display.</p>
              )
          }
        </div>
    </div>
  );
}
