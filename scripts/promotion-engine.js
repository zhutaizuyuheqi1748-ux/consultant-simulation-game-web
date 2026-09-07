(function(root, factory) {
  var api = factory(typeof require === 'function' ? require('./config.js') : root.MBB);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.MBB = root.MBB || {};
    Object.assign(root.MBB, api);
  }
})(typeof window !== 'undefined' ? window : null, function(dep) {
  'use strict';
  var C = dep.GAME_CONFIG;

  function checkImmediateEnding(state) {
    if (state.tags.indexOf('terminal_scandal') >= 0) return 'scandal';
    if (state.tags.indexOf('client_offer') >= 0) return 'client_poach';
    if (state.stats.stamina <= 0) return 'burnout';
    return null;
  }

  function resolveAnnualReview(state, rng) {
    var roll = rng.int(1, 100);
    var promoted = roll <= state.promotionChance;
    var next = Object.assign({}, state);
    var endingId = null;
    var line;
    next.year = state.year + 1;
    next.yearsAtRank = 1;
    next.eventIndex = 0;

    if (promoted) {
      next.rankIndex = Math.min(state.rankIndex + 1, C.ranks.length - 1);
      next.promotions += 1;
      next.failedReviews = 0;
      next.promotionChance = C.ranks[next.rankIndex].startChance;
      next.stats = Object.assign({}, state.stats, {
        stamina: Math.min(C.statsMax, state.stats.stamina + 10),
        partner: Math.min(C.statsMax, state.stats.partner + 5)
      });
      next.phase = 'promotion';
      line = next.rankIndex === C.ranks.length - 1
        ? '会议室门开了：你升为 Senior Partner。退休倒计时还有完整两年。'
        : '会议室门开了：你升职了。';
    } else {
      next.failedReviews += 1;
      next.totalFailedReviews = (state.totalFailedReviews || 0) + 1;
      next.promotionChance = Math.min(C.chanceMax, state.promotionChance + 10);
      if (next.failedReviews >= C.ranks[state.rankIndex].maxFailedReviews) {
        endingId = 'fired';
        next.phase = 'report';
        line = 'UP OR OUT，门禁卡先走一步。';
      } else {
        next.phase = 'event';
        line = '再观察两年——这句话比拒绝更长，也确实更长。';
      }
    }
    next.ending = endingId;
    return { roll: roll, target: state.promotionChance, rankIndex: state.rankIndex, promoted: promoted, nextState: next, endingId: endingId, summaryLine: line };
  }

  return { checkImmediateEnding: checkImmediateEnding, resolveAnnualReview: resolveAnnualReview };
});
