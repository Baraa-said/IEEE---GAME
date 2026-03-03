/**
 * RoomManager.js – Singleton store for all active rooms.
 *
 * Provides O(1) lookup by room code and by socket id → room mapping
 * so we can handle disconnects efficiently.
 */

const Room = require('./Room');
const CONFIG = require('../shared/gameConfig');

/** Reconnect window – sourced from gameConfig */
const RECONNECT_WINDOW_MS = CONFIG.RECONNECT_WINDOW_MS;

class RoomManager {
  constructor() {
    /** @type {Map<string, Room>} roomCode → Room */
    this.rooms = new Map();

    /** @type {Map<string, string>} socketId → roomCode */
    this.socketToRoom = new Map();

    // Cleanup stale disconnected players every 60s
    setInterval(() => this.cleanupDisconnected(), 60000);
  }

  createRoom(hostId, hostName) {
    const room = new Room(hostId, hostName);
    this.rooms.set(room.id, room);
    this.socketToRoom.set(hostId, room.id);
    return room;
  }

  getRoom(code) {
    return this.rooms.get(code) || null;
  }

  getRoomBySocket(socketId) {
    const code = this.socketToRoom.get(socketId);
    return code ? this.rooms.get(code) : null;
  }

  joinRoom(code, playerId, playerName) {
    const room = this.getRoom(code);
    if (!room) return { ok: false, reason: 'Room not found.' };
    const result = room.addPlayer(playerId, playerName);
    if (result.ok) {
      this.socketToRoom.set(playerId, code);
    }
    return result;
  }

  handleDisconnect(socketId) {
    const room = this.getRoomBySocket(socketId);
    if (!room) return null;

    const player = room.getPlayer(socketId);
    if (player) {
      player.disconnected = true;
      player.disconnectedAt = Date.now();
    }

    // If in lobby, remove player
    if (room.phase === 'lobby') {
      room.removePlayer(socketId);
      this.socketToRoom.delete(socketId);
      // If room empty, delete it
      if (room.players.size === 0) {
        this.rooms.delete(room.id);
        return null;
      }
    }

    return room;
  }

  /**
   * Attempt to reconnect a player to their game using room code + name.
   * Returns { ok, room, player } or { ok: false, reason }.
   */
  reconnectPlayer(newSocketId, roomCode, playerName) {
    const room = this.getRoom(roomCode);
    if (!room) return { ok: false, reason: 'Room not found.' };
    if (room.phase === 'lobby') return { ok: false, reason: 'Game has not started yet. Just rejoin normally.' };
    if (room.phase === 'game_over') return { ok: false, reason: 'Game is already over.' };

    // Find the disconnected player by name
    let disconnectedPlayer = null;
    let oldSocketId = null;
    for (const [sid, p] of room.players.entries()) {
      if (p.name === playerName && p.disconnected) {
        // Check if within reconnect window
        if (p.disconnectedAt && (Date.now() - p.disconnectedAt) <= RECONNECT_WINDOW_MS) {
          disconnectedPlayer = p;
          oldSocketId = sid;
          break;
        }
      }
    }

    if (!disconnectedPlayer) {
      return { ok: false, reason: `No disconnected player with that name found, or reconnect window (${Math.round(CONFIG.RECONNECT_WINDOW_MS / 60000)} min) expired.` };
    }

    // Swap the player to the new socket ID
    room.players.delete(oldSocketId);
    disconnectedPlayer.id = newSocketId;
    disconnectedPlayer.disconnected = false;
    disconnectedPlayer.disconnectedAt = null;
    room.players.set(newSocketId, disconnectedPlayer);

    // Update socket→room mapping
    this.socketToRoom.delete(oldSocketId);
    this.socketToRoom.set(newSocketId, roomCode);

    // Update skip votes if old socket was in there
    if (room.skipVotes && room.skipVotes.has(oldSocketId)) {
      room.skipVotes.delete(oldSocketId);
      room.skipVotes.add(newSocketId);
    }

    // Update hacker votes if old socket had voted
    if (room.hackerVotes && room.hackerVotes.has(oldSocketId)) {
      const target = room.hackerVotes.get(oldSocketId);
      room.hackerVotes.delete(oldSocketId);
      room.hackerVotes.set(newSocketId, target);
    }

    // Update vote tracker if old socket had voted
    if (room.voteTracker && room.voteTracker.votes.has(oldSocketId)) {
      const target = room.voteTracker.votes.get(oldSocketId);
      room.voteTracker.votes.delete(oldSocketId);
      room.voteTracker.votes.set(newSocketId, target);
    }

    return { ok: true, room, player: disconnectedPlayer };
  }

  /**
   * Clean up players who have been disconnected longer than the reconnect window.
   */
  cleanupDisconnected() {
    const now = Date.now();
    for (const room of this.rooms.values()) {
      if (room.phase === 'lobby' || room.phase === 'game_over') continue;
      for (const [sid, p] of room.players.entries()) {
        if (p.disconnected && p.disconnectedAt && (now - p.disconnectedAt) > RECONNECT_WINDOW_MS) {
          // Mark as permanently gone (dead) if they were alive
          if (p.alive) {
            p.alive = false;
          }
        }
      }
    }
  }

  removeRoom(code) {
    const room = this.rooms.get(code);
    if (room) {
      for (const pid of room.players.keys()) {
        this.socketToRoom.delete(pid);
      }
      this.rooms.delete(code);
    }
  }
}

module.exports = new RoomManager(); // singleton
