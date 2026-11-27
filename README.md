# Turkey Run — Thanksgiving Breakout

[![make.fun · turkey-run-game-01](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/turirer/turkey-run-game/rank.svg)](https://make.fun/bounty/turkey-run-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![reward](https://make.fun/badge/turkey-run-game-01/turirer/turkey-run-game/reward.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)

A complete offline browser game: you are a turkey making a break for it on
Thanksgiving morning, and the farmer is right behind you with a net. Run
3,000 metres from the farmyard, through the barnyard, across the kitchen
counter, and out the Freedom Gate — or end up as dinner.

**How it plays**

- **SPACE / ↑** — jump; press again mid-air to flap (double jump). Holding
  **↓** in the air slams you back down.
- **↓** — duck under the "DINNER →" signs, flying carving knives and pot
  racks.
- **→** — dash: a burst of speed that wins back ground on the farmer,
  on a short cooldown.
- On-screen JUMP / DUCK / DASH buttons work with mouse and touch.
- The **FARMER** bar is the chase: stumbles and puddles let him close in,
  clean running and dashes open the gap. If it fills, you're caught.
- Three feathers (lives). Corn is worth points; rare golden corn restores
  a feather. Stages get faster and meaner: fences, hay bales, puddles and
  dogs give way to carts and knives, then ovens, rolling pins and steam
  pots in the kitchen.
- **P** pauses, **M** mutes, **R** restarts. High score is kept locally.

Everything is drawn with canvas paths and every sound is synthesized with
WebAudio — the game ships no image or audio files and makes no network
requests. The source is split by job under `game/src/`: `settings.js`
(tuning), `world.js` (simulation), `art.js` (drawing), `screens.js` (HUD
and menus), `input.js`, `audio.js`, `rng.js`, `shots.js`, `main.js`.

Serve it locally with `node serve.ts`, then open http://localhost:8080.

Entry for the make.fun bounty: https://make.fun/bounty/turkey-run-game-01

Referral: https://make.fun/r/d6btpjsv
