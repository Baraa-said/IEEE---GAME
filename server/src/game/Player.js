/**
 * Player.js – Represents a single player in a Code Wars game.
 *
 * Each player has a unique socket id, display name, assigned role,
 * alive status, and vote-streak tracking for the two-consecutive-votes
 * elimination mechanic.
 */

const ROLES = require('../shared/roles');

class Player {
  /**
   * @param {string} id       – socket.id
   * @param {string} name     – display name chosen in lobby
   * @param {boolean} isHost  – true for the room creator
   */
  constructor(id, name, isHost = false) {
    this.id = id;
    this.name = name;
    this.isHost = isHost;

    /** @type {string|null} one of ROLES values, assigned at game start */
    this.role = null;

    /** Is the player still in the game? */
    this.alive = true;

    /**
     * How many consecutive voting rounds this player received
     * the highest number of votes. Two consecutive → eliminated.
     */
    this.voteStreak = 0;

    /** Who this player voted for in the current round (player id) */
    this.currentVote = null;

    /** Night action target (player id) – used by Hacker / QA / Admin */
    this.nightTarget = null;

    /** Latest investigation result for QA */
    this.lastInvestigation = null;

    /** Whether this player is protected by Admin this night */
    this.protected = false;

    /** Track disconnection — allow short reconnect window */
    this.disconnected = false;
    this.disconnectedAt = null;

    /** Is this an AI bot player (no real socket)? */
    this.isBot = false;
  }

  /* ---- helpers ---- */

  isHacker() {
    return this.role === ROLES.HACKER;
  }

  isSecurityLead() {
    return this.role === ROLES.SECURITY_LEAD;
  }

  isAdmin() {
    return this.role === ROLES.ADMIN;
  }

  isDeveloper() {
    return this.role === ROLES.DEVELOPER;
  }

  /** Return a safe public view (no role leak) */
  toPublic() {
    return {
      id: this.id,
      name: this.name,
      alive: this.alive,
      isHost: this.isHost,
      disconnected: this.disconnected,
      isBot: this.isBot,
    };
  }

  /** Return private view sent only to the player themselves */
  toPrivate() {
    return {
      ...this.toPublic(),
      role: this.role,
      lastInvestigation: this.lastInvestigation,
    };
  }

  /** Reset per-round state */
  resetRound() {
    this.currentVote = null;
  }

  /** Reset per-night state */
  resetNight() {
    this.nightTarget = null;
    this.protected = false;
  }
}

module.exports = Player;
