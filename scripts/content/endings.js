(function(root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.MBB = root.MBB || {};
    Object.assign(root.MBB, api);
  }
})(typeof window !== 'undefined' ? window : null, function() {
  'use strict';
  return {
    ENDINGS: {
      senior_partner_retired: { title: '终身成就 Partner', copy: '你完整做完 Senior Partner 的最后两年。顶楼的灯终于关了——因为现在轮到别人加班。' },
      senior_partner: { title: '终身成就 Partner', copy: '你完整做完 Senior Partner 的最后两年，然后把未读邮件交给了继任者。' },
      fired: { title: '门禁卡已失效', copy: '组织决定与你双向奔赴到此为止。' },
      burnout: { title: '身体先交付了', copy: '日历还有空格，你没有。' },
      scandal: { title: '那封邮件有了姓名', copy: '免责声明没能装下整个职业生涯。' },
      client_poach: { title: '甲方接住了你', copy: '你终于坐到桌子另一边，然后开始催咨询顾问。' }
    },
    TITLES: ['PPT 像素雕刻师', '凌晨三点战略家', '风险偏好艺术家', '客户翻译官', '背锅资产轻量化专家', '会议室幸存者']
  };
});
