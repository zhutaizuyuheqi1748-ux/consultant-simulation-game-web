(function(root) {
  'use strict';
  var M = root.MBB;
  var names = { delivery: '交付力', client: '客户信任', partner: 'Partner 印象', stamina: '体力' };

  function avatarAlt(rank, suffix) {
    return rank.name + ' / ' + rank.cn + suffix;
  }

  function renderStats(state) {
    var box = M.byId('stats');
    box.innerHTML = '';
    Object.keys(names).forEach(function(key) {
      var item = document.createElement('span');
      item.textContent = names[key] + ' · ' + state.stats[key];
      box.appendChild(item);
    });
  }

  M.renderGame = function(state, event, onChoose) {
    var rank = M.GAME_CONFIG.ranks[state.rankIndex];
    var portrait = M.byId('avatar');
    M.byId('year-label').textContent = 'YEAR ' + String(state.year).padStart(2, '0') + ' · 第 ' + state.year + ' 年';
    M.byId('rank-label').textContent = rank.name + ' / ' + rank.cn;
    M.byId('cycle-label').textContent = '本职级第 ' + state.yearsAtRank + ' / ' + M.GAME_CONFIG.reviewCycleYears + ' 年';
    portrait.src = rank.avatar;
    portrait.alt = avatarAlt(rank, '像素头像');

    M.byId('chance-number').textContent = state.promotionChance + '%';
    M.byId('chance-fill').style.width = state.promotionChance + '%';
    renderStats(state);

    M.byId('tone-label').textContent = {
      realistic: 'PROJECT REALITY',
      dark: 'DARK OFFICE',
      legendary: 'LEGENDARY'
    }[event.tone];
    M.byId('event-count').textContent = String(state.eventIndex + 1).padStart(2, '0') + ' / 03';
    M.byId('event-title').textContent = event.title;
    M.byId('event-body').textContent = event.body;

    var box = M.byId('choices');
    box.innerHTML = '';
    event.options.forEach(function(option) {
      var button = document.createElement('button');
      button.type = 'button';
      button.textContent = option.label;
      button.addEventListener('click', function() {
        var all = box.querySelectorAll('button');
        for (var i = 0; i < all.length; i += 1) all[i].disabled = true;
        onChoose(option.id);
      });
      box.appendChild(button);
    });
    M.showScene('game');
  };
})(window);
