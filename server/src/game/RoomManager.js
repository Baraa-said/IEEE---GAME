/**
 * RoomManager.js – Singleton store for all active rooms.
 *
 * Provides O(1) lookup by room code and by socket id → room mapping
 * so we can handle disconnects efficiently.
 */

const Room = require('./Room');

class RoomManager {
  constructor() {
    /** @type {Map<string, Room>} roomCode → Room */
    this.rooms = new Map();

    /** @type {Map<string, string>} socketId → roomCode */
    this.socketToRoom = new Map();
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
