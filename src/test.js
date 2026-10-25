const R = require('./engine.js');
let dist = {}, mix = {}, fail = 0, t0 = Date.now(), maxMs = 0, N = +process.argv[2] || 300, runs = 0;
const ymd = (d) => d.toISOString().slice(0, 10);
function check(seed, opts) {
  const s = Date.now(); const c = R.generate(seed, opts); maxMs = Math.max(maxMs, Date.now() - s); runs++;
  const chk = c._check(), key = `${c.answer.s},${c.answer.w},${c.answer.l}`;
  if (chk.triples !== 1 || chk.keys[0] !== key) { fail++; console.log('not unique', seed, opts); }
  // minimality: dropping the last clue must leave >1 answer
  if (c._checkPrefix(c.clues.length - 1).triples < 2) { fail++; console.log('not minimal', seed, opts); }
  if (JSON.stringify(R.generate(seed, opts).clues) !== JSON.stringify(c.clues)) { fail++; console.log('not stable', seed, opts); }
  // a theft never names the stolen piece in the scene clue
  if (c.type === 'theft' && c.murderType === 'weapon') { fail++; console.log('theft names the piece', seed); }
  // every case has its own cast: five different surnames, none of them Redwing
  const sur = c.suspects.map((p) => p.name.split(' ').pop()).concat([c.victim.split(' ').pop()]);
  if (new Set(sur).size !== 6 || sur.includes('Redwing')) { fail++; console.log('bad cast', seed); }
  if (/undefined/.test(JSON.stringify(c.clues) + JSON.stringify(c.hints) + c.murderClue)) { fail++; console.log('undefined text', seed, opts); }
  dist[c.clues.length] = (dist[c.clues.length] || 0) + 1;
  return c;
}
// Daily cases from launch: unique answers, and the rotation never repeats a scene or runs three of a kind.
let prev = [];
for (let d = 0; d < N; d++) {
  const date = ymd(new Date(Date.UTC(2026, 9, 20 + d)));
  const c = check('daily-' + date);
  const tag = c.scene.id + '/' + c.type; mix[tag] = (mix[tag] || 0) + 1;
  if (prev[0] && prev[0].scene.id === c.scene.id) { fail++; console.log('same scene twice', date); }
  if (prev[1] && prev[0].type === c.type && prev[1].type === c.type) { fail++; console.log('three of a kind', date); }
  prev = [c, prev[0]];
}
// Every scene, both kinds, every weekday's codes.
R.SCENES.forEach((scene) => ['murder', 'theft'].forEach((type) => {
  for (let k = 0; k < 70; k++) check('practice-' + scene + type + k, { scene, type, weekday: k % 7 });
}));
console.log({ runs, fail, dist, mix, avgMs: (Date.now() - t0) / runs / 2, maxMs });
const c = R.generate('daily-2026-10-23');
console.log(c.scene.name, c.type, c.victim, '|', c.murderClue); c.clues.forEach((x, i) => console.log(' -', x.text, JSON.stringify(c.steps[i])));
c.hints.forEach(x => console.log(' H', x.text));
console.log('answer', c.suspects[c.answer.s].name, c.weapons[c.answer.w].name, c.locations[c.answer.l].name);
if (fail) process.exit(1);
// What ships to the browser: no answer, no proof, no decoded clues, and only the right accusation opens the lock.
const B = require('../build.js');
let leaks = 0;
for (let d = 0; d < 6; d++) {
  const date = new Date(Date.UTC(2026, 9, 20 + d)).toISOString().slice(0, 10);
  const full = R.generate(R.seedFor('test-secret', date)), pc = B.makeCase(date, false, 2000, 'test-secret'), txt = JSON.stringify(pc);
  if (/"answer"|"solution"|"steps"|"plain"|"method"|"open"/.test(txt)) { leaks++; console.log('field leak', date); }
  full.clues.forEach((x) => { if (x.code && txt.includes(x.plain)) { leaks++; console.log('decoded clue leak', date); } });
  let opened = 0;
  for (let s = 0; s < 5; s++) for (let w = 0; w < 5; w++) for (let l = 0; l < 5; l++) {
    const v = B.openLock(date, pc.lock, { s, w, l });
    if (v) { opened++; if (s !== full.answer.s || w !== full.answer.w || l !== full.answer.l || JSON.stringify(v.solution) !== JSON.stringify(full.solution)) { leaks++; console.log("wrong guess opened the lock", date, s, w, l); } }
  }
  if (opened !== 1) { leaks++; console.log('lock opened by', opened, 'guesses', date); }
}
if (!B.revealed('2026-10-24', new Date('2026-10-25T12:00:00Z')) || B.revealed('2026-10-24', new Date('2026-10-25T11:59:00Z'))) { leaks++; console.log('reveal timing'); }
console.log({ lockChecks: 6, leaks });
if (leaks) process.exit(1);
// Sunday Big Cases: harder (more clues, no outright sighting, three hints) but still exactly one answer.
let bigs = 0;
for (let k = 0; k < 40; k++) {
  const c = check('big-' + k, { weekday: 0 });
  if (!c.big || c.clues.length < 7 || c.hints.length > 3) { bigs++; console.log('big case too easy', k, c.clues.length, c.hints.length); }
}
for (let d = 0; d < 21; d++) {
  const date = ymd(new Date(Date.UTC(2026, 9, 20 + d))), c = R.generate('daily-' + date);
  if (c.big !== (new Date(date + 'T12:00:00Z').getUTCDay() === 0)) { bigs++; console.log('big case on wrong day', date); }
}
// The answer desk copy opens only with the seed secret and the matching date.
const crypto = require('crypto');
function openDesk(seedSecret, id, desk) {
  try {
    const raw = Buffer.from(desk.data, 'base64'), d = crypto.createDecipheriv('aes-256-gcm', B.deskKey(seedSecret, id), Buffer.from(desk.iv, 'base64'));
    d.setAuthTag(raw.subarray(raw.length - 16));
    return JSON.parse(Buffer.concat([d.update(raw.subarray(0, raw.length - 16)), d.final()]).toString());
  } catch (e) { return null; }
}
const dc = B.makeCase('2026-10-25', false, 2000, 'test-secret'), full = R.generate(R.seedFor('test-secret', '2026-10-25'));
const dv = openDesk('test-secret', '2026-10-25', dc.desk);
if (!dv || JSON.stringify(dv.answer) !== JSON.stringify(full.answer)) { bigs++; console.log('desk does not open'); }
if (openDesk('wrong', '2026-10-25', dc.desk) || openDesk('test-secret', '2026-10-24', dc.desk)) { bigs++; console.log('desk opens with the wrong key'); }
console.log({ bigChecks: bigs ? 'fail' : 'ok' });
if (bigs) process.exit(1);
