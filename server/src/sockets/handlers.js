/**
 * socketHandlers.js – All Socket.io event handlers for the Code Wars game.
 *
 * This file wires every client event to the appropriate Room / Player
 * methods and broadcasts results back.
 */

const EVENTS = require('../shared/events');
const PHASES = require('../shared/phases');
const ROLES = require('../shared/roles');
const CONFIG = require('../shared/gameConfig');
const CodeEngine = require('../game/CodeEngine');
const BotManager = require('../game/BotManager');
const roomManager = require('../game/RoomManager');

/**
 * Register all handlers on a connected socket.
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 */
function registerHandlers(io, socket) {
  /* ──────────────────────────────────────────
   *  Helper: broadcast to a room
   * ────────────────────────────────────────── */
  function broadcastToRoom(roomId, event, data) {
    io.to(roomId).emit(event, data);
  }

  /** Send to a specific socket */
  function sendTo(socketId, event, data) {
    io.to(socketId).emit(event, data);
  }

  /** Send sendToPlayer function for night resolution */
  function sendToPlayerFn(playerId, event, data) {
    io.to(playerId).emit(event, data);
  }

  /* ──────────────────────────────────────────
   *  CREATE ROOM
   * ────────────────────────────────────────── */
  socket.on(EVENTS.CREATE_ROOM, ({ playerName }) => {
    const room = roomManager.createRoom(socket.id, playerName);
    socket.join(room.id);
    socket.emit(EVENTS.ROOM_CREATED, { roomId: room.id });
    io.to(room.id).emit(EVENTS.ROOM_UPDATE, room.getPublicState());
  });

  /* ──────────────────────────────────────────
   *  JOIN ROOM
   * ────────────────────────────────────────── */
  socket.on(EVENTS.JOIN_ROOM, ({ roomId, playerName }) => {
    const code = roomId.toUpperCase().trim();
    const result = roomManager.joinRoom(code, socket.id, playerName);

    if (!result.ok) {
      socket.emit(EVENTS.JOIN_ERROR, { reason: result.reason });
      return;
    }

    socket.join(code);
    socket.emit(EVENTS.ROOM_JOINED, { roomId: code });
    io.to(code).emit(EVENTS.ROOM_UPDATE, roomManager.getRoom(code).getPublicState());
  });

  /* ──────────────────────────────────────────
   *  FILL WITH BOTS (host fills lobby with AI bots for testing)
   * ────────────────────────────────────────── */
  socket.on(EVENTS.FILL_WITH_BOTS, ({ count } = {}) => {
    const room = roomManager.getRoomBySocket(socket.id);
    if (!room || room.phase !== PHASES.LOBBY) return;

    const player = room.getPlayer(socket.id);
    if (!player || !player.isHost) {
      socket.emit(EVENTS.ERROR, { message: 'Only the host can add bots.' });
      return;
    }

    // Determine how many bots to add
    const current = room.players.size;
    const target  = Math.max(current, CONFIG.MIN_PLAYERS);
    const need    = Math.max(0, target - current);
    const toAdd   = Math.min(typeof count === 'number' ? count : need, CONFIG.MAX_PLAYERS - current);
    if (toAdd <= 0) return;

    // Bot name pool: avoid duplicates with existing player names
    const usedNames = [...room.players.values()].map(p => p.name.replace('🤖 ', ''));
    const pool      = BotManager.getAvailableNames(usedNames);

    for (let i = 0; i < toAdd && pool.length > 0; i++) {
      const name = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
      room.addBot(name);
    }

    io.to(room.id).emit(EVENTS.ROOM_UPDATE, room.getPublicState());
  });

  /* ──────────────────────────────────────────
   *  SET PLAYER ROLE (host picks preferred role before game starts)
   * ────────────────────────────────────────── */
  socket.on(EVENTS.SET_PLAYER_ROLE, ({ role } = {}) => {
    const room = roomManager.getRoomBySocket(socket.id);
    if (!room || room.phase !== PHASES.LOBBY) return;
    const player = room.getPlayer(socket.id);
    if (!player) return;
    const valid = ['Developer', 'Hacker', 'QA', 'Admin'];
    if (!valid.includes(role)) return;
    player.preferredRole = role;
    // Confirm back to client only
    socket.emit(EVENTS.SYSTEM_MESSAGE, { message: `✅ Role preference set to ${role}. Will be assigned when possible.` });
  });

  /* ──────────────────────────────────────────
   *  START GAME
   * ────────────────────────────────────────── */
  socket.on(EVENTS.START_GAME, ({ advancedMode }) => {
    const room = roomManager.getRoomBySocket(socket.id);
    if (!room) return;

    const player = room.getPlayer(socket.id);
    if (!player || !player.isHost) {
      socket.emit(EVENTS.ERROR, { message: 'Only the host can start the game.' });
      return;
    }

    const result = room.startGame(io);
    if (!result.ok) {
      socket.emit(EVENTS.ERROR, { message: result.reason });
      return;
    }

    // Honor preferred roles — swap each player who has a preference with whoever holds that role
    const playerArr = [...room.players.values()];
    for (const p of playerArr) {
      if (!p.preferredRole || p.role === p.preferredRole) continue;
      const holder = playerArr.find(other => other.id !== p.id && other.role === p.preferredRole);
      if (holder) {
        const tmp = holder.role;
        holder.role = p.role;
        p.role = p.preferredRole;
      } else {
        // Desired role not held by anyone else — just assign it (edge case)
        p.role = p.preferredRole;
      }
      delete p.preferredRole;
    }

    if (advancedMode) {
      room.advancedMode = true;
      room.systemStability = CONFIG.INITIAL_STABILITY;
    }

    // Send role assignments privately
    for (const p of room.players.values()) {
      sendTo(p.id, EVENTS.ROLE_ASSIGNED, {
        role: p.role,
        description: getRoleDescription(p.role),
      });

      // Reveal fellow hackers to each hacker
      if (p.isHacker()) {
        const fellowHackers = [...room.players.values()]
          .filter(h => h.isHacker() && h.id !== p.id)
          .map(h => ({ id: h.id, name: h.name }));
        sendTo(p.id, EVENTS.HACKER_REVEAL, { hackers: fellowHackers });
      }
    }

    // Broadcast game started
    broadcastToRoom(room.id, EVENTS.GAME_STARTED, room.getPublicState());

    // Send initial code files — each player sees ONLY their own code
    if (room.codeStore) {
      for (const p of room.players.values()) {
        const ownCode = CodeEngine.getOwnCode(room.codeStore, p.id);
        if (ownCode) {
          sendTo(p.id, EVENTS.CODE_FILES_INIT, { [p.id]: ownCode });
        }
      }
    }

    // Begin Night 1 after a short delay for role reveal
    setTimeout(() => {
      room.startNight((event, data) => broadcastToRoom(room.id, event, data));
    }, CONFIG.DELAYS.ROLE_REVEAL);
  });

  /* ──────────────────────────────────────────
   *  CAST VOTE (Day phase)
   * ────────────────────────────────────────── */
  socket.on(EVENTS.CAST_VOTE, ({ targetId }) => {
    const room = roomManager.getRoomBySocket(socket.id);
    if (!room || room.phase !== PHASES.DAY_VOTING) return;

    const player = room.getPlayer(socket.id);
    if (!player || !player.alive) return;

    const accepted = room.voteTracker.castVote(socket.id, targetId);
    if (!accepted) {
      // Allow vote change
      room.voteTracker.changeVote(socket.id, targetId);
    }

    // Broadcast updated vote tally + individual votes
    const { tally } = room.voteTracker.tally();
    const individualVotes = {};
    for (const [voterId, targetId] of room.voteTracker.votes.entries()) {
      const voter = room.getPlayer(voterId);
      const target = room.getPlayer(targetId);
      individualVotes[voterId] = {
        voterName: voter?.name || 'Unknown',
        targetId,
        targetName: target?.name || 'Unknown',
      };
    }
    broadcastToRoom(room.id, EVENTS.VOTE_UPDATE, {
      tally,
      individualVotes,
      totalVoters: room.voteTracker.expectedVoters,
      votesCast: room.voteTracker.votes.size,
    });

    // If all votes in, resolve immediately
    if (room.voteTracker.allVotesCast()) {
      room.resolveVotes((event, data) => broadcastToRoom(room.id, event, data));
    }
  });

  /* ──────────────────────────────────────────
   *  NIGHT ACTION
   * ────────────────────────────────────────── */
  socket.on(EVENTS.NIGHT_ACTION, ({ targetId }) => {
    const room = roomManager.getRoomBySocket(socket.id);
    if (!room) return;
    // Hackers act during NIGHT, Admin protects during SUNRISE
    if (room.phase !== PHASES.NIGHT && room.phase !== PHASES.SUNRISE) return;

    room.submitNightAction(
      socket.id,
      targetId,
      sendToPlayerFn,
      (event, data) => broadcastToRoom(room.id, event, data)
    );
  });

  /* ──────────────────────────────────────────
   *  FINISH SUNRISE (Admin / QA press "Done")
   * ────────────────────────────────────────── */
  socket.on(EVENTS.FINISH_SUNRISE, () => {
    const room = roomManager.getRoomBySocket(socket.id);
    const reviewPhaseActive = room && (room.phase === PHASES.SUNRISE || (room.phase === PHASES.NIGHT && room.nightActions?.hackerInjected));
    if (!room || !reviewPhaseActive) return;
    const player = room.getPlayer(socket.id);
    if (!player || !player.alive) return;
    if (player.role !== ROLES.ADMIN && player.role !== ROLES.SECURITY_LEAD) return;

    room.sunriseDone.add(player.role);

    // Determine which special roles are alive
    const alive = room.getAlivePlayers();
    const adminAlive = alive.some(p => p.role === ROLES.ADMIN);
    const secAlive  = alive.some(p => p.role === ROLES.SECURITY_LEAD);
    const needed = new Set();
    if (adminAlive) needed.add(ROLES.ADMIN);
    if (secAlive)   needed.add(ROLES.SECURITY_LEAD);

    const allDone = [...needed].every(r => room.sunriseDone.has(r));
    if (allDone) {
      if (room.phase === PHASES.NIGHT) {
        room.resolveSunrise(
          (event, data) => broadcastToRoom(room.id, event, data),
          (playerId, event, data) => io.to(playerId).emit(event, data)
        );
      } else {
        room.skipPhase(
          (event, data) => broadcastToRoom(room.id, event, data),
          (playerId, event, data) => io.to(playerId).emit(event, data)
        );
      }
    }
  });

  /* ──────────────────────────────────────────
   *  SKIP PHASE (all alive players must skip)
   * ────────────────────────────────────────── */
  socket.on(EVENTS.SKIP_PHASE, () => {
    const room = roomManager.getRoomBySocket(socket.id);
    if (!room) return;

    const player = room.getPlayer(socket.id);
    if (!player || !player.alive) return;

    // Only allow skipping during timed phases
    if (![PHASES.DAY_DISCUSSION, PHASES.DAY_VOTING, PHASES.DAY_DEFENSE, PHASES.NIGHT, PHASES.SUNRISE].includes(room.phase)) return;

    room.skipVotes.add(socket.id);

    const alivePlayers = room.getAlivePlayers();
    // Bots always agree to skip — only real players need to vote
    const realAlive = alivePlayers.filter(p => !p.isBot).length;
    broadcastToRoom(room.id, EVENTS.SKIP_UPDATE, {
      skipCount: room.skipVotes.size,
      totalAlive: realAlive,
    });

    // If all real (non-bot) alive players voted to skip, advance phase
    const realSkips = [...room.skipVotes].filter(id => {
      const p = room.getPlayer(id);
      return p && !p.isBot;
    }).length;
    if (realSkips >= realAlive) {
      room.skipPhase((event, data) => broadcastToRoom(room.id, event, data),
        (playerId, event, data) => io.to(playerId).emit(event, data));
    }
  });

  /* ──────────────────────────────────────────
   *  CHAT MESSAGE (public Day chat)
   * ────────────────────────────────────────── */
  socket.on(EVENTS.CHAT_MESSAGE, ({ message }) => {
    const room = roomManager.getRoomBySocket(socket.id);
    if (!room) return;

    const player = room.getPlayer(socket.id);
    if (!player || !player.alive) return;

    // Public chat only during day phases
    if (![PHASES.DAY_DISCUSSION, PHASES.DAY_VOTING, PHASES.DAY_DEFENSE].includes(room.phase)) {
      return;
    }

    broadcastToRoom(room.id, EVENTS.CHAT_MESSAGE, {
      senderId: socket.id,
      senderName: player.name,
      message,
      timestamp: Date.now(),
    });
  });

  /* ──────────────────────────────────────────
   *  HACKER CHAT (private night chat)
   * ────────────────────────────────────────── */
  socket.on(EVENTS.HACKER_CHAT, ({ message }) => {
    const room = roomManager.getRoomBySocket(socket.id);
    if (!room || room.phase !== PHASES.NIGHT) return;

    const player = room.getPlayer(socket.id);
    if (!player || !player.alive || !player.isHacker()) return;

    // Send only to alive hackers
    for (const p of room.players.values()) {
      if (p.isHacker() && p.alive) {
        sendTo(p.id, EVENTS.HACKER_CHAT, {
          senderId: socket.id,
          senderName: player.name,
          message,
          timestamp: Date.now(),
        });
      }
    }
  });

  /* ──────────────────────────────────────────
   *  GET PLAYER CODE (browse a player's code files)
   *  - Day: players can only see their OWN code
   *  - Night: hackers, admin, and QA can see others' code
   *    - Admin: limited to ADMIN_CHECKS_PER_NIGHT different players
   *    - QA: limited to SECURITY_VIEWS_PER_NIGHT different players
   * ────────────────────────────────────────── */
  socket.on(EVENTS.GET_PLAYER_CODE, ({ targetId }) => {
    const room = roomManager.getRoomBySocket(socket.id);
    if (!room || !room.codeStore) return;

    const player = room.getPlayer(socket.id);
    if (!player) return;

    const isNight = room.phase === PHASES.NIGHT;
    const isSunrise = room.phase === PHASES.SUNRISE;
    const isNightReview = isNight && room.nightActions?.hackerInjected;
    const isNightOrSunrise = isNight || isSunrise;
    const isHacker = player.isHacker();
    const isAdmin = player.isAdmin();
    const isSecurityLead = player.isSecurityLead();

    // During day, you can ONLY see your own code
    if (!isNightOrSunrise && targetId !== socket.id) {
      socket.emit(EVENTS.ERROR, { message: 'You can only view your own code during the day.' });
      return;
    }
    // During NIGHT before review: only hackers can view other players' code
    if (isNight && !isNightReview && targetId !== socket.id && !isHacker) {
      socket.emit(EVENTS.ERROR, { message: 'Only hackers can browse code during the night.' });
      return;
    }
    // During review: only admin and QA can view other players' code
    if ((isSunrise || isNightReview) && targetId !== socket.id && !isAdmin && !isSecurityLead) {
      socket.emit(EVENTS.ERROR, { message: 'Only Admin and QA can browse code during review.' });
      return;
    }

    // Check view limits for admin and QA during review
    if ((isSunrise || isNightReview) && targetId !== socket.id && (isAdmin || isSecurityLead)) {
      const allowed = room.trackCodeView(socket.id, targetId);
      if (!allowed) {
        const limit = isAdmin ? CONFIG.ADMIN_CHECKS_PER_NIGHT : CONFIG.SECURITY_VIEWS_PER_NIGHT;
        socket.emit(EVENTS.ERROR, { message: `You can only view ${limit} players' code per round.` });
        return;
      }
    }

    const codeData = CodeEngine.getPlayerCode(room.codeStore, targetId);
    if (codeData) {
      const response = { targetId, ...codeData };
      // Include injection options for hackers viewing the agreed target
      if (isHacker && targetId !== socket.id) {
        response.injectionOptions = CodeEngine.getInjectionOptions(room.codeStore, targetId);
        response.alreadyInjected = room.nightActions.hackerInjected || false;
        console.log('[HANDLER] Hacker browsing', targetId, '- injectionOptions:', response.injectionOptions?.length, 'items');
      }
      // Include view counts so clients know remaining views
      if (isAdmin) {
        response.viewsUsed = room.nightActions.adminViews.size;
        response.viewsMax = CONFIG.ADMIN_CHECKS_PER_NIGHT;
      }
      if (isSecurityLead) {
        response.viewsUsed = room.nightActions.securityViews.size;
        response.viewsMax = CONFIG.SECURITY_VIEWS_PER_NIGHT;
      }
      socket.emit(EVENTS.PLAYER_CODE_DATA, response);
    }
  });

  /* ──────────────────────────────────────────
   *  HACKER INJECT (Hacker manually injects a corruption into a target's file)
   *  Kept for backwards compatibility but individual inject is now replaced by team vote.
   * ────────────────────────────────────────── */
  socket.on(EVENTS.HACKER_INJECT, ({ targetId, fileIdx, patchIdx }) => {
    // Redirect to inject vote system
    const room = roomManager.getRoomBySocket(socket.id);
    if (!room || !room.codeStore || room.phase !== 'night') return;

    room.submitHackerInjectVote(
      socket.id,
      fileIdx,
      patchIdx,
      sendToPlayerFn,
      (event, data) => broadcastToRoom(room.id, event, data)
    );
  });

  /* ──────────────────────────────────────────
   *  HACKER INJECT VOTE (Hackers vote on which corruption to apply)
   * ────────────────────────────────────────── */
  socket.on(EVENTS.HACKER_INJECT_VOTE, ({ fileIdx, patchIdx }) => {
    const room = roomManager.getRoomBySocket(socket.id);
    if (!room || !room.codeStore || room.phase !== 'night') return;

    room.submitHackerInjectVote(
      socket.id,
      fileIdx,
      patchIdx,
      sendToPlayerFn,
      (event, data) => broadcastToRoom(room.id, event, data)
    );
  });

  /* ──────────────────────────────────────────
   *  ADMIN CHECK (legacy — admin now browses code manually)
   * ────────────────────────────────────────── */
  socket.on(EVENTS.ADMIN_CHECK, ({ targetId }) => {
    // Admin checking is now manual — they browse the code and decide.
    // This event is kept for backwards compatibility but does nothing.
  });

  /* ──────────────────────────────────────────
   *  ADMIN SCAN CORRUPTION (Admin checks if a player has corrupted code)
   *  Only during SUNRISE. Returns corruption details—or a "clean" response.
   *  If corrupted, sends the player's full code so admin can inspect it.
   * ────────────────────────────────────────── */
  socket.on(EVENTS.ADMIN_SCAN_CORRUPTION, (payload = {}) => {
    const { targetId } = payload;
    const room = roomManager.getRoomBySocket(socket.id);
    const reviewPhaseActive = room && (room.phase === PHASES.SUNRISE || (room.phase === PHASES.NIGHT && room.nightActions?.hackerInjected));
    if (!room || !room.codeStore || !reviewPhaseActive) return;

    const player = room.getPlayer(socket.id);
    if (!player || !player.alive || !player.isAdmin()) return;

    const effectiveTargetId = room.nightActions?.hackerTarget || targetId;
    if (!effectiveTargetId) {
      socket.emit(EVENTS.ERROR, { message: 'No hacked target is available to review yet.' });
      return;
    }

    // Track view limit — admin can only scan ADMIN_CHECKS_PER_NIGHT different players
    const canView = room.trackCodeView(socket.id, effectiveTargetId);
    if (!canView) {
      const limit = CONFIG.ADMIN_CHECKS_PER_NIGHT;
      socket.emit(EVENTS.ERROR, { message: `You can only scan ${limit} players' code per round.` });
      return;
    }

    const details = CodeEngine.getCorruptionDetails(room.codeStore, effectiveTargetId);
    const target = room.getPlayer(effectiveTargetId);
    socket.emit(EVENTS.ADMIN_SCAN_RESULT, {
      targetId: effectiveTargetId,
      targetName: target?.name || details.playerName || 'Unknown',
      ...details,
    });
  });

  /* ──────────────────────────────────────────
   *  ADMIN BUG GUESS (Admin identifies the file containing the bug)
   *  During SUNRISE only. Admin has ONE try:
   *    - Correct file → the player is protected from the hacker attack.
   *    - Wrong file   → the player is eliminated.
   * ────────────────────────────────────────── */
  socket.on(EVENTS.ADMIN_BUG_GUESS, ({ targetId, fileIdx }) => {
    const room = roomManager.getRoomBySocket(socket.id);
    if (!room || !room.codeStore || room.phase !== PHASES.SUNRISE) return;

    const player = room.getPlayer(socket.id);
    if (!player || !player.alive || !player.isAdmin()) return;

    const result = room.submitAdminBugGuess(socket.id, targetId, fileIdx, sendToPlayerFn);
    if (result && !result.error) {
      socket.emit(EVENTS.ADMIN_BUG_GUESS_RESULT, result);
    } else if (result?.error === 'already_guessed') {
      socket.emit(EVENTS.ERROR, { message: 'You have already used your one bug-location guess this night.' });
    } else if (result?.error === 'not_corrupted') {
      socket.emit(EVENTS.ERROR, { message: 'That player\'s code is not corrupted.' });
    }
  });

  /* ──────────────────────────────────────────
   *  ADMIN REPAIR (Admin fixes a corrupted player's code)
   * ────────────────────────────────────────── */
  socket.on(EVENTS.ADMIN_REPAIR, ({ targetId }) => {
    const room = roomManager.getRoomBySocket(socket.id);
    const reviewPhaseActive = room && (room.phase === PHASES.SUNRISE || (room.phase === PHASES.NIGHT && room.nightActions?.hackerInjected));
    if (!room || !room.codeStore || !reviewPhaseActive) return;

    const result = room.submitAdminRepair(socket.id, targetId, sendToPlayerFn);
    if (result) {
      socket.emit(EVENTS.ADMIN_REPAIR_RESULT, result);
      // Send the target their updated (repaired) code
      if (result.repaired) {
        const ownCode = CodeEngine.getOwnCode(room.codeStore, targetId);
        if (ownCode) {
          sendTo(targetId, EVENTS.CODE_FILES_INIT, { [targetId]: ownCode });
        }
      }
    }
  });

  /* ──────────────────────────────────────────
   *  SECURITY SCAN (QA scans a player's code for sus function names)
   * ────────────────────────────────────────── */
  socket.on(EVENTS.SECURITY_SCAN, ({ targetId }) => {
    const room = roomManager.getRoomBySocket(socket.id);
    const qaPhaseActive = room && (room.phase === PHASES.SUNRISE || (room.phase === PHASES.NIGHT && room.nightActions?.hackerInjected));
    if (!room || !room.codeStore || !qaPhaseActive) {
      console.log('[SEC-SCAN] Blocked: room=%s codeStore=%s phase=%s', !!room, !!(room && room.codeStore), room?.phase);
      return;
    }

    const result = room.submitSecurityScan(socket.id, targetId, sendToPlayerFn);
    console.log('[SEC-SCAN] targetId=%s result=%s', targetId, JSON.stringify(result));
    if (result) {
      socket.emit(EVENTS.SECURITY_SCAN_RESULT, result);
    }
  });

  /* ──────────────────────────────────────────
   *  RECONNECT ATTEMPT
   * ────────────────────────────────────────── */
  socket.on(EVENTS.RECONNECT_ATTEMPT, ({ roomId, playerName }) => {
    const code = roomId.toUpperCase().trim();
    const result = roomManager.reconnectPlayer(socket.id, code, playerName);

    if (!result.ok) {
      socket.emit(EVENTS.RECONNECT_FAIL, { reason: result.reason });
      return;
    }

    const { room, player } = result;

    // Join the socket.io room
    socket.join(room.id);

    // Send reconnect success with full state
    socket.emit(EVENTS.RECONNECT_SUCCESS, {
      roomId: room.id,
      role: player.role,
      description: getRoleDescription(player.role),
      phase: room.phase,
      gameState: room.getPublicState(),
    });

    // Re-send hacker reveal if they're a hacker
    if (player.isHacker()) {
      const fellowHackers = [...room.players.values()]
        .filter(h => h.isHacker() && h.id !== player.id)
        .map(h => ({ id: h.id, name: h.name }));
      socket.emit(EVENTS.HACKER_REVEAL, { hackers: fellowHackers });
    }

    // Send last investigation result if QA
    if (player.isSecurityLead() && player.lastInvestigation) {
      socket.emit(EVENTS.INVESTIGATION_RESULT, { results: player.lastInvestigation });
    }

    // Send code files on reconnect (own code only)
    if (room.codeStore) {
      const ownCode = CodeEngine.getOwnCode(room.codeStore, player.id);
      if (ownCode) {
        socket.emit(EVENTS.CODE_FILES_INIT, { [player.id]: ownCode });
      }
    }

    // Notify room that player reconnected
    broadcastToRoom(room.id, EVENTS.PLAYER_RECONNECTED, {
      playerId: player.id,
      playerName: player.name,
    });
    broadcastToRoom(room.id, EVENTS.ROOM_UPDATE, room.getPublicState());
  });

  /* ──────────────────────────────────────────
   *  DISCONNECT
   * ────────────────────────────────────────── */
  socket.on(EVENTS.DISCONNECT, () => {
    const room = roomManager.handleDisconnect(socket.id);
    if (room) {
      broadcastToRoom(room.id, EVENTS.PLAYER_DISCONNECTED, { playerId: socket.id });
      broadcastToRoom(room.id, EVENTS.ROOM_UPDATE, room.getPublicState());
    }
  });
}

/* ──────────────────────────────────────────
 *  Role description helper
 * ────────────────────────────────────────── */
function getRoleDescription(role) {
  switch (role) {
    case ROLES.DEVELOPER:
      return 'You are a Developer. Review your code during the day for any bugs. Vote wisely during the day to eliminate the Hackers!';
    case ROLES.HACKER:
      return 'You are a Hacker. Each night, ALL Hackers vote on a target, then vote together on which corruption to inject. Your own code contains suspicious function names — watch out for the QA!';
    case ROLES.SECURITY_LEAD:
      return 'You are the QA. Each night, browse up to 2 players\' code looking for suspicious function names. If you find functions like exploit_buffer or rootkit_load — that player is a Hacker!';
    case ROLES.ADMIN:
      return 'You are the Admin. At sunrise, scan a player\'s code for corruption. If corrupted, you\'ll see all their files — choose which file has the bug. ONE try only: correct → you protect that player; wrong → that player is eliminated!';
    default:
      return '';
  }
}

module.exports = registerHandlers;
