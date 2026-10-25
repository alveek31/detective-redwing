// Detective Redwing answer desk. After a player has made six wrong accusations on a daily case, the game sends
// the case's sealed desk copy and the six guesses here. The Worker opens the seal with a key only it and the site
// build can derive (HMAC of the seed secret), checks the guesses are six different wrong ones, and returns the
// answer. The answer never ships in the page in readable form.
const LAUNCH = '2026-10-20';
const ORIGINS = ['https://brainbrew.fun', 'https://www.brainbrew.fun', 'https://alveek31.github.io'];
const SIZE = 5, ATTEMPTS = 6;

function reply(body, status, origin) {
  const headers = { 'content-type': 'application/json', 'cache-control': 'no-store', vary: 'Origin' };
  if (ORIGINS.includes(origin)) Object.assign(headers, { 'access-control-allow-origin': origin, 'access-control-allow-methods': 'POST, OPTIONS', 'access-control-allow-headers': 'content-type' });
  return new Response(body === null ? null : JSON.stringify(body), { status, headers });
}
const b64 = (t) => Uint8Array.from(atob(t), (c) => c.charCodeAt(0));
async function openDesk(secret, date, desk) {
  const enc = new TextEncoder();
  const hk = await crypto.subtle.importKey('raw', enc.encode(secret || ''), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const raw = await crypto.subtle.sign('HMAC', hk, enc.encode('desk|' + date));
  const key = await crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['decrypt']);
  const buf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64(desk.iv) }, key, b64(desk.data));
  return JSON.parse(new TextDecoder().decode(buf));
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
    const ok = (n) => Number.isInteger(n) && n >= 0 && n < SIZE;
    const keys = new Set(g.map((x) => x && [x.s, x.w, x.l].join(',')));
    if (g.length !== ATTEMPTS || keys.size !== g.length || !g.every((x) => x && ok(x.s) && ok(x.w) && ok(x.l))) {
      return reply({ error: 'six different accusations are needed first' }, 403, origin);
    }
    let sealed;
    try { sealed = await openDesk(env.REDWING_SECRET, date, q.desk || {}); } catch (e) { return reply({ error: 'unknown case' }, 404, origin); }
    const a = sealed.answer;
    // A list holding the right answer is not a lost game, so it gets nothing back.
    if (g.some((x) => x.s === a.s && x.w === a.w && x.l === a.l)) return reply({ error: 'that case was solved' }, 403, origin);
    return reply(sealed.open, 200, origin);
  }
};
