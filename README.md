# Brainbrew

Daily puzzle games at [brainbrew.fun](https://brainbrew.fun). The home page is `src/hub.html`; each game builds into its own folder. To add a game, see [docs/ADDING_A_GAME.md](docs/ADDING_A_GAME.md).

## Detective Redwing (`/redwing`)

A daily logic mystery. Five guests, five items, five rooms, one culprit, six accusations. Some days it is a murder (name the killer, weapon and room), some days a theft (name the thief, the stolen piece and the room).

- `src/engine.js` builds each day's case from the date and proves it has exactly one answer. It runs only at build time.
- `build.js` writes `dist/redwing/cases/<date>.json` for the past week and the next three days, plus 40 practice cases. A case file holds the clues and an AES-GCM lock keyed (PBKDF2, 300k rounds) by the correct suspect, item and room, so the answer, the proof and the decoded clues are not in the page. Case seeds mix in `REDWING_SECRET` (a repository secret), so the answers can't be rebuilt from this public code. After six wrong accusations the game asks the answer desk (below) for the answer. As a fallback, a daily case file also carries its answer once the date has ended in every time zone (noon UTC the next day), published by the 12:30 UTC build.
- `src/app.html` is the game page.
- `npm test` checks 500 daily cases plus every scene and case type, and that case files leak no answer and open only for the right accusation for a unique answer. `npm run build` writes `dist/index.html` (home) and `dist/redwing/index.html`.
- Every push to `main` (and a nightly run) tests, builds and deploys to GitHub Pages.

## Table Manners (`/table-manners`)

A daily seating puzzle. Guests phone ahead with their grudges and requests ("Don't let Bo sit next to Ada, since they fell out over splitting a bill"), and the player seats everyone around a round table. Three wrong guesses and dinner is ruined; speed is the score.

- `src/tablemanners-engine.js` builds each dinner (a hidden seating plus notes until exactly one seating fits). It runs only at build time. `build.js` writes `dist/table-manners/dinners/<date>.json` for the past week and the next three days, plus 40 practice dinners. A dinner file holds the guests, the notes and an AES-GCM lock keyed (PBKDF2, 200k rounds) by the correct seating, so the answer is not in the page. Seeds mix in `REDWING_SECRET` (as `HMAC(secret, "tablemanners|<date>")`), so the answers can't be rebuilt from this public code. A daily file carries its seating plan once the date has ended in every time zone (noon UTC the next day); until then, a ruined dinner says when the plan unlocks, and the next day's page shows yesterday's plan. Practice dinners come unlocked.
- `src/tablemanners.html` is the game page: rooms, hosts, notes and play. It loads the day's dinner file and checks a seating by trying the lock. Dinner No. 1 was 1 October 2026. Monday is 5 guests and gentle; the weekend is a 7-guest full house.
- Rooms follow the calendar: the Private Room on weekdays, one of Grandma's House, Brunch, Family Dinner or Wedding Reception each weekend in turn, and holiday rooms (with two days either side) that take over the whole weekend: Halloween, Thanksgiving, Christmas, New Year's Eve, Lunar New Year, Valentine's Day, Eid al-Fitr, Eid al-Adha and the Fourth of July. Each room has its own host and its own caller notes, written for family or friends as fits. Lunar New Year and the Eids are dated through 2028 in `MOVING`; add later years before 2029.
- `src/tablemanners.test.js` (part of `npm test`) checks 600 dinners have exactly one seating that fits every note, using a separate solver, checks every note in all 13 rooms, checks two years of the room calendar, and checks that dinner files leak no answer and their lock opens only for the right seating.
- Saved progress lives in the browser under `tablemanners:` keys. GoatCounter events: `tablemanners/started|solved/in-K|failed|shared/dinner-N` (or `practice`).

## Daily variety

Scenes rotate by date (see `SCENES` in `src/engine.js`): Hawthorne Manor, the SS Aurelia ocean liner, the Hotel Edelweiss in the Alps and the Silver Arrow night train, each with its own roles, weapons, rooms, staff and witnesses. Every case draws a fresh cast (a scene role, a fitting title and a surname from `SURNAMES`), so Detective Redwing is the only recurring character. The same scene never runs two days in a row. Every two days hold one murder and one theft, in a random order. Thefts use the shared `VALUABLES` instead of weapons, and their scene clue never names the stolen piece.

On phones the page turns into four tabs (Case, Evidence, Notebook, Accuse) with a notebook card per guest and an evidence strip above it.

Each weekday has its own code theme (see `THEMES` in `src/engine.js`): anagrams, trivia, general knowledge ("the room that holds the Merlot and the Malbec" means the Wine Cellar), number codes, Morse, mirror writing, Caesar and Atbash notes.

## Ranks, stats and friends

Everything here lives in the player's browser, with no accounts and no server.

- Ranks climb with solved daily cases: Rookie, Constable (3), Sergeant (10), Detective (25), Inspector (50), Chief Inspector (100). The header button shows the current rank and opens the stats screen: played, solve rate, average tries, current and best streak, Big Cases solved, and a chart of which accusation cracked each case.
- Sundays bring the Big Case: 7 to 11 clues, no clue that places anyone in a room outright, and three hints instead of five. It still has exactly one answer.
- Daily reminder: an `.ics` file (Apple, Outlook) or a Google Calendar link that repeats every day at the chosen time with a link to the game.
- Friends board: a player picks a detective name, and every link they share then carries `?pal=id.lastDay.results.name`, with their last 14 daily results (`1`-`6` tries, `0` unsolved, `-` not played). Opening such a link adds or refreshes that friend on the board, which shows the last seven days side by side.

## Player tracking

Visits are counted with Cloudflare Web Analytics (token in `package.json` under `config.cloudflareBeacon`), visible only to the site owner. Game events go to GoatCounter (`config.goatcounter`, dashboard at brainbrew.goatcounter.com, no cookies): `started/case-N` when someone makes their first accusation, `solved/case-N/in-K` when they solve it in K tries, `failed/case-N` after six wrong accusations, `shared/case-N` when someone taps a share button, `invited` when someone shares a friends-board invite, and `reminder` when someone adds the daily reminder to a calendar. Each event's title includes that day's theme, case type and scene. Practice games show up as `practice` instead of `case-N`.

## Night Shift (`nightshift.brainbrew.fun`)

A live party game for one room (Mafia, Werewolf or Chor-Police): one phone hosts, everyone else holds a secret role card on their own phone. Unlike the daily puzzles it needs a live server, so it isn't built from this repo:

- Code: `naqvikhan/night-shift`, a private repository (ask its owner for access). It deploys from there with its own GitHub Actions workflow.
- Hosting: a separate Cloudflare Worker named `nightshift` on this account, which serves the page and the game rooms (Durable Objects). It doesn't touch `worker/` or this site's build.
- Address: `nightshift.brainbrew.fun`, attached to that Worker as a Custom Domain in the Cloudflare dashboard.
- Here it is only a tile on the home page (`src/hub.html`) linking to that address.

## Answer desk (`worker/`)

A Cloudflare Worker at `https://api.brainbrew.fun/redwing/reveal`. The game posts the date and six different wrong accusations, and the Worker opens the case file's sealed `desk` copy (AES-GCM, keyed by HMAC-SHA256 of `REDWING_SECRET` and `desk|<date>`) and returns the answer, the proof and the decoded clues. A list containing the right answer, fewer than six guesses, or a date after tomorrow gets nothing. The deploy workflow publishes it whenever these repository secrets exist (Settings → Secrets and variables → Actions):

- `REDWING_SECRET`: any long random phrase. Used by the site build and the Worker. Changing it changes every case.
- `CLOUDFLARE_API_TOKEN`: a Cloudflare API token from the "Edit Cloudflare Workers" template, scoped to this account and the brainbrew.fun zone.
- `CLOUDFLARE_ACCOUNT_ID`: shown on the Cloudflare dashboard's Workers & Pages overview.
