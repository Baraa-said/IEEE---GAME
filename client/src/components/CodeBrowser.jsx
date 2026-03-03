import React, { useState, useEffect } from 'react';
import { ROLES, PHASES } from '../shared/constants';
import { getAvatarForPlayer } from '../utils/avatars';

/**
 * CodeBrowser – Interactive C-code file viewer with manual night actions.
 *
 * DAY  : Players see ONLY their own code.
 * NIGHT:
 *   - Hackers: After agreeing on a target, vote as a team on which corruption to inject.
 *   - Admin: Browse up to 2 players' code to visually find obvious bugs (runtime errors), then repair.
 *   - Security Lead: Browse up to 2 players' code to manually look for hacker function names.
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
  // Security Lead (browse only)
  securityScanResult,
  // Browse other player's code
  onGetPlayerCode,
  playerCodeData,
  fellowHackers,
}) {
  const [selectedPlayerId, setSelectedPlayerId] = useState(myId);
  const [selectedFileIdx, setSelectedFileIdx] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
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

  // When security lead selects a different player at sunrise, request their code
  // When hacker selects during night (via agreed target), code comes from vote status
  useEffect(() => {
    if (selectedPlayerId && selectedPlayerId !== myId) {
      // Security Lead browses during sunrise
      if (isSunrise && myRole === ROLES.SECURITY_LEAD) {
        onGetPlayerCode?.(selectedPlayerId);
      }
      // Hackers browse during night
      if (isNight && myRole === ROLES.HACKER) {
        onGetPlayerCode?.(selectedPlayerId);
      }
    }
  }, [selectedPlayerId, isNight, isSunrise, myRole, myId]);

  if (!codeFiles || Object.keys(codeFiles).length === 0) return null;

  // Merge playerCodeData (from security lead browse)
  const viewableCode = { ...codeFiles };
  if (playerCodeData && playerCodeData.targetId && playerCodeData.files) {
    viewableCode[playerCodeData.targetId] = {
      playerName: playerCodeData.playerName,
      files: playerCodeData.files,
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

  const selectedPlayer = selectedPlayerId ? viewableCode[selectedPlayerId] : null;
  const selectedFile = selectedPlayer?.files?.[selectedFileIdx];

  // Injection options — from hackerVoteStatus when target is agreed
  const injectionOptions = (hackerVoteStatus?.agreed && hackerVoteStatus?.injectionOptions) || [];
  const alreadyInjected = hackerInjectResult?.success || false;

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

    // NIGHT: Hacker sees agreed target + self
    if (isNight && myRole === ROLES.HACKER) {
      const self = [{ id: myId, name: alivePlayers?.find(p => p.id === myId)?.name || 'You' }];
      if (hackerVoteStatus?.agreed && hackerVoteStatus?.agreedTarget) {
        const targetName = hackerVoteStatus.agreedTargetName || 'Target';
        self.push({ id: hackerVoteStatus.agreedTarget, name: targetName });
      }
      return self;
    }

    // SUNRISE Admin: own code + scanned corrupted player (if any)
    if (isSunrise && myRole === ROLES.ADMIN) {
      const self = [{ id: myId, name: alivePlayers?.find(p => p.id === myId)?.name || 'You' }];
      if (adminScanResult?.corrupted && adminScanResult?.targetId) {
        self.push({ id: adminScanResult.targetId, name: adminScanResult.targetName });
      }
      return self;
    }

    // SUNRISE Security Lead: can browse alive players
    if (isSunrise && myRole === ROLES.SECURITY_LEAD) {
      return alivePlayers || [];
    }

    // Everyone else: own code only
    return [{ id: myId, name: alivePlayers?.find(p => p.id === myId)?.name || 'You' }];
  };

  const selectablePlayers = getSelectablePlayers();

  // ─── Render ───
  return (
    <div className={`cyber-card flex flex-col ${isMinimized ? 'h-auto' : 'h-full'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-cyber-green text-sm">📁</span>
          <h3 className="text-xs uppercase tracking-wider text-gray-400 font-bold">
            {isNight ? 'Code Files (Night)' : isSunrise ? 'Code Files (Sunrise)' : 'My Code Files'}
          </h3>
          {/* View counter for admin/security */}
          {isSunrise && (myRole === ROLES.ADMIN || myRole === ROLES.SECURITY_LEAD) && (
            <span className="text-[10px] px-2 py-0.5 rounded bg-cyber-darker border border-cyber-border text-gray-400">
              Views: {viewsUsed}/{viewsMax}
            </span>
          )}
        </div>
        <button
          onClick={() => setIsMinimized(!isMinimized)}
          className="text-xs text-gray-500 hover:text-gray-300 px-2"
        >
          {isMinimized ? '▲ Expand' : '▼ Minimize'}
        </button>
      </div>

      {isMinimized ? null : (
        <div className="flex flex-col flex-1 min-h-0 gap-2">
          {/* Player selector */}
          <div className="flex gap-1 flex-wrap">
            {selectablePlayers.map((p) => {
              const pid = p.id;
              const pName = p.name || viewableCode[pid]?.playerName || 'Unknown';
              const isSelected = pid === selectedPlayerId;
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

          {/* ═══ HACKER: Injection Voting Panel ═══ */}
          {myRole === ROLES.HACKER && isNight && (
            <div className="space-y-2">
              {!hackerVoteStatus?.agreed ? (
                <div className="text-xs p-2 rounded border bg-gray-800 border-gray-600 text-gray-400">
                  🕷️ Waiting for all hackers to agree on a target…
                </div>
              ) : alreadyInjected ? (
                <div className="text-xs p-3 rounded border bg-red-900/20 border-red-500/30 text-red-400">
                  ✅ Injection complete! Your team has corrupted <span className="font-bold">{hackerVoteStatus.agreedTargetName}</span>'s code.
                  {hackerInjectResult && (
                    <p className="mt-1 text-[10px]">💉 {hackerInjectResult.desc} in <span className="font-mono">{hackerInjectResult.fileName}</span></p>
                  )}
                </div>
              ) : (
                <>
                  <div className="p-2 rounded border bg-red-900/10 border-red-500/20">
                    <p className="text-[10px] uppercase tracking-wider text-red-400 font-bold mb-1">
                      💉 Vote on Corruption for {hackerVoteStatus.agreedTargetName}
                    </p>
                    <p className="text-[9px] text-gray-500">
                      All hackers must agree on the same injection. Browse the target's code above, then vote below.
                    </p>
                  </div>

                  {/* Inject vote status */}
                  {hackerInjectVoteStatus && (
                    <div className={`text-xs p-2 rounded border ${
                      hackerInjectVoteStatus.disagreement
                        ? 'bg-red-900/10 border-red-500/30'
                        : 'bg-cyber-darker border-cyber-red/20'
                    }`}>
                      {hackerInjectVoteStatus.disagreement && (
                        <p className="text-cyber-red font-bold mb-1">⚠️ You must ALL agree on the same injection! Votes reset.</p>
                      )}
                      {Object.values(hackerInjectVoteStatus.votes || {}).map((v, i) => (
                        <p key={i} className="text-gray-400">
                          🕷️ {v.hackerName} → <span className="text-red-300 font-mono text-[10px]">{v.fileName}: {v.desc}</span>
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

                  {/* Show injection options per file */}
                  <button
                    onClick={() => setShowInjectPanel(!showInjectPanel)}
                    className="text-[10px] text-gray-500 hover:text-gray-300 px-1"
                  >
                    {showInjectPanel ? '▲ Hide Injection Options' : '▼ Show Injection Options'}
                  </button>

                  {showInjectPanel && (
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {injectionOptions.length === 0 ? (
                        <p className="text-xs text-gray-500 p-2">No injection options available for this target.</p>
                      ) : (
                        injectionOptions.map((opt) => (
                          <div key={opt.fileIdx} className="space-y-0.5">
                            <p className="text-[9px] text-gray-500 font-mono px-1">📄 {opt.fileName}:</p>
                            {opt.patches.map((patch, i) => (
                              <button
                                key={i}
                                onClick={() => onHackerInjectVote?.(opt.fileIdx, patch.patchIdx)}
                                className="w-full text-left text-xs px-3 py-1.5 rounded border border-red-500/20 bg-red-900/10 text-red-300 hover:bg-red-900/30 hover:border-red-500/40 transition-all flex items-center gap-2"
                              >
                                <span className="text-red-500">⚡</span>
                                <span>{patch.desc}</span>
                              </button>
                            ))}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ═══ ADMIN: Scan-Result-Driven Repair Panel ═══ */}
          {myRole === ROLES.ADMIN && isSunrise && selectedPlayerId !== myId && (
            <div className="space-y-2">
              {/* No scan result for this player yet */}
              {(!adminScanResult || adminScanResult.targetId !== selectedPlayerId) && (
                <div className="text-xs p-3 rounded border bg-blue-900/10 border-blue-500/20 text-blue-300">
                  🔍 Scan this player from the panel above to check for corruption.
                </div>
              )}

              {/* Scan result: CLEAN */}
              {adminScanResult && adminScanResult.targetId === selectedPlayerId && !adminScanResult.corrupted && (
                <div className="text-xs p-3 rounded border bg-green-900/20 border-green-500/30 text-green-400 font-semibold">
                  ✅ Code is clean — no corruption found. Code view is locked.
                </div>
              )}

              {/* Scan result: CORRUPTED — show repair options */}
              {adminScanResult && adminScanResult.targetId === selectedPlayerId && adminScanResult.corrupted && (
                <div className="space-y-2">
                  <div className="p-2 rounded border bg-red-900/15 border-red-500/30">
                    <p className="text-[10px] uppercase tracking-wider text-red-400 font-bold mb-1">
                      ⚠️ Corruption Found in {adminScanResult.targetName}'s Code
                    </p>
                    <p className="text-[9px] text-gray-400">
                      Infected file: <span className="font-mono text-red-300">{adminScanResult.fileName}</span> — {adminScanResult.corruptionDesc}
                    </p>
                    <p className="text-[9px] text-gray-500 mt-1">
                      Inspect the code below, then apply the fix.
                    </p>
                  </div>

                  {/* Repair options — mirrors hacker inject panel */}
                  {adminRepairResult && adminRepairResult.targetId === adminScanResult.targetId ? (
                    <div className={`text-xs p-2 rounded border ${
                      adminRepairResult.repaired
                        ? 'bg-green-900/20 border-green-500/30 text-green-400'
                        : 'bg-gray-800 border-gray-600 text-gray-400'
                    }`}>
                      {adminRepairResult.repaired
                        ? <p>🔧 Fixed <span className="font-mono">{adminRepairResult.fileName}</span> — code restored!</p>
                        : <p>⚠️ Nothing was repaired — code may already be clean.</p>
                      }
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {(adminScanResult.repairOptions || []).map((opt) => (
                        <div key={opt.fileIdx} className="space-y-0.5">
                          <p className="text-[9px] text-gray-500 font-mono px-1">📄 {opt.fileName}:</p>
                          {opt.fixes.map((fix, i) => (
                            <button
                              key={i}
                              onClick={() => onAdminRepair?.(adminScanResult.targetId)}
                              className="w-full text-left text-xs px-3 py-1.5 rounded border border-green-500/30 bg-green-900/15 text-green-300 hover:bg-green-900/40 hover:border-green-500/50 transition-all flex items-center gap-2"
                            >
                              <span className="text-green-400">🔧</span>
                              <span>Fix: {fix.desc}</span>
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ═══ SECURITY LEAD: Manual Browse Panel ═══ */}
          {myRole === ROLES.SECURITY_LEAD && isSunrise && selectedPlayerId !== myId && (
            <div className="space-y-2">
              <div className="p-2 rounded border bg-yellow-900/10 border-yellow-500/20">
                <p className="text-[10px] uppercase tracking-wider text-cyber-yellow font-bold">
                  🔍 Reviewing {viewableCode[selectedPlayerId]?.playerName || 'player'}'s code
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

          {/* ═══ SECURITY LEAD: Instruction when viewing own code ═══ */}
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
          {(myRole === ROLES.ADMIN && isSunrise && selectedPlayerId !== myId &&
            adminScanResult && adminScanResult.targetId === selectedPlayerId && !adminScanResult.corrupted)
            ? null
            : selectedPlayer ? (
              <>
                {/* File tabs */}
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
                      📄 {file.name}
                      {/* Highlight infected file */}
                      {myRole === ROLES.ADMIN && adminScanResult?.corrupted &&
                       adminScanResult?.fileIdx === idx && (
                        <span className="text-red-400 ml-1">⚠️</span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Code display */}
                <div className="flex-1 overflow-auto bg-[#0d1117] rounded border border-gray-800 min-h-0">
                  <div className="p-0 font-mono text-xs leading-5 whitespace-pre overflow-x-auto">
                    {selectedFile && renderCode(selectedFile.code)}
                  </div>
                </div>
              </>
            ) : (
              <p className="text-xs text-gray-500 text-center py-4">No code to display.</p>
            )
          }
        </div>
      )}
    </div>
  );
}
