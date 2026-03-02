/**
 * Socket event name constants – single source of truth for both
 * server and client so they never fall out of sync.
 */

const EVENTS = Object.freeze({
  /* ── Connection ── */
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',

  /* ── Lobby ── */
  CREATE_ROOM: 'create_room',
  JOIN_ROOM: 'join_room',
  ROOM_CREATED: 'room_created',
  ROOM_JOINED: 'room_joined',
  ROOM_UPDATE: 'room_update',
  JOIN_ERROR: 'join_error',
  START_GAME: 'start_game',
  GAME_STARTED: 'game_started',

  /* ── Role ── */
  ROLE_ASSIGNED: 'role_assigned',
  HACKER_REVEAL: 'hacker_reveal',

  /* ── Phase ── */
  PHASE_CHANGE: 'phase_change',

  /* ── Day / Voting ── */
  CAST_VOTE: 'cast_vote',
  VOTE_UPDATE: 'vote_update',
  VOTE_RESULT: 'vote_result',
  PLAYER_ELIMINATED: 'player_eliminated',
  DEFENSE_START: 'defense_start',

  /* ── Night ── */
  NIGHT_ACTION: 'night_action',
  NIGHT_RESULT: 'night_result',
  INVESTIGATION_RESULT: 'investigation_result',
  PROTECTION_RESULT: 'protection_result',

  /* ── Chat ── */
  CHAT_MESSAGE: 'chat_message',
  HACKER_CHAT: 'hacker_chat',
  SYSTEM_MESSAGE: 'system_message',

  /* ── Game end ── */
  GAME_OVER: 'game_over',

  /* ── Misc ── */
  ERROR: 'error_message',
  PLAYER_DISCONNECTED: 'player_disconnected',
  PLAYER_RECONNECTED: 'player_reconnected',
  KICK_PLAYER: 'kick_player',
});

module.exports = EVENTS;
