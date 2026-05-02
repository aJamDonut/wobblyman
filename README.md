# Survivor Mission UI Game

Modern modular HTML5 game foundation using ESM modules and Vite.

## Scripts

- npm run dev: Start local dev server and open preview page
- npm run build: Build production assets into dist
- npm run preview: Preview production build locally

## Project Structure

- preview.html: App HTML shell and mount points
- src/main.js: ESM entry point
- src/styles/game.css: Presentation styles
- src/game/state.js: Initial game state and selectors
- src/game/helpers.js: Formatting and reusable UI helpers
- src/game/render.js: UI rendering functions
- src/game/gameApp.js: Game orchestration and mission flow
