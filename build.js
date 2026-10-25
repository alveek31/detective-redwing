// Builds the Brainbrew site: dist/index.html (game shelf) and dist/redwing/ (Detective Redwing).
// Redwing cases are generated here, not in the browser: each case file carries the clues and an encrypted lock,
// never the answer or the solver. The lock opens only with the right accusation (see lockCase).
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Redwing = require('./src/engine.js');
const src = (f) => fs.readFileSync(__dirname + '/src/' + f, 'utf8');
const cfg = require('./package.json').config || {};

const LAUNCH = '2026-10-20';
const ITER = 300000;        // PBKDF2 rounds per accusation check: a moment on a phone, and slow to brute-force
const PRACTICE = 40;        // size of the practice pool
const ymd = (d) => d.toISOString().slice(0, 10);

// What the page may see: the people, items, rooms and coded clues. Decoded clues, the answer and the proof stay locked.
function publicCase(id, c) {
  return {
    id, type: c.type, scene: c.scene, words: c.words, theme: c.theme, victim: c.victim,
    suspects: c.suspects, weapons: c.weapons, locations: c.locations, murderClue: c.murderClue, attempts: c.attempts,
    clues: c.clues.map((x) => ({ text: x.text, code: x.code, puzzle: x.puzzle, cipher: x.cipher, source: x.source, speaker: x.speaker })),
    hints: c.hints.map((x) => ({ text: x.text }))
  };
}
function secret(c) {
  return { answer: c.answer, solution: c.solution, steps: c.steps, plains: c.clues.map((x) => ({ plain: x.plain, method: x.method })) };
}
function guessKey(id, g, salt, iter) { return crypto.pbkdf2Sync(id + '|' + g.s + ',' + g.w + ',' + g.l, salt, iter, 32, 'sha256'); }
function lockCase(id, c, iter) {
  const salt = crypto.randomBytes(16), iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', guessKey(id, c.answer, salt, iter), iv);
  const data = Buffer.concat([cipher.update(JSON.stringify(secret(c)), 'utf8'), cipher.final(), cipher.getAuthTag()]);
  return { salt: salt.toString('base64'), iv: iv.toString('base64'), iter, data: data.toString('base64') };
}
function openLock(id, lock, g) {
  try {
    const raw = Buffer.from(lock.data, 'base64'), tag = raw.subarray(raw.length - 16);
    const d = crypto.createDecipheriv('aes-256-gcm', guessKey(id, g, Buffer.from(lock.salt, 'base64'), lock.iter), Buffer.from(lock.iv, 'base64'));
    d.setAuthTag(tag);
    return JSON.parse(Buffer.concat([d.update(raw.subarray(0, raw.length - 16)), d.final()]).toString('utf8'));
  } catch (e) { return null; }
}
function makeCase(id, seed, reveal, iter) {
  const c = Redwing.generate(seed);
  if (c._check().triples !== 1) throw new Error('Case ' + id + ' does not have exactly one answer');
  const out = publicCase(id, c);
  out.lock = lockCase(id, c, iter || ITER);
  if (reveal) out.open = secret(c);
  return out;
}
// A daily case is revealed to everyone once that date has ended in every time zone (noon UTC the next day).
function revealed(date, now) { return Date.parse(date + 'T00:00:00Z') + 36 * 3600e3 <= now.getTime(); }
function practiceCode(i) { return crypto.createHash('sha256').update('practice-' + i).digest('hex').slice(0, 5).toUpperCase(); }

function build() {
  const analytics = (cfg.cloudflareBeacon ? '<script type="module" src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon=\'{"token": "' + cfg.cloudflareBeacon + '"}\'></script>\n' : '') +
    (cfg.goatcounter ? '<script data-goatcounter="https://' + cfg.goatcounter + '.goatcounter.com/count" async src="https://gc.zgo.at/count.js"></script>\n' : '');
  const page = (body) => '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n<style>[hidden]{display:none!important} body{margin:0}</style>\n</head>\n<body>\n' + body + '\n' + analytics + '</body>\n</html>\n';
  const write = (file, text) => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, text); };
  const dist = __dirname + '/dist';
  fs.rmSync(dist + '/redwing/cases', { recursive: true, force: true });

  write(dist + '/index.html', page(src('hub.html')));
  write(dist + '/redwing/index.html', page(src('app.html').replace('<!--HOME-->', '<a class="home" href="../">← Brainbrew</a>')));

  // Daily cases for the archive week and a few days ahead, so every time zone has today's case between nightly builds.
  const now = new Date(), index = { launch: LAUNCH, daily: {}, practice: [] };
  for (let k = -8; k <= 3; k++) {
    const date = ymd(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + k)));
    if (date < LAUNCH) continue;
    const c = makeCase(date, 'daily-' + date, revealed(date, now));
    write(dist + '/redwing/cases/' + date + '.json', JSON.stringify(c));
    index.daily[date] = { scene: c.scene.id, type: c.type };
  }
  // Practice cases do not count toward anything, so their answers come unlocked for the end-of-game reveal.
  for (let i = 0; i < PRACTICE; i++) {
    const code = practiceCode(i);
    write(dist + '/redwing/cases/p-' + code + '.json', JSON.stringify(makeCase('p-' + code, 'practice-' + code, true)));
    index.practice.push(code);
  }
  write(dist + '/redwing/cases/index.json', JSON.stringify(index));
  console.log('Built dist/index.html, dist/redwing/index.html, ' + Object.keys(index.daily).length + ' daily and ' + PRACTICE + ' practice cases');
}

module.exports = { publicCase, makeCase, openLock, revealed };
if (require.main === module) build();
