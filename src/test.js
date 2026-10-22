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
