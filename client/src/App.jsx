import React, { useState, useEffect, useCallback } from 'react';
import socket from './socket';
import { EVENTS, PHASES } from './shared/constants';
import LobbyScreen from './components/LobbyScreen';
import GameScreen from './components/GameScreen';
import GameOverScreen from './components/GameOverScreen';
import RoleRevealModal from './components/RoleRevealModal';

/**
 * App – Root component. Manages global game state received from the server
 * and renders the appropriate screen (Lobby → Game → GameOver).
 */
export default function App() {
  // ── Connection & identity ──
  const [connected, setConnected] = useState(false);
  const [roomId, setRoomId] = useState(null);
  const [playerName, setPlayerName] = useState('');

  // ── Game state ──
  const [gameState, setGameState] = useState(null);  // public state from server
  const [myRole, setMyRole] = useState(null);
  const [roleDescription, setRoleDescription] = useState('');
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [fellowHackers, setFellowHackers] = useState([]);
  const [phase, setPhase] = useState(PHASES.LOBBY);
  const [phaseMessage, setPhaseMesage] = useState('');
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

  /* ═══════════════════════════════════════════
   *  SOCKET EVENT LISTENERS
   * ═══════════════════════════════════════════ */
  useEffect(() => {
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    // Room events
    socket.on(EVENTS.ROOM_CREATED, ({ roomId }) => setRoomId(roomId));
    socket.on(EVENTS.ROOM_JOINED, ({ roomId }) => setRoomId(roomId));
    socket.on(EVENTS.JOIN_ERROR, ({ reason }) => setErrorMsg(reason));
    socket.on(EVENTS.ERROR, ({ message }) => setErrorMsg(message));

    socket.on(EVENTS.ROOM_UPDATE, (state) => {
      setGameState(state);
    });

    // Role
    socket.on(EVENTS.ROLE_ASSIGNED, ({ role, description }) => {
      setMyRole(role);
      setRoleDescription(description);
      setShowRoleModal(true);
    });

    socket.on(EVENTS.HACKER_REVEAL, ({ hackers }) => {
      setFellowHackers(hackers);
    });

    // Phase
    socket.on(EVENTS.PHASE_CHANGE, ({ phase: p, message, duration, sprint, systemStability, defenders: defs }) => {
      setPhase(p);
      setPhaseMesage(message || '');
      setPhaseDuration(duration || 0);
      if (defs) setDefenders(defs);
      // Reset votes on new voting phase
      if (p === PHASES.DAY_VOTING) {
        setVoteTally({});
        setVotesCast(0);
      }
      // Clear night result when day starts
      if (p === PHASES.DAY_DISCUSSION) {
        setNightResult(null);
      }
    });

    // Game started
    socket.on(EVENTS.GAME_STARTED, (state) => {
      setGameState(state);
      setPhase(state.phase);
    });

    // Voting
    socket.on(EVENTS.VOTE_UPDATE, ({ tally, votesCast: vc, totalVoters: tv }) => {
      setVoteTally(tally);
      setVotesCast(vc);
      setTotalVoters(tv);
    });

    socket.on(EVENTS.VOTE_RESULT, ({ tally, eliminatedId, defenders: defs }) => {
      setVoteTally(tally);
      if (defs) setDefenders(defs);
    });

    // Eliminations
    socket.on(EVENTS.PLAYER_ELIMINATED, (data) => {
      setEliminationLog(prev => [...prev, data]);
      addSystemMessage(`☠️ ${data.name} (${data.role}) was eliminated – ${data.reason}`);
    });

    // Night
    socket.on(EVENTS.INVESTIGATION_RESULT, (result) => {
      setInvestigationResult(result);
    });

    socket.on(EVENTS.NIGHT_RESULT, (result) => {
      setNightResult(result);
      addSystemMessage(result.message);
    });

    // Chat
    socket.on(EVENTS.CHAT_MESSAGE, (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    socket.on(EVENTS.HACKER_CHAT, (msg) => {
      setHackerMessages(prev => [...prev, msg]);
    });

    // Game over
    socket.on(EVENTS.GAME_OVER, (data) => {
      setGameOverData(data);
      setPhase(PHASES.GAME_OVER);
    });

    // Disconnect notices
    socket.on(EVENTS.PLAYER_DISCONNECTED, ({ playerId }) => {
      addSystemMessage(`⚠️ A player disconnected.`);
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

  /* ═══════════════════════════════════════════
   *  ACTIONS
   * ═══════════════════════════════════════════ */
  const createRoom = (name) => {
    setPlayerName(name);
    socket.emit(EVENTS.CREATE_ROOM, { playerName: name });
  };

  const joinRoom = (code, name) => {
    setPlayerName(name);
    socket.emit(EVENTS.JOIN_ROOM, { roomId: code, playerName: name });
  };

  const startGame = (advancedMode = false) => {
    socket.emit(EVENTS.START_GAME, { advancedMode });
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
      <GameScreen
        myId={myId}
        myRole={myRole}
        amAlive={amAlive}
        phase={phase}
        phaseMessage={phaseMessage}
        phaseDuration={phaseDuration}
        gameState={gameState}
        alivePlayers={alivePlayers}
        deadPlayers={deadPlayers}
        defenders={defenders}
        // Voting
        voteTally={voteTally}
        votesCast={votesCast}
        totalVoters={totalVoters}
        onCastVote={castVote}
        // Night
        onNightAction={submitNightAction}
        investigationResult={investigationResult}
        nightResult={nightResult}
        fellowHackers={fellowHackers}
        // Chat
        messages={messages}
        hackerMessages={hackerMessages}
        onSendChat={sendChatMessage}
        onSendHackerChat={sendHackerChat}
        // Elimination log
        eliminationLog={eliminationLog}
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
