(function(root) {
  'use strict';
  var M = root.MBB;
  var state;
  var rng;
  var events = [];
  var current;
  var locked = false;

  function seed() { return (Date.now() ^ (Math.random() * 4294967295)) >>> 0; }
  function fresh() {
    state = M.createGame(seed());
    rng = M.createRng(state.seed);
    events = [];
    current = null;
    M.byId('share-prompt').hidden = true;
    M.playOpening();
  }
  function start() {
    M.audio.startMusic().then(function(playing) {
      M.byId('audio-toggle').textContent = playing ? '🔊 播放中' : '🔈 不支持';
    });
    state = M.beginYear(state);
    drawYear();
    nextEvent();
  }
  function drawYear() { events = M.drawYearEvents(state, M.ALL_EVENTS, rng); }
  function startNextYear() {
    state = M.advanceYear(state);
    drawYear();
    nextEvent();
  }
  function nextEvent() {
    if (state.phase === 'annualReview') return review();
    if (state.phase === 'yearComplete') return M.playYearEnd(state, startNextYear);
    if (state.phase === 'report') return showReport();
    if (!events.length) drawYear();
    current = events.shift();
    locked = false;
    M.renderGame(state, current, choose);
  }
  function choose(id) {
    if (locked) return;
    locked = true;
    var result = M.resolveOption(state, current, id, rng);
    M.audio.playChoice();
    state = M.recordEventResult(state, result);
    var immediate = M.checkImmediateEnding(state);
    if (immediate) {
      state.ending = immediate;
      state.phase = 'report';
      M.audio.playFailure();
    }
    M.playImmediateResult(result, nextEvent);
  }
  function review() {
    M.playAnnualReview(state, function() {
      var result = M.resolveAnnualReview(state, rng);
      state = result.nextState;
      return result;
    }, function() {
      if (state.phase === 'report') showReport();
      else if (state.phase === 'promotion') {
        M.playPromotion(M.GAME_CONFIG.ranks[state.rankIndex], function() {
          state.phase = 'event';
          drawYear();
          nextEvent();
        });
      } else {
        drawYear();
        nextEvent();
      }
    });
  }
  function showReport() {
    var report = M.buildJourneyReport(state);
    M.showScene('report');
    M.drawJourneyReport(M.byId('report-canvas'), report);
  }

  document.addEventListener('DOMContentLoaded', function() {
    M.setAppHeight();
    root.addEventListener('resize', M.setAppHeight);
    M.byId('skip-opening').addEventListener('click', M.skipOpening);
    M.byId('start-game').addEventListener('click', start);
    M.byId('audio-toggle').addEventListener('click', function() {
      var button = this;
      M.audio.toggle().then(function(enabled) {
        button.textContent = enabled ? '🔊 播放中' : (M.audio.isSupported() ? '🔇 静音' : '🔈 不支持');
        button.setAttribute('aria-pressed', enabled ? 'true' : 'false');
      });
    });
    M.byId('restart-game').addEventListener('click', fresh);
    M.byId('share-report').addEventListener('click', function() { M.byId('share-prompt').hidden = false; });
    M.byId('close-share-prompt').addEventListener('click', function() { M.byId('share-prompt').hidden = true; });
    fresh();
  });
})(window);
