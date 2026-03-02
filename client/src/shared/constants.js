/**
 * Shared event constants — mirrors the server's events.js
 */

export const EVENTS = Object.freeze({
  CREATE_ROOM: 'create_room',
  JOIN_ROOM: 'join_room',
  ROOM_CREATED: 'room_created',
  ROOM_JOINED: 'room_joined',
  ROOM_UPDATE: 'room_update',
  JOIN_ERROR: 'join_error',
  START_GAME: 'start_game',
  GAME_STARTED: 'game_started',
  ROLE_ASSIGNED: 'role_assigned',
  HACKER_REVEAL: 'hacker_reveal',
  PHASE_CHANGE: 'phase_change',
  CAST_VOTE: 'cast_vote',
  VOTE_UPDATE: 'vote_update',
  VOTE_RESULT: 'vote_result',
  PLAYER_ELIMINATED: 'player_eliminated',
  DEFENSE_START: 'defense_start',
  NIGHT_ACTION: 'night_action',
  NIGHT_RESULT: 'night_result',
  INVESTIGATION_RESULT: 'investigation_result',
  PROTECTION_RESULT: 'protection_result',
  CHAT_MESSAGE: 'chat_message',
  HACKER_CHAT: 'hacker_chat',
  HACKER_VOTE_UPDATE: 'hacker_vote_update',
  SYSTEM_MESSAGE: 'system_message',
  GAME_OVER: 'game_over',
  SKIP_PHASE: 'skip_phase',
  SKIP_UPDATE: 'skip_update',
  ERROR: 'error_message',
  PLAYER_DISCONNECTED: 'player_disconnected',
  PLAYER_RECONNECTED: 'player_reconnected',
  RECONNECT_ATTEMPT: 'reconnect_attempt',
  RECONNECT_SUCCESS: 'reconnect_success',
  RECONNECT_FAIL: 'reconnect_fail',
});

export const PHASES = Object.freeze({
  LOBBY: 'lobby',
  DAY_DISCUSSION: 'day_discussion',
  DAY_VOTING: 'day_voting',
  DAY_DEFENSE: 'day_defense',
  NIGHT: 'night',
  GAME_OVER: 'game_over',
});

export const ROLES = Object.freeze({
  DEVELOPER: 'Developer',
  HACKER: 'Hacker',
  SECURITY_LEAD: 'Security Lead',
  ADMIN: 'Admin',
});
