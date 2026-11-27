// settings.js — every number the game runs on, in one place.
//
// The world is drawn in a fixed 1280x720 space (the canvas backing store),
// and CSS scales it to the window, so a position here means the same thing
// on every screen.

export const VIEW_W = 1280;
export const VIEW_H = 720;
export const GROUND_Y = 600;          // the dirt line the turkey runs on
export const PX_PER_METER = 40;       // world pixels per metre of distance

export const TURKEY_X = 320;          // the turkey holds this screen x
export const TURKEY_W = 64;
export const TURKEY_H = 58;           // standing height
export const TURKEY_DUCK_H = 38;      // height while ducking

export const GRAVITY = 2600;          // px/s^2
export const JUMP_V = -1050;          // first jump
export const FLAP_V = -820;           // second jump (the wing flap)
export const MAX_FALL = 1500;
export const DUCK_FALL = 2600;        // holding duck in the air slams down

export const BASE_SPEED = 380;        // world scroll speed, px/s
export const SPEED_PER_100M = 7;      // it creeps up as you run
export const MAX_SPEED = 730;
export const DASH_TIME = 0.7;         // seconds a dash lasts
export const DASH_COOLDOWN = 2.5;     // seconds before the next dash
export const DASH_MULT = 1.6;
export const DIP_TIME = 0.8;          // slow-down after a stumble or puddle
export const DIP_MULT = 0.55;

export const FINISH_M = 3000;         // the Freedom Gate
export const MAX_FEATHERS = 3;        // lives
export const INVULN_TIME = 1.2;       // blinking grace after a hit

// The pursuit: gap 0..100. The farmer is drawn closer as it shrinks.
export const GAP_START = 70;
export const GAP_RECOVER = 1.15;      // per second of clean running
export const GAP_HIT = 18;            // lost on a stumble
export const GAP_PUDDLE = 10;         // lost in a puddle
export const GAP_DASH = 6;            // won back by dashing
export const GAP_SPOTTED = 55;        // farmer first visible under this

export const CORN_POINTS = 25;
export const GOLDEN_POINTS = 150;

// The three stretches of the escape, in order. `kinds` names the obstacles
// that may appear there (see world.js for what each kind is).
export const STAGES = [
  {
    name: 'THE FARMYARD',
    from: 0,
    kinds: ['fence', 'haybale', 'puddle', 'dog'],
    sky: ['#f7c873', '#fdeec9'],
    far: '#c98d5a',
    ground: '#a4713f',
    path: '#c08b52',
  },
  {
    name: 'THE BARNYARD',
    from: 1000,
    kinds: ['fence', 'haybale', 'cart', 'sign', 'knife', 'dog'],
    sky: ['#e88a5a', '#f7c873'],
    far: '#9c5a44',
    ground: '#8a5a33',
    path: '#a4713f',
  },
  {
    name: 'THE KITCHEN',
    from: 2000,
    kinds: ['oven', 'potrack', 'rollingpin', 'steampot', 'knife'],
    sky: ['#f3e2c2', '#fdf6e3'],
    far: '#d9b98a',
    ground: '#b98a5a',
    path: '#cfa06e',
  },
];

export const PALETTE = {
  ink: '#3a2413',
  cream: '#fff6e0',
  turkeyBody: '#8a5a33',
  turkeyDark: '#6e4525',
  turkeyBelly: '#c99a63',
  tailA: '#a85f2e',
  tailB: '#d98a3d',
  tailC: '#7c4a26',
  wattle: '#d63a2e',
  beak: '#f0a13a',
  farmerShirt: '#b03a2e',
  farmerShirtDark: '#8c2b21',
  overalls: '#3f5f8a',
  hat: '#e8c96a',
  skin: '#f2c094',
  dog: '#b07a45',
  dogDark: '#8a5c30',
  wood: '#8a6238',
  woodDark: '#6e4c2a',
  straw: '#e8c96a',
  corn: '#ffd23e',
  cornDark: '#e8a81c',
  husk: '#5a8a3c',
  puddle: '#7ab5d6',
  steel: '#cfd6dd',
  steelDark: '#9aa5ae',
  ovenBody: '#5a4a42',
  ovenGlow: '#ff8a3d',
  leafA: '#d98a3d',
  leafB: '#b03a2e',
  leafC: '#e8c96a',
};
