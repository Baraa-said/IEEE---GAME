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
const crypto = require('crypto');
const Player = require('./Player');
const RoleEngine = require('./RoleEngine');
const CodeEngine = require('./CodeEngine');
const VoteTracker = require('./VoteTracker');
const BotManager = require('./BotManager');
const ROLES = require('../shared/roles');
const PHASES = require('../shared/phases');
const EVENTS = require('../shared/events');
const CONFIG = require('../shared/gameConfig');

/** Duration constants (ms) – sourced from gameConfig */
const TIMERS = CONFIG.TIMERS;

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
    this.systemStability = CONFIG.INITIAL_STABILITY;

    // Voting
    this.voteTracker = new VoteTracker();
    this.voteRoundInSprint = 0; // how many vote rounds within current sprint

    // Night action collection
    this.nightActions = { hackerTarget: null, adminTarget: null, securityTargets: [] };
    this.hackerVotes = new Map(); // hackerId → targetId (hackers vote on target)

    // Timers
    this.phaseTimer = null;

    // Elimination log
    this.log = [];

    // Track defenders for defense phase
    this.currentDefenders = [];

    // Skip votes
    this.skipVotes = new Set();
    // Sunrise done votes (admin + security lead press "Finish Sunrise")
    this.sunriseDone = new Set();

    // Code files per player (populated at game start)
    /** @type {Map<string, object>|null} */
    this.codeStore = null;
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

  /**
   * Add a bot player to the lobby.
   * @param {string} name – display name (without emoji prefix)
   * @returns {Player}
   */
  addBot(name) {
    const botId = `bot_${crypto.randomBytes(4).toString('hex')}`;
    const bot = new Player(botId, `🤖 ${name}`, false);
    bot.isBot = true;
    this.players.set(botId, bot);
    return bot;
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
      minPlayers: CONFIG.MIN_PLAYERS,
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
    if (this.players.size < CONFIG.MIN_PLAYERS) {
      return { ok: false, reason: `Need at least ${CONFIG.MIN_PLAYERS} players to start.` };
    }

    // Assign roles
    const playerArr = [...this.players.values()];
    RoleEngine.assignRoles(playerArr);

    // Generate code files per player
    this.codeStore = CodeEngine.generateCodeFiles(playerArr);

    this.phase = PHASES.NIGHT;
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
    this.skipVotes = new Set(); // Reset skip votes on phase change
    this.sunriseDone = new Set(); // Reset sunrise done on phase change
    this.phase = newPhase;
    broadcast(EVENTS.PHASE_CHANGE, {
      phase: newPhase,
      sprint: this.sprint,
      systemStability: this.systemStability,
      ...extra,
    });
  }

  /**
   * Skip the current phase (called when all alive players voted to skip).
   */
  skipPhase(broadcast, sendToPlayerFn) {
    const currentPhase = this.phase;
    this.clearTimer();

    switch (currentPhase) {
      case PHASES.DAY_DISCUSSION:
        this.startVoting(broadcast);
        break;
      case PHASES.DAY_VOTING:
        this.resolveVotes(broadcast);
        break;
      case PHASES.DAY_DEFENSE:
        this.startVoting(broadcast);
        break;
      case PHASES.NIGHT:
        this.endNightToSunrise(broadcast, sendToPlayerFn);
        break;
      case PHASES.SUNRISE:
        this.resolveSunrise(broadcast, sendToPlayerFn);
        break;
      default:
        break;
    }
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
    this._lastBroadcast = broadcast;
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

    // Trigger bot vote actions
    BotManager.onPhaseStart(this, PHASES.DAY_VOTING);
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

      // Broadcast updated state (dead player fix)
      broadcast(EVENTS.ROOM_UPDATE, this.getPublicState());

      // Check win
      const win = RoleEngine.checkWinCondition([...this.players.values()], this.systemStability, this.advancedMode);
      if (win.gameOver) {
        this.endGame(broadcast, win);
        return;
      }

      // Move to next night (new sprint)
      this.sprint += 1;
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
   * Begin the Night phase — HACKERS ONLY act here.
   */
  startNight(broadcast) {
    this._lastBroadcast = broadcast;
    // Reset night state for all alive players
    this.getAlivePlayers().forEach(p => p.resetNight());
    this.nightActions = {
      hackerTarget: null,
      hackerInjected: false,
      adminProtectTarget: null,   // set when admin correctly guesses corrupted file
      adminKillTarget: null,      // set when admin incorrectly guesses corrupted file
      adminBugGuessUsed: false,   // admin only gets one guess per night
      adminRepairs: [],
      securityTargets: [],
      adminViews: new Set(),
      securityViews: new Set(),
    };
    this.hackerVotes = new Map();
    this.hackerInjectVotes = new Map();

    this.setPhase(PHASES.NIGHT, broadcast, {
      message: 'Night falls… Hackers choose their target and inject malicious code.',
      duration: TIMERS.NIGHT,
    });

    this._lastSendToPlayer = this._lastSendToPlayer || null;
    this.phaseTimer = setTimeout(() => {
      this.endNightToSunrise(broadcast, this._lastSendToPlayer);
    }, TIMERS.NIGHT);

    // Trigger bot night actions
    BotManager.onPhaseStart(this, PHASES.NIGHT);
  }

  /**
   * Transition from Night to Sunrise — don't resolve yet.
   */
  endNightToSunrise(broadcast, sendToPlayerFn) {
    this.clearTimer();
    this._lastSendToPlayer = sendToPlayerFn;
    this.startSunrise(broadcast);
  }

  /**
   * Begin the Sunrise phase — ADMIN and SECURITY LEAD act here.
   * Admin browses code, repairs, and selects a player to protect.
   * Security Lead browses code and investigates.
   */
  startSunrise(broadcast) {
    this._lastBroadcast = broadcast;
    this.setPhase(PHASES.SUNRISE, broadcast, {
      message: 'Sunrise… Admin and Security Lead review the code and take action.',
      duration: TIMERS.SUNRISE,
    });

    this.phaseTimer = setTimeout(() => {
      this.resolveSunrise(broadcast, this._lastSendToPlayer);
    }, TIMERS.SUNRISE);

    // Trigger bot sunrise actions
    BotManager.onPhaseStart(this, PHASES.SUNRISE);
  }

  /**
   * Resolve all night + sunrise actions and advance to day.
   * Hacker attack vs Admin protection is resolved here.
   */
  resolveSunrise(broadcast, sendToPlayerFn) {
    this.clearTimer();

    // Resolve standard night actions (elimination, protection, stability)
    const result = RoleEngine.resolveNight({
      alivePlayers: this.getAlivePlayers(),
      hackerTargetId: this.nightActions.hackerTarget,
      adminTargetId: this.nightActions.adminProtectTarget,
      adminKillTargetId: this.nightActions.adminKillTarget,
      securityTargetIds: this.nightActions.securityTargets,
      systemStability: this.systemStability,
      advancedMode: this.advancedMode,
    });

    this.systemStability = result.newStability;

    // Broadcast admin wrong-guess kill (before hacker kill, so order is clear)
    if (result.adminKilled) {
      broadcast(EVENTS.PLAYER_ELIMINATED, {
        id: result.adminKilled.id,
        name: result.adminKilled.name,
        role: result.adminKilled.role,
        reason: 'Admin misidentified the corrupted file — wrongly terminated!',
      });
      this.log.push({ sprint: this.sprint, phase: 'night', eliminated: result.adminKilled.name, role: result.adminKilled.role });
    }

    // Broadcast hacker-attack night outcome
    if (result.eliminated) {
      broadcast(EVENTS.NIGHT_RESULT, {
        eliminated: { id: result.eliminated.id, name: result.eliminated.name, role: result.eliminated.role },
        adminKilled: result.adminKilled ? { id: result.adminKilled.id, name: result.adminKilled.name, role: result.adminKilled.role } : null,
        protectionSaved: false,
        message: `${result.eliminated.name} was eliminated during the night!`,
      });
      this.log.push({ sprint: this.sprint, phase: 'night', eliminated: result.eliminated.name, role: result.eliminated.role });
    } else if (result.protectionSaved) {
      broadcast(EVENTS.NIGHT_RESULT, {
        eliminated: null,
        adminKilled: result.adminKilled ? { id: result.adminKilled.id, name: result.adminKilled.name, role: result.adminKilled.role } : null,
        protectionSaved: true,
        message: 'The Admin correctly identified the corrupted file and saved the targeted player! The hacker attack was blocked.',
      });
    } else if (result.adminKilled) {
      broadcast(EVENTS.NIGHT_RESULT, {
        eliminated: null,
        adminKilled: { id: result.adminKilled.id, name: result.adminKilled.name, role: result.adminKilled.role },
        protectionSaved: false,
        message: `${result.adminKilled.name} was wrongly terminated — the Admin pointed at the wrong file.`,
      });
    } else if (this.nightActions.hackerInjected) {
      broadcast(EVENTS.NIGHT_RESULT, {
        eliminated: null,
        adminKilled: null,
        protectionSaved: false,
        message: 'A file was injected during the night! Someone\u2019s code has a hidden bug\u2026',
      });
    } else {
      broadcast(EVENTS.NIGHT_RESULT, {
        eliminated: null,
        adminKilled: null,
        protectionSaved: false,
        message: 'The night passes quietly\u2026 no code was compromised.',
      });
    }

    // Send each player ONLY their own updated code
    if (this.codeStore && sendToPlayerFn) {
      for (const [pid] of this.codeStore.entries()) {
        const ownCode = CodeEngine.getOwnCode(this.codeStore, pid);
        if (ownCode) {
          sendToPlayerFn(pid, EVENTS.CODE_FILES_INIT, { [pid]: ownCode });
        }
      }
    }

    // Broadcast updated player state
    broadcast(EVENTS.ROOM_UPDATE, this.getPublicState());

    // Check win condition
    const win = RoleEngine.checkWinCondition([...this.players.values()], this.systemStability, this.advancedMode);
    if (win.gameOver) {
      this.endGame(broadcast, win);
      return;
    }

    // Reset vote streaks for upcoming day
    this.getAlivePlayers().forEach(p => { p.voteStreak = 0; });

    // Small delay then start day
    setTimeout(() => {
      this.startDay(broadcast);
    }, CONFIG.DELAYS.NIGHT_TO_DAY);
  }

  /**
   * Record a night action from a player.
   * @param {string} playerId
   * @param {string} targetId
   * @param {function} sendToPlayer – fn(playerId, event, data) to send private message
   * @param {function} broadcast
   */
  /**
   * Hacker night action — pick a target to corrupt.
   * All hackers must agree on the same target (unanimous vote).
   */
  submitNightAction(playerId, targetId, sendToPlayer, broadcast) {
    const player = this.getPlayer(playerId);
    if (!player || !player.alive) return;

    this._lastSendToPlayer = sendToPlayer;
    player.nightTarget = targetId;

    // Admin no longer directly chooses protection — it is determined by bug-guess result
    if (player.isAdmin()) return;

    if (!player.isHacker()) return; // non-hackers use separate events
    if (this.phase !== PHASES.NIGHT) return; // hackers only act during night

    this.hackerVotes.set(playerId, targetId);
    const aliveHackers = this.getAliveHackers();
    const voteSummary = {};
    for (const [hId, tId] of this.hackerVotes.entries()) {
      const h = this.getPlayer(hId);
      const t = this.getPlayer(tId);
      voteSummary[hId] = { hackerName: h?.name, targetId: tId, targetName: t?.name };
    }
    for (const h of aliveHackers) {
      sendToPlayer(h.id, EVENTS.HACKER_VOTE_UPDATE, {
        votes: voteSummary,
        totalHackers: aliveHackers.length,
        allVoted: this.hackerVotes.size >= aliveHackers.length,
        disagreement: false,
      });
    }
    if (this.hackerVotes.size >= aliveHackers.length) {
      const targets = [...this.hackerVotes.values()];
      const allSame = targets.every(t => t === targets[0]);
      if (allSame) {
        this.nightActions.hackerTarget = targets[0];
        // Send agreed-upon target with injection options to all hackers
        const injectionOptions = CodeEngine.getInjectionOptions(this.codeStore, targets[0]);
        const targetPlayer = this.getPlayer(targets[0]);
        const targetCode = CodeEngine.getPlayerCode(this.codeStore, targets[0]);
        for (const h of aliveHackers) {
          sendToPlayer(h.id, EVENTS.HACKER_VOTE_UPDATE, {
            votes: voteSummary,
            totalHackers: aliveHackers.length,
            allVoted: true,
            disagreement: false,
            agreed: true,
            agreedTarget: targets[0],
            agreedTargetName: targetPlayer?.name || 'Unknown',
            injectionOptions,
            targetCode,
          });
        }
      } else {
        this.hackerVotes.clear();
        for (const h of aliveHackers) {
          sendToPlayer(h.id, EVENTS.HACKER_VOTE_UPDATE, {
            votes: {},
            totalHackers: aliveHackers.length,
            allVoted: false,
            disagreement: true,
            message: 'You must all agree on the same target! Votes reset.',
          });
        }
        return;
      }
    }

    // Don't auto-resolve — hackers still need to vote on injection
  }

  /**
   * Hacker injection vote — after target is agreed, hackers vote on which corruption to apply.
   * All hackers must agree on the same injection (unanimous vote).
   */
  submitHackerInjectVote(playerId, fileIdx, patchIdx, sendToPlayer, broadcast) {
    const player = this.getPlayer(playerId);
    if (!player || !player.alive || !player.isHacker() || this.phase !== PHASES.NIGHT) return null;
    if (!this.nightActions.hackerTarget) return null; // no target agreed yet
    if (this.nightActions.hackerInjected) return null; // already injected

    this._lastSendToPlayer = sendToPlayer;
    const aliveHackers = this.getAliveHackers();
    this.hackerInjectVotes.set(playerId, { fileIdx, patchIdx });

    // Build vote summary
    const voteSummary = {};
    const injectionOptions = CodeEngine.getInjectionOptions(this.codeStore, this.nightActions.hackerTarget);
    for (const [hId, vote] of this.hackerInjectVotes.entries()) {
      const h = this.getPlayer(hId);
      // Find the patch description
      let desc = '?';
      for (const opt of injectionOptions) {
        if (opt.fileIdx === vote.fileIdx) {
          const p = opt.patches.find(p => p.patchIdx === vote.patchIdx);
          if (p) { desc = p.desc; break; }
        }
      }
      const file = injectionOptions.find(o => o.fileIdx === vote.fileIdx);
      voteSummary[hId] = {
        hackerName: h?.name,
        fileIdx: vote.fileIdx,
        fileName: file?.fileName || '?',
        patchIdx: vote.patchIdx,
        desc,
      };
    }

    // Notify all hackers of vote status
    for (const h of aliveHackers) {
      sendToPlayer(h.id, EVENTS.HACKER_INJECT_VOTE_UPDATE, {
        votes: voteSummary,
        totalHackers: aliveHackers.length,
        allVoted: this.hackerInjectVotes.size >= aliveHackers.length,
        disagreement: false,
      });
    }

    if (this.hackerInjectVotes.size >= aliveHackers.length) {
      const votes = [...this.hackerInjectVotes.values()];
      const allSame = votes.every(v => v.fileIdx === votes[0].fileIdx && v.patchIdx === votes[0].patchIdx);
      if (allSame) {
        // Apply the agreed injection
        const result = CodeEngine.injectCorruption(
          this.codeStore,
          this.nightActions.hackerTarget,
          votes[0].fileIdx,
          votes[0].patchIdx
        );
        if (result.success) {
          this.nightActions.hackerInjected = true;
        }
        const target = this.getPlayer(this.nightActions.hackerTarget);
        const injectResult = {
          ...result,
          targetId: this.nightActions.hackerTarget,
          targetName: target?.name || 'Unknown',
        };
        // Notify all hackers
        for (const h of aliveHackers) {
          sendToPlayer(h.id, EVENTS.HACKER_INJECT_RESULT, injectResult);
        }
        // Auto-advance night phase now that hackers finished
        if (result.success) {
          setTimeout(() => this.skipPhase(broadcast, sendToPlayer), 1500);
        }
        return injectResult;
      } else {
        // Disagreement — reset inject votes
        this.hackerInjectVotes.clear();
        for (const h of aliveHackers) {
          sendToPlayer(h.id, EVENTS.HACKER_INJECT_VOTE_UPDATE, {
            votes: {},
            totalHackers: aliveHackers.length,
            allVoted: false,
            disagreement: true,
            message: 'All hackers must agree on the same injection! Votes reset.',
          });
        }
        return null;
      }
    }
    return null;
  }

  /**
   * Track a player's code view (admin or security lead).
   * Returns true if allowed, false if view limit exceeded.
   */
  trackCodeView(playerId, targetId) {
    const player = this.getPlayer(playerId);
    if (!player) return false;

    if (player.isAdmin()) {
      if (!this.nightActions.adminViews.has(targetId) &&
          this.nightActions.adminViews.size >= CONFIG.ADMIN_CHECKS_PER_NIGHT) {
        return false;
      }
      this.nightActions.adminViews.add(targetId);
      return true;
    }

    if (player.isSecurityLead()) {
      if (!this.nightActions.securityViews.has(targetId) &&
          this.nightActions.securityViews.size >= CONFIG.SECURITY_VIEWS_PER_NIGHT) {
        return false;
      }
      this.nightActions.securityViews.add(targetId);
      return true;
    }

    return true; // hackers have no view limit
  }

  /**
   * Admin checks a player's code for corruption (up to ADMIN_CHECKS_PER_NIGHT).
   * Returns the check result immediately to the admin.
   */
  submitAdminCheck(playerId, targetId, sendToPlayer) {
    // Keep for backwards compat — admin now browses code manually
    return null;
  }

  /**
   * Admin submits a bug-location guess for a corrupted player's code.
   * ONE try only — correct → player protected; wrong → player dies.
   *
   * @param {string} playerId  – admin's socket id
   * @param {string} targetId  – the player being inspected
   * @param {number} fileIdx   – index of the file the admin thinks contains the bug
   * @param {function} sendToPlayer
   * @returns {object|null} result info
   */
  submitAdminBugGuess(playerId, targetId, fileIdx, sendToPlayer) {
    const player = this.getPlayer(playerId);
    if (!player || !player.alive || !player.isAdmin() || this.phase !== PHASES.SUNRISE) return null;
    if (this.nightActions.adminBugGuessUsed) return { error: 'already_guessed' };

    this._lastSendToPlayer = sendToPlayer;

    // Get actual corruption details
    const details = CodeEngine.getCorruptionDetails(this.codeStore, targetId);
    if (!details.corrupted) return { error: 'not_corrupted' };

    const correct = details.fileIdx === fileIdx;
    const target = this.getPlayer(targetId);

    this.nightActions.adminBugGuessUsed = true;

    if (correct) {
      // Correct! This player will be protected from the hacker's attack.
      this.nightActions.adminProtectTarget = targetId;
    } else {
      // Wrong! This player will be eliminated at sunrise resolution.
      this.nightActions.adminKillTarget = targetId;
    }

    return {
      correct,
      targetId,
      targetName: target?.name || 'Unknown',
      guessedFileIdx: fileIdx,
      actualFileIdx: details.fileIdx,
      guessedFileName: details.files?.[fileIdx]?.name || `File ${fileIdx}`,
      actualFileName: details.fileName,
    };
  }

  /**
   * Hacker injects a specific corruption into a target's file.
   * Only 1 injection per hacker team per night.
   */
  submitHackerInject(playerId, targetId, fileIdx, patchIdx, sendToPlayer) {
    const player = this.getPlayer(playerId);
    if (!player || !player.alive || !player.isHacker() || this.phase !== PHASES.NIGHT) return null;
    if (this.nightActions.hackerInjected) return { success: false, reason: 'already_injected' };
    if (targetId === playerId) return { success: false, reason: 'cannot_self_inject' };

    this._lastSendToPlayer = sendToPlayer;
    const result = CodeEngine.injectCorruption(this.codeStore, targetId, fileIdx, patchIdx);
    if (result.success) {
      this.nightActions.hackerInjected = true;
    }
    const target = this.getPlayer(targetId);
    return {
      ...result,
      targetId,
      targetName: target?.name || 'Unknown',
    };
  }

  /**
   * Admin repairs a player's corrupted code.
   */
  submitAdminRepair(playerId, targetId, sendToPlayer) {
    const player = this.getPlayer(playerId);
    if (!player || !player.alive || !player.isAdmin() || this.phase !== PHASES.SUNRISE) return null;

    this._lastSendToPlayer = sendToPlayer;
    const repairResult = CodeEngine.repairCorruption(this.codeStore, targetId);
    const target = this.getPlayer(targetId);
    if (repairResult.wasCorrupted) {
      this.nightActions.adminRepairs.push(targetId);
    }
    return {
      targetId,
      targetName: target?.name || 'Unknown',
      repaired: repairResult.wasCorrupted,
      fileName: repairResult.fileName || null,
    };
  }

  /**
   * Security Lead scans a player for hacker function signatures.
   */
  submitSecurityScan(playerId, targetId, sendToPlayer) {
    const player = this.getPlayer(playerId);
    if (!player || !player.alive || !player.isSecurityLead() || this.phase !== PHASES.SUNRISE) return null;
    if (this.nightActions.securityTargets.length >= CONFIG.MAX_INVESTIGATIONS_PER_NIGHT) return null;
    if (this.nightActions.securityTargets.includes(targetId)) return null;

    this._lastSendToPlayer = sendToPlayer;
    this.nightActions.securityTargets.push(targetId);

    const scanResult = CodeEngine.scanForHackerSignatures(this.codeStore, targetId);
    const target = this.getPlayer(targetId);
    console.log('[SEC-SCAN-DETAIL] targetId=%s targetName=%s targetRole=%s scanResult=%s codeStoreHas=%s',
      targetId, target?.name, target?.role, JSON.stringify(scanResult), this.codeStore.has(targetId));
    return {
      targetId,
      targetName: target?.name || 'Unknown',
      isHacker: scanResult.suspicious,
      suspicious: scanResult.suspicious,
      suspiciousFunctions: scanResult.suspiciousFunctions,
      suspiciousFile: scanResult.suspiciousFile || null,
    };
  }

  /** Check if all expected night actors have submitted */
  allNightActionsReady() {
    // Night resolves via timer — all actions are manually triggered
    return false;
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

  /* Old resolveNight removed — resolution now happens in resolveSunrise() */

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
