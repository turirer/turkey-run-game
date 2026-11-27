// The game's rules and state, with no drawing and no browser in it: the player's turkey, the
// pool of falling knives and corn cobs, spawning, collisions, score, lives and level. step() advances
// one fixed step and returns what happened as bit flags, so the caller can react without the
// world knowing about screens or sound. Nothing here allocates after createWorld returns.
import { KNIFE, CORN, FIELD, LEVEL, LIVES, PLAYER, POOL_SIZE } from './config.js';

export const KIND_KNIFE = 0;
export const KIND_CORN = 1;

export const EVENT_HIT = 1;
export const EVENT_CORN = 2;
export const EVENT_OVER = 4;

function overlaps(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

export function createWorld(random) {
  const player = { x: 0, y: FIELD.groundY - PLAYER.height, width: PLAYER.width, height: PLAYER.height, invulnerable: 0 };
  const items = [];
  for (let index = 0; index < POOL_SIZE; index += 1) {
    items.push({ active: false, kind: KIND_KNIFE, x: 0, y: 0, width: 0, height: 0, speed: 0 });
  }
  const state = { player, items, score: 0, lives: LIVES, level: 1, elapsed: 0, knifeTimer: 0, cornTimer: 0 };

  function reset() {
    player.x = (FIELD.width - player.width) / 2;
    player.invulnerable = 0;
    for (const item of items) item.active = false;
    state.score = 0;
    state.lives = LIVES;
    state.level = 1;
    state.elapsed = 0;
    state.knifeTimer = KNIFE.interval;
    state.cornTimer = CORN.interval;
  }

  function freeItem() {
    for (let index = 0; index < items.length; index += 1) if (!items[index].active) return items[index];
    return null;
  }

  function spawnKnife() {
    const item = freeItem();
    if (item === null) return;
    item.active = true;
    item.kind = KIND_KNIFE;
    item.width = KNIFE.minWidth + random() * (KNIFE.maxWidth - KNIFE.minWidth);
    item.height = KNIFE.height;
    item.x = random() * (FIELD.width - item.width);
    item.y = -item.height;
    item.speed = KNIFE.speed + KNIFE.speedPerLevel * (state.level - 1) + random() * KNIFE.speedJitter;
  }

  function spawnCorn() {
    const item = freeItem();
    if (item === null) return;
    item.active = true;
    item.kind = KIND_CORN;
    item.width = CORN.size;
    item.height = CORN.size;
    item.x = random() * (FIELD.width - item.width);
    item.y = -item.height;
    item.speed = CORN.speed + CORN.speedPerLevel * (state.level - 1);
  }

  function knifeInterval() {
    return Math.max(KNIFE.minInterval, KNIFE.interval * KNIFE.intervalScale ** (state.level - 1));
  }

  /**
   * One fixed step. `direction` is -1, 0 or 1 (left, still, right). With `harmless` set (the title
   * screen's backdrop) things fall but nothing touches the player and nothing scores.
   */
  function step(dt, direction, harmless) {
    let events = 0;
    state.elapsed += dt;
    state.level = Math.min(LEVEL.max, 1 + Math.floor(state.elapsed / LEVEL.seconds));

    player.x = Math.min(FIELD.width - player.width, Math.max(0, player.x + direction * PLAYER.speed * dt));
    if (player.invulnerable > 0) player.invulnerable = Math.max(0, player.invulnerable - dt);

    state.knifeTimer -= dt;
    if (state.knifeTimer <= 0) {
      spawnKnife();
      state.knifeTimer += knifeInterval();
    }
    state.cornTimer -= dt;
    if (state.cornTimer <= 0) {
      spawnCorn();
      state.cornTimer += CORN.interval + random() * CORN.intervalJitter;
    }

    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];
      if (!item.active) continue;
      item.y += item.speed * dt;
      if (item.y > FIELD.groundY) {
        item.active = false;
        if (item.kind === KIND_KNIFE && !harmless) state.score += KNIFE.dodgePoints;
        continue;
      }
      if (harmless || !overlaps(item, player)) continue;
      if (item.kind === KIND_CORN) {
        item.active = false;
        state.score += CORN.points;
        events |= EVENT_CORN;
      } else if (player.invulnerable === 0) {
        item.active = false;
        state.lives -= 1;
        player.invulnerable = PLAYER.invulnerable;
        events |= EVENT_HIT;
        if (state.lives === 0) {
          events |= EVENT_OVER;
          break;
        }
      }
    }
    return events;
  }

  reset();
  return { state, reset, step };
}
