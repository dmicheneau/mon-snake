---
name: run-snake
description: Run, screenshot, and test the Snake browser game. Use when asked to run the game, take a screenshot, verify a game mechanic, or check that a change works in the actual app.
---

Snake is a single-file browser game (`src/snake.html`). The driver runs it headlessly using **jsdom + node-canvas** — no browser or display server required. It executes the real game code (`init`, `tick`, `draw`, `endGame`) and renders a PNG screenshot.

All paths below are relative to the repo root (`/data`).

## Prerequisites

node-canvas must be installed alongside jsdom:

```
npm install canvas
```

(jsdom is already in `package.json`. `canvas` is not — install it once.)

Fontconfig will emit a harmless warning on first run:
`Fontconfig error: Cannot load default config file` — ignore it. Text in screenshots renders as boxes; game logic is unaffected.

## Run (agent path)

```
node .claude/skills/run-snake/driver.mjs [--ticks N] [--game-over] [--out FILE]
```

| Option | Default | Effect |
|--------|---------|--------|
| `--ticks N` | 5 | Run N game ticks |
| `--game-over` | off | Send ArrowUp at tick 2, run 30 ticks total — crashes snake into top wall |
| `--out FILE` | `/tmp/snake-screenshot.png` | PNG output path |

The driver always prints:
- `Score:` — the score element text
- `Ticks run:` — how many ticks executed
- `Game over: true/false` — whether `endGame()` fired (detected by `clearInterval`)

Exit 0 on success, 1 if the game threw a JS error.

### Example: screenshot normal gameplay

```
node .claude/skills/run-snake/driver.mjs --ticks 5 --out /tmp/snake-initial.png
```

Output:
```
Screenshot saved to /tmp/snake-initial.png
Score: SCORE : 0
Ticks run: 5
Game over: false
```

### Example: screenshot game-over overlay

```
node .claude/skills/run-snake/driver.mjs --game-over --out /tmp/snake-gameover.png
```

Output:
```
Screenshot saved to /tmp/snake-gameover.png
Score: SCORE : 1
Ticks run: 30
Game over: true
```

## How the driver works

- jsdom parses `src/snake.html` with `runScripts: 'dangerously'`
- `setInterval` is intercepted: the game's tick callback is captured but not auto-fired — the driver calls it manually for determinism
- `canvas.getContext('2d')` is patched to return a real node-canvas context (jsdom's built-in canvas context is a stub)
- After ticks run, the canvas buffer is written to PNG via `canvas.toBuffer('image/png')`

**Why not Playwright?** Playwright's Chromium binary requires system libs (`libglib2.0-0`, `libnss3`, etc.) that need root to install. This container doesn't have root. The jsdom+canvas approach covers the same game logic with no OS dependencies beyond `npm install canvas`.

## Gotchas

- **`gameOver` is a `let`, not `var`** — jsdom doesn't expose `let`-scoped variables on `window`. The driver detects game-over by checking whether the game's `setInterval` was cleared (`__intervals.size === 0`), which is what `endGame()` does.
- **Fonts render as boxes** — node-canvas falls back to a box glyph when fontconfig has no config. Game logic is 100% correct; only the screenshot text looks odd.
- **`Fontconfig error` is harmless** — printed to stderr, doesn't affect exit code or game behaviour.
- **Apple position is random** — score varies between runs. Use `--ticks` with a small number to observe normal play; use `--game-over` for a deterministic end state.

## Troubleshooting

**`Cannot find module 'canvas'`** → Run `npm install canvas`

**`no setInterval callback found`** → The game's `init()` didn't run. Check that `src/snake.html` still calls `init()` at the bottom of its `<script>`.

**`ERROR: canvas not initialised`** → `canvas.getContext('2d')` was never called. Check that `draw()` is called during `init()` or `tick()`.
