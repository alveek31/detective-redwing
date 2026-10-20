# Detective Redwing

A daily logic murder mystery. Five guests, five weapons, five rooms, one killer, six accusations.

- `src/engine.js` builds each day's case from the date and proves it has exactly one answer.
- `src/app.html` is the game page.
- `npm test` checks 500 cases for a unique answer. `npm run build` writes `dist/index.html`.
- Every push to `main` (and a nightly run) tests, builds and deploys to GitHub Pages.

## Daily variety

Each weekday has its own code theme (see `THEMES` in `src/engine.js`): anagrams, trivia, number codes, Morse, mirror writing, Caesar and Atbash notes. Every case also has a word lock ("Redwing, Red Baron and Sturon are all types of what?") that opens a bonus clue.

## Player tracking

The live site counts visits and game events with [GoatCounter](https://www.goatcounter.com) (free, no cookies). The site code is set in `package.json` under `config.goatcounter`. Events: `started/case-N`, `solved/case-N/in-K`, `failed/case-N`, `lock-opened/case-N`.
