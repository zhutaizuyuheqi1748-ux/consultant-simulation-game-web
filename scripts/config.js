(function(root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.MBB = root.MBB || {};
    Object.assign(root.MBB, api);
  }
})(typeof window !== 'undefined' ? window : null, function() {
  'use strict';
  var GAME_CONFIG = {
    eventsPerYear: 3,
    reviewCycleYears: 2,
    chanceMin: 5,
    chanceMax: 95,
    statsMin: 0,
    statsMax: 100,
    startingStats: { delivery: 45, client: 42, partner: 38, stamina: 76 },
    ranks: [
      { id: 'ba', name: 'Business Analyst', cn: '商业分析师', startChance: 52, maxFailedReviews: 2, avatar: './assets/images/avatars/ba.png' },
      { id: 'consultant', name: 'Consultant', cn: '咨询顾问', startChance: 48, maxFailedReviews: 2, avatar: './assets/images/avatars/consultant.png' },
      { id: 'manager', name: 'Manager', cn: '项目经理', startChance: 44, maxFailedReviews: 2, avatar: './assets/images/avatars/manager.png' },
      { id: 'principal', name: 'Principal', cn: '董事', startChance: 40, maxFailedReviews: 2, avatar: './assets/images/avatars/principal.png' },
      { id: 'partner', name: 'Partner', cn: '合伙人', startChance: 36, maxFailedReviews: 2, avatar: './assets/images/avatars/partner.png' },
      { id: 'senior_partner', name: 'Senior Partner', cn: '高级合伙人', startChance: 100, maxFailedReviews: 0, avatar: './assets/images/avatars/senior-partner.png' }
    ],
    toneWeights: { realistic: 50, dark: 25, legendary: 25 },
    resultAnimationMs: 650,
    annualReviewAnimationMs: 1400
  };
  return { GAME_CONFIG: GAME_CONFIG };
});
