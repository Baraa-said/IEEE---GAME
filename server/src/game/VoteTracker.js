/**
 * VoteTracker.js – Manages voting rounds during the Day phase.
 *
 * Key mechanic: a player is only eliminated after receiving the
 * highest vote count in TWO consecutive voting rounds. Ties mean
 * both players must defend but neither is eliminated unless one
 * of them leads the _next_ round as well.
 */

class VoteTracker {
  constructor() {
    /** Map<voterId, targetId> */
    this.votes = new Map();

    /** Total alive voters expected this round */
    this.expectedVoters = 0;
  }

  /**
   * Reset for a new voting round.
   * @param {number} aliveCount – number of alive players who can vote
   */
  reset(aliveCount) {
    this.votes = new Map();
    this.expectedVoters = aliveCount;
  }

  /**
   * Record a vote.
   * @param {string} voterId
   * @param {string} targetId
   * @returns {boolean} true if vote was accepted
   */
  castVote(voterId, targetId) {
    if (this.votes.has(voterId)) return false; // already voted
    this.votes.set(voterId, targetId);
    return true;
  }

  /**
   * Change vote (optional).
   */
  changeVote(voterId, targetId) {
    this.votes.set(voterId, targetId);
    return true;
  }

  /** Have all expected voters voted? */
  allVotesCast() {
    return this.votes.size >= this.expectedVoters;
  }

  /**
   * Tally votes.
   * @returns {{ tally: Map<targetId, number>, highest: string[], highestCount: number }}
   */
  tally() {
    const tally = new Map();
    for (const targetId of this.votes.values()) {
      tally.set(targetId, (tally.get(targetId) || 0) + 1);
    }

    let highestCount = 0;
    for (const count of tally.values()) {
      if (count > highestCount) highestCount = count;
    }

    const highest = [];
    for (const [id, count] of tally.entries()) {
      if (count === highestCount && highestCount > 0) highest.push(id);
    }

    return { tally: Object.fromEntries(tally), highest, highestCount };
  }

  /**
   * Process a completed vote round against the players array and
   * return the result, updating vote streaks.
   *
   * @param {Player[]} alivePlayers
   * @returns {{ eliminated: Player|null, defenders: Player[], tally: object }}
   */
  processRound(alivePlayers) {
    const { tally, highest, highestCount } = this.tally();

    if (highestCount === 0) {
      // No votes cast – no one eliminated
      return { eliminated: null, defenders: [], tally };
    }

    // Update streaks
    for (const player of alivePlayers) {
      if (highest.includes(player.id)) {
        player.voteStreak += 1;
      } else {
        player.voteStreak = 0; // reset if not leading
      }
    }

    // Check for double-streak elimination (2 consecutive highest votes)
    const elimCandidates = alivePlayers.filter(
      p => highest.includes(p.id) && p.voteStreak >= 2
    );

    // If exactly one player has streak >= 2, eliminate them
    if (elimCandidates.length === 1) {
      const eliminated = elimCandidates[0];
      eliminated.alive = false;
      return { eliminated, defenders: [], tally };
    }

    // If multiple have streak >= 2, eliminate the one with most votes this round
    if (elimCandidates.length > 1) {
      // Sort by votes descending
      elimCandidates.sort((a, b) => (tally[b.id] || 0) - (tally[a.id] || 0));
      // If still tied, no elimination – they all defend again
      if ((tally[elimCandidates[0].id] || 0) === (tally[elimCandidates[1].id] || 0)) {
        return { eliminated: null, defenders: elimCandidates, tally };
      }
      const eliminated = elimCandidates[0];
      eliminated.alive = false;
      return { eliminated, defenders: [], tally };
    }

    // No one has double streak yet – the highest-voted players must defend
    const defenders = alivePlayers.filter(p => highest.includes(p.id));
    return { eliminated: null, defenders, tally };
  }
}

module.exports = VoteTracker;
