const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createDrawer } = require('../food/draw-bag.js');

function rng(seed = 12345) {
  return length => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return Math.floor(seed / 4294967296 * length);
  };
}
function storage() {
  const data = new Map();
  return { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
}

test('every restaurant appears exactly once per round, with no boundary repeats', () => {
  for (const size of [1, 2, 3, 4, 19]) {
    const names = Array.from({ length: size }, (_, i) => 'restaurant-' + i);
    const draw = createDrawer(rng(), storage());
    let last;
    for (let round = 0; round < 100; round++) {
      const results = names.map(() => draw(names));
      assert.deepEqual([...results].sort(), [...names].sort());
      if (size > 1) assert.notEqual(results[0], last);
      last = results.at(-1);
    }
  }
});

test('refresh and switching cuisine preserve independent rounds', () => {
  const saved = storage();
  const all = ['THEGRILL', '希伯意', '尊宝比萨', '一心美式寿司'];
  const western = all.slice(0, 3);
  let draw = createDrawer(rng(), saved);
  const first = draw(all);
  const westernFirst = draw(western);
  draw = createDrawer(rng(77), saved);
  const rest = Array.from({ length: 3 }, () => draw(all));
  assert.equal(new Set([first, ...rest]).size, 4);
  assert.equal(new Set([westernFirst, draw(western), draw(western)]).size, 3);
});

test('missing, malformed and blocked storage still allow nonrepeating draws', () => {
  for (const saved of [undefined,
    { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } },
    { getItem() { return 'not json'; }, setItem() {} },
    { getItem() { return JSON.stringify({ remaining: ['removed'], last: 'unknown' }); }, setItem() {} },
    { getItem() { return JSON.stringify({ remaining: ['a', 'a'], last: 'b' }); }, setItem() {} }
  ]) {
    const draw = createDrawer(rng(), saved);
    const names = ['a', 'b', 'c'];
    const draws = Array.from({ length: 12 }, () => draw(names));
    for (let i = 1; i < draws.length; i++) assert.notEqual(draws[i], draws[i - 1]);
    assert.equal(new Set(draws.slice(-3)).size, 3);
  }
});

test('a failed storage write cannot restore an old queue on every draw', () => {
  const saved = {
    getItem() { return JSON.stringify({ remaining: ['b', 'c'], last: 'a' }); },
    setItem() { throw new Error('quota'); }
  };
  const draw = createDrawer(rng(), saved);
  const names = ['a', 'b', 'c'];
  assert.deepEqual([draw(names), draw(names)], ['c', 'b']);
  assert.equal(new Set(names.map(() => draw(names))).size, 3);
});

test('different random seeds produce varied orders and all possible initial choices', () => {
  const names = ['a', 'b', 'c', 'd'];
  const orders = new Set();
  const firsts = new Set();
  for (let seed = 1; seed <= 100; seed++) {
    const draw = createDrawer(rng(seed * 99991), storage());
    const results = names.map(() => draw(names));
    firsts.add(results[0]);
    orders.add(results.join(','));
  }
  assert.equal(firsts.size, 4);
  assert.ok(orders.size >= 20);
});
