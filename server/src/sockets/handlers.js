/**
 * socketHandlers.js – All Socket.io event handlers for the Code Wars game.
 *
 * This file wires every client event to the appropriate Room / Player
 * methods and broadcasts results back.
 */

const EVENTS = require('../shared/events');
const PHASES = require('../shared/phases');
const ROLES = require('../shared/roles');
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

    if (advancedMode) {
      room.advancedMode = true;
      room.systemStability = 3;
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

    // Begin Day 1 after a short delay for role reveal
    setTimeout(() => {
      room.startDay((event, data) => broadcastToRoom(room.id, event, data));
    }, 5000);
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

    // Broadcast updated vote tally
    const { tally } = room.voteTracker.tally();
    broadcastToRoom(room.id, EVENTS.VOTE_UPDATE, {
      tally,
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
    if (!room || room.phase !== PHASES.NIGHT) return;

    room.submitNightAction(
      socket.id,
      targetId,
      sendToPlayerFn,
      (event, data) => broadcastToRoom(room.id, event, data)
    );
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
      return 'You are a Developer. You have no special night ability. Vote wisely during the day to eliminate the Hackers!';
    case ROLES.HACKER:
      return 'You are a Hacker. Each night, conspire with fellow Hackers to inject a critical bug into a player. Don\'t get caught!';
    case ROLES.SECURITY_LEAD:
      return 'You are the Security Lead. Each night, investigate one player to learn if they are a Hacker or not.';
    case ROLES.ADMIN:
      return 'You are the Admin. Each night, choose one player to debug (protect). If Hackers target them, the attack fails.';
    default:
      return '';
  }
}

module.exports = registerHandlers;
