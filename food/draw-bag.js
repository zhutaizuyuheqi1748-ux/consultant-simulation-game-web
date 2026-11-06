(function (root) {
  'use strict';

  function createDrawer(randomIndex, storage) {
    const memory = new Map();

    function valid(state, names) {
      return state && Array.isArray(state.remaining) &&
        new Set(state.remaining).size === state.remaining.length &&
        state.remaining.every(name => names.includes(name)) &&
        names.includes(state.last) && !state.remaining.includes(state.last);
    }

    return function draw(names) {
      if (!names.length || new Set(names).size !== names.length) {
        throw new Error('A draw needs a nonempty list of unique restaurant names.');
      }
      // Each cuisine keeps its own round, including when switching filters.
      const key = 'mbb-food-bag-v1:' + JSON.stringify([...names].sort());
      let state = memory.get(key);
      if (!state) {
        try {
          const saved = JSON.parse(storage.getItem(key));
          if (valid(saved, names)) state = saved;
        } catch (_) { /* Storage can be unavailable or contain invalid JSON. */ }
      }
      if (!valid(state, names)) state = { remaining: [], last: null };

      if (!state.remaining.length) {
        state.remaining = [...names];
        // Fisher–Yates: all orders are equally likely before the boundary rule.
        for (let i = state.remaining.length - 1; i > 0; i--) {
          const j = randomIndex(i + 1);
          [state.remaining[i], state.remaining[j]] = [state.remaining[j], state.remaining[i]];
        }
        // Do not repeat the previous round's final restaurant at the boundary.
        const end = state.remaining.length - 1;
        if (end > 0 && state.remaining[end] === state.last) {
          const j = randomIndex(end);
          [state.remaining[end], state.remaining[j]] = [state.remaining[j], state.remaining[end]];
        }
      }
      const chosen = state.remaining.pop();
      state.last = chosen;
      memory.set(key, state);
      try { storage.setItem(key, JSON.stringify(state)); } catch (_) { /* Keep the in-memory round. */ }
      return chosen;
    };
  }

  if (typeof module === 'object' && module.exports) module.exports = { createDrawer };
  else root.FoodDraw = { createDrawer };
}(typeof window === 'object' ? window : globalThis));
