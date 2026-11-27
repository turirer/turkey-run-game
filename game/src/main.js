// main.js — boot, the frame loop, and the screen state machine
// (title → play ⇄ paused → end). The simulation is world.js, the drawing
// is art.js + screens.js, the noise is audio.js.

import {
  initAudio, isMuted, sfxCorn, sfxDash, sfxFlap, sfxGobble, sfxGolden,
  sfxHit, sfxJump, sfxLose, sfxSplash, sfxSpotted, sfxStage, sfxWin,
  toggleMute,
} from './audio.js';
import { createInput } from './input.js';
import { drawEnd, drawPaused, drawTitle, renderPlay } from './screens.js';
import { parseShotParams, stageShot } from './shots.js';
import { createWorld, scoreOf, updateWorld } from './world.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusLine = document.getElementById('status');

function announce(message) {
  if (statusLine) statusLine.textContent = message;
}

function loadBest() {
  try {
    return Number.parseInt(localStorage.getItem('turkeyRunBest') || '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(score) {
  try { localStorage.setItem('turkeyRunBest', String(score)); } catch { /* ignore */ }
}

// ------------------------------------------------------ screenshot mode

const shot = parseShotParams();
if (shot) {
  const staged = stageShot(shot.shot, shot.seed);
  if (staged.screen === 'title') {
    drawTitle(ctx, 0.4, staged.best);
  } else if (staged.screen === 'end') {
    drawEnd(ctx, staged.world, staged.best, staged.isNewBest);
  } else {
    renderPlay(ctx, staged.world, {
      best: staged.best,
      muted: false,
      showButtons: true,
      duckHeld: staged.world.turkey.ducking,
      hideHint: true,
    });
  }
  window.__shotReady = true;
} else {
  runGame();
}

// ------------------------------------------------------------ the game

function runGame() {
  let screen = 'title'; // title | play | paused | end
  let world = createWorld(1);
  let best = loadBest();
  let isNewBest = false;
  let spottedFlash = 0;
  let titleTime = 0;

  const input = createInput(canvas, initAudio);

  // A small read-only hook so automated checks can see the game state.
  window.__game = { screen, distance: 0, score: 0, feathers: 3 };

  function startRun() {
    world = createWorld((Date.now() % 100000) + 1);
    isNewBest = false;
    spottedFlash = 0;
    screen = 'play';
    input.clearPressed();
    sfxGobble();
    announce('The run begins. Jump the fences, duck the knives, reach the Freedom Gate.');
  }

  function finishRun() {
    const score = scoreOf(world);
    if (score > best) {
      best = score;
      isNewBest = true;
      saveBest(best);
    }
    screen = 'end';
    announce(world.finished === 'escaped'
      ? `You escaped! Final score ${score}.`
      : `Caught by the farmer. Final score ${score}.`);
  }

  function playEvents() {
    for (const event of world.events) {
      switch (event) {
        case 'jump': sfxJump(); break;
        case 'flap': sfxFlap(); break;
        case 'dash': sfxDash(); break;
        case 'corn': sfxCorn(); break;
        case 'golden': sfxGolden(); sfxGobble(); break;
        case 'hit': sfxHit(); sfxGobble(); break;
        case 'splash': sfxSplash(); break;
        case 'stage': sfxStage(); break;
        case 'spotted': sfxSpotted(); spottedFlash = 1.2; break;
        case 'caught': sfxLose(); break;
        case 'escaped': sfxWin(); break;
        default: break;
      }
    }
    world.events.length = 0;
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;

    if (input.takePressed('mute')) toggleMute();

    if (screen === 'title') {
      titleTime += dt;
      if (input.wasPressed('jump') || input.wasPressed('start') || input.wasPressed('restart')) {
        startRun();
      }
      drawTitle(ctx, titleTime, best);
    } else if (screen === 'play') {
      if (input.takePressed('pause')) {
        screen = 'paused';
        announce('Paused.');
      } else {
        updateWorld(world, dt, {
          jumpPressed: input.takePressed('jump'),
          duckHeld: input.state.duckHeld,
          dashPressed: input.takePressed('dash'),
        });
        playEvents();
        if (spottedFlash > 0) spottedFlash -= dt;
        if (world.finished) finishRun();
      }
      renderPlay(ctx, world, {
        best,
        muted: isMuted(),
        showButtons: true,
        duckHeld: input.state.duckHeld,
        spottedFlash: Math.max(0, spottedFlash),
      });
    } else if (screen === 'paused') {
      if (input.takePressed('pause') || input.takePressed('start')) screen = 'play';
      renderPlay(ctx, world, { best, muted: isMuted(), showButtons: false, duckHeld: false });
      drawPaused(ctx);
    } else if (screen === 'end') {
      world.time += dt; // keeps the restart prompt blinking
      if (input.wasPressed('restart') || input.wasPressed('start') || input.wasPressed('jump')) {
        startRun();
      }
      drawEnd(ctx, world, best, isNewBest);
    }

    window.__game.screen = screen;
    window.__game.distance = Math.floor(world.distance);
    window.__game.score = scoreOf(world);
    window.__game.feathers = world.feathers;

    requestAnimationFrame(frame);
  }

  announce('Turkey Run. Press space or click to start the escape.');
  requestAnimationFrame(frame);
}
