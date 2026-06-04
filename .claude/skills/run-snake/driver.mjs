#!/usr/bin/env node
/**
 * Driver for the Snake game — runs it headlessly with jsdom + node-canvas.
 * Exercises the real game code (init/tick/draw/endGame) and produces a PNG.
 *
 * Prerequisites (one-time):
 *   npm install          # jsdom already in package.json
 *   npm install canvas   # node-canvas for headless rendering
 *
 * Usage:
 *   node .claude/skills/run-snake/driver.mjs [options]
 *
 * Options:
 *   --ticks N          Run N game ticks (default: 5)
 *   --game-over        Drive snake into wall, capture game-over screen
 *   --out FILE         Screenshot path (default: /tmp/snake-screenshot.png)
 *   --score            Print score after running
 *
 * Exit 0 on success, 1 on JS error in the game.
 */

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { JSDOM, VirtualConsole } = require('jsdom');
import { createCanvas, Image } from 'canvas';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const args = process.argv.slice(2);
const flagValue = (flag, def) => { const i = args.indexOf(flag); return i !== -1 && args[i+1] ? args[i+1] : def; };
const hasFlag = (flag) => args.includes(flag);

const tickCount = parseInt(flagValue('--ticks', '5'), 10);
const triggerGameOver = hasFlag('--game-over');
const outPath = flagValue('--out', '/tmp/snake-screenshot.png');
const printScore = hasFlag('--score');

const htmlPath = path.resolve(fileURLToPath(import.meta.url), '../../../../src/snake.html');
const html = readFileSync(htmlPath, 'utf8');

// Patch canvas creation to use node-canvas
const errors = [];
const vc = new VirtualConsole();
vc.on('error', (e) => errors.push(e));

const dom = new JSDOM(html, {
  runScripts: 'dangerously',
  resources: 'usable',
  virtualConsole: vc,
  beforeParse(window) {
    // Provide a real canvas implementation via node-canvas
    const OriginalHTMLCanvasElement = window.HTMLCanvasElement;

    window.HTMLCanvasElement.prototype.getContext = function(type) {
      if (type !== '2d') return null;
      if (!this._nodeCanvas) {
        this._nodeCanvas = createCanvas(this.width || 400, this.height || 400);
        // Sync width/height attributes
        Object.defineProperty(this, 'width', {
          get: () => this._nodeCanvas.width,
          set: (v) => { this._nodeCanvas.width = v; },
        });
        Object.defineProperty(this, 'height', {
          get: () => this._nodeCanvas.height,
          set: (v) => { this._nodeCanvas.height = v; },
        });
      }
      return this._nodeCanvas.getContext('2d');
    };

    // No-op setInterval/clearInterval are needed; jsdom provides them
    // but they don't auto-tick — we'll call tick() manually for determinism.
    let _intervalId = 0;
    const _intervals = new Map();
    window.setInterval = (fn, delay) => {
      const id = ++_intervalId;
      _intervals.set(id, fn);
      return id;
    };
    window.clearInterval = (id) => _intervals.delete(id);
    // Expose intervals map so we can drive ticks
    window.__intervals = _intervals;
  },
});

// Give the page a moment to initialise (init() runs on parse)
const { window } = dom;
await new Promise(r => setTimeout(r, 50));

// Get the tick function from the first registered interval
const tickFn = [...window.__intervals.values()][0];
if (!tickFn) {
  console.error('ERROR: no setInterval callback found — game did not initialise');
  process.exit(1);
}

// Run ticks
const actualTicks = triggerGameOver ? 30 : tickCount;

for (let i = 0; i < actualTicks; i++) {
  if (triggerGameOver && i === 2) {
    // Fire key to go up — drive into top wall
    const evt = new window.KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true });
    window.document.dispatchEvent(evt);
  }
  tickFn();
}

// Read game state
const scoreEl = window.document.getElementById('score');
const score = scoreEl?.textContent ?? '?';

// Find the canvas node to save its image
const canvasEl = window.document.getElementById('c');
const nodeCanvas = canvasEl?._nodeCanvas;

if (!nodeCanvas) {
  console.error('ERROR: canvas not initialised');
  process.exit(1);
}

// Save PNG
const buffer = nodeCanvas.toBuffer('image/png');
writeFileSync(outPath, buffer);
console.log(`Screenshot saved to ${outPath}`);

// gameOver is a `let` — not on window. Detect it by checking if the interval
// was cleared (endGame calls clearInterval, emptying __intervals).
const isGameOver = window.__intervals.size === 0;

if (printScore || true) {
  console.log('Score:', score);
  console.log('Ticks run:', actualTicks);
  console.log('Game over:', isGameOver);
}

if (errors.length) {
  console.error('JS errors:', errors);
  process.exit(1);
}
process.exit(0);
