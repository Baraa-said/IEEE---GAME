/**
 * Room.js – Represents a single game room / lobby.
 *
 * Manages:
 *  - Player list
 *  - Game state (phase, sprint number, stability)
 *  - Phase transitions (day → voting → defense → night → day …)
 *  - Night action collection
 *  - Win-condition checks after every elimination
 */

const { v4: uuidv4 } = require('uuid');
const Player = require('./Player');
const RoleEngine = require('./RoleEngine');
const VoteTracker = require('./VoteTracker');
const ROLES = require('../shared/roles');
const PHASES = require('../shared/phases');
const EVENTS = require('../shared/events');

/** Duration constants (ms) */
const TIMERS = {
  DISCUSSION: 60000,   // 60 s day discussion
  VOTING: 45000,       // 45 s to vote
  DEFENSE: 20000,      // 20 s to defend
  NIGHT: 30000,        // 30 s for night actions
};

class Room {
  /**
   * @param {string} hostId   – socket id of the creator
   * @param {string} hostName – display name of the creator
   */
  constructor(hostId, hostName) {
    this.id = this.generateRoomCode();

    /** @type {Map<string, Player>} */
    this.players = new Map();

    // Add the host
    const host = new Player(hostId, hostName, true);
    this.players.set(hostId, host);

    // Game state
    this.phase = PHASES.LOBBY;
    this.sprint = 0;            // current sprint (round) number
    this.advancedMode = false;
    this.systemStability = 3;

    // Voting
    this.voteTracker = new VoteTracker();
    this.voteRoundInSprint = 0; // how many vote rounds within current sprint

    // Night action collection
    this.nightActions = { hackerTarget: null, adminTarget: null, securityTarget: null };
    this.hackerVotes = new Map(); // hackerId → targetId (hackers vote on target)

    // Timers
    this.phaseTimer = null;

    // Elimination log
    this.log = [];

    // Track defenders for defense phase
    this.currentDefenders = [];
  }

  /* ═══════════════════════════════════════════
   *  Room code generation
   * ═══════════════════════════════════════════ */
  generateRoomCode() {
    // 6-char uppercase alphanumeric
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /* ═══════════════════════════════════════════
   *  Player management
   * ═══════════════════════════════════════════ */

  addPlayer(id, name) {
    if (this.phase !== PHASES.LOBBY) return { ok: false, reason: 'Game already in progress.' };
    if (this.players.has(id)) return { ok: false, reason: 'Already in room.' };
    if ([...this.players.values()].find(p => p.name === name)) {
      return { ok: false, reason: 'Name already taken.' };
    }
    this.players.set(id, new Player(id, name));
    return { ok: true };
  }

  removePlayer(id) {
    this.players.delete(id);
    // Transfer host if needed
    if (this.players.size > 0 && ![...this.players.values()].some(p => p.isHost)) {
      const first = this.players.values().next().value;
      first.isHost = true;
    }
  }

  getPlayer(id) {
    return this.players.get(id);
  }

  getAlivePlayers() {
    return [...this.players.values()].filter(p => p.alive);
  }

  getAliveHackers() {
    return this.getAlivePlayers().filter(p => p.isHacker());
  }

  getAliveNonHackers() {
    return this.getAlivePlayers().filter(p => !p.isHacker());
  }

  /** Public lobby / player-list state */
  getPublicState() {
    return {
      roomId: this.id,
      phase: this.phase,
      sprint: this.sprint,
      systemStability: this.systemStability,
      advancedMode: this.advancedMode,
      players: [...this.players.values()].map(p => p.toPublic()),
      defenders: this.currentDefenders.map(p => p.id),
      voteRoundInSprint: this.voteRoundInSprint,
    };
  }

  /* ═══════════════════════════════════════════
   *  Game start
   * ═══════════════════════════════════════════ */

  /**
   * Start the game — validate player count, assign roles, begin Day 1.
   * @param {function} io – socket.io server (or room emitter) for broadcasting
   * @returns {{ ok: boolean, reason?: string }}
   */
  startGame(io) {
    if (this.players.size < 6) {
      return { ok: false, reason: 'Need at least 6 players to start.' };
    }

    // Assign roles
    const playerArr = [...this.players.values()];
    RoleEngine.assignRoles(playerArr);

    this.phase = PHASES.DAY_DISCUSSION;
    this.sprint = 1;

    return { ok: true };
  }

  /* ═══════════════════════════════════════════
   *  Phase transitions
   * ═══════════════════════════════════════════ */

  clearTimer() {
    if (this.phaseTimer) {
      clearTimeout(this.phaseTimer);
      this.phaseTimer = null;
    }
  }

  /**
   * Transition to a new phase and broadcast.
   * @param {string} newPhase
   * @param {function} broadcast – fn(event, data) to emit to room
   * @param {object} [extra]    – extra data to send with phase change
   */
  setPhase(newPhase, broadcast, extra = {}) {
    this.clearTimer();
    this.phase = newPhase;
    broadcast(EVENTS.PHASE_CHANGE, {
      phase: newPhase,
      sprint: this.sprint,
      systemStability: this.systemStability,
      ...extra,
    });
  }

  /**
   * Begin the Day discussion phase.
   */
  startDay(broadcast) {
    this.voteRoundInSprint = 0;
    this.currentDefenders = [];
    // Reset vote streaks at start of new sprint? No — streaks persist across rounds within a sprint.
    this.setPhase(PHASES.DAY_DISCUSSION, broadcast, {
      message: `Sprint ${this.sprint} – Standup Meeting begins. Discuss who might be a Hacker!`,
      duration: TIMERS.DISCUSSION,
    });

    // Auto-advance to voting after timer
    this.phaseTimer = setTimeout(() => {
      this.startVoting(broadcast);
    }, TIMERS.DISCUSSION);
  }

  /**
   * Begin a voting round.
   */
  startVoting(broadcast) {
    this.voteRoundInSprint += 1;
    const alive = this.getAlivePlayers();
    this.voteTracker.reset(alive.length);
    alive.forEach(p => p.resetRound());

    this.setPhase(PHASES.DAY_VOTING, broadcast, {
      message: `Voting round ${this.voteRoundInSprint} – Vote to Suspend an Account.`,
      duration: TIMERS.VOTING,
    });

    // Auto-resolve if timer expires
    this.phaseTimer = setTimeout(() => {
      this.resolveVotes(broadcast);
    }, TIMERS.VOTING);
  }

  /**
   * Process vote results.
   * @returns {object} result info (for logging)
   */
  resolveVotes(broadcast) {
    this.clearTimer();

    const alive = this.getAlivePlayers();
    const { eliminated, defenders, tally } = this.voteTracker.processRound(alive);

    broadcast(EVENTS.VOTE_RESULT, { tally, eliminatedId: eliminated?.id || null, defenders: defenders.map(d => d.id) });

    if (eliminated) {
      // Reveal role
      broadcast(EVENTS.PLAYER_ELIMINATED, {
        id: eliminated.id,
        name: eliminated.name,
        role: eliminated.role,
        reason: 'Voted out during Standup',
      });
      this.log.push({ sprint: this.sprint, phase: 'day', eliminated: eliminated.name, role: eliminated.role });

      // Check win
      const win = RoleEngine.checkWinCondition([...this.players.values()], this.systemStability, this.advancedMode);
      if (win.gameOver) {
        this.endGame(broadcast, win);
        return;
      }

      // Move to night
      this.startNight(broadcast);
    } else if (defenders.length > 0) {
      // Defense phase
      this.currentDefenders = defenders;
      this.setPhase(PHASES.DAY_DEFENSE, broadcast, {
        defenders: defenders.map(d => ({ id: d.id, name: d.name })),
        message: `${defenders.map(d => d.name).join(' & ')} must defend themselves!`,
        duration: TIMERS.DEFENSE,
      });

      this.phaseTimer = setTimeout(() => {
        this.startVoting(broadcast);
      }, TIMERS.DEFENSE);
    } else {
      // No one voted — move to next vote round or advance
      this.startVoting(broadcast);
    }
  }

  /**
   * Begin the Night phase.
   */
  startNight(broadcast) {
    // Reset night state for all alive players
    this.getAlivePlayers().forEach(p => p.resetNight());
    this.nightActions = { hackerTarget: null, adminTarget: null, securityTarget: null };
    this.hackerVotes = new Map();

    this.setPhase(PHASES.NIGHT, broadcast, {
      message: 'Night falls… Hackers, Security Lead, and Admin perform their actions.',
      duration: TIMERS.NIGHT,
    });

    // Auto-resolve after timer
    this.phaseTimer = setTimeout(() => {
      this.resolveNight(broadcast);
    }, TIMERS.NIGHT);
  }

  /**
   * Record a night action from a player.
   * @param {string} playerId
   * @param {string} targetId
   * @param {function} sendToPlayer – fn(event, data) to send private message
   * @param {function} broadcast
   */
  submitNightAction(playerId, targetId, sendToPlayer, broadcast) {
    const player = this.getPlayer(playerId);
    if (!player || !player.alive || this.phase !== PHASES.NIGHT) return;

    player.nightTarget = targetId;

    if (player.isHacker()) {
      this.hackerVotes.set(playerId, targetId);
      // Check if all alive hackers have voted
      const aliveHackers = this.getAliveHackers();
      if (this.hackerVotes.size >= aliveHackers.length) {
        // Majority vote among hackers to pick target
        this.nightActions.hackerTarget = this.majorityVote(this.hackerVotes);
      }
    } else if (player.isAdmin()) {
      this.nightActions.adminTarget = targetId;
    } else if (player.isSecurityLead()) {
      this.nightActions.securityTarget = targetId;
    }

    // Check if all night actions are in
    if (this.allNightActionsReady()) {
      this.resolveNight(broadcast, sendToPlayer);
    }
  }

  /** Check if all expected night actors have submitted */
  allNightActionsReady() {
    const alive = this.getAlivePlayers();
    const aliveHackers = alive.filter(p => p.isHacker());
    const aliveAdmin = alive.find(p => p.isAdmin());
    const aliveSecurity = alive.find(p => p.isSecurityLead());

    const hackersReady = this.hackerVotes.size >= aliveHackers.length;
    const adminReady = !aliveAdmin || this.nightActions.adminTarget !== null;
    const securityReady = !aliveSecurity || this.nightActions.securityTarget !== null;

    return hackersReady && adminReady && securityReady;
  }

  /** Simple majority vote from a Map<voterId, targetId> */
  majorityVote(votesMap) {
    const tally = new Map();
    for (const target of votesMap.values()) {
      tally.set(target, (tally.get(target) || 0) + 1);
    }
    let best = null, bestCount = 0;
    for (const [target, count] of tally.entries()) {
      if (count > bestCount) { best = target; bestCount = count; }
    }
    return best;
  }

  /**
   * Resolve all night actions and advance to next day.
   */
  resolveNight(broadcast, sendToPlayerFn) {
    this.clearTimer();

    // If hackers didn't all vote, pick from whatever we have
    if (!this.nightActions.hackerTarget && this.hackerVotes.size > 0) {
      this.nightActions.hackerTarget = this.majorityVote(this.hackerVotes);
    }

    const result = RoleEngine.resolveNight({
      alivePlayers: this.getAlivePlayers(),
      hackerTargetId: this.nightActions.hackerTarget,
      adminTargetId: this.nightActions.adminTarget,
      securityTargetId: this.nightActions.securityTarget,
      systemStability: this.systemStability,
      advancedMode: this.advancedMode,
    });

    this.systemStability = result.newStability;

    // Send investigation result privately to Security Lead
    if (result.investigationResult && sendToPlayerFn) {
      const secLead = this.getAlivePlayers().find(p => p.isSecurityLead());
      if (secLead) {
        secLead.lastInvestigation = result.investigationResult;
        sendToPlayerFn(secLead.id, EVENTS.INVESTIGATION_RESULT, result.investigationResult);
      }
    }

    // Broadcast night outcome
    if (result.eliminated) {
      broadcast(EVENTS.NIGHT_RESULT, {
        eliminated: { id: result.eliminated.id, name: result.eliminated.name, role: result.eliminated.role },
        protectionSaved: false,
        message: `${result.eliminated.name} was found with a critical bug injected. They are out!`,
      });
      this.log.push({ sprint: this.sprint, phase: 'night', eliminated: result.eliminated.name, role: result.eliminated.role });
    } else if (result.protectionSaved) {
      broadcast(EVENTS.NIGHT_RESULT, {
        eliminated: null,
        protectionSaved: true,
        message: 'The Admin successfully debugged the targeted player. No one was eliminated!',
      });
    } else {
      broadcast(EVENTS.NIGHT_RESULT, {
        eliminated: null,
        protectionSaved: false,
        message: 'The night passes quietly… no one was attacked.',
      });
    }

    // Check win condition
    const win = RoleEngine.checkWinCondition([...this.players.values()], this.systemStability, this.advancedMode);
    if (win.gameOver) {
      this.endGame(broadcast, win);
      return;
    }

    // Next sprint
    this.sprint += 1;
    // Reset vote streaks for new sprint
    this.getAlivePlayers().forEach(p => { p.voteStreak = 0; });

    // Small delay then start next day
    setTimeout(() => {
      this.startDay(broadcast);
    }, 3000);
  }

  /**
   * End the game.
   */
  endGame(broadcast, winResult) {
    this.clearTimer();
    this.phase = PHASES.GAME_OVER;
    broadcast(EVENTS.GAME_OVER, {
      winner: winResult.winner,
      reason: winResult.reason,
      players: [...this.players.values()].map(p => ({
        id: p.id,
        name: p.name,
        role: p.role,
        alive: p.alive,
      })),
    });
  }
}

module.exports = Room;
