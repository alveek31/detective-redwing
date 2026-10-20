// Brainbrew stats: a Cloudflare Worker that counts anonymous Detective Redwing plays in a D1 database.
// POST /e    {c: case number, k: "start"|"solve"|"fail", n: accusations used, th: theme name}  (sent by the game)
// GET  /?key=STATS_KEY            owner-only dashboard
// GET  /stats.json?key=STATS_KEY  the same numbers as JSON
// No cookies, IPs or user agents are stored: each row is just a case number, event kind, try count, theme and time.

const LAUNCH = Date.UTC(2026, 9, 20); // Case No. 1
const KINDS = ["start", "solve", "fail"];
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" };

let ready = false;
async function setup(db) {
  if (ready) return;
  await db.prepare("CREATE TABLE IF NOT EXISTS events (case_no INTEGER NOT NULL, kind TEXT NOT NULL, tries INTEGER, theme TEXT, ts INTEGER NOT NULL)").run();
  await db.prepare("CREATE INDEX IF NOT EXISTS events_case ON events (case_no, kind)").run();
  ready = true;
}

function caseDate(n) { return new Date(LAUNCH + (n - 1) * 864e5).toISOString().slice(0, 10); }
function todayCase() { return Math.floor((Date.now() - LAUNCH) / 864e5) + 1; }

async function record(request, env) {
  let e;
  try { e = JSON.parse(await request.text()); } catch (err) { return new Response("bad json", { status: 400, headers: CORS }); }
  const c = Number(e.c), n = e.n == null ? null : Number(e.n);
  // Players ahead of or behind UTC can be one case either side of today.
  if (!Number.isInteger(c) || c < 1 || c > todayCase() + 1 || !KINDS.includes(e.k) || (n !== null && !(Number.isInteger(n) && n >= 1 && n <= 6)))
    return new Response("ignored", { status: 400, headers: CORS });
  const theme = typeof e.th === "string" ? e.th.slice(0, 40) : null;
  await setup(env.DB);
  await env.DB.prepare("INSERT INTO events (case_no, kind, tries, theme, ts) VALUES (?, ?, ?, ?, ?)").bind(c, e.k, n, theme, Date.now()).run();
  return new Response(null, { status: 204, headers: CORS });
}

async function stats(env) {
  await setup(env.DB);
  const { results } = await env.DB.prepare("SELECT case_no, kind, tries, MAX(theme) AS theme, COUNT(*) AS n FROM events GROUP BY case_no, kind, tries ORDER BY case_no DESC").all();
  const byCase = new Map(), byTheme = new Map();
  for (const r of results) {
    if (!byCase.has(r.case_no)) byCase.set(r.case_no, { case: r.case_no, date: caseDate(r.case_no), theme: null, started: 0, solved: 0, failed: 0, dist: [0, 0, 0, 0, 0, 0] });
    const d = byCase.get(r.case_no);
    if (r.theme) d.theme = r.theme;
    if (r.kind === "start") d.started += r.n;
    if (r.kind === "fail") d.failed += r.n;
    if (r.kind === "solve") { d.solved += r.n; if (r.tries >= 1 && r.tries <= 6) d.dist[r.tries - 1] += r.n; }
  }
  const days = [...byCase.values()];
  for (const d of days) {
    const t = d.theme || "Unknown";
    if (!byTheme.has(t)) byTheme.set(t, { theme: t, days: 0, started: 0, solved: 0, failed: 0, dist: [0, 0, 0, 0, 0, 0] });
    const s = byTheme.get(t);
    s.days++; s.started += d.started; s.solved += d.solved; s.failed += d.failed;
    d.dist.forEach((v, i) => { s.dist[i] += v; });
  }
  const finish = (x) => {
    const done = x.solved + x.failed;
    x.unfinished = Math.max(0, x.started - done);
    x.solveRate = done ? x.solved / done : null;
    const tries = x.dist.reduce((a, v, i) => a + v * (i + 1), 0);
    x.avgTries = x.solved ? tries / x.solved : null;
    return x;
  };
  const total = finish(days.reduce((a, d) => { a.started += d.started; a.solved += d.solved; a.failed += d.failed; d.dist.forEach((v, i) => { a.dist[i] += v; }); return a; }, { started: 0, solved: 0, failed: 0, dist: [0, 0, 0, 0, 0, 0] }));
  return { total, days: days.map(finish), themes: [...byTheme.values()].map(finish).sort((a, b) => (a.solveRate ?? 2) - (b.solveRate ?? 2)) };
}

const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
const pct = (x) => (x == null ? "–" : Math.round(x * 100) + "%");
const avg = (x) => (x == null ? "–" : x.toFixed(1));
function bars(dist) {
  const max = Math.max(1, ...dist);
  return '<span class="dist">' + dist.map((v, i) => '<span title="' + v + " solved in " + (i + 1) + '"><i style="height:' + Math.round((v / max) * 100) + '%"></i><b>' + (i + 1) + "</b></span>").join("") + "</span>";
}
function row(first, x) {
  return "<tr><td>" + first + "</td><td>" + x.started + "</td><td>" + x.solved + "</td><td>" + x.failed + "</td><td>" + x.unfinished + "</td><td><strong>" + pct(x.solveRate) + "</strong></td><td>" + avg(x.avgTries) + "</td><td>" + bars(x.dist) + "</td></tr>";
}
const HEAD = "<tr><th></th><th>Started</th><th>Solved</th><th>Failed</th><th>Unfinished</th><th>Solve rate</th><th>Avg tries</th><th>Solved in 1–6</th></tr>";

function page(s) {
  const t = s.total;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex">
<title>Redwing stats</title><style>
:root{--bg:#faf8f4;--fg:#1f1b16;--muted:#6b6358;--line:#e4ddd2;--accent:#a3261c;--bar:#c9a98f}
@media (prefers-color-scheme: dark){:root{--bg:#171513;--fg:#ece6dc;--muted:#a39a8d;--line:#332e28;--accent:#e0675b;--bar:#6e5a4a}}
body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.45 system-ui,sans-serif}
main{max-width:960px;margin:0 auto;padding:24px 16px 48px}
h1{font-size:22px;margin:0 0 4px}h2{font-size:16px;margin:32px 0 8px}p{color:var(--muted);margin:0 0 16px}
.tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px}
.tile{border:1px solid var(--line);border-radius:10px;padding:12px}.tile b{display:block;font-size:26px}.tile span{color:var(--muted);font-size:13px}
.wrap{overflow-x:auto}table{border-collapse:collapse;width:100%;min-width:640px}
th,td{text-align:right;padding:7px 8px;border-bottom:1px solid var(--line);white-space:nowrap}th{color:var(--muted);font-weight:500;font-size:13px}
td:first-child,th:first-child{text-align:left}strong{color:var(--accent)}
.dist{display:inline-flex;gap:3px;align-items:flex-end;height:28px}.dist span{display:flex;flex-direction:column;justify-content:flex-end;width:14px;height:100%}
.dist i{display:block;background:var(--bar);border-radius:2px 2px 0 0;min-height:1px}.dist b{font-size:10px;font-weight:400;color:var(--muted);text-align:center}
</style></head><body><main>
<h1>Detective Redwing stats</h1><p>Daily cases only. One device counts once per case. Solve rate is solved out of finished games.</p>
<div class="tiles"><div class="tile"><b>${t.started}</b><span>games started</span></div><div class="tile"><b>${t.solved}</b><span>solved</span></div><div class="tile"><b>${t.failed}</b><span>failed (6 wrong)</span></div><div class="tile"><b>${pct(t.solveRate)}</b><span>solve rate</span></div><div class="tile"><b>${avg(t.avgTries)}</b><span>avg tries to solve</span></div></div>
<h2>By day</h2><div class="wrap"><table>${HEAD}${s.days.map((d) => row("#" + d.case + " · " + d.date + "<br><small>" + esc(d.theme || "") + "</small>", d)).join("") || '<tr><td colspan="8">No plays yet.</td></tr>'}</table></div>
<h2>By weekday theme (hardest first)</h2><div class="wrap"><table>${HEAD}${s.themes.map((x) => row(esc(x.theme) + "<br><small>" + x.days + " day" + (x.days === 1 ? "" : "s") + "</small>", x)).join("")}</table></div>
</main></body></html>`;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
    if (request.method === "POST" && url.pathname === "/e") return record(request, env);
    if (request.method === "GET" && (url.pathname === "/" || url.pathname === "/stats.json")) {
      if (!env.STATS_KEY || url.searchParams.get("key") !== env.STATS_KEY) return new Response("Not found", { status: 404 });
      const s = await stats(env);
      if (url.pathname === "/stats.json") return Response.json(s, { headers: { "Cache-Control": "no-store" } });
      return new Response(page(s), { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
    }
    return new Response("Not found", { status: 404 });
  },
};
