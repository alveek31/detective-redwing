// Detective Redwing answer desk. After a player has made six wrong accusations on a daily case, the game sends
// them here and gets the answer back. The answer never ships in the page; this Worker rebuilds it from the
// seed secret, which only it and the site build know.
import Redwing from '../src/engine.js';

const LAUNCH = '2026-10-20';
const ORIGINS = ['https://brainbrew.fun', 'https://www.brainbrew.fun', 'https://alveek31.github.io'];

function reply(body, status, origin) {
  const headers = { 'content-type': 'application/json', 'cache-control': 'no-store', vary: 'Origin' };
  if (ORIGINS.includes(origin)) Object.assign(headers, { 'access-control-allow-origin': origin, 'access-control-allow-methods': 'POST, OPTIONS', 'access-control-allow-headers': 'content-type' });
  return new Response(body === null ? null : JSON.stringify(body), { status, headers });
}

export default {
  async fetch(req, env) {
    const origin = req.headers.get('origin') || '';
    if (req.method === 'OPTIONS') return reply(null, 204, origin);
    if (req.method !== 'POST' || new URL(req.url).pathname !== '/redwing/reveal') return reply({ error: 'not found' }, 404, origin);
    let q;
    try { q = await req.json(); } catch (e) { return reply({ error: 'bad request' }, 400, origin); }
    const date = String(q && q.date || '');
    // Only real daily cases, and nothing beyond tomorrow (UTC) so future answers can't be fished out early.
    const latest = new Date(Date.now() + 864e5).toISOString().slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < LAUNCH || date > latest) return reply({ error: 'unknown case' }, 404, origin);
    const g = Array.isArray(q.guesses) ? q.guesses : [];
    const ok = (n) => Number.isInteger(n) && n >= 0 && n < Redwing.SIZE;
    const keys = new Set(g.map((x) => x && [x.s, x.w, x.l].join(',')));
    if (g.length !== Redwing.ATTEMPTS || keys.size !== g.length || !g.every((x) => x && ok(x.s) && ok(x.w) && ok(x.l))) {
      return reply({ error: 'six different accusations are needed first' }, 403, origin);
    }
    const c = Redwing.generate(Redwing.seedFor(env.REDWING_SECRET, date));
    const a = c.answer;
    // A list holding the right answer is not a lost game, so it gets nothing back.
    if (g.some((x) => x.s === a.s && x.w === a.w && x.l === a.l)) return reply({ error: 'that case was solved' }, 403, origin);
    return reply(Redwing.secretOf(c), 200, origin);
  }
};
