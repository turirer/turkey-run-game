// input.js — keyboard, mouse and touch, folded into four game actions:
// jump, duck (held), dash, plus pause / restart / mute / start.
//
// Screens read `pressed` edges once per frame (takePressed clears them),
// and `duckHeld` for as long as the key or button is down. The on-screen
// buttons are defined here so screens.js can draw exactly the circles
// that pointer input listens to.

import { VIEW_W, VIEW_H } from './settings.js';

// Touch buttons, in canvas coordinates (drawn by screens.js).
export const BUTTONS = [
  { id: 'duck', label: 'DUCK', x: 96, y: VIEW_H - 92, r: 46 },
  { id: 'dash', label: 'DASH', x: VIEW_W - 196, y: VIEW_H - 78, r: 38 },
  { id: 'jump', label: 'JUMP', x: VIEW_W - 96, y: VIEW_H - 92, r: 46 },
];

const KEY_ACTIONS = {
  Space: 'jump', ArrowUp: 'jump', KeyW: 'jump',
  ArrowDown: 'duck', KeyS: 'duck',
  ArrowRight: 'dash', KeyD: 'dash', ShiftLeft: 'dash', ShiftRight: 'dash',
  KeyP: 'pause', Escape: 'pause',
  KeyR: 'restart',
  KeyM: 'mute',
  Enter: 'start',
};

export function createInput(canvas, onFirstGesture) {
  const pressed = new Set();
  const state = { duckHeld: false, anyGesture: false };

  function gesture() {
    if (!state.anyGesture) {
      state.anyGesture = true;
      onFirstGesture();
    }
  }

  function press(action) {
    pressed.add(action);
    gesture();
  }

  window.addEventListener('keydown', (event) => {
    const action = KEY_ACTIONS[event.code];
    if (!action) return;
    event.preventDefault();
    if (action === 'duck') state.duckHeld = true;
    if (!event.repeat) press(action);
  });

  window.addEventListener('keyup', (event) => {
    if (KEY_ACTIONS[event.code] === 'duck') state.duckHeld = false;
  });

  // Pointer position in canvas coordinates, whatever the CSS scale is.
  function toCanvas(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * VIEW_W,
      y: ((event.clientY - rect.top) / rect.height) * VIEW_H,
    };
  }

  function buttonAt(x, y) {
    for (const b of BUTTONS) {
      const dx = x - b.x;
      const dy = y - b.y;
      if (dx * dx + dy * dy <= b.r * b.r) return b.id;
    }
    return null;
  }

  let duckPointer = null;

  canvas.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    const { x, y } = toCanvas(event);
    const id = buttonAt(x, y);
    if (id === 'duck') {
      state.duckHeld = true;
      duckPointer = event.pointerId;
      press('duck');
    } else if (id === 'dash') {
      press('dash');
    } else {
      // The JUMP button, and any other tap: jump (also starts/restarts).
      press('jump');
      press('start');
    }
  });

  function releaseDuck(event) {
    if (duckPointer === event.pointerId) {
      state.duckHeld = false;
      duckPointer = null;
    }
  }
  canvas.addEventListener('pointerup', releaseDuck);
  canvas.addEventListener('pointercancel', releaseDuck);
  canvas.addEventListener('pointerleave', releaseDuck);

  return {
    state,
    // True once per press; reading clears the edge.
    takePressed(action) {
      if (!pressed.has(action)) return false;
      pressed.delete(action);
      return true;
    },
    // Peek without consuming (used for start/restart on menu screens).
    wasPressed(action) {
      return pressed.has(action);
    },
    clearPressed() {
      pressed.clear();
    },
  };
}
