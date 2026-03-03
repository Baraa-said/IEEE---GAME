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
  FILL_WITH_BOTS: 'fill_with_bots',
  SET_PLAYER_ROLE: 'set_player_role',

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
  NIGHT_ACTION_ACK: 'night_action_ack',
  NIGHT_RESULT: 'night_result',
  INVESTIGATION_RESULT: 'investigation_result',
  PROTECTION_RESULT: 'protection_result',

  /* ── Chat ── */
  CHAT_MESSAGE: 'chat_message',
  HACKER_CHAT: 'hacker_chat',
  HACKER_VOTE_UPDATE: 'hacker_vote_update',
  SYSTEM_MESSAGE: 'system_message',

  /* ── Game end ── */
  GAME_OVER: 'game_over',

  /* ── Skip ── */
  SKIP_PHASE: 'skip_phase',
  SKIP_UPDATE: 'skip_update',
  FINISH_SUNRISE: 'finish_sunrise',

  /* ── Code Files ── */
  CODE_FILES_INIT: 'code_files_init',
  GET_PLAYER_CODE: 'get_player_code',
  PLAYER_CODE_DATA: 'player_code_data',
  HACKER_INJECT: 'hacker_inject',
  HACKER_INJECT_RESULT: 'hacker_inject_result',
  HACKER_INJECT_VOTE: 'hacker_inject_vote',
  HACKER_INJECT_VOTE_UPDATE: 'hacker_inject_vote_update',
  ADMIN_CHECK: 'admin_check',
  ADMIN_CHECK_RESULT: 'admin_check_result',
  ADMIN_SCAN_CORRUPTION: 'admin_scan_corruption',
  ADMIN_SCAN_RESULT: 'admin_scan_result',
  ADMIN_REPAIR: 'admin_repair',
  ADMIN_REPAIR_RESULT: 'admin_repair_result',
  ADMIN_BUG_GUESS: 'admin_bug_guess',
  ADMIN_BUG_GUESS_RESULT: 'admin_bug_guess_result',
  SECURITY_SCAN: 'security_scan',
  SECURITY_SCAN_RESULT: 'security_scan_result',
  CODE_UPDATE: 'code_update',

  /* ── Misc ── */
  ERROR: 'error_message',
  PLAYER_DISCONNECTED: 'player_disconnected',
  PLAYER_RECONNECTED: 'player_reconnected',
  RECONNECT_ATTEMPT: 'reconnect_attempt',
  RECONNECT_SUCCESS: 'reconnect_success',
  RECONNECT_FAIL: 'reconnect_fail',
  KICK_PLAYER: 'kick_player',
});

module.exports = EVENTS;
