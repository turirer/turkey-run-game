// art.js — every picture in the game is drawn here with canvas paths.
// No image files: the turkey, the farmer, the dog, the obstacles and the
// three backdrops are all vector shapes in an autumn palette.
//
// Characters are drawn facing right, with (x, feetY) as the anchor: x is
// the left edge of the character's box and feetY is where its feet land.

import { GROUND_Y, PALETTE, VIEW_H, VIEW_W } from './settings.js';

function ellipse(ctx, cx, cy, rx, ry, color, rot = 0) {
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, rot, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

function rect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function roundRect(ctx, x, y, w, h, r, color) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function line(ctx, x1, y1, x2, y2, color, width = 3) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.stroke();
}

// ---------------------------------------------------------------- turkey

export function drawTurkey(ctx, x, feetY, pose) {
  const { ducking = false, airborne = false, flap = 0, runPhase = 0 } = pose;
  ctx.save();
  ctx.translate(x, feetY);
  if (ducking) {
    // Crouch: squash toward the ground, head stretched forward.
    ctx.translate(0, 2);
    ctx.scale(1.08, 0.7);
  }

  // Tail fan: five feathers fanned behind the body.
  const tailColors = [PALETTE.tailC, PALETTE.tailA, PALETTE.tailB, PALETTE.tailA, PALETTE.tailC];
  for (let i = 0; i < 5; i += 1) {
    const angle = -2.35 + i * 0.34; // pointing up-left, spread wide
    ctx.save();
    ctx.translate(12, -30);
    ctx.rotate(angle);
    ellipse(ctx, 0, -15, 6, 16, tailColors[i]);
    ellipse(ctx, 0, -26, 4.5, 6, PALETTE.cream);
    ctx.restore();
  }

  // Legs (behind the body), swinging with the run cycle.
  const swing = airborne ? 0 : Math.sin(runPhase) * 9;
  const legColor = '#c97e2e';
  const footY = airborne ? -7 : 0;
  line(ctx, 26, -14, 26 + swing, footY, legColor, 3.5);
  line(ctx, 38, -14, 38 - swing, footY, legColor, 3.5);
  line(ctx, 26 + swing, footY, 31 + swing, footY, legColor, 3);
  line(ctx, 38 - swing, footY, 43 - swing, footY, legColor, 3);

  // Body and belly.
  ellipse(ctx, 32, -27, 25, 18, PALETTE.turkeyBody);
  ellipse(ctx, 36, -20, 17, 11, PALETTE.turkeyBelly);

  // Wing: tucked while running, thrown up on the flap jump.
  ctx.save();
  ctx.translate(26, -32);
  ctx.rotate(-flap * 1.9 + (airborne ? -0.3 : 0.15));
  ellipse(ctx, 8, 4, 15, 8, PALETTE.turkeyDark, 0.5);
  ellipse(ctx, 10, 2, 10, 5, PALETTE.turkeyBody, 0.5);
  ctx.restore();

  // Neck and head, stretched forward when ducking.
  const headX = ducking ? 58 : 53;
  const headY = ducking ? -34 : -47;
  line(ctx, 46, -34, headX - 2, headY + 4, PALETTE.turkeyBody, 9);
  ellipse(ctx, headX, headY, 10, 9, '#7d8b99');
  // Wattle and beak.
  ellipse(ctx, headX + 6, headY + 8, 3.5, 6, PALETTE.wattle);
  ctx.beginPath();
  ctx.moveTo(headX + 7, headY - 3);
  ctx.lineTo(headX + 19, headY + 1);
  ctx.lineTo(headX + 7, headY + 5);
  ctx.closePath();
  ctx.fillStyle = PALETTE.beak;
  ctx.fill();
  // Eye, wide with worry, plus a raised brow.
  ellipse(ctx, headX + 3, headY - 2, 3.6, 3.6, '#ffffff');
  ellipse(ctx, headX + 4, headY - 2, 1.8, 1.8, PALETTE.ink);
  line(ctx, headX - 1, headY - 8, headX + 7, headY - 6, PALETTE.ink, 2);

  ctx.restore();
}

// ---------------------------------------------------------------- farmer

export function drawFarmer(ctx, x, feetY, runPhase, netDown = false) {
  ctx.save();
  ctx.translate(x, feetY);
  const swing = Math.sin(runPhase) * 11;

  // Legs in overalls, boots at the ends.
  line(ctx, 26, -40, 26 + swing, -2, PALETTE.overalls, 8);
  line(ctx, 38, -40, 38 - swing, -2, PALETTE.overalls, 8);
  rect(ctx, 20 + swing, -5, 13, 5, PALETTE.ink);
  rect(ctx, 32 - swing, -5, 13, 5, PALETTE.ink);

  // Torso: plaid shirt with an overalls bib over it.
  roundRect(ctx, 16, -74, 34, 38, 8, PALETTE.farmerShirt);
  line(ctx, 24, -74, 24, -38, PALETTE.farmerShirtDark, 3);
  line(ctx, 42, -74, 42, -38, PALETTE.farmerShirtDark, 3);
  line(ctx, 16, -58, 50, -58, PALETTE.farmerShirtDark, 3);
  roundRect(ctx, 22, -56, 22, 20, 4, PALETTE.overalls);
  rect(ctx, 24, -74, 5, 18, PALETTE.overalls);
  rect(ctx, 37, -74, 5, 18, PALETTE.overalls);

  // Head, straw hat, and a face that means business.
  ellipse(ctx, 34, -84, 11, 11, PALETTE.skin);
  ellipse(ctx, 34, -92, 19, 4.5, PALETTE.hat);
  ctx.beginPath();
  ctx.arc(34, -92, 10, Math.PI, 0);
  ctx.fillStyle = PALETTE.hat;
  ctx.fill();
  ellipse(ctx, 39, -84, 1.8, 1.8, PALETTE.ink);
  line(ctx, 35, -89, 43, -87, PALETTE.ink, 2);
  ctx.beginPath();
  ctx.arc(40, -74, 4, Math.PI * 1.15, Math.PI * 1.85);
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Arm out front, swinging a catching net.
  const netX = netDown ? 66 : 78;
  const netY = netDown ? -18 : -52;
  line(ctx, 44, -66, netX - 14, netY + 4, PALETTE.farmerShirt, 7);
  line(ctx, netX - 14, netY + 4, netX, netY, PALETTE.woodDark, 4);
  ctx.beginPath();
  ctx.arc(netX + 8, netY - 2, 14, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,246,224,0.35)';
  ctx.fill();
  ctx.strokeStyle = PALETTE.woodDark;
  ctx.lineWidth = 3;
  ctx.stroke();
  line(ctx, netX - 2, netY - 12, netX + 16, netY + 8, 'rgba(58,36,19,0.5)', 1.5);
  line(ctx, netX + 16, netY - 12, netX - 2, netY + 8, 'rgba(58,36,19,0.5)', 1.5);

  ctx.restore();
}

// ------------------------------------------------------------------- dog

export function drawDog(ctx, x, feetY, runPhase, time) {
  ctx.save();
  ctx.translate(x, feetY);
  const swing = Math.sin(runPhase) * 7;

  // Tail wagging, ears flapping.
  const wag = Math.sin(time * 12) * 4;
  line(ctx, 8, -30, -4, -42 + wag, PALETTE.dogDark, 5);
  // Legs.
  line(ctx, 20, -16, 20 + swing, 0, PALETTE.dogDark, 5);
  line(ctx, 30, -16, 30 - swing, 0, PALETTE.dogDark, 5);
  line(ctx, 48, -16, 48 - swing, 0, PALETTE.dogDark, 5);
  line(ctx, 58, -16, 58 + swing, 0, PALETTE.dogDark, 5);
  // Body and head.
  ellipse(ctx, 38, -27, 27, 14, PALETTE.dog);
  ellipse(ctx, 64, -36, 11, 10, PALETTE.dog);
  ellipse(ctx, 58, -42, 5, 9, PALETTE.dogDark, 0.4 + Math.sin(time * 10) * 0.15);
  roundRect(ctx, 70, -38, 12, 7, 3, PALETTE.dog);
  ellipse(ctx, 82, -35, 3, 2.5, PALETTE.ink);
  ellipse(ctx, 66, -39, 2, 2, PALETTE.ink);
  // Tongue out, collar on.
  rect(ctx, 74, -31, 7, 4, '#e88a9a');
  rect(ctx, 56, -33, 5, 12, PALETTE.wattle);

  ctx.restore();
}

// ------------------------------------------------------------------ corn

export function drawCorn(ctx, cx, cy, golden, time) {
  ctx.save();
  ctx.translate(cx, cy);
  const bob = Math.sin(time * 3 + cx * 0.05) * 2;
  ctx.translate(0, bob);
  // Husk leaves.
  ellipse(ctx, -6, 8, 5, 9, PALETTE.husk, -0.5);
  ellipse(ctx, 6, 8, 5, 9, PALETTE.husk, 0.5);
  // Cob with kernel dots.
  roundRect(ctx, -6, -13, 12, 24, 5, golden ? '#ffe066' : PALETTE.corn);
  ctx.fillStyle = PALETTE.cornDark;
  for (let r = 0; r < 4; r += 1) {
    for (let c = 0; c < 3; c += 1) {
      ctx.beginPath();
      ctx.arc(-3.5 + c * 3.5, -8 + r * 5.5, 1.1, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (golden) {
    // A four-point sparkle so the rare cob reads at a glance.
    ctx.fillStyle = '#fff6e0';
    const s = 5 + Math.sin(time * 6) * 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -13 - s);
    ctx.lineTo(2, -11);
    ctx.lineTo(s, -9);
    ctx.lineTo(2, -7);
    ctx.lineTo(0, -5 + s * 0.4);
    ctx.lineTo(-2, -7);
    ctx.lineTo(-s, -9);
    ctx.lineTo(-2, -11);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

// ------------------------------------------------------------- obstacles

function drawFence(ctx, ob) {
  const { x, w, h } = ob;
  const top = GROUND_Y - h;
  rect(ctx, x + 4, top, 9, h, PALETTE.woodDark);
  rect(ctx, x + w - 13, top, 9, h, PALETTE.woodDark);
  rect(ctx, x, top + 8, w, 10, PALETTE.wood);
  rect(ctx, x, top + h - 20, w, 10, PALETTE.wood);
  ellipse(ctx, x + 8, top + 13, 1.6, 1.6, PALETTE.ink);
  ellipse(ctx, x + w - 8, top + 13, 1.6, 1.6, PALETTE.ink);
}

function drawHaybale(ctx, ob) {
  const { x, w, h } = ob;
  const top = GROUND_Y - h;
  roundRect(ctx, x, top, w, h, 14, PALETTE.straw);
  ctx.strokeStyle = '#c9a44a';
  ctx.lineWidth = 3;
  for (let i = 1; i <= 3; i += 1) {
    ctx.beginPath();
    ctx.arc(x + w / 2, top + h / 2, i * 7, 0.4, Math.PI * 1.7);
    ctx.stroke();
  }
  line(ctx, x + 10, top + 4, x + 10, top + h - 4, '#b03a2e', 4);
  line(ctx, x + w - 10, top + 4, x + w - 10, top + h - 4, '#b03a2e', 4);
}

function drawPuddle(ctx, ob, time) {
  const { x, w } = ob;
  ellipse(ctx, x + w / 2, GROUND_Y - 3, w / 2, 8, PALETTE.puddle);
  ellipse(ctx, x + w / 2 - 12, GROUND_Y - 5, w / 4, 3.5, '#bcdcf2');
  const ripple = (time * 30 + x) % 26;
  ctx.beginPath();
  ctx.ellipse(x + w / 2 + 14, GROUND_Y - 3, ripple, ripple * 0.25, 0, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawCart(ctx, ob) {
  const { x, w, h } = ob;
  const top = GROUND_Y - h;
  // Pumpkins riding on top.
  ellipse(ctx, x + 34, top + 6, 15, 11, '#e07b2e');
  ellipse(ctx, x + 62, top + 4, 17, 12, '#d96f26');
  rect(ctx, x + 60, top - 10, 5, 8, PALETTE.husk);
  // Bed and planks.
  roundRect(ctx, x, top + 12, w, 34, 4, PALETTE.wood);
  line(ctx, x, top + 24, x + w, top + 24, PALETTE.woodDark, 3);
  line(ctx, x, top + 36, x + w, top + 36, PALETTE.woodDark, 3);
  // Handles trailing behind.
  line(ctx, x + w, top + 26, x + w + 26, top + 40, PALETTE.woodDark, 5);
  // Wheels with spokes, turning as it rolls.
  for (const wx of [x + 26, x + w - 26]) {
    ctx.beginPath();
    ctx.arc(wx, GROUND_Y - 16, 16, 0, Math.PI * 2);
    ctx.fillStyle = PALETTE.woodDark;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(wx, GROUND_Y - 16, 6, 0, Math.PI * 2);
    ctx.fillStyle = PALETTE.straw;
    ctx.fill();
    for (let s = 0; s < 3; s += 1) {
      const a = ob.spin + s * (Math.PI * 2 / 3);
      line(ctx, wx, GROUND_Y - 16, wx + Math.cos(a) * 14, GROUND_Y - 16 + Math.sin(a) * 14, PALETTE.straw, 3);
    }
  }
}

function drawSign(ctx, ob) {
  const { x, w, top, h } = ob;
  // Post rising out of frame, board hanging at head height.
  rect(ctx, x + w - 10, 0, 10, top + h, PALETTE.woodDark);
  roundRect(ctx, x, top, w, h, 6, PALETTE.wood);
  ctx.strokeStyle = PALETTE.woodDark;
  ctx.lineWidth = 3;
  ctx.strokeRect(x + 4, top + 4, w - 8, h - 8);
  ctx.fillStyle = PALETTE.cream;
  ctx.font = 'bold 21px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('DINNER →', x + w / 2, top + h / 2 + 1);
}

function drawKnife(ctx, ob, time) {
  const cx = ob.x + ob.w / 2;
  const cy = ob.top + ob.h / 2;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(Math.sin(time * 9 + ob.phase) * 0.5 - 0.4);
  // Blade.
  ctx.beginPath();
  ctx.moveTo(-34, 0);
  ctx.lineTo(8, -7);
  ctx.lineTo(8, 7);
  ctx.closePath();
  ctx.fillStyle = PALETTE.steel;
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-34, 0);
  ctx.lineTo(8, 7);
  ctx.lineTo(8, 3);
  ctx.closePath();
  ctx.fillStyle = PALETTE.steelDark;
  ctx.fill();
  // Handle.
  roundRect(ctx, 8, -4, 24, 8, 3, PALETTE.woodDark);
  ctx.restore();
}

function drawOven(ctx, ob) {
  const { x, w, h } = ob;
  const top = GROUND_Y - h;
  roundRect(ctx, x, top, w, h, 8, PALETTE.ovenBody);
  // Door window with the glow inside.
  const grad = ctx.createLinearGradient(0, top + 30, 0, top + h - 14);
  grad.addColorStop(0, '#3a2413');
  grad.addColorStop(1, PALETTE.ovenGlow);
  ctx.fillStyle = grad;
  ctx.fillRect(x + 14, top + 32, w - 28, h - 48);
  rect(ctx, x + 10, top + 22, w - 20, 6, PALETTE.steelDark);
  // Knobs and the temperature dial.
  for (let i = 0; i < 3; i += 1) ellipse(ctx, x + 22 + i * 26, top + 12, 6, 6, PALETTE.steel);
  ctx.fillStyle = PALETTE.cream;
  ctx.font = 'bold 15px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('350°', x + w / 2, top + h - 4);
}

function drawPotrack(ctx, ob) {
  const { x, w, top } = ob;
  rect(ctx, x - 6, top, w + 12, 7, PALETTE.woodDark);
  const pots = [[10, 34], [52, 44], [96, 30]];
  for (const [off, ph] of pots) {
    line(ctx, x + off + 12, top + 7, x + off + 12, top + 16, PALETTE.steelDark, 2.5);
    roundRect(ctx, x + off, top + 16, 24, ph, 4, PALETTE.steelDark);
    rect(ctx, x + off - 2, top + 13, 28, 5, PALETTE.steel);
  }
}

function drawRollingPin(ctx, ob) {
  const { x, w, h } = ob;
  const cy = GROUND_Y - h / 2;
  roundRect(ctx, x + 14, cy - h / 2, w - 28, h, h / 2, '#e3c298');
  roundRect(ctx, x, cy - 5, 16, 10, 5, PALETTE.wood);
  roundRect(ctx, x + w - 16, cy - 5, 16, 10, 5, PALETTE.wood);
  // Rolling stripes.
  ctx.save();
  ctx.beginPath();
  ctx.rect(x + 14, cy - h / 2, w - 28, h);
  ctx.clip();
  for (let i = 0; i < 4; i += 1) {
    const sx = x + 14 + ((i * 22 + (ob.spin * 20) % 22) % (w - 28));
    line(ctx, sx, cy - h / 2, sx, cy + h / 2, '#cfa06e', 4);
  }
  ctx.restore();
}

function drawSteamPot(ctx, ob, time) {
  const { x, w, h } = ob;
  const top = GROUND_Y - h;
  // Steam puffs rising and fading.
  for (let i = 0; i < 3; i += 1) {
    const rise = ((time * 26 + i * 18) % 44);
    ctx.globalAlpha = 0.55 * (1 - rise / 44);
    ellipse(ctx, x + w / 2 + Math.sin(time * 2 + i * 2) * 6, top - 6 - rise, 9 + rise * 0.22, 7 + rise * 0.16, '#ffffff');
  }
  ctx.globalAlpha = 1;
  roundRect(ctx, x, top, w, h, 8, '#6e6259');
  rect(ctx, x - 4, top - 6, w + 8, 9, PALETTE.steelDark);
  ellipse(ctx, x + w / 2, top - 10, 6, 4, PALETTE.ink);
  rect(ctx, x + 8, top + 16, w - 16, 4, PALETTE.steel);
}

export function drawObstacle(ctx, ob, time) {
  switch (ob.kind) {
    case 'fence': drawFence(ctx, ob); break;
    case 'haybale': drawHaybale(ctx, ob); break;
    case 'puddle': drawPuddle(ctx, ob, time); break;
    case 'cart': drawCart(ctx, ob); break;
    case 'sign': drawSign(ctx, ob); break;
    case 'knife': drawKnife(ctx, ob, time); break;
    case 'oven': drawOven(ctx, ob); break;
    case 'potrack': drawPotrack(ctx, ob); break;
    case 'rollingpin': drawRollingPin(ctx, ob); break;
    case 'steampot': drawSteamPot(ctx, ob, time); break;
    default: break;
  }
}

// ------------------------------------------------------------ backdrops

function barnSilhouette(ctx, x, baseY, scale, color) {
  ctx.save();
  ctx.translate(x, baseY);
  ctx.scale(scale, scale);
  ctx.fillStyle = color;
  ctx.fillRect(0, -90, 150, 90);
  ctx.beginPath();
  ctx.moveTo(-10, -90);
  ctx.lineTo(40, -130);
  ctx.lineTo(110, -130);
  ctx.lineTo(160, -90);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(165, -140, 26, 140);
  ctx.beginPath();
  ctx.arc(178, -140, 13, Math.PI, 0);
  ctx.fill();
  ctx.restore();
}

function treeShape(ctx, x, baseY, scale, color) {
  ctx.save();
  ctx.translate(x, baseY);
  ctx.scale(scale, scale);
  rect(ctx, -4, -46, 8, 46, color);
  ellipse(ctx, 0, -66, 30, 26, color);
  ellipse(ctx, -22, -50, 20, 17, color);
  ellipse(ctx, 22, -50, 20, 17, color);
  ctx.restore();
}

function cloudShape(ctx, x, y, scale, color) {
  ellipse(ctx, x, y, 42 * scale, 15 * scale, color);
  ellipse(ctx, x - 26 * scale, y + 5 * scale, 28 * scale, 11 * scale, color);
  ellipse(ctx, x + 28 * scale, y + 5 * scale, 30 * scale, 12 * scale, color);
}

function farmBackdrop(ctx, stage, scroll, time, dusk) {
  const grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  grad.addColorStop(0, stage.sky[0]);
  grad.addColorStop(1, stage.sky[1]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, VIEW_W, GROUND_Y);

  // Sun, low and warm.
  ellipse(ctx, 1080, 130, 52, 52, dusk ? '#ff9a4d' : '#ffd76a');
  ellipse(ctx, 1080, 130, 70, 70, 'rgba(255,215,106,0.25)');

  // Clouds drifting slower than the world.
  const cloudOff = (scroll * 0.12) % 1500;
  for (let i = 0; i < 3; i += 1) {
    const cx = ((i * 520 + 180 - cloudOff) % 1500 + 1500) % 1500 - 110;
    cloudShape(ctx, cx, 80 + i * 46, 1 + i * 0.25, 'rgba(255,246,224,0.85)');
  }

  // Far layer: barns and trees on the horizon.
  const farOff = (scroll * 0.3) % 1450;
  for (let i = -1; i < 2; i += 1) {
    const bx = i * 1450 - farOff + 120;
    barnSilhouette(ctx, bx, GROUND_Y - 58, 1.15, stage.far);
    treeShape(ctx, bx + 420, GROUND_Y - 56, 1.3, stage.far);
    treeShape(ctx, bx + 980, GROUND_Y - 56, 1.0, stage.far);
  }

  // Mid layer: a fence line and pumpkins, closer and darker.
  const midOff = (scroll * 0.62) % 180;
  ctx.fillStyle = dusk ? '#7c4a26' : '#96682f';
  for (let x = -midOff; x < VIEW_W + 180; x += 180) {
    rect(ctx, x, GROUND_Y - 52, 8, 52, ctx.fillStyle);
    rect(ctx, x, GROUND_Y - 44, 180, 7, ctx.fillStyle);
    rect(ctx, x, GROUND_Y - 24, 180, 7, ctx.fillStyle);
  }
  const pumpOff = (scroll * 0.62) % 640;
  for (let i = -1; i < 3; i += 1) {
    const px = i * 640 - pumpOff + 300;
    ellipse(ctx, px, GROUND_Y - 10, 17, 12, '#e07b2e');
    ellipse(ctx, px + 26, GROUND_Y - 8, 12, 9, '#d96f26');
    rect(ctx, px - 2, GROUND_Y - 26, 5, 7, PALETTE.husk);
  }
}

function kitchenBackdrop(ctx, stage, scroll) {
  // Tiled wall.
  ctx.fillStyle = stage.sky[1];
  ctx.fillRect(0, 0, VIEW_W, GROUND_Y);
  ctx.strokeStyle = 'rgba(185,138,90,0.35)';
  ctx.lineWidth = 2;
  const tileOff = (scroll * 0.15) % 64;
  for (let x = -tileOff; x < VIEW_W; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, GROUND_Y - 120);
    ctx.stroke();
  }
  for (let y = 64; y < GROUND_Y - 120; y += 64) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(VIEW_W, y);
    ctx.stroke();
  }

  // A window onto the autumn yard the turkey is running for.
  const winOff = (scroll * 0.3) % 1500;
  for (let i = -1; i < 2; i += 1) {
    const wx = i * 1500 - winOff + 700;
    rect(ctx, wx, 90, 240, 200, '#f7c873');
    ellipse(ctx, wx + 180, 140, 26, 26, '#ffd76a');
    treeShape(ctx, wx + 60, 290, 0.9, '#c98d5a');
    treeShape(ctx, wx + 170, 290, 0.7, '#c98d5a');
    ctx.strokeStyle = PALETTE.woodDark;
    ctx.lineWidth = 8;
    ctx.strokeRect(wx, 90, 240, 200);
    line(ctx, wx + 120, 90, wx + 120, 290, PALETTE.woodDark, 6);
  }

  // Shelf with jars, and a rail of hanging pans.
  const shelfOff = (scroll * 0.45) % 900;
  for (let i = -1; i < 3; i += 1) {
    const sx = i * 900 - shelfOff + 140;
    rect(ctx, sx, 330, 300, 10, PALETTE.wood);
    for (let j = 0; j < 4; j += 1) {
      roundRect(ctx, sx + 18 + j * 70, 292, 44, 38, 5, j % 2 ? '#d98a3d' : '#b03a2e');
      rect(ctx, sx + 24 + j * 70, 284, 32, 8, PALETTE.woodDark);
    }
    rect(ctx, sx + 360, 140, 260, 7, PALETTE.woodDark);
    for (let j = 0; j < 3; j += 1) {
      const px = sx + 380 + j * 80;
      line(ctx, px + 20, 147, px + 20, 172, PALETTE.steelDark, 3);
      ellipse(ctx, px + 20, 192, 24, 20, PALETTE.steelDark);
      ellipse(ctx, px + 20, 192, 16, 13, PALETTE.steel);
    }
  }

  // The far counter the turkey is running along.
  rect(ctx, 0, GROUND_Y - 120, VIEW_W, 120, '#d9b98a');
  rect(ctx, 0, GROUND_Y - 120, VIEW_W, 12, PALETTE.wood);
}

export function drawBackdrop(ctx, stage, stageIndex, scroll, time) {
  if (stageIndex === 2) kitchenBackdrop(ctx, stage, scroll);
  else farmBackdrop(ctx, stage, scroll, time, stageIndex === 1);
}

export function drawGround(ctx, stage, stageIndex, scroll) {
  rect(ctx, 0, GROUND_Y, VIEW_W, VIEW_H - GROUND_Y, stage.ground);
  rect(ctx, 0, GROUND_Y, VIEW_W, 24, stage.path);
  const off = scroll % 90;
  if (stageIndex === 2) {
    // Countertop plank seams.
    for (let x = -off; x < VIEW_W + 90; x += 90) {
      line(ctx, x, GROUND_Y + 4, x, VIEW_H, 'rgba(110,76,42,0.5)', 3);
    }
  } else {
    // Grass tufts and dirt flecks along the path.
    for (let x = -off; x < VIEW_W + 90; x += 90) {
      line(ctx, x + 12, GROUND_Y + 16, x + 8, GROUND_Y + 4, '#5a8a3c', 3);
      line(ctx, x + 18, GROUND_Y + 16, x + 20, GROUND_Y + 2, '#5a8a3c', 3);
      ellipse(ctx, x + 52, GROUND_Y + 34, 7, 3, 'rgba(58,36,19,0.35)');
    }
  }
}

// -------------------------------------------------------------- finish

export function drawGate(ctx, x) {
  // Two posts and a banner: the way out of the farm.
  rect(ctx, x, GROUND_Y - 230, 16, 230, PALETTE.woodDark);
  rect(ctx, x + 190, GROUND_Y - 230, 16, 230, PALETTE.woodDark);
  roundRect(ctx, x - 14, GROUND_Y - 268, 234, 44, 10, PALETTE.wood);
  ctx.fillStyle = PALETTE.cream;
  ctx.font = 'bold 27px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('FREEDOM', x + 103, GROUND_Y - 245);
  // Trees and golden light beyond the posts.
  treeShape(ctx, x + 60, GROUND_Y - 4, 1.5, '#7c5a30');
  treeShape(ctx, x + 150, GROUND_Y - 4, 1.2, '#8a6238');
  ellipse(ctx, x + 103, GROUND_Y - 120, 90, 110, 'rgba(255,215,106,0.18)');
}

// --------------------------------------------------------- small pieces

export function drawFeatherIcon(ctx, x, y, filled) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.5);
  ellipse(ctx, 0, -8, 6, 13, filled ? PALETTE.tailB : 'rgba(58,36,19,0.25)');
  line(ctx, 0, 6, 0, -18, filled ? PALETTE.cream : 'rgba(58,36,19,0.3)', 2);
  ctx.restore();
}

export function drawLeaf(ctx, leaf) {
  ctx.save();
  ctx.translate(leaf.x, leaf.y);
  ctx.rotate(leaf.rot);
  ellipse(ctx, 0, 0, 7, 4, leaf.color);
  ctx.restore();
}
