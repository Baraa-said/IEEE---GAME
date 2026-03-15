import React, { useState, useEffect, useCallback } from 'react';
import socket from './socket';
import { EVENTS, PHASES } from './shared/constants';
import LobbyScreen from './components/LobbyScreen';
import GameScreen from './components/GameScreen';
import GameOverScreen from './components/GameOverScreen';
import RoleRevealModal from './components/RoleRevealModal';
import ToastContainer from './components/Toast';
import { playPhaseChange, playChatNotif, playElimination, playJoinRoom, playPlayerJoined, playGameStart, playRoleReveal, playVoteResult, playDefenseStart, playProtectionSaved, playHackerInject, playScanClean, playScanCorrupted, playRepair, playWin, playLose, playSunrise, playHackerChat, playSendMessage, playSkip } from './utils/sounds';
import { applyThemeToDocument } from './utils/themes';
import SkyBackground from './components/SkyBackground';
import { RefreshCw, Skull, AlertTriangle } from 'lucide-react';

/**
 * App – Root component. Manages global game state received from the server
 * and renders the appropriate screen (Lobby → Game → GameOver).
 */
export default function App() {
  // ── Connection & identity ──
  const [connected, setConnected] = useState(false);
  const [roomId, setRoomId] = useState(() => sessionStorage.getItem('cw_roomId') || null);
  const [playerName, setPlayerName] = useState(() => sessionStorage.getItem('cw_playerName') || '');
  const [reconnecting, setReconnecting] = useState(false);

  // ── Game state ──
  const [gameState, setGameState] = useState(null);  // public state from server
  const [myRole, setMyRole] = useState(null);
  const [roleDescription, setRoleDescription] = useState('');
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [fellowHackers, setFellowHackers] = useState([]);
  const [phase, setPhase] = useState(PHASES.LOBBY);
  const [phaseMessage, setPhaseMessage] = useState('');
  const [phaseDuration, setPhaseDuration] = useState(0);

  // ── Voting ──
  const [voteTally, setVoteTally] = useState({});
  const [votesCast, setVotesCast] = useState(0);
  const [totalVoters, setTotalVoters] = useState(0);

  // ── Chat ──
  const [messages, setMessages] = useState([]);
  const [hackerMessages, setHackerMessages] = useState([]);

  // ── Night ──
  const [investigationResult, setInvestigationResult] = useState(null);
  const [nightResult, setNightResult] = useState(null);

  // ── Game Over ──
  const [gameOverData, setGameOverData] = useState(null);

  // ── System messages / errors ──
  const [errorMsg, setErrorMsg] = useState('');

  // ── Elimination log ──
  const [eliminationLog, setEliminationLog] = useState([]);

  // ── Defenders for defense phase ──
  const [defenders, setDefenders] = useState([]);

  // Timer & Toast & Hacker vote & Skip
  const [phaseEndTime, setPhaseEndTime] = useState(null);
  const [hackerVoteStatus, setHackerVoteStatus] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [skipCount, setSkipCount] = useState(0);
  const [totalAliveForSkip, setTotalAliveForSkip] = useState(0);
  const [hasSkipped, setHasSkipped] = useState(false);
  const [individualVotes, setIndividualVotes] = useState({});

  // ── Code Files ──
  const [codeFiles, setCodeFiles] = useState(null);
  const [securityScanResult, setSecurityScanResult] = useState(null);
  const [hackerInjectResult, setHackerInjectResult] = useState(null);
  const [adminRepairResult, setAdminRepairResult] = useState(null);
  const [playerCodeData, setPlayerCodeData] = useState(null);
  const [hackerInjectVoteStatus, setHackerInjectVoteStatus] = useState(null);
  const [adminScanResult, setAdminScanResult] = useState(null);
  const [adminBugGuessResult, setAdminBugGuessResult] = useState(null);

  // Apply role-based theme to document when role changes
  useEffect(() => {
    applyThemeToDocument(myRole);
  }, [myRole]);

  /* ═══════════════════════════════════════════
   *  SOCKET EVENT LISTENERS
   * ═══════════════════════════════════════════ */
  useEffect(() => {
    socket.on('connect', () => {
      setConnected(true);
      // Auto-reconnect: if we had a room + name, try to rejoin
      const savedRoom = sessionStorage.getItem('cw_roomId');
      const savedName = sessionStorage.getItem('cw_playerName');
      const savedInGame = sessionStorage.getItem('cw_inGame');
      if (savedRoom && savedName && savedInGame === 'true') {
        setReconnecting(true);
        socket.emit(EVENTS.RECONNECT_ATTEMPT, { roomId: savedRoom, playerName: savedName });
      }
    });
    socket.on('disconnect', () => setConnected(false));

    // Room events
    socket.on(EVENTS.ROOM_CREATED, ({ roomId }) => {
      setRoomId(roomId);
      sessionStorage.setItem('cw_roomId', roomId);
      try { playJoinRoom(); } catch(_) {}
    });
    socket.on(EVENTS.ROOM_JOINED, ({ roomId }) => {
      setRoomId(roomId);
      sessionStorage.setItem('cw_roomId', roomId);
      try { playJoinRoom(); } catch(_) {}
    });
    socket.on(EVENTS.JOIN_ERROR, ({ reason }) => setErrorMsg(reason));
    socket.on(EVENTS.ERROR, ({ message }) => setErrorMsg(message));

    socket.on(EVENTS.ROOM_UPDATE, (state) => {
      setGameState(prev => {
        if (prev && state.players.length > prev.players.length) {
          try { playPlayerJoined(); } catch(_) {}
        }
        return state;
      });
    });

    // Role
    socket.on(EVENTS.ROLE_ASSIGNED, ({ role, description }) => {
      setMyRole(role);
      setRoleDescription(description);
      setShowRoleModal(true);
      try { playRoleReveal(); } catch(_) {}
    });

    socket.on(EVENTS.HACKER_REVEAL, ({ hackers }) => {
      setFellowHackers(hackers);
    });

    // Phase
    socket.on(EVENTS.PHASE_CHANGE, ({ phase: p, message, duration, sprint, systemStability, defenders: defs, ...rest }) => {
      setPhase(p);
      setPhaseMessage(message || '');
      setPhaseDuration(duration || 0);
      setPhaseEndTime(duration ? Date.now() + duration : null);
      setGameState(prev => prev ? ({ ...prev, phase: p, sprint, systemStability, ...rest }) : prev);
      if (defs) setDefenders(defs);
      // Reset votes on new voting phase
      if (p === PHASES.DAY_VOTING) {
        setVoteTally({});
        setVotesCast(0);
        setIndividualVotes({});
      }
      if (p === PHASES.DAY_DEFENSE) { try { playDefenseStart(); } catch(_) {} }
      if (p === PHASES.SUNRISE)      { try { playSunrise(); } catch(_) {} }
      // Reset skip votes on every phase change
      setSkipCount(0);
      setHasSkipped(false);
      // Clear night result & hacker votes when night starts (night-first flow)
      if (p === PHASES.NIGHT) {
        setNightResult(null);
        setHackerVoteStatus(null);
        setHackerInjectResult(null);
        setHackerInjectVoteStatus(null);
        setAdminRepairResult(null);
        setSecurityScanResult(null);
        setPlayerCodeData(null);
      }
      // Reset admin/security state when sunrise starts
      if (p === PHASES.SUNRISE) {
        setAdminRepairResult(null);
        setSecurityScanResult(null);
        setPlayerCodeData(null);
        setAdminScanResult(null);
        setAdminBugGuessResult(null);
      }
      // Phase change sound & toast
      try { playPhaseChange(p === PHASES.NIGHT); } catch(e) {}
      const phaseLabels = {
        [PHASES.DAY_DISCUSSION]: { title: '\u2600\ufe0f Discussion Phase', type: 'day' },
        [PHASES.DAY_VOTING]: { title: '\ud83d\uddf3\ufe0f Voting Phase', type: 'voting' },
        [PHASES.DAY_DEFENSE]: { title: '\ud83d\udee1\ufe0f Defense Phase', type: 'info' },
        [PHASES.NIGHT]: { title: '\ud83c\udf19 Night Phase', type: 'night' },
        [PHASES.SUNRISE]: { title: '\ud83c\udf05 Sunrise Phase', type: 'info' },
      };
      const toastInfo = phaseLabels[p];
      if (toastInfo) {
        setToasts(prev => [...prev, { ...toastInfo, message: message || '', id: Date.now() + Math.random() }]);
      }
    });

    // Game started
    socket.on(EVENTS.GAME_STARTED, (state) => {
      setGameState(state);
      setPhase(state.phase);
      sessionStorage.setItem('cw_inGame', 'true');
      try { playGameStart(); } catch(_) {}
    });

    // Voting
    socket.on(EVENTS.VOTE_UPDATE, ({ tally, votesCast: vc, totalVoters: tv, individualVotes: iv }) => {
      setVoteTally(tally);
      setVotesCast(vc);
      setTotalVoters(tv);
      if (iv) setIndividualVotes(iv);
    });

    socket.on(EVENTS.VOTE_RESULT, ({ tally, eliminatedId, defenders: defs }) => {
      setVoteTally(tally);
      if (defs) setDefenders(defs);
      try { playVoteResult(); } catch(_) {}
    });

    // Eliminations
    socket.on(EVENTS.PLAYER_ELIMINATED, (data) => {
      setEliminationLog(prev => [...prev, data]);
      addSystemMessage(`☠️ ${data.name} (${data.role}) was eliminated – ${data.reason}`);      try { playElimination(); } catch(e) {}
      setToasts(prev => [...prev, { id: Date.now() + Math.random(), title: '\u2620\ufe0f Player Eliminated', message: `${data.name} (${data.role})`, type: 'elimination' }]);    });

    // Night
    socket.on(EVENTS.INVESTIGATION_RESULT, (data) => {
      setInvestigationResult(data.results || [data]);
    });

    socket.on(EVENTS.NIGHT_RESULT, (result) => {
      setNightResult(result);
      addSystemMessage(result.message);      if (result.protectionSaved) { try { playProtectionSaved(); } catch(_) {} }      const tType = result.eliminated ? 'elimination' : result.protectionSaved ? 'protection' : 'info';
      setToasts(prev => [...prev, { id: Date.now() + Math.random(), title: '\ud83c\udf19 Night Result', message: result.message, type: tType }]);
    });

    // Chat
    socket.on(EVENTS.CHAT_MESSAGE, (msg) => {
      setMessages(prev => [...prev, msg]);
      if (msg.senderId !== socket.id) try { playChatNotif(); } catch(_) {}
    });

    socket.on(EVENTS.HACKER_CHAT, (msg) => {
      setHackerMessages(prev => [...prev, msg]);
      if (msg.senderId !== socket.id) try { playHackerChat(); } catch(_) {}
    });

    socket.on(EVENTS.HACKER_VOTE_UPDATE, (data) => {
      setHackerVoteStatus(data);
    });

    // Game over
    socket.on(EVENTS.GAME_OVER, (data) => {
      setGameOverData(data);
      setPhase(PHASES.GAME_OVER);
      sessionStorage.removeItem('cw_inGame');
      try { data.winner === 'hackers' ? playLose() : playWin(); } catch(_) {}
    });

    // Disconnect notices
    socket.on(EVENTS.PLAYER_DISCONNECTED, ({ playerId }) => {
      addSystemMessage(`⚠️ A player disconnected.`);
    });

    // Reconnect notices
    socket.on(EVENTS.PLAYER_RECONNECTED, ({ playerName: pName }) => {
      addSystemMessage(`🔄 ${pName} reconnected!`);
    });

    // Reconnect success — restore full game state
    socket.on(EVENTS.RECONNECT_SUCCESS, ({ roomId: rid, role, description, phase: p, gameState: gs }) => {
      setReconnecting(false);
      setRoomId(rid);
      setMyRole(role);
      setRoleDescription(description);
      setPhase(p);
      setGameState(gs);
      addSystemMessage('🔄 Reconnected successfully!');
    });

    // Reconnect fail — clear session, go to lobby
    socket.on(EVENTS.RECONNECT_FAIL, ({ reason }) => {
      setReconnecting(false);
      sessionStorage.removeItem('cw_roomId');
      sessionStorage.removeItem('cw_playerName');
      sessionStorage.removeItem('cw_inGame');
      setRoomId(null);
      setPhase(PHASES.LOBBY);
      setErrorMsg(`Reconnect failed: ${reason}`);
    });

    // Skip updates
    socket.on(EVENTS.SKIP_UPDATE, ({ skipCount: sc, totalAlive: ta }) => {
      setSkipCount(sc);
      setTotalAliveForSkip(ta);
    });

    // Code files
    socket.on(EVENTS.CODE_FILES_INIT, (data) => {
      setCodeFiles(data);
    });

    socket.on(EVENTS.CODE_UPDATE, (data) => {
      setCodeFiles(data);
    });

    socket.on(EVENTS.SECURITY_SCAN_RESULT, (data) => {
      setSecurityScanResult(data);
      try { data.suspicious ? playScanCorrupted() : playScanClean(); } catch(_) {}
    });

    socket.on(EVENTS.HACKER_INJECT_RESULT, (data) => {
      setHackerInjectResult(data);
      if (data.success) try { playHackerInject(); } catch(_) {}
    });

    socket.on(EVENTS.HACKER_INJECT_VOTE_UPDATE, (data) => {
      setHackerInjectVoteStatus(data);
    });

    socket.on(EVENTS.ADMIN_REPAIR_RESULT, (data) => {
      setAdminRepairResult(data);
      if (data.repaired) try { playRepair(); } catch(_) {}
    });

    socket.on(EVENTS.ADMIN_SCAN_RESULT, (data) => {
      setAdminScanResult(data);
      try { data.corrupted ? playScanCorrupted() : playScanClean(); } catch(_) {}
    });

    socket.on(EVENTS.ADMIN_BUG_GUESS_RESULT, (data) => {
      setAdminBugGuessResult(data);
    });

    socket.on(EVENTS.PLAYER_CODE_DATA, (data) => {
      setPlayerCodeData(data);
    });

    return () => {
      socket.removeAllListeners();
    };
  }, []);

  /* ── Helper: add a system message to public chat ── */
  const addSystemMessage = useCallback((text) => {
    setMessages(prev => [...prev, {
      senderId: '__system__',
      senderName: 'SYSTEM',
      message: text,
      timestamp: Date.now(),
      isSystem: true,
    }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  /* ═══════════════════════════════════════════
   *  ACTIONS
   * ═══════════════════════════════════════════ */
  const createRoom = (name) => {
    setPlayerName(name);
    sessionStorage.setItem('cw_playerName', name);
    socket.emit(EVENTS.CREATE_ROOM, { playerName: name });
  };

  const joinRoom = (code, name) => {
    setPlayerName(name);
    sessionStorage.setItem('cw_playerName', name);
    socket.emit(EVENTS.JOIN_ROOM, { roomId: code, playerName: name });
  };

  const startGame = (advancedMode = false) => {
    socket.emit(EVENTS.START_GAME, { advancedMode });
  };

  const fillWithBots = (count) => {
    socket.emit(EVENTS.FILL_WITH_BOTS, { count });
  };

  const requestRole = (role) => {
    socket.emit(EVENTS.SET_PLAYER_ROLE, { role });
  };

  const castVote = (targetId) => {
    socket.emit(EVENTS.CAST_VOTE, { targetId });
  };

  const submitNightAction = (targetId) => {
    socket.emit(EVENTS.NIGHT_ACTION, { targetId });
  };

  const sendChatMessage = (message) => {
    socket.emit(EVENTS.CHAT_MESSAGE, { message });
  };

  const sendHackerChat = (message) => {
    socket.emit(EVENTS.HACKER_CHAT, { message });
  };

  const skipPhase = () => {
    if (!hasSkipped) {
      socket.emit(EVENTS.SKIP_PHASE);
      setHasSkipped(true);
    }
  };

  const securityScan = (targetId) => {
    setSecurityScanResult(null);
    socket.emit(EVENTS.SECURITY_SCAN, { targetId });
  };

  const hackerInject = (targetId, fileIdx, patchIdx) => {
    socket.emit(EVENTS.HACKER_INJECT, { targetId, fileIdx, patchIdx });
  };

  const hackerInjectVote = (fileIdx, patchIdx) => {
    socket.emit(EVENTS.HACKER_INJECT_VOTE, { fileIdx, patchIdx });
  };

  const adminRepair = (targetId) => {
    socket.emit(EVENTS.ADMIN_REPAIR, { targetId });
  };

  const adminScanCorruption = (targetId) => {
    socket.emit(EVENTS.ADMIN_SCAN_CORRUPTION, targetId ? { targetId } : {});
    // Clear previous scan result so UI shows loading state
    setAdminScanResult(null);
    setAdminBugGuessResult(null);
  };

  const adminBugGuess = (targetId, fileIdx) => {
    socket.emit(EVENTS.ADMIN_BUG_GUESS, { targetId, fileIdx });
  };

  const getPlayerCode = (targetId) => {
    socket.emit(EVENTS.GET_PLAYER_CODE, { targetId });
  };

  const finishSunrise = () => {
    socket.emit(EVENTS.FINISH_SUNRISE);
  };

  /* ═══════════════════════════════════════════
   *  DERIVED STATE
   * ═══════════════════════════════════════════ */
  const myId = socket.id;
  const isHost = gameState?.players?.find(p => p.id === myId)?.isHost ?? false;
  const amAlive = gameState?.players?.find(p => p.id === myId)?.alive ?? true;
  const alivePlayers = gameState?.players?.filter(p => p.alive) ?? [];
  const deadPlayers = gameState?.players?.filter(p => !p.alive) ?? [];

  /* ═══════════════════════════════════════════
   *  RENDER
   * ═══════════════════════════════════════════ */
  // Show reconnecting overlay
  if (reconnecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cyber-bg">
        <div className="cyber-card text-center p-8">
          <div className="text-4xl mb-4 animate-spin flex justify-center"><RefreshCw size={40} /></div>
          <h2 className="text-cyber-green text-lg font-bold mb-2">Reconnecting...</h2>
          <p className="text-gray-400 text-sm">Attempting to rejoin your game session.</p>
          <p className="text-gray-500 text-xs mt-2">Room: {roomId} • Name: {playerName}</p>
        </div>
      </div>
    );
  }

  // Not in a room yet → show lobby
  if (!roomId || phase === PHASES.LOBBY) {
    return (
      <>
        <LobbyScreen
          connected={connected}
          roomId={roomId}
          gameState={gameState}
          isHost={isHost}
          errorMsg={errorMsg}
          onCreateRoom={createRoom}
          onJoinRoom={joinRoom}
          onStartGame={startGame}
          onFillBots={fillWithBots}
          onRequestRole={requestRole}
          onClearError={() => setErrorMsg('')}
        />
        {showRoleModal && (
          <RoleRevealModal
            role={myRole}
            description={roleDescription}
            fellowHackers={fellowHackers}
            onClose={() => setShowRoleModal(false)}
          />
        )}
      </>
    );
  }

  // Game over
  if (phase === PHASES.GAME_OVER && gameOverData) {
    return (
      <GameOverScreen
        data={gameOverData}
        myId={myId}
      />
    );
  }

  // In-game
  return (
    <>
      <SkyBackground phase={phase} />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <GameScreen
        myId={myId}
        myRole={myRole}
        amAlive={amAlive}
        phase={phase}
        phaseMessage={phaseMessage}
        phaseDuration={phaseDuration}
        phaseEndTime={phaseEndTime}
        gameState={gameState}
        alivePlayers={alivePlayers}
        deadPlayers={deadPlayers}
        defenders={defenders}
        // Voting
        voteTally={voteTally}
        votesCast={votesCast}
        totalVoters={totalVoters}
        onCastVote={castVote}
        individualVotes={individualVotes}
        // Night
        onNightAction={submitNightAction}
        investigationResult={investigationResult}
        nightResult={nightResult}
        fellowHackers={fellowHackers}
        hackerVoteStatus={hackerVoteStatus}
        // Chat
        messages={messages}
        hackerMessages={hackerMessages}
        onSendChat={sendChatMessage}
        onSendHackerChat={sendHackerChat}
        // Elimination log
        eliminationLog={eliminationLog}
        // Skip
        skipCount={skipCount}
        totalAliveForSkip={totalAliveForSkip}
        hasSkipped={hasSkipped}
        onSkipPhase={skipPhase}
        // Code
        codeFiles={codeFiles}
        onSecurityScan={securityScan}
        securityScanResult={securityScanResult}
        onHackerInject={hackerInject}
        hackerInjectResult={hackerInjectResult}
        onHackerInjectVote={hackerInjectVote}
        hackerInjectVoteStatus={hackerInjectVoteStatus}
        onAdminRepair={adminRepair}
        adminRepairResult={adminRepairResult}
        onAdminScanCorruption={adminScanCorruption}
        adminScanResult={adminScanResult}
        onAdminBugGuess={adminBugGuess}
        adminBugGuessResult={adminBugGuessResult}
        onGetPlayerCode={getPlayerCode}
        playerCodeData={playerCodeData}
        onFinishSunrise={finishSunrise}
      />
      {showRoleModal && (
        <RoleRevealModal
          role={myRole}
          description={roleDescription}
          fellowHackers={fellowHackers}
          onClose={() => setShowRoleModal(false)}
        />
      )}
    </>
  );
}
