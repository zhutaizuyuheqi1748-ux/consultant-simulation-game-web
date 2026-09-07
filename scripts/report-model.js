(function(root, factory) {
  var api = factory(
    typeof require === 'function' ? require('./config.js') : root.MBB,
    typeof require === 'function' ? require('./content/endings.js') : root.MBB,
    typeof require === 'function' ? require('./content/life-endings.js') : root.MBB
  );
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.MBB = root.MBB || {};
    Object.assign(root.MBB, api);
  }
})(typeof window !== 'undefined' ? window : null, function(config, content, lifeEndings) {
  'use strict';

  var STAT_TITLES = {
    delivery: ['最终版 v∞ 终结者', '你的交付能力是四项能力里最高的。'],
    client: ['客户微信置顶联系人', '你的客户关系是四项能力里最高的。'],
    partner: ['Partner 点头收藏家', '你的合伙人认可度是四项能力里最高的。'],
    stamina: ['人类可再生工时', '你的体力是四项能力里最高的。']
  };
  var ENDING_TITLES = {
    fired: ['门禁卡提前退休', '最后一次委员会替你的门禁卡做了职业规划。'],
    burnout: ['本人先于项目下线', '项目还在继续，你的体力先提交了离职申请。'],
    scandal: ['免责声明署名人', '职业生涯最后一页终于出现了你的全名。'],
    client_poach: ['桌子另一边的人', '你离开乙方工牌，坐到了曾经催你改稿的位置。'],
    senior_partner: ['顶楼幸存者', '你真的活过了所有委员会，走到了 Senior Partner。'],
    senior_partner_retired: ['顶楼幸存者', '你从新人活成了新人培训里不具名的传奇。']
  };

  function strongestStat(stats) {
    return ['delivery', 'client', 'partner', 'stamina'].reduce(function(best, key) {
      return (stats[key] || 0) > (stats[best] || 0) ? key : best;
    }, 'delivery');
  }

  function toMomentCard(item) {
    var copy = item.moment || [item.resultTitle, item.storyLine].filter(Boolean).join(' ');
    return {
      eventId: item.eventId || '',
      eventTitle: item.eventTitle || '无名项目',
      optionLabel: item.label || item.optionLabel || '当时你做了决定',
      resultTitle: item.resultTitle || '',
      storyLine: item.storyLine || '',
      copy: copy || '这件事发生了，但会议纪要拒绝承认。',
      chanceDelta: item.chanceDelta || 0
    };
  }

  function findRiskiest(history) {
    if (!history.length) return null;
    var riskiest = history[0];
    history.slice(1).forEach(function(item) {
      if ((item.chanceDelta || 0) < (riskiest.chanceDelta || 0)) riskiest = item;
    });
    return (riskiest.chanceDelta || 0) < 0 ? toMomentCard(riskiest) : null;
  }

  function selectMoments(history) {
    var decorated = history.map(function(item, index) { return { item: item, index: index }; });
    decorated.sort(function(a, b) {
      return Math.abs(b.item.chanceDelta || 0) - Math.abs(a.item.chanceDelta || 0) || a.index - b.index;
    });
    var seen = {};
    var output = [];
    decorated.forEach(function(entry) {
      var key = entry.item.eventId || 'history-' + entry.index;
      if (!seen[key] && output.length < 3) {
        seen[key] = true;
        output.push(toMomentCard(entry.item));
      }
    });
    return output;
  }

  function toLegacyMoment(card) {
    var legacy = new String(card.copy);
    Object.keys(card).forEach(function(key) { legacy[key] = card[key]; });
    return legacy;
  }

  function addTitle(cards, title, reason) {
    if (!title || cards.some(function(card) { return card.title === title; }) || cards.length >= 3) return;
    cards.push({ title: title, reason: reason });
  }

  function buildTitleCards(state, history) {
    var cards = [];
    var stats = state.stats || {};
    var tags = state.tags || [];
    var swings = history.map(function(item) { return item.chanceDelta || 0; });
    var lowest = swings.length ? Math.min.apply(Math, swings) : 0;
    var highest = swings.length ? Math.max.apply(Math, swings) : 0;
    var negativeCount = swings.filter(function(value) { return value < 0; }).length;
    var lowestItem = history.find(function(item) { return (item.chanceDelta || 0) === lowest; });
    var highestItem = history.find(function(item) { return (item.chanceDelta || 0) === highest; });
    var latestTag = tags[tags.length - 1];
    var tagOrigin = history.slice().reverse().find(function(item) {
      return latestTag && (item.addTags || []).indexOf(latestTag) >= 0;
    });

    if (state.failedReviews > 0) addTitle(cards, '绩效观察区逃生者', '你被留在当前职级观察过 ' + state.failedReviews + ' 次，仍然撑到了下一页。');
    if (lowest <= -12) addTitle(cards, '把 ' + lowest + '% 当体验卡', '你在《' + lowestItem.eventTitle + '》里选了“' + (lowestItem.label || lowestItem.optionLabel) + '”，一次丢掉 ' + Math.abs(lowest) + ' 点。');
    if (latestTag) addTitle(cards, '「' + latestTag + '」持证人', tagOrigin ? '这张证是在《' + tagOrigin.eventTitle + '》里亲手挣来的。' : '这是你一路留下、并带到结局的真实标签。');
    if ((stats.stamina || 0) < 25) addTitle(cards, '咖啡续命长期客户', '结局时体力只剩 ' + (stats.stamina || 0) + '，人还在线，电量已经不是。');
    if (state.promotions >= 3) addTitle(cards, '晋升材料常驻嘉宾', state.year + ' 年里升了 ' + state.promotions + ' 次，委员会至少记住了你的名字。');
    if (history.length && negativeCount >= Math.ceil(history.length / 2)) addTitle(cards, '概率过山车驾驶员', history.length + ' 次决定里有 ' + negativeCount + ' 次让晋升概率向下走。');
    if (highest >= 12) addTitle(cards, '一把抬高半条命', '你在《' + highestItem.eventTitle + '》里一次抢回了 ' + highest + ' 点晋升概率。');
    var strongest = strongestStat(stats);
    var statTitle = STAT_TITLES[strongest];
    addTitle(cards, statTitle[0], statTitle[1].replace('。', '，结局数值是 ' + (stats[strongest] || 0) + '。'));
    var endingTitle = ENDING_TITLES[state.ending] || ENDING_TITLES.fired;
    addTitle(cards, endingTitle[0], endingTitle[1]);
    addTitle(cards, String(state.year) + ' 年工牌持有人', '这张工牌陪你从 Analyst 走到' + config.GAME_CONFIG.ranks[state.rankIndex].cn + '。');
    return cards;
  }

  function buildTitles(state, history) {
    return buildTitleCards(state, history).map(function(card) { return card.title; });
  }

  function bestBy(history, compare) {
    if (!history.length) return null;
    return history.slice(1).reduce(function(best, item) {
      return compare(item.chanceDelta || 0, best.chanceDelta || 0) ? item : best;
    }, history[0]);
  }

  function sceneText(item, emptyCopy) {
    if (!item) return emptyCopy;
    return '在《' + item.eventTitle + '》里，你选了“' + (item.label || item.optionLabel || '做决定') + '”。' + (item.resultTitle || item.storyLine || '会议纪要记住了这件事。');
  }

  function buildCareerStory(state, history, ending, rank) {
    var first = history[0];
    var best = bestBy(history, function(value, current) { return value > current; });
    var worst = bestBy(history, function(value, current) { return value < current; });
    if (best && (best.chanceDelta || 0) <= 0) best = null;
    if (worst && (worst.chanceDelta || 0) >= 0) worst = null;
    var endingHeadlines = {
      fired: '从 Business Analyst 到' + rank.cn + '：最后是门禁卡先退休',
      burnout: '从 Business Analyst 到' + rank.cn + '：项目还在，人先下线',
      scandal: '从 Business Analyst 到' + rank.cn + '：最后一页终于写了真名',
      client_poach: '从 Business Analyst 到' + rank.cn + '：最后坐到了桌子另一边',
      senior_partner: '从 Business Analyst 到 Senior Partner：你真的活到了顶楼',
      senior_partner_retired: '从 Business Analyst 到 Senior Partner：工牌完成了全生命周期'
    };
    return {
      headline: endingHeadlines[state.ending] || endingHeadlines.fired,
      sections: [
        { label: '入职第一课', text: sceneText(first, '你从 Business Analyst 入职，还没弄懂“最终版”为什么永远不最终。') },
        { label: '最风光的一页', text: sceneText(best, '这段履历没有高光截图，只有按时交付的会议纪要。') },
        { label: '最想删除的一页', text: sceneText(worst, '你谨慎得没有留下事故，可惜委员会也没留下掌声。') },
        { label: '最后一页', text: '就这样，你用 ' + state.year + ' 年从 Business Analyst 走到' + rank.cn + '，升了 ' + state.promotions + ' 次。' + ending.copy }
      ]
    };
  }

  function buildJourneyReport(state) {
    var history = state.history || [];
    var swing = history.reduce(function(current, item) {
      return Math.abs(item.chanceDelta || 0) > Math.abs(current || 0) ? item.chanceDelta : current;
    }, 0);
    var ending = content.ENDINGS[state.ending] || content.ENDINGS.fired;
    var rank = config.GAME_CONFIG.ranks[state.rankIndex];
    var riskiest = findRiskiest(history);
    var titleCards = buildTitleCards(state, history);
    var momentCards = selectMoments(history);
    var lifeEnding = lifeEndings && typeof lifeEndings.selectLifeEnding === 'function'
      ? lifeEndings.selectLifeEnding(state)
      : null;
    return {
      brand: '麦波恩咨询 MBB',
      ending: ending.title,
      quote: ending.copy,
      verdict: ending.copy + ' 你用 ' + state.year + ' 年和 ' + state.promotions + ' 次晋升，把职业生涯交付到了' + rank.cn + '。',
      rank: rank.name,
      rankCn: rank.cn,
      years: state.year,
      promotions: state.promotions,
      dangerous: riskiest ? riskiest.eventTitle : '—',
      biggestSwing: swing,
      lifeEnding: lifeEnding,
      careerStory: buildCareerStory(state, history, ending, rank),
      titleCards: titleCards,
      momentCards: momentCards,
      persona: { title: titleCards[0].title, line: titleCards[0].reason },
      beatPercent: [18, 38, 57, 73, 86, 94][state.rankIndex] || 18,
      titles: titleCards.map(function(card) { return card.title; }),
      riskiest: riskiest,
      moments: momentCards.map(toLegacyMoment)
    };
  }

  return {
    buildJourneyReport: buildJourneyReport,
    findRiskiest: findRiskiest,
    buildTitles: buildTitles,
    buildTitleCards: buildTitleCards,
    buildCareerStory: buildCareerStory,
    selectMoments: selectMoments
  };
});
