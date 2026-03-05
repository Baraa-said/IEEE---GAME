/**
 * gameConfig.js – Centralised game configuration.
 *
 * Every tunable constant lives here so you can adjust the game
 * without hunting through multiple source files.
 */

module.exports = {

  /* ═══════════════════════════════════════════
   *  Phase Timers (milliseconds)
   * ═══════════════════════════════════════════ */
  TIMERS: {
    DISCUSSION: 60000,   // 60 s  – day discussion
    VOTING:    45000,    // 45 s  – voting phase
    DEFENSE:   20000,    // 20 s  – accused player's defence
    NIGHT:     300000,    // 5 min – night actions (hackers)
    SUNRISE:   180000,    // 3 min – sunrise actions (admin + QA)
  },

  /* ═══════════════════════════════════════════
   *  Transition Delays (milliseconds)
   * ═══════════════════════════════════════════ */
  DELAYS: {
    ROLE_REVEAL:    5000,  // pause after role reveal before Night 1
    NIGHT_TO_DAY:   3000,  // pause after night resolution before day starts
  },

  /* ═══════════════════════════════════════════
   *  Player & Lobby
   * ═══════════════════════════════════════════ */
  MIN_PLAYERS: 6,         // minimum players to start a game

  /* ═══════════════════════════════════════════
   *  Hacker Distribution
   *  hackerTiers is evaluated top-to-bottom;
   *  the first tier whose `maxPlayers` >= playerCount is used.
   *  If none match, `defaultHackerRatio` applies.
   * ═══════════════════════════════════════════ */
  HACKER_TIERS: [
    { maxPlayers: 7,  hackers: 2 },
    { maxPlayers: 10, hackers: 3 },
  ],
  DEFAULT_HACKER_RATIO: 1 / 3,   // floor(playerCount * ratio)

  /* ═══════════════════════════════════════════
   *  Stability (Advanced Mode)
   * ═══════════════════════════════════════════ */
  INITIAL_STABILITY: 3,

  /* ═══════════════════════════════════════════
   *  QA
   * ═══════════════════════════════════════════ */
  MAX_INVESTIGATIONS_PER_NIGHT: 1,
  SECURITY_VIEWS_PER_NIGHT: 1,     // how many players the QA can browse code of

  /* ═════════════════════════════════════════════
   *  Admin
   * ═════════════════════════════════════════════ */
  ADMIN_CHECKS_PER_NIGHT: 1,   // how many players the admin can check for corruption

  /* ═══════════════════════════════════════════
   *  Reconnect
   * ═══════════════════════════════════════════ */
  RECONNECT_WINDOW_MS: 15 * 60 * 1000,   // 15 minutes

  /* ═══════════════════════════════════════════
   *  Code Files (CodeEngine)
   * ═══════════════════════════════════════════ */
  CODE_FILES: {
    MIN_CLEAN: 2,       // minimum clean files per player
    MAX_CLEAN: 3,       // maximum clean files per player  (random in range)
  },
};
