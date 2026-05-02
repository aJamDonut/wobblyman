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
- src/game/ecs/components.js: ECS component names
- src/game/ecs/World.js: Minimal ECS world/entity storage
- src/game/engine/GameLoop.js: Fixed-step game loop
- src/game/systems/missionProgressSystem.js: ECS mission timer system
- src/game/systems/survivorRecoverySystem.js: Idle survivor recovery system
- src/game/persistence.js: localStorage load/save for survivors and resources

## Survivor Controls

- Use PREV and NEXT on the profile panel to navigate survivors
- Use RECRUIT and DISMISS ACTIVE on the Survivors screen to add/remove survivors
- Left and right arrow keys also cycle active survivor

## Persistence

- Survivor roster, active survivor, capacity, and resource counts are saved locally
- State restores automatically when preview.html is reloaded
