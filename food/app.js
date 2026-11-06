(function () {
  'use strict';
  const groups = [
    { name: '粤菜／港式茶餐厅', label: '粤菜 / 茶餐厅', emoji: '🥟', restaurants: ['臻港味港式茶餐厅', '张仔记·老顺德干蒸菜', '新地港式茶餐厅', '叹世界点心餐厅'] },
    { name: '川菜', label: '川菜', emoji: '🌶️', restaurants: ['川采·川菜', '蜀隆老牌川菜', '勤勤川菜'] },
    { name: '西餐／披萨', label: '西餐 / 披萨', emoji: '🍕', restaurants: ['THEGRILL西餐厅🐔🐔🐔', '希伯意西餐·早茶·点心', '尊宝比萨'] },
    { name: '寿司／日料', label: '寿司 / 日料', emoji: '🍣', restaurants: ['一心美式寿司'] },
    { name: '泰餐／海南鸡饭', label: '泰餐 / 海南鸡饭', emoji: '🍚', restaurants: ['泰味赞东南亚主题餐厅', '椰香阁海南鸡饭'] },
    { name: '烧腊／烤鸭', label: '烧腊 / 烤鸭', emoji: '🍗', restaurants: ['旺角烧鹅·烧腊', '都城记北京烤鸭'] },
    { name: '新疆菜', label: '新疆菜', emoji: '🥙', restaurants: ['寻疆·新疆大盘鸡·烤包子'] },
    { name: '快餐／日常简餐', label: '快餐 / 简餐', emoji: '🍔', restaurants: ['麦当劳&麦咖啡', '肯德基宅急送', '麦稻中式健康菜'] }
  ];
  const restaurants = groups.flatMap(group => group.restaurants.map(name => ({ name, category: group.name, emoji: group.emoji })));
  const byId = id => document.getElementById(id);
  const stage = byId('stage');
  const drawButton = byId('draw');
  const filters = byId('filters');
  let selected = '全部';
  let busy = false;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function pool() { return restaurants.filter(item => selected === '全部' || item.category === selected); }
  // Rejection sampling avoids modulo bias, giving every restaurant the same chance.
  function randomIndex(length) {
    if (!window.crypto || !window.crypto.getRandomValues) return Math.floor(Math.random() * length);
    const range = 4294967296;
    const limit = range - (range % length);
    const value = new Uint32Array(1);
    do { window.crypto.getRandomValues(value); } while (value[0] >= limit);
    return value[0] % length;
  }
  let storage;
  try { storage = window.localStorage; } catch (_) { /* Private browsing may block storage. */ }
  const drawRestaurant = window.FoodDraw.createDrawer(randomIndex, storage);
  function renderList() {
    const choices = pool();
    byId('pool-count').textContent = choices.length + ' 家待选';
    byId('list-count').textContent = choices.length + ' 家';
    byId('restaurants').replaceChildren(...choices.map(item => {
      const li = document.createElement('li');
      const icon = document.createElement('span');
      icon.className = 'restaurant-icon';
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = item.emoji;
      const copy = document.createElement('div');
      copy.className = 'restaurant-copy';
      const name = document.createElement('strong');
      name.textContent = item.name;
      const category = document.createElement('small');
      category.textContent = item.category;
      copy.append(name, category);
      const number = document.createElement('span');
      number.className = 'restaurant-number';
      number.textContent = String(restaurants.indexOf(item) + 1).padStart(2, '0');
      li.append(icon, copy, number);
      return li;
    }));
    byId('restaurants').scrollTop = 0;
  }
  [{ name: '全部', label: '✦ 全部 · 随缘' }, ...groups].forEach(group => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'filter';
    button.textContent = group.label;
    button.setAttribute('aria-pressed', String(group.name === selected));
    button.addEventListener('click', () => {
      if (busy || selected === group.name) return;
      selected = group.name;
      filters.querySelectorAll('button').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
      stage.className = 'stage';
      byId('result').hidden = true;
      byId('draw-label').textContent = '摇一签，开饭';
      byId('status').textContent = pool().length === 1 ? '这类只有一家，摇一签就为它开饭。' : '心里默念「吃什么」，然后摇一签。';
      renderList();
    });
    filters.append(button);
  });
  const pause = ms => new Promise(resolve => window.setTimeout(resolve, ms));
  drawButton.addEventListener('click', async () => {
    if (busy) return;
    busy = true;
    drawButton.disabled = true;
    filters.querySelectorAll('button').forEach(button => { button.disabled = true; });
    byId('result').hidden = true;
    stage.className = 'stage shaking';
    byId('draw-label').textContent = '好饭正在路上…';
    byId('status').textContent = '哗啦哗啦，让签筒替你想一想…';
    const choices = pool();
    const chosenName = drawRestaurant(choices.map(item => item.name));
    const chosen = choices.find(item => item.name === chosenName);
    await pause(reducedMotion.matches ? 100 : 1550);
    stage.className = 'stage revealing';
    byId('status').textContent = '签出来了，看看今天的好食运。';
    await pause(reducedMotion.matches ? 100 : 650);
    byId('result-number').textContent = '第 ' + String(restaurants.indexOf(chosen) + 1).padStart(2, '0') + ' 签';
    byId('result-name').textContent = chosen.name;
    byId('result-category').textContent = chosen.category;
    byId('result-emoji').textContent = chosen.emoji;
    stage.className = 'stage has-result';
    byId('result').hidden = false;
    byId('status').textContent = '抽中了「' + chosen.name + '」，今天好好吃饭！';
    byId('draw-label').textContent = '再摇一签';
    drawButton.disabled = false;
    filters.querySelectorAll('button').forEach(button => { button.disabled = false; });
    busy = false;
  });
  renderList();
}());
