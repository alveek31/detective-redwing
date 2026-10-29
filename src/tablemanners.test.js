// Checks for Table Manners (src/tablemanners.html). Run: node src/tablemanners.test.js [days]
// 1. Every daily dinner (and a batch of practice dinners) has exactly one seating that satisfies its notes,
//    checked with a separate solver that works from the drawn room, not the game's own rule code.
// 2. Every note reads correctly in every scheduled room: right caller, right names, no repeats, one sentence.
// 3. The room calendar follows the rules: restaurant on weekdays, one room per weekend, holidays take over.
// 4. Built dinner files carry no answer, and their lock opens only with the right seating.
const fs = require('fs');
const html = fs.readFileSync(__dirname + '/tablemanners.html', 'utf8');
const js = html.split('<script>')[1].split('</script>')[0].replace('if(typeof document!=="undefined") boot();', '');
const E = require('./tablemanners-engine.js');
const { makeDinner, opensSeating } = require('../build.js');
const page = new Function(js + '; return {LAUNCH, textsFor, THEME_BY_ID, EVERYDAY, PRIORITY, WEEKEND, roomForDate, setT: (t) => { T = t; }, sideWords: (t) => sideWords(t)};')();
const G = { ...page, generate: E.generate, DAYS: E.DAYS, permutations: E.permutations };

const DAYS_TO_CHECK = +process.argv[2] || 400;
let failures = 0;
const fail = (...m) => { failures++; if (failures <= 20) console.error('FAIL', ...m); };

// --- 1. one answer per dinner, by brute force over every seating ---
const CX = 210, R = 124;
function seatXY(n, i) { const a = (-90 + i * 360 / n) * Math.PI / 180; return [CX + R * Math.cos(a), 207 + R * Math.sin(a)]; }
function side(n, i) { const x = seatXY(n, i)[0]; return x > CX + .5 ? 'window' : x < CX - .5 ? 'door' : null; }
const near = (n, i) => new Set([(i + n - 1) % n, (i + 1) % n]);
function ok(c, pos, n) {
  const A = pos[c.a], B = pos[c.b], C = pos[c.c];
  switch (c.t) {
    case 'head': return A === 0;
    case 'notHead': return A !== 0;
    case 'side': return side(n, A) === c.s;
    case 'notSide': return side(n, A) !== c.s;
    case 'adj': return near(n, A).has(B);
    case 'notAdj': return !near(n, A).has(B);
    case 'across': return n % 2 === 0 && (A - B + n) % n === n / 2;
    case 'notAcross': return !(n % 2 === 0 && (A - B + n) % n === n / 2);
    case 'two': return ((B - A + n) % n) - 1 === 1 || ((A - B + n) % n) - 1 === 1;
    case 'between': { const s = near(n, A); return s.has(B) && s.has(C) && B !== C; }
  }
  throw new Error('unknown rule ' + c.t);
}
const perms = {};
function check(p, label) {
  const n = p.n; perms[n] = perms[n] || G.permutations(n);
  const sol = {}; p.solution.forEach((s, g) => { sol[g] = s; });
  p.clues.forEach((c, i) => { if (!ok(c, sol, n)) fail(label, 'answer breaks note', i); });
  let count = 0;
  for (const perm of perms[n]) {
    const pos = {}; perm.forEach((g, s) => { pos[g] = s; });
    if (p.clues.every((c) => ok(c, pos, n)) && ++count > 1) break;
  }
  if (count !== 1) fail(label, 'has', count > 1 ? '2+' : count, 'seatings that fit');
}
const key = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const dinners = [];
for (let i = 0; i < DAYS_TO_CHECK; i++) {
  const d = new Date(G.LAUNCH.getFullYear(), G.LAUNCH.getMonth(), G.LAUNCH.getDate() + i), cfg = G.DAYS[d.getDay()];
  const p = G.generate('seat-them:' + key(d), cfg.n, cfg.level); check(p, key(d)); dinners.push(p);
}
for (let i = 0; i < 200; i++) { const cfg = G.DAYS[[1, 3, 4, 6][i % 4]]; const p = G.generate('practice:test-' + i, cfg.n, cfg.level); check(p, 'practice ' + i); dinners.push(p); }

// --- 2. notes read correctly in every room ---
const rooms = [...G.EVERYDAY, ...G.PRIORITY];
let notes = 0;
for (const p of dinners) for (const room of rooms) {
  const t = G.THEME_BY_ID[room]; G.setT(t);
  const tx = G.textsFor(p, room, t.circle), seen = new Set();
  p.clues.forEach((c, i) => {
    const x = tx[i], who = [c.a, c.b, c.c].filter((v) => v !== undefined), text = G.sideWords(x.text);
    notes++;
    if (x.mode === 'self' && x.caller !== c.a) fail(room, 'first-person note from the wrong guest');
    if (x.mode === 'other' && (x.caller === null || who.includes(x.caller))) fail(room, 'gossip about the caller themself');
    if (x.mode === 'self' && x.text.includes('{A}')) fail(room, 'first-person note names the caller', x.text);
    if (x.text.includes('{B}') !== (c.b !== undefined) || x.text.includes('{C}') !== (c.c !== undefined)) fail(room, 'wrong names in', x.text);
    if (seen.has(x.text)) fail(room, 'note repeated in one dinner', x.text); seen.add(x.text);
    if (t.sideNames && /window|door/i.test(text)) fail(room, 'mentions a window or door outdoors', text);
  });
}

// --- 3. the room calendar ---
const weekend = (d) => d.getDay() === 0 || d.getDay() === 6;
for (let i = 0; i < 365 * 2; i++) {
  const d = new Date(2026, 9, 1 + i), r = G.roomForDate(d);
  if (!r.holiday && !weekend(d) && r.room !== 'classic') fail(key(d), 'weekday shows', r.room);
  if (!r.holiday && weekend(d) && !G.WEEKEND.includes(r.room)) fail(key(d), 'weekend shows', r.room);
  if (d.getDay() === 6) { const sun = G.roomForDate(new Date(2026, 9, 2 + i)); if (sun.room !== r.room) fail(key(d), 'weekend split between', r.room, 'and', sun.room); }
}
for (const [date, room] of [['2026-10-31', 'halloween'], ['2026-11-26', 'thanksgiving'], ['2026-11-29', 'thanksgiving'], ['2026-12-25', 'christmas'], ['2027-01-01', 'newyear'], ['2027-02-14', 'valentine'], ['2027-03-09', 'eid'], ['2027-07-04', 'july4'], ['2026-11-10', 'classic']]) {
  const [y, m, dd] = date.split('-').map(Number), got = G.roomForDate(new Date(y, m - 1, dd)).room;
  if (got !== room) fail(date, 'expected', room, 'got', got);
}

// --- 4. what the page receives ---
for (let i = 0; i < 12; i++) {
  const cfg = G.DAYS[i % 7], id = 'lock-test-' + i, f = makeDinner(id, cfg, cfg.label, false, 1000), text = JSON.stringify(f);
  if ('solution' in f || 'open' in f || /solution|"open"/.test(text)) fail(id, 'dinner file leaks the answer');
  const p = E.generate('seat-them:' + id, cfg.n, cfg.level); // same seed as makeDinner without a build secret
  const right = []; p.solution.forEach((seat, guest) => { right[seat] = guest; });
  if (!process.env.REDWING_SECRET && !opensSeating(id, f.lock, right)) fail(id, 'lock does not open with the right seating');
  for (let k = 1; k < right.length; k++) { const wrong = right.slice(k).concat(right.slice(0, k));   // every rotation of the right plan is wrong
    if (opensSeating(id, f.lock, wrong)) fail(id, 'lock opens with a wrong seating'); }
  if (!makeDinner(id, cfg, cfg.label, true, 1000).open) fail(id, 'revealed dinner has no plan');
}

console.log('Table Manners: ' + dinners.length + ' dinners, ' + notes + ' notes across ' + rooms.length + ' rooms, 2 years of room calendar' + (failures ? ': ' + failures + ' problems' : ': all good'));
process.exit(failures ? 1 : 0);
