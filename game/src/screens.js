// screens.js — everything the player reads: the play scene assembly, the
// HUD, the title screen, the pause and end screens, stage banners and the
// on-screen touch buttons. Drawing the world itself is art.js's job.

import {
  drawBackdrop, drawCorn, drawDog, drawFarmer, drawFeatherIcon, drawGate,
  drawGround, drawLeaf, drawObstacle, drawTurkey,
} from './art.js';
import { BUTTONS } from './input.js';
import {
  DASH_COOLDOWN, FINISH_M, GROUND_Y, MAX_FEATHERS, PALETTE, STAGES,
  TURKEY_X, VIEW_H, VIEW_W,
} from './settings.js';
import { farmerXFor, gateXFor, scoreOf } from './world.js';

const FONT = '"Trebuchet MS", Verdana, sans-serif';

// Bold text with a dark outline, readable over any backdrop.
function text(ctx, str, x, y, size, color = PALETTE.cream, align = 'center') {
  ctx.font = `bold ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.lineWidth = Math.max(3, size / 7);
  ctx.strokeStyle = 'rgba(58,36,19,0.85)';
  ctx.strokeText(str, x, y);
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

function panel(ctx, x, y, w, h) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 18);
  ctx.fillStyle = 'rgba(43,26,16,0.78)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,246,224,0.5)';
  ctx.lineWidth = 2;
  ctx.stroke();
}

// ------------------------------------------------------------ play scene

export function renderPlay(ctx, world, opts = {}) {
  const stage = STAGES[world.stageIndex];
  drawBackdrop(ctx, stage, world.stageIndex, world.px, world.time);

  // The Freedom Gate rolls in over the last stretch.
  const gateX = gateXFor(world);
  if (gateX < VIEW_W + 260 && world.finished !== 'escaped') drawGate(ctx, gateX);

  drawGround(ctx, stage, world.stageIndex, world.px);

  for (const cob of world.corns) drawCorn(ctx, cob.x, cob.y, cob.golden, world.time);

  for (const ob of world.obstacles) {
    if (ob.kind === 'dog') drawDog(ctx, ob.x, GROUND_Y, ob.runPhase, world.time);
    else drawObstacle(ctx, ob, world.time);
  }

  // The farmer, closer as the gap shrinks.
  const fx = farmerXFor(world.gap);
  if (fx > -170) drawFarmer(ctx, fx, GROUND_Y, world.farmerRunPhase);

  // The turkey, blinking while invulnerable after a hit.
  const t = world.turkey;
  const blink = t.invuln > 0 && Math.floor(world.time * 12) % 2 === 0;
  ctx.save();
  if (blink) ctx.globalAlpha = 0.35;
  drawTurkey(ctx, TURKEY_X, t.feetY, {
    ducking: t.ducking,
    airborne: t.feetY < GROUND_Y,
    flap: t.flapT > 0 ? Math.min(1, t.flapT / 0.3) : 0,
    runPhase: t.runPhase,
  });
  ctx.restore();

  for (const leaf of world.leaves) drawLeaf(ctx, leaf);

  drawHUD(ctx, world, opts);
  if (world.banner) drawBanner(ctx, world.banner.text, Math.min(1, world.banner.t));
  if (opts.spottedFlash > 0) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, opts.spottedFlash);
    text(ctx, 'SPOTTED!', VIEW_W / 2, 150, 54, '#ff6a4d');
    ctx.restore();
  }
  if (opts.showButtons) drawButtons(ctx, world, opts.duckHeld);
  if (world.distance < 120 && !opts.hideHint) {
    text(ctx, 'SPACE jump (twice = flap)   ·   ↓ duck   ·   → dash', VIEW_W / 2, VIEW_H - 26, 21);
  }
}

function drawHUD(ctx, world, opts) {
  // Score, top left.
  text(ctx, `SCORE ${scoreOf(world)}`, 28, 40, 34, PALETTE.cream, 'left');
  if (opts.best > 0) text(ctx, `BEST ${opts.best}`, 28, 76, 19, '#f3d9a4', 'left');

  // Distance and stage, top centre.
  text(ctx, `${Math.floor(world.distance)} m / ${FINISH_M} m`, VIEW_W / 2, 38, 30);
  text(ctx, STAGES[world.stageIndex].name, VIEW_W / 2, 72, 18, '#f3d9a4');

  // Feathers and corn, top right.
  for (let i = 0; i < MAX_FEATHERS; i += 1) {
    drawFeatherIcon(ctx, VIEW_W - 150 + i * 34, 44, i < world.feathers);
  }
  drawCorn(ctx, VIEW_W - 52, 40, false, world.time);
  text(ctx, `× ${world.corn}`, VIEW_W - 24, 42, 24, PALETTE.cream, 'right');

  // The pursuit bar, bottom left but clear of the DUCK button: it fills
  // red as the farmer closes in.
  const barX = 176;
  const barY = VIEW_H - 58;
  const barW = 240;
  text(ctx, 'FARMER', barX, barY - 16, 17, '#ffb59a', 'left');
  ctx.beginPath();
  ctx.roundRect(barX, barY, barW, 18, 9);
  ctx.fillStyle = 'rgba(43,26,16,0.6)';
  ctx.fill();
  const danger = (100 - world.gap) / 100;
  if (danger > 0.02) {
    ctx.beginPath();
    ctx.roundRect(barX + 2, barY + 2, (barW - 4) * danger, 14, 7);
    ctx.fillStyle = danger > 0.75 ? '#e8452e' : danger > 0.5 ? '#f07b2e' : '#e8a81c';
    ctx.fill();
  }
  ctx.strokeStyle = 'rgba(255,246,224,0.7)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(barX, barY, barW, 18, 9);
  ctx.stroke();

  // Dash recharge, under the pursuit bar.
  const dashReady = world.dash.cd <= 0;
  text(ctx, dashReady ? 'DASH READY →' : 'DASH …', barX, barY + 38, 16, dashReady ? '#ffe066' : '#c9b18a', 'left');
  if (opts.muted) text(ctx, 'SOUND OFF (M)', VIEW_W - 28, VIEW_H - 30, 16, '#c9b18a', 'right');
}

function drawBanner(ctx, str, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  panel(ctx, VIEW_W / 2 - 330, 108, 660, 64);
  text(ctx, str, VIEW_W / 2, 141, 34, '#ffe066');
  ctx.restore();
}

function drawButtons(ctx, world, duckHeld) {
  for (const b of BUTTONS) {
    const isDuck = b.id === 'duck' && duckHeld;
    const dashCooling = b.id === 'dash' && world.dash.cd > 0;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fillStyle = isDuck ? 'rgba(255,224,102,0.5)' : 'rgba(43,26,16,0.38)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,246,224,0.75)';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    if (dashCooling) {
      const frac = 1 - world.dash.cd / DASH_COOLDOWN;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r - 5, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
      ctx.strokeStyle = '#ffe066';
      ctx.lineWidth = 4;
      ctx.stroke();
    }
    text(ctx, b.label, b.x, b.y + 1, 17);
  }
}

// ---------------------------------------------------------------- title

export function drawTitle(ctx, time, best) {
  const stage = STAGES[0];
  const scroll = time * 140;
  drawBackdrop(ctx, stage, 0, scroll, time);
  drawGround(ctx, stage, 0, scroll);

  // A little staged chase behind the words.
  drawObstacle(ctx, { kind: 'fence', x: 830, w: 70, h: 64, top: GROUND_Y - 64, spin: 0, phase: 0 }, time);
  drawCorn(ctx, 880, GROUND_Y - 120, false, time);
  drawCorn(ctx, 920, GROUND_Y - 140, false, time);
  drawCorn(ctx, 960, GROUND_Y - 120, true, time);
  drawFarmer(ctx, 250, GROUND_Y, time * 9);
  drawTurkey(ctx, 470, GROUND_Y, { runPhase: time * 10 });

  text(ctx, 'TURKEY RUN', VIEW_W / 2, 150, 96, '#ffe066');
  text(ctx, '— THANKSGIVING BREAKOUT —', VIEW_W / 2, 222, 32, '#ffb59a');
  text(ctx, 'Outrun the farmer. Dodge the oven. Reach the Freedom Gate!', VIEW_W / 2, 272, 25);

  panel(ctx, VIEW_W / 2 - 430, 320, 860, 128);
  text(ctx, 'SPACE / ↑  jump — press again mid-air to flap', VIEW_W / 2, 352, 23);
  text(ctx, '↓  duck under signs and flying knives      →  dash away', VIEW_W / 2, 388, 23);
  text(ctx, 'Grab corn for points. Golden corn restores a feather. 3 feathers, then dinner.', VIEW_W / 2, 424, 21, '#f3d9a4');

  if (best > 0) text(ctx, `BEST SCORE  ${best}`, VIEW_W / 2, 486, 24, '#ffe066');
  if (Math.floor(time * 1.6) % 2 === 0) {
    text(ctx, 'PRESS SPACE OR CLICK TO RUN', VIEW_W / 2, 548, 32, '#ffffff');
  }
  text(ctx, 'P pause · M mute', VIEW_W / 2, VIEW_H - 28, 17, '#c9b18a');
}

// ------------------------------------------------------------------ end

export function drawEnd(ctx, world, best, isNewBest) {
  const stage = STAGES[world.stageIndex];
  drawBackdrop(ctx, stage, world.stageIndex, world.px, world.time);
  drawGround(ctx, stage, world.stageIndex, world.px);

  const escaped = world.finished === 'escaped';
  if (escaped) {
    drawGate(ctx, TURKEY_X + 150);
    drawTurkey(ctx, TURKEY_X, GROUND_Y - 30, { airborne: true, flap: 1, runPhase: world.time * 8 });
  } else {
    // The farmer, net down, and one very unlucky bird.
    drawTurkey(ctx, TURKEY_X, GROUND_Y, { ducking: true, runPhase: 0 });
    drawFarmer(ctx, TURKEY_X - 74, GROUND_Y, 0, true);
  }

  // Dim the scene behind the result panel.
  ctx.fillStyle = 'rgba(43,26,16,0.35)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  text(ctx, escaped ? 'YOU ESCAPED!' : 'CAUGHT!', VIEW_W / 2, 150, 76, escaped ? '#ffe066' : '#ff6a4d');
  text(
    ctx,
    escaped ? 'The woods are yours. Thanksgiving is cancelled.' : 'The farmer wins this year. Dinner is at six.',
    VIEW_W / 2, 208, 25,
  );

  panel(ctx, VIEW_W / 2 - 280, 248, 560, 252);
  const rows = [
    ['Distance', `${Math.floor(world.distance)} m`],
    ['Corn gathered', `${world.corn}`],
    ['Golden corn', `${world.golden}`],
    ['Feathers left', `${Math.max(0, world.feathers)}`],
  ];
  rows.forEach(([label, value], i) => {
    text(ctx, label, VIEW_W / 2 - 240, 292 + i * 40, 23, '#f3d9a4', 'left');
    text(ctx, value, VIEW_W / 2 + 240, 292 + i * 40, 23, PALETTE.cream, 'right');
  });
  text(ctx, 'TOTAL SCORE', VIEW_W / 2 - 240, 462, 27, '#ffe066', 'left');
  text(ctx, `${scoreOf(world)}`, VIEW_W / 2 + 240, 462, 27, '#ffe066', 'right');

  if (isNewBest) text(ctx, '★ NEW BEST! ★', VIEW_W / 2, 540, 28, '#ffe066');
  else if (best > 0) text(ctx, `BEST  ${best}`, VIEW_W / 2, 540, 22, '#f3d9a4');
  if (Math.floor(world.time * 1.6) % 2 === 0) {
    text(ctx, 'PRESS R OR CLICK TO RUN AGAIN', VIEW_W / 2, 592, 28, '#ffffff');
  }
}

export function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(43,26,16,0.55)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  text(ctx, 'PAUSED', VIEW_W / 2, VIEW_H / 2 - 30, 64, '#ffe066');
  text(ctx, 'The farmer waits. Press P to keep running.', VIEW_W / 2, VIEW_H / 2 + 30, 24);
}
