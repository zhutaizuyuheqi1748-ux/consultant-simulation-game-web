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

  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }

  function createGame(seed) {
    return {
      seed: seed,
      phase: 'opening',
      rankIndex: 0,
      year: 1,
      yearsAtRank: 1,
      eventIndex: 0,
      promotionChance: C.ranks[0].startChance,
      failedReviews: 0,
      totalFailedReviews: 0,
      stats: Object.assign({}, C.startingStats),
      relationships: { manager: 0, partner: 0, client: 0, peer: 0, junior: 0 },
      tags: [],
      history: [],
      ending: null,
      promotions: 0
    };
  }

  function beginYear(state) {
    var next = Object.assign({}, state);
    next.phase = 'event';
    next.eventIndex = 0;
    return next;
  }

  function advanceYear(state) {
    var next = Object.assign({}, state);
    next.year = state.year + 1;
    next.yearsAtRank = state.yearsAtRank + 1;
    next.eventIndex = 0;
    next.phase = 'event';
    return next;
  }

  function recordEventResult(state, result) {
    var next = Object.assign({}, state);
    next.stats = Object.assign({}, state.stats);
    Object.keys(result.statDelta || {}).forEach(function(key) {
      next.stats[key] = clamp((next.stats[key] || 0) + result.statDelta[key], C.statsMin, C.statsMax);
    });
    next.relationships = Object.assign({}, state.relationships);
    Object.keys(result.relationshipDelta || {}).forEach(function(key) {
      next.relationships[key] = clamp((next.relationships[key] || 0) + result.relationshipDelta[key], -100, 100);
    });
    next.tags = state.tags.filter(function(tag) { return (result.removeTags || []).indexOf(tag) < 0; });
    (result.addTags || []).forEach(function(tag) { if (next.tags.indexOf(tag) < 0) next.tags.push(tag); });
    next.promotionChance = clamp(state.promotionChance + (result.chanceDelta || 0), C.chanceMin, C.chanceMax);
    next.history = state.history.concat([Object.assign({ year: state.year, rankIndex: state.rankIndex }, result)]);
    next.eventIndex = state.eventIndex + 1;

    if (next.eventIndex < C.eventsPerYear) {
      next.phase = 'event';
    } else if (state.yearsAtRank < C.reviewCycleYears) {
      next.phase = 'yearComplete';
    } else if (state.rankIndex === C.ranks.length - 1) {
      next.phase = 'report';
      next.ending = 'senior_partner_retired';
    } else {
      next.phase = 'annualReview';
    }
    return next;
  }

  return {
    createGame: createGame,
    resetGame: createGame,
    beginYear: beginYear,
    advanceYear: advanceYear,
    recordEventResult: recordEventResult,
    clamp: clamp
  };
});
