/**
 * RoleEngine.js – Assigns roles based on player count and resolves
 * night actions (hacker attack, investigation, protection).
 *
 * Role distribution:
 *   6-7  players → 2 Hackers, 1 Admin, 1 QA, rest Developers
 *   8-10 players → 3 Hackers, 1 Admin, 1 QA, rest Developers
 *   11+  players → floor(count/3) Hackers (min 3), 1 Admin, 1 QA, rest Developers
 */

const ROLES = require('../shared/roles');
const CONFIG = require('../shared/gameConfig');

class RoleEngine {
  /**
   * Shuffle array in-place (Fisher-Yates).
   */
  static shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /**
   * Determine how many hackers for the given player count.
   */
  static hackerCount(playerCount) {
    for (const tier of CONFIG.HACKER_TIERS) {
      if (playerCount <= tier.maxPlayers) return tier.hackers;
    }
    return Math.floor(playerCount * CONFIG.DEFAULT_HACKER_RATIO);
  }

  /**
   * Assign roles to an array of Player instances.
   * Mutates each player's `role` property.
   * @param {Player[]} players
   */
  static assignRoles(players) {
    const count = players.length;
    const numHackers = RoleEngine.hackerCount(count);

    // Build role pool
    const roles = [];
    for (let i = 0; i < numHackers; i++) roles.push(ROLES.HACKER);
    roles.push(ROLES.ADMIN);
    roles.push(ROLES.SECURITY_LEAD);
    while (roles.length < count) roles.push(ROLES.DEVELOPER);

    // Shuffle and assign
    RoleEngine.shuffle(roles);
    players.forEach((player, idx) => {
      player.role = roles[idx];
    });
  }

  /**
   * Resolve a full night phase.
   *
   * @param {Object} params
   * @param {Player[]} params.alivePlayers - all alive players
   * @param {string|null} params.hackerTargetId - id of player hackers chose to attack
   * @param {string|null} params.adminTargetId  - id of player admin chose to protect
   * @param {string|null} params.securityTargetId - id of player QA chose to investigate
   * @param {number} params.systemStability - current stability (advanced mode)
   * @param {boolean} params.advancedMode
   *
   * @returns {{ eliminated: Player|null, investigationResult: {targetId,isHacker}|null, protectionSaved: boolean, newStability: number }}
   */
  static resolveNight({ alivePlayers, hackerTargetId, adminTargetId, adminKillTargetId, securityTargetIds, systemStability, advancedMode }) {
    const result = {
      eliminated: null,
      adminKilled: null,
      investigationResults: [],
      protectionSaved: false,
      newStability: systemStability,
    };

    // --- Investigation (QA investigates up to 2 players) ---
    if (securityTargetIds && securityTargetIds.length > 0) {
      for (const targetId of securityTargetIds) {
        const target = alivePlayers.find(p => p.id === targetId);
        if (target) {
          result.investigationResults.push({
            targetId: target.id,
            targetName: target.name,
            isHacker: target.isHacker(),
          });
        }
      }
    }

    // --- Admin Wrong-Guess Kill (Admin pointed at the wrong file → player dies) ---
    if (adminKillTargetId) {
      const victim = alivePlayers.find(p => p.id === adminKillTargetId);
      if (victim && victim.alive) {
        victim.alive = false;
        result.adminKilled = victim;
      }
    }

    // --- Protection & Attack ---
    if (hackerTargetId) {
      const protectedId = adminTargetId;
      if (hackerTargetId === protectedId) {
        // Attack blocked by admin's correct guess!
        result.protectionSaved = true;
      } else {
        const victim = alivePlayers.find(p => p.id === hackerTargetId);
        if (victim && victim.alive) {
          victim.alive = false;
          result.eliminated = victim;
          if (advancedMode) {
            result.newStability = Math.max(0, systemStability - 1);
          }
        }
      }
    }

    return result;
  }

  /**
   * Check win conditions.
   * @param {Player[]} allPlayers
   * @param {number} systemStability
   * @param {boolean} advancedMode
   * @returns {{ gameOver: boolean, winner: 'hackers'|'developers'|null, reason: string }}
   */
  static checkWinCondition(allPlayers, systemStability = CONFIG.INITIAL_STABILITY, advancedMode = false) {
    const alive = allPlayers.filter(p => p.alive);
    const hackers = alive.filter(p => p.isHacker());
    const nonHackers = alive.filter(p => !p.isHacker());

    // Hackers eliminated → developers win
    if (hackers.length === 0) {
      return { gameOver: true, winner: 'developers', reason: 'All Hackers have been eliminated! The codebase is secure.' };
    }

    // Hackers >= non-hackers → hackers win
    if (hackers.length >= nonHackers.length) {
      return { gameOver: true, winner: 'hackers', reason: 'Hackers have taken over the system! The codebase is compromised.' };
    }

    // Advanced mode: stability reached 0
    if (advancedMode && systemStability <= 0) {
      return { gameOver: true, winner: 'hackers', reason: 'System stability reached zero! Critical system failure.' };
    }

    return { gameOver: false, winner: null, reason: '' };
  }
}

module.exports = RoleEngine;
