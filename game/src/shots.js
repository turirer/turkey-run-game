// shots.js — deterministic scenes for the hand-in screenshots.
//
// Opening the game with ?shot=title|play|kitchen|end&seed=N stages one
// frozen moment and sets window.__shotReady, so a headless browser can
// photograph the real game code exactly as a player would see it. The
// same seed always stages the same scene.

import { GROUND_Y, STAGES } from './settings.js';
import { makeRng } from './rng.js';
import { createWorld, makeObstacle, scoreOf, stageIndexFor } from './world.js';

export function parseShotParams() {
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  if (!shot) return null;
  const seed = Number.parseInt(params.get('seed') || '7', 10) || 7;
  return { shot, seed };
}

function cornArc(world, cx, peak) {
  for (let i = 0; i < 5; i += 1) {
    const t = i / 4;
    world.corns.push({
      x: cx - 90 + t * 180,
      y: GROUND_Y - 60 - Math.sin(t * Math.PI) * peak,
      golden: false,
      taken: false,
    });
  }
}

// Mid-jump over a fence in the farmyard, the farmer in sight behind.
function stagePlay(seed) {
  const world = createWorld(seed);
  const rng = makeRng(seed * 31 + 5);
  world.time = 3.2;
  world.distance = 640;
  world.px = 640 * 40;
  world.stageIndex = stageIndexFor(world.distance);
  world.corn = 14;
  world.gap = 46;
  world.spotted = true;
  world.turkey.feetY = GROUND_Y - 148;
  world.turkey.vy = -120;
  world.turkey.jumps = 2;
  world.turkey.flapT = 0.22;
  world.turkey.runPhase = 2.1;
  world.farmerRunPhase = 1.4;
  world.obstacles.push(makeObstacle('fence', 430, rng));
  world.obstacles.push(makeObstacle('haybale', 880, rng));
  world.obstacles.push(makeObstacle('dog', 1100, rng));
  cornArc(world, 465, 120);
  world.corns.push({ x: 1010, y: GROUND_Y - 150, golden: true, taken: false });
  return world;
}

// Ducking under a flying carving knife in the kitchen, oven ahead.
function stageKitchen(seed) {
  const world = createWorld(seed);
  const rng = makeRng(seed * 17 + 3);
  world.time = 8.4;
  world.distance = 2350;
  world.px = 2350 * 40;
  world.stageIndex = stageIndexFor(world.distance);
  world.corn = 31;
  world.golden = 1;
  world.feathers = 2;
  world.gap = 34;
  world.spotted = true;
  world.turkey.ducking = true;
  world.turkey.runPhase = 4.2;
  world.farmerRunPhase = 3.3;
  world.obstacles.push(makeObstacle('knife', 440, rng));
  world.obstacles.push(makeObstacle('oven', 810, rng));
  world.obstacles.push(makeObstacle('steampot', 1040, rng));
  cornArc(world, 865, 130);
  return world;
}

// The escape, completed: the end screen with the full tally.
function stageEnd(seed) {
  const world = createWorld(seed);
  world.time = 5.0;
  world.distance = 3000;
  world.px = 3000 * 40;
  world.stageIndex = STAGES.length - 1;
  world.corn = 47;
  world.golden = 2;
  world.feathers = 2;
  world.finished = 'escaped';
  return world;
}

// Returns { screen, world, best, isNewBest } for main.js to render once.
export function stageShot(name, seed) {
  if (name === 'title') return { screen: 'title', world: null, best: 4210, isNewBest: false };
  if (name === 'kitchen') {
    const world = stageKitchen(seed);
    return { screen: 'play', world, best: 4210, isNewBest: false };
  }
  if (name === 'end') {
    const world = stageEnd(seed);
    return { screen: 'end', world, best: scoreOf(world), isNewBest: true };
  }
  const world = stagePlay(seed);
  return { screen: 'play', world, best: 4210, isNewBest: false };
}
