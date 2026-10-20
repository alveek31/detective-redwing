# Brainbrew stats Worker

Counts Detective Redwing plays: for each daily case, how many people started, solved and failed, how many tries solvers needed, and the weekday theme. It stores no cookies, IPs or device details, only `case number, start/solve/fail, tries, theme, time`. Runs on Cloudflare's free tier (Workers + D1).

The game sends events only when `config.statsUrl` in `package.json` is set to this Worker's address.

## One-time setup in the Cloudflare dashboard

1. **Create the database.** Go to dash.cloudflare.com, then **Storage & databases > D1 SQL database > Create database**. Name it `redwing-stats` and click **Create**. (The Worker creates the table itself.)
2. **Create the Worker.** Go to **Compute (Workers) > Workers & Pages > Create > Start with Hello World!**. Name it `redwing-stats` and click **Deploy**.
3. **Paste the code.** On the new Worker's page click **Edit code**, delete everything in `worker.js`, paste the contents of `stats/worker.js` from this repo, then click **Deploy**.
4. **Connect the database.** On the Worker's page open the **Bindings** tab, click **Add binding**, choose **D1 database**, set the variable name to `DB`, pick `redwing-stats`, and click **Add binding** (deploy if asked).
5. **Set your private key.** Open **Settings > Variables and Secrets > Add**. Type: **Secret**, name: `STATS_KEY`, value: any long password you make up. Click **Deploy**.
6. **Copy the Worker's address** from the top of its page, e.g. `https://redwing-stats.yourname.workers.dev`, and put it in `package.json` as `"statsUrl"`. Pushing to `main` redeploys the game with tracking on.

## Viewing the numbers

- Dashboard: `https://redwing-stats.yourname.workers.dev/?key=YOUR_STATS_KEY` (bookmark it)
- Raw JSON: `.../stats.json?key=YOUR_STATS_KEY`

Without the right key both pages return "Not found".

## Notes

- One device counts once per case (the game remembers it played). The same person on two devices counts twice.
- "Unfinished" is started minus solved minus failed: people who made at least one accusation and walked away.
- Anyone could post fake events to `/e`; the Worker rejects anything that is not a real case number, event kind or try count, which is enough for a hobby site.
- If you change `worker.js`, paste it into the dashboard again (step 3).
