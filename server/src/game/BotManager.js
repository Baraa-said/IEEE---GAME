/**
 * BotManager.js – Controls automatic bot behaviour during each game phase.
 *
 * Bots are stored in the Room's player map like real players but have
 * `player.isBot = true` and no real socket connection.  The Room calls
 * `BotManager.onPhaseStart(room, phase)` after every phase transition so
 * bots can schedule their actions with human-like delays.
 */

const PHASES  = require('../shared/phases');
const ROLES   = require('../shared/roles');
const EVENTS  = require('../shared/events');
const CodeEngine = require('./CodeEngine');

/* Bot names pool */
const BOT_NAMES = [
  'Alice', 'Bob', 'Charlie', 'Diana', 'Eve',
  'Frank', 'Grace', 'Hank', 'Ivy', 'Jake',
];

class BotManager {
  /* ─── Utilities ─────────────────────────────────── */

  static rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  static sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  /* ─── Bot name pool ─────────────────────────────── */

  static getAvailableNames(used = []) {
    return BOT_NAMES.filter(n => !used.includes(n));
  }

  /* ─── Phase dispatcher ──────────────────────────── */

  /**
   * Called by Room after every phase transition.
   * Schedules the appropriate async bot actions.
   */
  static onPhaseStart(room, phase) {
    const bots = [...room.players.values()].filter(p => p.isBot && p.alive);
    if (!bots.length) return;

    const broadcast     = room._lastBroadcast;
    const sendToPlayer  = room._lastSendToPlayer || (() => {});
    if (!broadcast) return;

    switch (phase) {
      case PHASES.NIGHT:
        this._doNight(room, bots, broadcast, sendToPlayer);
        break;
      case PHASES.SUNRISE:
        this._doSunrise(room, bots, broadcast, sendToPlayer);
        break;
      case PHASES.DAY_VOTING:
        this._doVote(room, bots, broadcast);
        break;
      default:
        break; // nothing for discussion / defense
    }
  }

  /* ─── Night: hacker bots pick target & inject ───── */

  static async _doNight(room, _bots, broadcast, sendToPlayer) {
    // Wait a random human-like delay before acting
    await this.sleep(this.rand(8000, 22000));
    if (room.phase !== PHASES.NIGHT) return;

    const hackerBots = [...room.players.values()].filter(
      p => p.isBot && p.alive && p.isHacker()
    );
    if (!hackerBots.length) return;

    /* ── Step 1: agree on a target ── */
    const nonHackers = room.getAliveNonHackers();
    if (!nonHackers.length) return;
    const target = nonHackers[this.rand(0, nonHackers.length - 1)];

    for (const bot of hackerBots) {
      if (room.phase !== PHASES.NIGHT) return;
      room.submitNightAction(bot.id, target.id, sendToPlayer, broadcast);
      await this.sleep(this.rand(500, 2000));
    }

    /* ── Step 2: agree on injection ── */
    await this.sleep(this.rand(4000, 12000));
    if (room.phase !== PHASES.NIGHT) return;
    if (!room.nightActions.hackerTarget) return;
    if (room.nightActions.hackerInjected) return;

    const opts = CodeEngine.getInjectionOptions(room.codeStore, room.nightActions.hackerTarget);
    if (!opts || !opts.length) return;

    const fileOpt = opts[this.rand(0, opts.length - 1)];
    const patch   = fileOpt.patches[this.rand(0, fileOpt.patches.length - 1)];

    for (const bot of hackerBots) {
      if (room.phase !== PHASES.NIGHT) return;
      if (room.nightActions.hackerInjected) return;
      room.submitHackerInjectVote(
        bot.id, fileOpt.fileIdx, patch.patchIdx, sendToPlayer, broadcast
      );
      await this.sleep(this.rand(500, 1500));
    }
  }

  /* ─── Sunrise: admin bot repairs corrupted code ──── */

  static async _doSunrise(room, bots, _broadcast, sendToPlayer) {
    const adminBot = bots.find(b => b.role === ROLES.ADMIN);
    if (!adminBot) return;

    const broadcast = room._lastBroadcast;
    await this.sleep(this.rand(6000, 20000));
    if (room.phase !== PHASES.SUNRISE) return;

    // Admin bot tries to repair the hacker's target if code was injected
    const hackerTarget = room.nightActions?.hackerTarget;
    if (hackerTarget && room.nightActions?.hackerInjected) {
      const details = CodeEngine.getCorruptionDetails(room.codeStore, hackerTarget);
      if (details && details.corrupted) {
        // Attempt a bug guess on the corrupted player's file
        const result = room.submitAdminBugGuess(adminBot.id, hackerTarget, details.fileIdx, sendToPlayer);
        if (result && !result.error) {
          sendToPlayer(adminBot.id, EVENTS.ADMIN_BUG_GUESS_RESULT, result);
          if (broadcast) {
            broadcast(EVENTS.ROOM_UPDATE, room.getPublicState());
          }
        }
        return;
      }
    }

    // Fallback: try to repair a random alive player's code
    const alive = room.getAlivePlayers().filter(p => p.id !== adminBot.id);
    if (!alive.length) return;
    const pick = alive[this.rand(0, alive.length - 1)];
    const repairResult = room.submitAdminRepair(adminBot.id, pick.id, sendToPlayer);
    if (repairResult) {
      sendToPlayer(adminBot.id, EVENTS.ADMIN_REPAIR_RESULT, repairResult);
    }
  }

  /* ─── Day voting: bots cast random votes ────────── */

  static async _doVote(room, bots, broadcast) {
    /* Shuffle so vote order is random */
    const shuffled = [...bots].sort(() => Math.random() - 0.5);

    const buildVoteUpdate = () => {
      const iv = {};
      for (const [vid, tid] of room.voteTracker.votes.entries()) {
        const voter  = room.getPlayer(vid);
        const tgt    = room.getPlayer(tid);
        iv[vid] = {
          voterName:  voter?.name  || '?',
          targetId:   tid,
          targetName: tgt?.name   || '?',
        };
      }
      return iv;
    };

    for (const bot of shuffled) {
      await this.sleep(this.rand(4000, 20000));
      if (room.phase !== PHASES.DAY_VOTING) return;

      const candidates = room.getAlivePlayers().filter(p => p.id !== bot.id);
      if (!candidates.length) continue;
      const pick = candidates[this.rand(0, candidates.length - 1)];

      const accepted = room.voteTracker.castVote(bot.id, pick.id);
      if (!accepted) room.voteTracker.changeVote(bot.id, pick.id);

      const { tally } = room.voteTracker.tally();
      broadcast(EVENTS.VOTE_UPDATE, {
        tally,
        individualVotes: buildVoteUpdate(),
        totalVoters: room.voteTracker.expectedVoters,
        votesCast:   room.voteTracker.votes.size,
      });

      if (room.voteTracker.allVotesCast()) {
        room.resolveVotes(broadcast);
        return;
      }
    }
  }
}

module.exports = BotManager;
