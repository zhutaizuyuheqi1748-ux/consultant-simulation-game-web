(function(root, factory) {
  var api = factory(typeof require === 'function' ? require('../config.js') : root.MBB);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.MBB = root.MBB || {};
    Object.assign(root.MBB, api);
  }
})(typeof window !== 'undefined' ? window : null, function(dep) {
  'use strict';

  var ENDING_BANDS = [
    { deliveryHigh: 49, clientHigh: 47, partnerHigh: 42, staminaLow: 50, staminaHigh: 62 },
    { deliveryHigh: 51, clientHigh: 53, partnerHigh: 49, staminaLow: 47, staminaHigh: 65 },
    { deliveryHigh: 51, clientHigh: 55, partnerHigh: 58, staminaLow: 32, staminaHigh: 55 },
    { deliveryHigh: 53, clientHigh: 54, partnerHigh: 67, staminaLow: 42, staminaHigh: 67 },
    { deliveryHigh: 55, clientHigh: 56, partnerHigh: 73, staminaLow: 41, staminaHigh: 66 },
    { deliveryHigh: 55, clientHigh: 57, partnerHigh: 78, staminaLow: 52, staminaHigh: 77 }
  ];

  var LIFE_ENDINGS = {
    'early-caregiver': {
      id: 'early-caregiver', title: '全职带娃的前顾问',
      outcome: '你在第一个孩子出生后离开咨询，把职业暂停键按了三年。',
      joke: '以前管理项目排期，现在管理午睡排期。',
      detail: '收入少了，睡眠没有增加；但你第一次完整参加了一个没有会议纪要的生日。'
    },
    'early-course-creator': {
      id: 'early-course-creator', title: '三十万粉丝的 Excel 老师',
      outcome: '你没有升职，却靠做 Excel 和 PPT 课程赚到了第一桶金。',
      joke: '公司不认可你的能力，网友按月订阅。',
      detail: '你开宝马 3 系，有一个娃；最大的遗憾是家里人一直以为你没有正式工作。'
    },
    'early-big-tech': {
      id: 'early-big-tech', title: '大厂战略总监',
      outcome: '你离开咨询，加入一家更大的公司，后来做到了战略总监。',
      joke: '以前帮客户编战略，现在开始给自己编。',
      detail: '你开一辆二手 Model 3，有两个娃；收入翻了几倍，但“最后一版”依然没有最后。'
    },
    'early-client-pm': {
      id: 'early-client-pm', title: '甲方项目经理',
      outcome: '客户记住了你，把你招过去负责原来的项目。',
      joke: '昨天还在被客户催，今天开始催咨询顾问。',
      detail: '你开理想 L7，周末带两个娃露营；遗憾是每次看到咨询报价，都会想起自己当年的时薪。'
    },
    'early-mba': {
      id: 'early-mba', title: 'MBA 重新开局',
      outcome: 'Sponsor 没能保住你，却帮你拿到了商学院推荐信。',
      joke: 'UP OR OUT，最后 OUT 到了商学院。',
      detail: '毕业后你进入投资行业，背着六十万学费贷款；职位更体面，睡得并没有更多。'
    },
    'early-state-owned': {
      id: 'early-state-owned', title: '国企战略岗',
      outcome: '你离开咨询，考进一家大型国企做战略规划。',
      joke: '项目周期从六周变成了五年。',
      detail: '你开凯美瑞，有两个娃，每天七点回家；遗憾是年度战略材料仍然沿用你十年前做的模板。'
    },
    'early-sweet-potato': {
      id: 'early-sweet-potato', title: '红薯摊 CEO',
      outcome: '连续两次晋升失败后，你半年没找到合适工作，最后在写字楼下卖起了烤红薯。',
      joke: '唯一没写进 Excel 的增长曲线，真的增长了。',
      detail: '十年后你开了三家店，开五菱宏光送货，有一个娃；遗憾是路过甲方大楼还会下意识看邮件。'
    },
    'mid-professor': {
      id: 'mid-professor', title: '商学院老师',
      outcome: '一次体检让你离开项目一线，后来去商学院教案例课。',
      joke: '以前制造案例，现在负责解释案例。',
      detail: '你骑自行车上班，收入少了一半；但每天能回家吃晚饭，孩子终于知道你具体做什么工作。'
    },
    'mid-coo': {
      id: 'mid-coo', title: '创业公司 COO',
      outcome: '你加入曾经服务过的创业公司，三年后成为 COO。',
      joke: '以前管理 Workstream，现在管理整家公司。',
      detail: '你开 Model Y，有两个娃，期权价值写着八位数；遗憾是两个孩子第一次走路，你都在开董事会。'
    },
    'mid-client-strategy': {
      id: 'mid-client-strategy', title: '甲方战略负责人',
      outcome: '客户把你挖走，任命你为集团战略负责人。',
      joke: '你终于坐到了桌子另一边，然后提出“这页再深一层”。',
      detail: '你开沃尔沃 XC60，房贷还剩十二年；工作稳定了，但每到周日晚上还是会莫名紧张。'
    },
    'mid-independent': {
      id: 'mid-independent', title: '一人咨询公司',
      outcome: '你离开公司，成立了一家只有自己的咨询工作室。',
      joke: '公司只有一个人，周会终于取消了。',
      detail: '你开宝马 X3，有一个娃；收入好的月份超过从前，差的月份连自己都想优化掉。'
    },
    'mid-big-tech': {
      id: 'mid-big-tech', title: '大厂中层',
      outcome: '你加入大厂负责经营分析，职位没有暴涨，生活先稳定了。',
      joke: '以前凌晨两点改客户材料，现在晚上十点改内部材料。',
      detail: '你开别克 GL8，有两个娃，房贷还了一半；遗憾是你终于有时间，却已经不知道周末想做什么。'
    },
    'late-client-ceo': {
      id: 'late-client-ceo', title: '客户公司 CEO',
      outcome: '你离开合伙人岗位，加入客户公司，后来成为 CEO。',
      joke: '以前向 CEO 汇报，现在别人向你汇报。',
      detail: '你有司机接送，两个娃更熟悉你的助理；最大的遗憾是终于到了顶层，却错过了很多第一次。'
    },
    'late-boutique-founder': {
      id: 'late-boutique-founder', title: '精品咨询创始人',
      outcome: '你带走几个客户和老同事，创办了一家三十人的咨询公司。',
      joke: '终于当上真正的老板，区别是工资要自己发。',
      detail: '你开保时捷，有一个娃；公司利润不错，但每个月最后一天都会重新理解“现金流”。'
    },
    'sp-bookstore': {
      id: 'sp-bookstore', title: '大理书店老板',
      outcome: '你做到 Senior Partner，卖掉股份，去大理开了一家书店。',
      joke: '书店下午六点关门，这是你做过最激进的组织改革。',
      detail: '你开一辆旧沃尔沃，孩子已经长大；偶尔凌晨两点醒来，还是会下意识检查邮箱。'
    },
    'sp-evergreen': {
      id: 'sp-evergreen', title: '顶楼常青树',
      outcome: '你成为 Senior Partner，退休后继续担任几家公司的董事。',
      joke: '你没有被优化，最后成了负责优化别人的人。',
      detail: '你有两套房、两辆车和两个娃；遗憾是家里人记得你的职位，却想不起你哪年开始经常不在家。'
    }
  };

  function withRunFacts(id, state) {
    var source = LIFE_ENDINGS[id];
    var rank = dep.GAME_CONFIG.ranks[state.rankIndex] || dep.GAME_CONFIG.ranks[0];
    var observedReviews = state.totalFailedReviews == null ? (state.failedReviews || 0) : state.totalFailedReviews;
    return Object.assign({}, source, {
      triggerSummary: '你在麦波恩做了 ' + state.year + ' 年，最终停在' + rank.cn + '，完成 ' + state.promotions + ' 次晋升，经历 ' + observedReviews + ' 次再观察。'
    });
  }

  function selectLifeEnding(state) {
    var rankIndex = Math.max(0, Math.min(ENDING_BANDS.length - 1, state.rankIndex || 0));
    var band = ENDING_BANDS[rankIndex];
    var stats = state.stats || {};
    var delivery = stats.delivery || 0;
    var client = stats.client || 0;
    var partner = stats.partner || 0;
    var stamina = stats.stamina || 0;
    var id;

    if (rankIndex <= 1) {
      if (stamina <= band.staminaLow) id = 'early-caregiver';
      else if (delivery >= band.deliveryHigh && client < band.clientHigh) id = 'early-course-creator';
      else if (delivery >= band.deliveryHigh) id = 'early-big-tech';
      else if (client >= band.clientHigh) id = 'early-client-pm';
      else if (partner >= band.partnerHigh) id = 'early-mba';
      else if (stamina >= band.staminaHigh) id = 'early-state-owned';
      else id = 'early-sweet-potato';
    } else if (rankIndex <= 3) {
      if (stamina <= band.staminaLow) id = 'mid-professor';
      else if (delivery >= band.deliveryHigh && client >= band.clientHigh) id = 'mid-coo';
      else if (client >= band.clientHigh) id = 'mid-client-strategy';
      else if (partner >= band.partnerHigh) id = 'mid-independent';
      else id = 'mid-big-tech';
    } else if (rankIndex === 4) {
      id = client >= band.clientHigh ? 'late-client-ceo' : 'late-boutique-founder';
    } else {
      id = stamina <= band.staminaLow ? 'sp-bookstore' : 'sp-evergreen';
    }
    return withRunFacts(id, state);
  }

  return { LIFE_ENDINGS: LIFE_ENDINGS, ENDING_BANDS: ENDING_BANDS, selectLifeEnding: selectLifeEnding };
});
