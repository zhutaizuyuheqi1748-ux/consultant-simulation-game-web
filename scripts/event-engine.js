(function(root, factory) {
  var api = factory(typeof require === 'function' ? require('./config.js') : root.MBB);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.MBB = root.MBB || {};
    Object.assign(root.MBB, api);
  }
})(typeof window !== 'undefined' ? window : null, function(dep) {
  'use strict';
  var RISK_PROFILES = [[-15, -3], [-7, 7], [-3, 15]];

  function midpoint(option) {
    return ((option.chanceRange || [0, 0])[0] + (option.chanceRange || [0, 0])[1]) / 2;
  }

  function prepareEvent(event, rng) {
    var ranked = event.options.slice().sort(function(a, b) { return midpoint(a) - midpoint(b); });
    var profileById = {};
    ranked.forEach(function(option, index) { profileById[option.id] = RISK_PROFILES[index].slice(); });
    var options = event.options.map(function(option) {
      return Object.assign({}, option, { chanceRange: profileById[option.id].slice() });
    });
    for (var index = options.length - 1; index > 0; index -= 1) {
      var swapIndex = rng.int(0, index);
      var value = options[index];
      options[index] = options[swapIndex];
      options[swapIndex] = value;
    }
    return Object.assign({}, event, { options: options });
  }

  function eligibleEvents(state, events) {
    var rankId = dep.GAME_CONFIG.ranks[state.rankIndex].id;
    return events.filter(function(event) {
      return event.rankIds.indexOf(rankId) >= 0 &&
        (!event.requiresTag || state.tags.indexOf(event.requiresTag) >= 0) &&
        (!event.forbiddenTag || state.tags.indexOf(event.forbiddenTag) < 0);
    });
  }

  function drawYearEvents(state, events, rng) {
    var eligible = eligibleEvents(state, events);
    var seen = (state.history || []).map(function(item) { return item.eventId; });
    var unseen = eligible.filter(function(event) { return seen.indexOf(event.id) < 0; });
    var pool = (unseen.length >= dep.GAME_CONFIG.eventsPerYear ? unseen : eligible).slice();
    var output = [];
    while (output.length < dep.GAME_CONFIG.eventsPerYear && pool.length) {
      var counts = pool.reduce(function(acc, event) {
        acc[event.tone] = (acc[event.tone] || 0) + 1;
        return acc;
      }, {});
      var candidates = pool.map(function(event) {
        return { value: event, weight: dep.GAME_CONFIG.toneWeights[event.tone] / counts[event.tone] };
      });
      var picked = rng.pickWeighted(candidates);
      output.push(prepareEvent(picked, rng));
      pool.splice(pool.indexOf(picked), 1);
    }
    return output;
  }

  function resolveOption(state, event, id, rng) {
    var option = event.options.filter(function(item) { return item.id === id; })[0];
    if (!option) throw new Error('Unknown option: ' + id);
    var range = option.chanceRange || [0, 0];
    return Object.assign({
      eventId: event.id,
      eventTitle: event.title,
      optionId: id,
      resultTitle: option.resultTitle,
      storyLine: option.storyLine,
      moment: option.moment || option.resultTitle,
      statDelta: {},
      relationshipDelta: {},
      addTags: [],
      removeTags: []
    }, option, { chanceDelta: rng.int(range[0], range[1]) });
  }

  return { RISK_PROFILES: RISK_PROFILES, prepareEvent: prepareEvent, eligibleEvents: eligibleEvents, drawYearEvents: drawYearEvents, resolveOption: resolveOption };
});
