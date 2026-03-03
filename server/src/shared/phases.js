/**
 * Phase constants for the game cycle.
 */

const PHASES = Object.freeze({
  LOBBY: 'lobby',
  DAY_DISCUSSION: 'day_discussion',
  DAY_VOTING: 'day_voting',
  DAY_DEFENSE: 'day_defense',
  NIGHT: 'night',
  SUNRISE: 'sunrise',
  GAME_OVER: 'game_over',
});

module.exports = PHASES;
