// Turkey Run's hand-in program (Node 22, standard library only).
//
// The entry is the game/ folder beside this file: plain static files a
// desktop browser loads offline, no build step and no network request.
// This program copies game/ and screenshots/ into the output directory
// and writes dossier.json — the summary the judge reads — using the
// vendored make.fun library, with the scorer's own size caps so an entry
// the gate would refuse never gets written.
//
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for the
// output directory:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

const dossier = buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(out, 'dossier.json'), dossier);

// One line of confirmation for whoever runs the hand-in by hand.
console.log(`dossier.json written to ${join(out, 'dossier.json')} (${Buffer.byteLength(dossier)} bytes)`);
