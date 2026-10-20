const R = require('./engine.js');
let dist = {}, fail = 0, t0 = Date.now(), maxMs = 0, N = +process.argv[2] || 300;
for (let d = 0; d < N; d++) {
  const s = Date.now(); const c = R.generate('daily-' + d); maxMs = Math.max(maxMs, Date.now() - s);
  const chk = c._check(), key = `${c.answer.s},${c.answer.w},${c.answer.l}`;
  if (chk.triples !== 1 || chk.keys[0] !== key) fail++;
  // minimality: dropping the last clue must leave >1 answer
  if (c._checkPrefix(c.clues.length - 1).triples < 2) fail++;
  if (JSON.stringify(R.generate('daily-' + d).clues) !== JSON.stringify(c.clues)) fail++;
  dist[c.clues.length] = (dist[c.clues.length] || 0) + 1;
}
console.log({ N, fail, dist, avgMs: (Date.now() - t0) / N / 2, maxMs });
const c = R.generate('daily-2026-10-20');
console.log(c.victim, '|', c.murderClue); c.clues.forEach((x,i) => console.log(' -', x.text, JSON.stringify(c.steps[i])));
c.hints.forEach(x => console.log(' H', x.text));
console.log('answer', c.suspects[c.answer.s].name, c.weapons[c.answer.w].name, c.locations[c.answer.l].name);
