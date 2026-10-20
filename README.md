# Brainbrew

Daily puzzle games at [brainbrew.fun](https://brainbrew.fun). The home page is `src/hub.html`; each game builds into its own folder.

## Detective Redwing (`/redwing`)

A daily logic murder mystery. Five guests, five weapons, five rooms, one killer, six accusations.

- `src/engine.js` builds each day's case from the date and proves it has exactly one answer.
- `src/app.html` is the game page.
- `npm test` checks 500 cases for a unique answer. `npm run build` writes `dist/index.html` (home) and `dist/redwing/index.html`.
- Every push to `main` (and a nightly run) tests, builds and deploys to GitHub Pages.

## Daily variety

Each weekday has its own code theme (see `THEMES` in `src/engine.js`): anagrams, trivia, general knowledge ("the room that holds the Merlot and the Malbec" means the Wine Cellar), number codes, Morse, mirror writing, Caesar and Atbash notes.

## Player tracking

Visits are counted with Cloudflare Web Analytics (token in `package.json` under `config.cloudflareBeacon`). The live site counts visits and game events with [GoatCounter](https://www.goatcounter.com) (free, no cookies). The site code is set in `package.json` under `config.goatcounter`. Events: `started/case-N`, `solved/case-N/in-K`, `failed/case-N`.
