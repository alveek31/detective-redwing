# Adding a game to Brainbrew

Brainbrew ([brainbrew.fun](https://brainbrew.fun)) is one static site built from this repo. The home page lists the games, and each game lives in its own folder on the site, like `brainbrew.fun/redwing/`. This guide shows how to add a new one, say `brainbrew.fun/wordy/`.

## How the site fits together

```
src/
  hub.html        home page body (the game shelf)
  app.html        Detective Redwing's page
  engine.js       Redwing's case generator (build time only)
  assets/         images copied into dist/
build.js          turns src/ into dist/
dist/             the built site (ignored by git, made by `npm run build`)
.github/workflows/deploy.yml   tests, builds and deploys main to GitHub Pages
```

`build.js` wraps each page body in a shared shell with `page(body, meta)`: doctype, viewport, link-preview tags, icons and the analytics scripts. So a game page is just its body (markup, `<style>` and `<script>`), with no `<html>` or `<head>` of its own. Then `write()` puts it at `dist/<game>/index.html`, which GitHub Pages serves at `brainbrew.fun/<game>/`.

## Steps

1. **Add your page** as `src/<game>.html` (for example `src/wordy.html`). Keep it self-contained: inline CSS and JS, and put images in `src/assets/<game>/`. Include a link back home, for example `<a href="../">← Brainbrew</a>`.

2. **Build it into its own folder.** In `build()` in `build.js`, next to the Redwing line, add:

   ```js
   write(dist + '/wordy/index.html', page(src('wordy.html'), { title: 'Wordy', desc: 'One short line about the game.', path: 'wordy/' }));
   ```

   Copy any images the same way Redwing copies `og.png` and `icon-180.png`. Note that `meta()` currently points every page's preview image at `redwing/og.png`; if your game has its own picture, add an `image` option to `meta()` rather than changing Redwing's.

3. **List it on the home page.** In `src/hub.html`, add a card inside `<main class="shelf">`, before the "More games soon" card:

   ```html
   <a class="game" href="wordy/">
     <span class="tag">Daily word game</span>
     <h2>Wordy</h2>
     <p>One or two sentences that sell the game.</p>
     <span class="play">Play today's puzzle →</span>
   </a>
   ```

   Use the existing colour tokens (`--brew`, `--red`, `--muted` and so on) so it matches in light and dark mode.

4. **Daily puzzles:** if your game changes every day, pick the day's puzzle from the date so everyone gets the same one. Anything that must stay secret (answers) should not ship readable in the page; see how Redwing locks its cases in `build.js`. Ask Al before adding new repository secrets or services.

5. **Tests (optional but welcome):** `npm test` runs `src/test.js`. If your game has logic worth checking, add a check there or a small `src/<game>.test.js` and chain it in the `test` script in `package.json`. The deploy stops if tests fail.

6. **Analytics** come for free: the shell adds Cloudflare and GoatCounter to every page. To record game events, call `window.goatcounter.count({ path: '<game>/solved', event: true })` the way `src/app.html` does.

## Test locally

You need Node 22.

```sh
npm test
npm run build
npx serve dist        # or: python3 -m http.server -d dist 8000
```

Open the printed address, check the home page shows your card, and click through to `/<game>/`. Try it on a phone-width window too. Local Redwing cases differ from the live site because `REDWING_SECRET` isn't set; that's expected.

## Getting it live

`main` deploys automatically, so all changes go through a pull request:

1. Create a branch: `git checkout -b add-wordy`.
2. Commit, push, and open a pull request into `main` with a short description and a screenshot.
3. Al reviews it. Once Al merges it, the deploy workflow tests, builds and publishes the site within a few minutes.

Please don't push straight to `main`, and leave `.github/workflows/`, `worker/` and the Redwing files alone unless you've agreed a change with Al.
