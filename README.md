# Detective Redwing

A daily logic murder mystery. Five guests, five weapons, five rooms, one killer, six accusations.

- `src/engine.js` builds each day's case from the date and proves it has exactly one answer.
- `src/app.html` is the game page.
- `npm test` checks 500 cases for a unique answer. `npm run build` writes `dist/index.html`.
- Every push to `main` (and a nightly run) tests, builds and deploys to GitHub Pages.
