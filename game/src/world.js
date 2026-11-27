// world.js — the simulation: the turkey's run, the farmer's chase, what
// spawns ahead and what happens when the turkey meets it. Drawing lives in
// art.js and screens.js; this file only moves numbers.
//
// updateWorld returns events ('jump', 'corn', 'hit', ...) that main.js
// turns into sound and screen changes.

import {
  BASE_SPEED, CORN_POINTS, DASH_COOLDOWN, DASH_MULT, DASH_TIME, DIP_MULT,
  DIP_TIME, DUCK_FALL, FINISH_M, FLAP_V, GAP_DASH, GAP_HIT, GAP_PUDDLE,
  GAP_RECOVER, GAP_SPOTTED, GAP_START, GOLDEN_POINTS, GRAVITY, GROUND_Y,
  INVULN_TIME, JUMP_V, MAX_FALL, MAX_FEATHERS, MAX_SPEED, PX_PER_METER,
  SPEED_PER_100M, STAGES, TURKEY_DUCK_H, TURKEY_H, TURKEY_W, TURKEY_X,
  VIEW_W,
} from './settings.js';
import { intRange, makeRng, pick, range } from './rng.js';

// What each obstacle kind is: its size, where its top sits, and whether it
// rolls toward the turkey (extra px/s). Ground kinds sit on GROUND_Y;
// duck kinds hang in the band a standing turkey's head passes through.
export const OBSTACLE_DEFS = {
  fence:      { w: 70,  h: 64,  ground: true },
  haybale:    { w: 84,  h: 56,  ground: true },
  puddle:     { w: 120, h: 10,  ground: true, splash: true },
  dog:        { w: 76,  h: 52,  ground: true, extra: 90 },
  cart:       { w: 130, h: 78,  ground: true },
  sign:       { w: 120, h: 72,  top: GROUND_Y - 120 },
  knife:      { w: 64,  h: 30,  top: GROUND_Y - 80, extra: 55 },
  oven:       { w: 110, h: 110, ground: true },
  potrack:    { w: 130, h: 74,  top: GROUND_Y - 122 },
  rollingpin: { w: 90,  h: 34,  ground: true, extra: 60 },
  steampot:   { w: 80,  h: 70,  ground: true },
};

export function makeObstacle(kind, x, rng) {
  const def = OBSTACLE_DEFS[kind];
  return {
    kind,
    x,
    w: def.w,
    h: def.h,
    top: def.ground ? GROUND_Y - def.h : def.top,
    extra: def.extra || 0,
    splash: Boolean(def.splash),
    spin: 0,
    phase: rng ? rng() * Math.PI * 2 : 0,
    runPhase: rng ? rng() * Math.PI * 2 : 0,
    hit: false,
  };
}

export function stageIndexFor(distance) {
  let index = 0;
  for (let i = 0; i < STAGES.length; i += 1) {
    if (distance >= STAGES[i].from) index = i;
  }
  return index;
}

// Where the farmer is drawn: off-screen left at full gap, at the turkey's
// tail feathers when the gap runs out.
export function farmerXFor(gap) {
  const caughtX = TURKEY_X - 80;
  return -170 + ((100 - gap) / 100) * (caughtX + 170);
}

export function createWorld(seed = 1) {
  return {
    rng: makeRng(seed),
    time: 0,
    distance: 0,          // metres
    px: 0,                // total pixels scrolled (drives parallax)
    speed: BASE_SPEED,
    stageIndex: 0,
    banner: null,         // { text, t } stage announcement
    feathers: MAX_FEATHERS,
    gap: GAP_START,
    spotted: false,
    corn: 0,
    golden: 0,
    finished: null,       // null | 'caught' | 'escaped'
    turkey: {
      feetY: GROUND_Y,
      vy: 0,
      jumps: 0,
      ducking: false,
      invuln: 0,
      flapT: 0,           // wing-up timer after a flap jump
      runPhase: 0,
    },
    farmerRunPhase: 0,
    dash: { t: 0, cd: 0 },
    dip: { t: 0 },
    obstacles: [],
    corns: [],            // { x, y, golden, taken }
    leaves: [],           // { x, y, rot, vr, color }
    spawnIn: 500,         // px of travel before the next obstacle
    nextGoldenM: 700,     // distance of the next golden cob
    events: [],
  };
}

export function scoreOf(world) {
  return Math.floor(world.distance) + world.corn * CORN_POINTS + world.golden * GOLDEN_POINTS;
}

function emit(world, name) {
  world.events.push(name);
}

function spawnObstacle(world) {
  const stage = STAGES[world.stageIndex];
  const kind = pick(world.rng, stage.kinds);
  const ob = makeObstacle(kind, VIEW_W + 40, world.rng);
  world.obstacles.push(ob);

  // Corn often rewards the jump: an arc over the obstacle, or a low line
  // in the clear ground after it.
  const roll = world.rng();
  if (roll < 0.5 && !ob.splash && ob.top > GROUND_Y - 200) {
    const cx = ob.x + ob.w / 2;
    for (let i = 0; i < 5; i += 1) {
      const t = i / 4;
      world.corns.push({
        x: cx - 90 + t * 180,
        y: GROUND_Y - 60 - Math.sin(t * Math.PI) * 110,
        golden: false,
        taken: false,
      });
    }
  } else if (roll < 0.8) {
    const startX = ob.x + ob.w + 150;
    for (let i = 0; i < 4; i += 1) {
      world.corns.push({ x: startX + i * 46, y: GROUND_Y - 44, golden: false, taken: false });
    }
  }

  // The next gap always leaves room to land and react.
  world.spawnIn = world.speed * range(world.rng, 0.95, 1.35) + range(world.rng, 0, 200);
}

function turkeyBox(world) {
  const t = world.turkey;
  const h = t.ducking ? TURKEY_DUCK_H : TURKEY_H;
  return {
    x0: TURKEY_X + 12,
    x1: TURKEY_X + TURKEY_W - 12,
    y0: t.feetY - h + 6,
    y1: t.feetY - 2,
  };
}

function overlaps(a, b) {
  return a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
}

export function updateWorld(world, dt, actions) {
  const t = world.turkey;
  world.time += dt;

  // ---- speed: base creep, dash burst, stumble dip
  if (world.dash.t > 0) world.dash.t -= dt;
  if (world.dash.cd > 0) world.dash.cd -= dt;
  if (world.dip.t > 0) world.dip.t -= dt;
  const base = Math.min(MAX_SPEED, BASE_SPEED + (world.distance / 100) * SPEED_PER_100M);
  world.speed = world.dash.t > 0 ? base * DASH_MULT : world.dip.t > 0 ? base * DIP_MULT : base;

  // ---- turkey vertical movement
  const grounded = t.feetY >= GROUND_Y;
  if (actions.jumpPressed) {
    if (grounded) {
      t.vy = JUMP_V;
      t.jumps = 1;
      emit(world, 'jump');
    } else if (t.jumps < 2) {
      t.vy = FLAP_V;
      t.jumps = 2;
      t.flapT = 0.3;
      emit(world, 'flap');
    }
  }
  t.vy += GRAVITY * dt;
  if (actions.duckHeld && !grounded) t.vy = Math.max(t.vy, DUCK_FALL);
  t.vy = Math.min(t.vy, MAX_FALL);
  t.feetY += t.vy * dt;
  if (t.feetY >= GROUND_Y) {
    t.feetY = GROUND_Y;
    t.vy = 0;
    t.jumps = 0;
  }
  t.ducking = actions.duckHeld && t.feetY >= GROUND_Y;
  if (t.invuln > 0) t.invuln -= dt;
  if (t.flapT > 0) t.flapT -= dt;
  t.runPhase += dt * world.speed * 0.05;
  world.farmerRunPhase += dt * world.speed * 0.045;

  // ---- dash
  if (actions.dashPressed && world.dash.cd <= 0 && world.dash.t <= 0) {
    world.dash.t = DASH_TIME;
    world.dash.cd = DASH_COOLDOWN;
    world.gap = Math.min(100, world.gap + GAP_DASH);
    emit(world, 'dash');
  }

  // ---- travel
  const step = world.speed * dt;
  world.px += step;
  world.distance += step / PX_PER_METER;

  // ---- pursuit
  if (world.dip.t <= 0) world.gap = Math.min(100, world.gap + GAP_RECOVER * dt);
  if (!world.spotted && world.gap < GAP_SPOTTED) {
    world.spotted = true;
    emit(world, 'spotted');
  }
  if (world.gap <= 0) {
    world.finished = 'caught';
    emit(world, 'caught');
    return;
  }

  // ---- stages and the finish
  const stageNow = stageIndexFor(world.distance);
  if (stageNow !== world.stageIndex) {
    world.stageIndex = stageNow;
    world.banner = { text: `STAGE ${stageNow + 1} — ${STAGES[stageNow].name}`, t: 2.2 };
    emit(world, 'stage');
  }
  if (world.banner) {
    world.banner.t -= dt;
    if (world.banner.t <= 0) world.banner = null;
  }
  if (world.distance >= FINISH_M) {
    world.finished = 'escaped';
    emit(world, 'escaped');
    return;
  }

  // ---- spawning
  world.spawnIn -= step;
  if (world.spawnIn <= 0 && world.distance < FINISH_M - 60) spawnObstacle(world);
  if (world.distance >= world.nextGoldenM) {
    world.corns.push({ x: VIEW_W + 80, y: GROUND_Y - 150, golden: true, taken: false });
    world.nextGoldenM = world.distance + intRange(world.rng, 650, 950);
  }

  // ---- move the world past the turkey
  for (const ob of world.obstacles) {
    ob.x -= step + ob.extra * dt;
    ob.spin += dt * 6;
    ob.runPhase += dt * (world.speed + ob.extra) * 0.05;
  }
  world.obstacles = world.obstacles.filter((ob) => ob.x + ob.w > -220);
  for (const cob of world.corns) cob.x -= step;
  world.corns = world.corns.filter((cob) => !cob.taken && cob.x > -80);

  // ---- falling leaves, pure decoration
  if (world.rng() < dt * 1.6 && world.leaves.length < 14) {
    world.leaves.push({
      x: VIEW_W + 20,
      y: range(world.rng, 20, 320),
      rot: range(world.rng, 0, 6.28),
      vr: range(world.rng, -2, 2),
      color: pick(world.rng, ['#d98a3d', '#b03a2e', '#e8c96a']),
    });
  }
  for (const leaf of world.leaves) {
    leaf.x -= step * 0.7 + 30 * dt;
    leaf.y += 46 * dt + Math.sin(world.time * 2 + leaf.rot) * 18 * dt;
    leaf.rot += leaf.vr * dt;
  }
  world.leaves = world.leaves.filter((leaf) => leaf.x > -30 && leaf.y < GROUND_Y + 30);

  // ---- collisions
  const box = turkeyBox(world);
  for (const ob of world.obstacles) {
    const obBox = { x0: ob.x + 6, x1: ob.x + ob.w - 6, y0: ob.top + 4, y1: ob.top + ob.h };
    if (!overlaps(box, obBox)) continue;
    if (ob.splash) {
      if (!ob.hit && t.feetY >= GROUND_Y - 4) {
        ob.hit = true;
        world.dip.t = DIP_TIME;
        world.gap -= GAP_PUDDLE;
        emit(world, 'splash');
      }
      continue;
    }
    if (t.invuln > 0 || ob.hit) continue;
    ob.hit = true;
    world.feathers -= 1;
    world.gap -= GAP_HIT;
    world.dip.t = DIP_TIME;
    t.invuln = INVULN_TIME;
    emit(world, 'hit');
    if (world.feathers <= 0 || world.gap <= 0) {
      world.finished = 'caught';
      emit(world, 'caught');
      return;
    }
  }

  for (const cob of world.corns) {
    if (cob.taken) continue;
    const cobBox = { x0: cob.x - 10, x1: cob.x + 10, y0: cob.y - 14, y1: cob.y + 14 };
    if (!overlaps(box, cobBox)) continue;
    cob.taken = true;
    if (cob.golden) {
      world.golden += 1;
      world.feathers = Math.min(MAX_FEATHERS, world.feathers + 1);
      emit(world, 'golden');
    } else {
      world.corn += 1;
      emit(world, 'corn');
    }
  }
}

// The Freedom Gate's screen x while the turkey closes in on it.
export function gateXFor(world) {
  const remainingPx = (FINISH_M - world.distance) * PX_PER_METER;
  return TURKEY_X + remainingPx;
}
