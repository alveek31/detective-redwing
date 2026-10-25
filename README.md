# Brainbrew

Daily puzzle games at [brainbrew.fun](https://brainbrew.fun). The home page is `src/hub.html`; each game builds into its own folder.

## Detective Redwing (`/redwing`)

A daily logic mystery. Five guests, five items, five rooms, one culprit, six accusations. Some days it is a murder (name the killer, weapon and room), some days a theft (name the thief, the stolen piece and the room).

- `src/engine.js` builds each day's case from the date and proves it has exactly one answer. It runs only at build time.
- `build.js` writes `dist/redwing/cases/<date>.json` for the past week and the next three days, plus 40 practice cases. A case file holds the clues and an AES-GCM lock keyed (PBKDF2, 300k rounds) by the correct suspect, item and room, so the answer, the proof and the decoded clues are not in the page. Case seeds mix in `REDWING_SECRET` (a repository secret), so the answers can't be rebuilt from this public code. After six wrong accusations the game asks the answer desk (below) for the answer. As a fallback, a daily case file also carries its answer once the date has ended in every time zone (noon UTC the next day), published by the 12:30 UTC build.
- `src/app.html` is the game page.
- `npm test` checks 500 daily cases plus every scene and case type, and that case files leak no answer and open only for the right accusation for a unique answer. `npm run build` writes `dist/index.html` (home) and `dist/redwing/index.html`.
- Every push to `main` (and a nightly run) tests, builds and deploys to GitHub Pages.

## Daily variety

Scenes rotate by date (see `SCENES` in `src/engine.js`): Hawthorne Manor, the SS Aurelia ocean liner, the Hotel Edelweiss in the Alps and the Silver Arrow night train, each with its own guests, weapons, rooms, staff and witnesses. The same scene never runs two days in a row. Every two days hold one murder and one theft, in a random order. Thefts use the shared `VALUABLES` instead of weapons, and their scene clue never names the stolen piece.

On phones the page turns into four tabs (Case, Evidence, Notebook, Accuse) with a notebook card per guest and an evidence strip above it.

Each weekday has its own code theme (see `THEMES` in `src/engine.js`): anagrams, trivia, general knowledge ("the room that holds the Merlot and the Malbec" means the Wine Cellar), number codes, Morse, mirror writing, Caesar and Atbash notes.

## Player tracking

Visits are counted with Cloudflare Web Analytics (token in `package.json` under `config.cloudflareBeacon`), visible only to the site owner. Game events go to GoatCounter (`config.goatcounter`, dashboard at brainbrew.goatcounter.com, no cookies): `started/case-N` when someone makes their first accusation, `solved/case-N/in-K` when they solve it in K tries, and `failed/case-N` after six wrong accusations. Each event's title includes that day's theme, case type and scene. Practice games show up as `practice` instead of `case-N`.

## Answer desk (`worker/`)

A Cloudflare Worker at `https://api.brainbrew.fun/redwing/reveal`. The game posts the date and six different wrong accusations, and the Worker rebuilds the case from `REDWING_SECRET` and returns the answer, the proof and the decoded clues. A list containing the right answer, fewer than six guesses, or a date after tomorrow gets nothing. The deploy workflow publishes it whenever these repository secrets exist (Settings → Secrets and variables → Actions):

- `REDWING_SECRET`: any long random phrase. Used by the site build and the Worker. Changing it changes every case.
- `CLOUDFLARE_API_TOKEN`: a Cloudflare API token from the "Edit Cloudflare Workers" template, scoped to this account and the brainbrew.fun zone.
- `CLOUDFLARE_ACCOUNT_ID`: shown on the Cloudflare dashboard's Workers & Pages overview.
