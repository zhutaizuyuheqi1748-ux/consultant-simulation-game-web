(function(root) {
  'use strict';
  var M = root.MBB;
  var statNames = { delivery: '交付力', client: '客户信任', partner: 'Partner 印象', stamina: '体力' };
  var relationNames = { manager: '上级关系', partner: 'Partner 关系', client: '客户关系', peer: '同级关系', junior: '下属关系' };

  function setPortrait(id, rank, suffix) {
    var image = M.byId(id);
    image.src = rank.avatar;
    image.alt = rank.name + ' / ' + rank.cn + suffix;
  }

  function addEffect(box, label, value) {
    if (!value) return;
    var item = document.createElement('span');
    item.textContent = label + ' ' + (value > 0 ? '+' : '') + value;
    box.appendChild(item);
  }

  function renderEffects(result) {
    var box = M.byId('result-effects');
    box.innerHTML = '';
    Object.keys(result.statDelta || {}).forEach(function(key) { addEffect(box, statNames[key] || key, result.statDelta[key]); });
    Object.keys(result.relationshipDelta || {}).forEach(function(key) { addEffect(box, relationNames[key] || key, result.relationshipDelta[key]); });
  }

  M.playImmediateResult = function(result, done) {
    var scene = M.byId('result');
    var delta = M.byId('result-delta');
    M.byId('result-title').textContent = result.resultTitle;
    M.byId('result-story').textContent = result.storyLine;
    delta.textContent = '晋升概率 ' + (result.chanceDelta >= 0 ? '+' : '') + result.chanceDelta + '%';
    delta.className = result.chanceDelta < 0 ? 'result-delta negative' : 'result-delta';
    renderEffects(result);
    scene.classList.remove('shake');
    scene.classList.remove('flash');
    scene.classList.add(result.chanceDelta < 0 ? 'shake' : 'flash');
    M.showScene('result');
    M.byId('next-event').disabled = true;
    setTimeout(function() {
      M.byId('next-event').disabled = false;
      M.byId('next-event').onclick = done;
    }, M.GAME_CONFIG.resultAnimationMs);
  };

  M.playYearEnd = function(state, done) {
    var rank = M.GAME_CONFIG.ranks[state.rankIndex];
    M.byId('year-end-number').textContent = 'YEAR ' + String(state.year).padStart(2, '0');
    M.byId('year-end-title').textContent = '第 ' + state.year + ' 年结束';
    M.byId('year-end-copy').textContent = '你以 ' + rank.name + ' 的身份撑过这一年。晋升委员会还没来，下一年继续。';
    M.byId('continue-year').textContent = '进入第 ' + (state.year + 1) + ' 年 →';
    M.byId('continue-year').onclick = done;
    M.showScene('year-end');
  };

  M.playAnnualReview = function(state, resolveDecision, done) {
    var rank = M.GAME_CONFIG.ranks[state.rankIndex];
    var room = document.querySelector('.review-room');
    var debate = M.byId('review-debate');
    var resultBox = M.byId('review-result');
    var button = M.byId('review-next');
    var steps = ['人事校准你的项目记录', 'Sponsor 为你争取名额', '合伙人进行最后表决'];
    setPortrait('review-avatar', rank, '晋升评审头像');
    M.byId('review-target').textContent = state.promotionChance + '%';
    M.byId('review-copy').textContent = '门关上了。你的名字正在会议桌上被反复讨论。';
    debate.innerHTML = '';
    resultBox.textContent = '';
    resultBox.className = 'review-result';
    room.classList.remove('debating');
    button.textContent = '查看决定';
    button.disabled = false;
    M.showScene('review');
    button.onclick = function() {
      var index = 0;
      button.disabled = true;
      button.textContent = '委员会讨论中…';
      room.classList.add('debating');
      M.audio.playReview();
      function showStep() {
        var item;
        if (index < steps.length) {
          item = document.createElement('li');
          item.textContent = steps[index] + '…';
          debate.appendChild(item);
          index += 1;
          root.setTimeout(showStep, 620);
          return;
        }
        root.setTimeout(function() {
          var result = resolveDecision();
          room.classList.remove('debating');
          resultBox.textContent = result.promoted ? '晋升通过' : (result.endingId ? '决定：OUT' : '暂缓晋升');
          resultBox.className = 'review-result revealed ' + (result.promoted ? 'approved' : 'rejected');
          M.byId('review-copy').textContent = result.summaryLine;
          if (result.promoted) M.audio.playPromotion();
          else M.audio.playFailure();
          button.textContent = '接受结果 →';
          button.disabled = false;
          button.onclick = done;
        }, 420);
      }
      showStep();
    };
  };

  M.playPromotion = function(rank, done) {
    setPortrait('promotion-avatar', rank, '晋升头像');
    M.byId('promotion-rank').textContent = '晋升 ' + rank.name + ' / ' + rank.cn;
    M.showScene('promotion');
    M.audio.playPromotion();
    M.byId('continue-career').onclick = done;
  };
})(window);
