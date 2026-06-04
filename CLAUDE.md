# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture

Single-file browser game: `src/snake.html` contains all HTML, CSS, and game logic inline — no build step, no bundler.

Grid: 20×20 cells, each 20px. State is held in module-level variables (`snake`, `dir`, `nextDir`, `apple`, `score`, `gameOver`). The game loop runs via `setInterval(tick, 150)`.

Key functions:
- `init()` — resets all state and starts the interval
- `tick()` — advances one frame: moves the snake, checks collisions, handles apple pickup
- `draw()` — full canvas repaint each tick (grid, apple, snake body + head eyes)
- `endGame()` — stops the interval and renders the game-over overlay

Collision detection excludes the tail segment (it will have moved by the time the head arrives), avoiding a false self-collision on the frame the snake eats an apple.

## Running

Open `src/snake.html` directly in a browser — no server required.

`jsdom` in `package.json` is available for headless testing if needed:
```bash
npm install
node -e "const { JSDOM } = require('jsdom'); ..."
```
