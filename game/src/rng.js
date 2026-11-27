// rng.js — a tiny seeded random generator (mulberry32).
//
// Seeding matters for the screenshot staging in shots.js: the same seed
// lays out the same obstacles and corn every time, so a screenshot can be
// retaken byte for byte.

export function makeRng(seed) {
  let state = (seed >>> 0) || 1;
  return function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A float in [lo, hi).
export function range(rng, lo, hi) {
  return lo + rng() * (hi - lo);
}

// An integer in [lo, hi] inclusive.
export function intRange(rng, lo, hi) {
  return lo + Math.floor(rng() * (hi - lo + 1));
}

// One element of a non-empty list.
export function pick(rng, list) {
  return list[Math.floor(rng() * list.length) % list.length];
}
