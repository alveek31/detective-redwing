// Detective Redwing case engine: seeded generation + brute-force uniqueness check.
var Redwing = (function () {
  var SUSPECTS = [
    { name: "Lady Vesper", tall: true, left: false, role: "the widowed aunt" },
    { name: "Dr. Thorne", tall: true, left: true, role: "the family physician" },
    { name: "Miss Hollis", tall: false, left: false, role: "the governess" },
    { name: "Captain Grey", tall: true, left: false, role: "a retired naval officer" },
    { name: "Reverend Ashby", tall: false, left: true, role: "the village vicar" },
    { name: "Madame Lark", tall: false, left: false, role: "a touring soprano" },
    { name: "Mr. Fennick", tall: false, left: true, role: "the estate solicitor" },
    { name: "Professor Quill", tall: true, left: true, role: "an amateur chemist" }
  ];
  var WEAPONS = [
    { name: "Candlestick", heavy: true },
    { name: "Letter Opener", heavy: false },
    { name: "Revolver", heavy: false },
    { name: "Poison Vial", heavy: false },
    { name: "Rope", heavy: false },
    { name: "Fire Poker", heavy: true },
    { name: "Walking Cane", heavy: true },
    { name: "Bronze Bust", heavy: true }
  ];
  var LOCATIONS = [
    { name: "Library", outdoor: false },
    { name: "Conservatory", outdoor: false },
    { name: "Wine Cellar", outdoor: false },
    { name: "Billiard Room", outdoor: false },
    { name: "Garden Maze", outdoor: true },
    { name: "Stables", outdoor: true },
    { name: "Boathouse", outdoor: true },
    { name: "Orchard", outdoor: true }
  ];
  var VICTIMS = [
    "Lord Ashcombe", "Sir Edmund Pryce", "Mrs. Delacourt", "Colonel Hartley",
    "Baroness Wren", "Mr. Silas Mott", "Lady Imogen Crane", "Judge Albright"
  ];
  var TRIVIA = {
    "Candlestick": "weapon that named the San Francisco Giants' old ballpark",
    "Letter Opener": "weapon also known as a paper knife",
    "Revolver": "weapon that titles the Beatles' 1966 album",
    "Poison Vial": "weapon Romeo bought from a poor apothecary",
    "Rope": "weapon that titles Hitchcock's 1948 film",
    "Fire Poker": "weapon Wittgenstein reportedly brandished at Karl Popper",
    "Walking Cane": "weapon that, made of sugar, hangs on Christmas trees",
    "Bronze Bust": "weapon cast in the alloy that names the age after the Stone Age",
    "Library": "room the ancient city of Alexandria made legendary",
    "Conservatory": "room that shares its name with a school of music",
    "Wine Cellar": "room where a sommelier would keep the Bordeaux",
    "Billiard Room": "room where you would hear talk of cues, breaks and pockets",
    "Garden Maze": "place a Minotaur would feel at home",
    "Stables": "place Hercules cleaned for King Augeas",
    "Boathouse": "building where rowers keep their eights",
    "Orchard": "place Newton is said to have watched an apple fall"
  };
  // General-knowledge disguises: you must know what these things are a type of to tell which item or room is meant.
  var KNOW = {
    "Candlestick": "item that held a beeswax taper",
    "Letter Opener": "item a clerk would slide under a seal",
    "Revolver": "weapon of the Colt and Webley kind",
    "Poison Vial": "item that once held belladonna",
    "Rope": "item tied in a bowline and a sheepshank",
    "Fire Poker": "item from the companion set by the hearth",
    "Walking Cane": "item cut from malacca or blackthorn",
    "Bronze Bust": "item cast by the same craft as Rodin's Thinker",
    "Library": "room shelved with Jane Eyre, Middlemarch and Persuasion",
    "Conservatory": "room where the Monstera and the Calathea grow",
    "Wine Cellar": "room that holds the Merlot, the Malbec and the Shiraz",
    "Billiard Room": "room where guests practise the massé and the jump shot",
    "Garden Maze": "place built on the pattern of the Cretan labyrinth",
    "Stables": "place where the Arabian, the Clydesdale and the Shire sleep",
    "Boathouse": "building that holds the skiff, the punt and the coracle",
    "Orchard": "place where the Bramleys and the Cox grow"
  };
  var SIZE = 5;
  var ATTEMPTS = 6;

  function hash(str) {
    var h = 1779033703 ^ str.length;
    for (var i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    return h >>> 0;
  }
  function rngFrom(seed) {
    var a = hash(String(seed));
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function shuffle(arr, rng) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function pick(arr, rng) { return arr[Math.floor(rng() * arr.length)]; }

  function permutations(n) {
    var out = [];
    (function rec(cur, used) {
      if (cur.length === n) { out.push(cur.slice()); return; }
      for (var i = 0; i < n; i++) if (!used[i]) {
        used[i] = true; cur.push(i); rec(cur, used); cur.pop(); used[i] = false;
      }
    })([], []);
    return out;
  }
  var PERMS = permutations(SIZE);
  var ALL = [];
  PERMS.forEach(function (w) { PERMS.forEach(function (l) { ALL.push({ w: w, l: l }); }); });

  function mixed(list, key) {
    var t = 0; list.forEach(function (x) { if (x[key]) t++; });
    return t > 0 && t < list.length;
  }

  function buildCandidates(S, W, L, sol, m, rng) {
    var c = [];
    var w = sol.w, l = sol.l;
    function add(text, f, kind) { c.push({ text: text, f: f, kind: kind }); }
    var negS = [
      function (s, x) { return s + " never touched the " + x + "."; },
      function (s, x) { return "Whatever " + s + " was holding, it was not the " + x + "."; }
    ];
    var negL = [
      function (s, x) { return s + " was nowhere near the " + x + "."; },
      function (s, x) { return s + " was not in the " + x + "."; }
    ];
    var negWL = [
      function (x, y) { return "The " + x + " was not found in the " + y + "."; },
      function (x, y) { return "Nobody carried the " + x + " into the " + y + "."; }
    ];
    for (var i = 0; i < SIZE; i++) {
      for (var j = 0; j < SIZE; j++) {
        (function (i, j) {
          if (w[i] === j) {
            if (i !== m) add(S[i].name + " was seen carrying the " + W[j].name + ".", function (a) { return a.w[i] === j; }, "pos");
          } else add(pick(negS, rng)(S[i].name, W[j].name), function (a) { return a.w[i] !== j; }, "neg");
          if (l[i] === j) {
            if (i !== m) add(S[i].name + " spent the evening in the " + L[j].name + ".", function (a) { return a.l[i] === j; }, "pos");
          } else add(pick(negL, rng)(S[i].name, L[j].name), function (a) { return a.l[i] !== j; }, "neg");
        })(i, j);
      }
    }
    // weapon / location pairs
    for (var wj = 0; wj < SIZE; wj++) for (var lk = 0; lk < SIZE; lk++) (function (wj, lk) {
      var holder = w.indexOf(wj);
      var together = l[holder] === lk;
      var f = function (a) { var h = a.w.indexOf(wj); return (a.l[h] === lk) === together; };
      if (together) {
        if (holder !== m) add("The " + W[wj].name + " turned up in the " + L[lk].name + ".", f, "pos");
      } else add(pick(negWL, rng)(W[wj].name, L[lk].name), f, "neg");
    })(wj, lk);
    // "either A or B" clues: one of the two named guests is the true one
    for (var e = 0; e < SIZE; e++) (function (e) {
      var o = (e + 1 + Math.floor(rng() * (SIZE - 1))) % SIZE;
      var pair = rng() < 0.5 ? [e, o] : [o, e];
      var we = w[e], le = l[e];
      add("Either " + S[pair[0]].name + " or " + S[pair[1]].name + " had the " + W[we].name + ".",
        function (a) { return a.w[e] === we || a.w[o] === we; }, "or");
      add("The " + L[le].name + " was occupied by either " + S[pair[0]].name + " or " + S[pair[1]].name + ".",
        function (a) { return a.l[e] === le || a.l[o] === le; }, "or");
    })(e);
    for (var s = 0; s < SIZE; s++) (function (s) {
      var out = L[l[s]].outdoor;
      add(S[s].name + "'s shoes were " + (out ? "caked in mud, so they were outdoors" : "spotless, so they stayed indoors") + ".",
        function (a) { return L[a.l[s]].outdoor === out; }, "attr");
      var hv = W[w[s]].heavy;
      add(S[s].name + " carried a " + (hv ? "heavy" : "light") + " object all evening.",
        function (a) { return W[a.w[s]].heavy === hv; }, "attr");
    })(s);
    for (var k = 0; k < SIZE; k++) (function (k) {
      var who = l.indexOf(k);
      var tall = S[who].tall, left = S[who].left;
      add("The person in the " + L[k].name + " was " + (tall ? "tall" : "short") + ".",
        function (a) { return S[a.l.indexOf(k)].tall === tall; }, "attr");
      add("Whoever was in the " + L[k].name + " is " + (left ? "left" : "right") + "-handed.",
        function (a) { return S[a.l.indexOf(k)].left === left; }, "attr");
    })(k);
    for (var q = 0; q < SIZE; q++) (function (q) {
      var out = L[l[w.indexOf(q)]].outdoor;
      add("The " + W[q].name + " was " + (out ? "found outdoors, damp with dew" : "kept indoors all night") + ".",
        function (a) { return L[a.l[a.w.indexOf(q)]].outdoor === out; }, "attr");
    })(q);
    return c;
  }

  function murderClue(S, W, L, sol, m, rng) {
    var opts = [];
    var lm = sol.l[m], wm = sol.w[m];
    opts.push({
      type: "location",
      text: "The body was found in the " + L[lm].name + ".",
      who: function (a) { return a.l.indexOf(lm); }
    });
    opts.push({
      type: "weapon",
      text: "The coroner is certain: the fatal blow came from the " + W[wm].name + ".",
      who: function (a) { return a.w.indexOf(wm); }
    });
    var sameTrait = S.filter(function (x) { return x.tall === S[m].tall && x.left === S[m].left; }).length;
    if (sameTrait === 1) opts.push({
      type: "trait",
      text: "A maid glimpsed the killer fleeing: " + (S[m].tall ? "tall" : "short") + " and " + (S[m].left ? "left" : "right") + "-handed.",
      who: function () { return m; }
    });
    return pick(opts, rng);
  }

  function filter(pool, clues) {
    return pool.filter(function (a) { for (var j = 0; j < clues.length; j++) if (!clues[j].f(a)) return false; return true; });
  }
  function answers(clues, mc, pool) {
    var seen = {}, n = 0, consistent = 0, src = pool || ALL;
    for (var i = 0; i < src.length; i++) {
      var a = src[i], ok = true;
      for (var j = 0; j < clues.length; j++) if (!clues[j].f(a)) { ok = false; break; }
      if (!ok) continue;
      consistent++;
      var who = mc.who(a);
      var key = who + "," + a.w[who] + "," + a.l[who];
      if (!seen[key]) { seen[key] = true; n++; }
    }
    return { triples: n, consistent: consistent, keys: Object.keys(seen) };
  }
  // Facts (suspect-weapon, suspect-room) that hold in every assignment still possible.
  function certain(pool) {
    var out = [];
    for (var i = 0; i < SIZE; i++) {
      var w0 = pool[0].w[i], l0 = pool[0].l[i], wSame = true, lSame = true;
      for (var k = 1; k < pool.length; k++) { if (pool[k].w[i] !== w0) wSame = false; if (pool[k].l[i] !== l0) lSame = false; }
      if (wSame) out.push("w" + i + ":" + w0);
      if (lSame) out.push("l" + i + ":" + l0);
    }
    return out;
  }

  function anagram(word, rng) {
    for (var t = 0; t < 20; t++) {
      var a = shuffle(word.split(""), rng).join("");
      if (a !== word) return a;
    }
    return word.split("").reverse().join("");
  }
  function caesar(text, k) {
    return text.replace(/[A-Za-z]/g, function (ch) {
      var base = ch <= "Z" ? 65 : 97;
      return String.fromCharCode((ch.charCodeAt(0) - base + k) % 26 + base);
    });
  }
  function cap(t) { return t.charAt(0).toUpperCase() + t.slice(1); }
  var MORSE = { A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.", G: "--.", H: "....", I: "..", J: ".---", K: "-.-", L: ".-..", M: "--",
    N: "-.", O: "---", P: ".--.", Q: "--.-", R: ".-.", S: "...", T: "-", U: "..-", V: "...-", W: ".--", X: "-..-", Y: "-.--", Z: "--.." };
  function atbash(text) {
    return text.replace(/[A-Za-z]/g, function (ch) {
      var base = ch <= "Z" ? 65 : 97;
      return String.fromCharCode(25 - (ch.charCodeAt(0) - base) + base);
    });
  }
  // Ways to disguise one name inside a clue. Each returns the replacement phrase and the label shown to players.
  var NAME_CODES = {
    anagram: function (word, cat, rng) { var a = anagram(word, rng); return { phrase: cat + " is an anagram of " + a, label: "Anagram", token: a }; },
    numbers: function (word, cat) {
      var t = word.split("").map(function (ch) { return ch.charCodeAt(0) - 64; }).join("-");
      return { phrase: cat + " spells " + t, label: "Number code · A=1, B=2 … Z=26", token: t };
    },
    morse: function (word, cat) { var t = word.split("").map(function (ch) { return MORSE[ch]; }).join(" "); return { phrase: cat + " is " + t, label: "Morse code", token: t }; },
    mirror: function (word, cat) { var t = word.split("").reverse().join(""); return { phrase: cat + " reads " + t + " backwards", label: "Mirror writing", token: t }; }
  };
  var NOTE_CODES = {
    caesar: function (text, rng) { var k = 2 + Math.floor(rng() * 6); return { text: caesar(text, k), label: "Coded note · shift each letter back " + k }; },
    atbash: function (text) { return { text: atbash(text), label: "Coded note · mirrored alphabet: A↔Z, B↔Y, C↔X …" }; },
    reverse: function (text) { return { text: text.split("").reverse().join(""), label: "Coded note · read it backwards" }; }
  };
  // One theme per weekday (0 = Sunday), so each day of the week plays differently.
  var THEMES = [
    { name: "Grand Sunday", codes: ["morse", "knowledge", "trivia", "anagram", "caesar"] },
    { name: "Gentle Monday", codes: ["knowledge", "trivia"] },
    { name: "Scrambled Tuesday", codes: ["anagram", "knowledge", "caesar"] },
    { name: "Numbers Wednesday", codes: ["numbers", "knowledge", "atbash"] },
    { name: "Looking-glass Thursday", codes: ["mirror", "trivia", "reverse"] },
    { name: "Telegraph Friday", codes: ["morse", "knowledge", "caesar"] },
    { name: "Puzzler's Saturday", codes: ["anagram", "numbers", "knowledge", "trivia", "atbash"] }
  ];
  function letters(name) { return name.toUpperCase().replace(/[^A-Z]/g, ""); }
  // Find a name in the clue that a code can replace. Suspects use their surname; items and rooms need "the X".
  function findName(c, S, W, L, code) {
    if (code !== "trivia" && code !== "knowledge") {
      var s = S.filter(function (x) { return c.text.indexOf(x.name) >= 0 && c.text.indexOf(x.name + "'s") < 0; })[0];
      if (s) return { from: s.name, word: letters(s.name.split(" ").pop()), cat: "the guest whose surname", the: false, name: s.name };
    }
    var groups = [[W, "the weapon whose name"], [L, "the place whose name"]];
    for (var g = 0; g < groups.length; g++) {
      var e = groups[g][0].filter(function (x) { return c.text.indexOf("the " + x.name) >= 0 || c.text.indexOf("The " + x.name) >= 0; })[0];
      if (e) return { from: e.name, word: letters(e.name), cat: groups[g][1], the: true, name: e.name };
    }
    return null;
  }
  function swapName(text, hit, phrase) {
    if (hit.the) {
      var bare = phrase.replace(/^the /, "");
      return text.replace("the " + hit.from, "the " + bare).replace("The " + hit.from, "The " + bare);
    }
    var at = text.indexOf(hit.from), out = text.replace(hit.from, phrase);
    return at === 0 ? cap(out) : out;
  }
  // Rewrite core clues as puzzles following the day's theme: one code per clue, never two on the same clue.
  function encodeCryptic(clues, S, W, L, rng, theme) {
    var out = clues.map(function (c) { return { text: c.text, plain: c.text, kind: c.kind, f: c.f, code: null }; });
    var free = shuffle(out.map(function (_, i) { return i; }), rng);
    free = free.slice(0, Math.max(1, out.length - 2));  // always leave at least two plain clues
    theme.codes.forEach(function (code) {
      for (var n = 0; n < free.length; n++) {
        var c = out[free[n]];
        if (NOTE_CODES[code]) {
          var r = NOTE_CODES[code](c.text, rng);
          c.text = r.text; c.code = "Coded note"; c.method = r.label.replace("Coded note · ", ""); c.cipher = true;
        } else {
          var hit = findName(c, S, W, L, code);
          if (!hit) continue;
          var nc = NAME_CODES[code] ? NAME_CODES[code](hit.word, hit.cat, rng) : null;
          var phrase = code === "trivia" ? "the " + TRIVIA[hit.name] : code === "knowledge" ? "the " + KNOW[hit.name] : nc.phrase;
          c.text = swapName(c.text, hit, phrase);
          c.code = code === "trivia" ? "Trivia" : code === "knowledge" ? "General knowledge · what is it a type of?" : nc.label;
          if (nc) c.puzzle = { type: code, token: nc.token };
        }
        free.splice(n, 1);
        return;
      }
    });
    return out;
  }

  // Where each piece of evidence came from: the household staff, outside witnesses, or the detective's own eyes.
  var SOURCES = ["household", "witness", "observed"];
  var STAFF = ["The butler", "The cook", "The footman", "A housemaid", "The chauffeur", "The head gardener"];
  var WITNESSES = ["The village constable", "A passing postman", "The vicar's wife", "A neighbouring farmer", "The station porter", "The doctor's receptionist"];
  function assignSources(clues, rng) {
    var staff = shuffle(STAFF, rng), wit = shuffle(WITNESSES, rng), turn = rng() < 0.5 ? 0 : 1;
    clues.forEach(function (c) {
      if (/shoes|found|kept indoors|turned up/.test(c.plain)) c.source = "observed";
      else { c.source = turn % 2 ? "witness" : "household"; turn++; }
    });
    // Make sure every case uses all three kinds of evidence where it can.
    SOURCES.forEach(function (src) {
      if (clues.some(function (c) { return c.source === src; })) return;
      var counts = {}; clues.forEach(function (c) { counts[c.source] = (counts[c.source] || 0) + 1; });
      var donor = clues.filter(function (c) { return counts[c.source] > 1 && (src !== "observed" || c.cipher); })[0];
      if (donor) donor.source = src;
    });
    var si = 0, wi = 0;
    clues.forEach(function (c) {
      if (c.source === "household") c.speaker = staff[si++ % staff.length];
      else if (c.source === "witness") c.speaker = wit[wi++ % wit.length];
      else if (c.cipher) c.speaker = "A note you found";
    });
    return clues.slice().sort(function (a, b) { return SOURCES.indexOf(a.source) - SOURCES.indexOf(b.source); });
  }

  function generate(seed, opts) {
    var rng = rngFrom(seed);
    var dm = String(seed).match(/(\d{4})-(\d{2})-(\d{2})$/);
    var weekday = opts && opts.weekday != null ? opts.weekday
      : dm ? new Date(+dm[1], +dm[2] - 1, +dm[3]).getDay() : Math.floor(rng() * 7);
    var theme = THEMES[weekday];
    for (var tries = 0; tries < 60; tries++) {
      var S, W, L;
      do { S = shuffle(SUSPECTS, rng).slice(0, SIZE); } while (!mixed(S, "tall") || !mixed(S, "left"));
      do { W = shuffle(WEAPONS, rng).slice(0, SIZE); } while (!mixed(W, "heavy"));
      do { L = shuffle(LOCATIONS, rng).slice(0, SIZE); } while (!mixed(L, "outdoor"));
      var idx = []; for (var z = 0; z < SIZE; z++) idx.push(z);
      var sol = { w: shuffle(idx, rng), l: shuffle(idx, rng) };
      var m = Math.floor(rng() * SIZE);
      var mc = murderClue(S, W, L, sol, m, rng);
      var cand = buildCandidates(S, W, L, sol, m, rng);
      // Prefer indirect clues: attributes and negatives first, a few positives allowed.
      cand = shuffle(cand, rng).sort(function (x, y) {
        var wt = { attr: 0, or: 0.6, neg: 1, pos: 2 };
        return wt[x.kind] + rng() * 2.2 - (wt[y.kind] + rng() * 2.2);
      });
      var chosen = [], pool = ALL;
      var cur = answers(chosen, mc, pool);
      for (var i = 0; i < cand.length && cur.triples > 1; i++) {
        var np = filter(pool, [cand[i]]);
        var next = answers([], mc, np);
        if (next.triples < cur.triples || (next.consistent < cur.consistent && rng() < 0.25)) {
          chosen.push(cand[i]); cur = next; pool = np;
        }
      }
      if (cur.triples !== 1) continue;
      for (var r = chosen.length - 1; r >= 0; r--) {
        var without = chosen.slice(0, r).concat(chosen.slice(r + 1));
        if (answers(without, mc).triples === 1) chosen = without;
      }
      if (chosen.length < 5 || chosen.length > 9) continue;
      if (chosen.filter(function (c) { return c.kind === "pos"; }).length > 1) continue;
      chosen = shuffle(chosen, rng);
      chosen = assignSources(encodeCryptic(chosen, S, W, L, rng, theme), rng);
      // Hints: extra clues unsealed by wrong accusations, weakest first, so the core set alone stays sufficient.
      var used = {}; chosen.forEach(function (c) { used[c.text] = true; });
      var spare = shuffle(cand.filter(function (c) { return !used[c.text]; }), rng);
      var hints = spare.filter(function (c) { return c.kind === "attr"; }).slice(0, 2)
        .concat(spare.filter(function (c) { return c.kind === "pos"; }).slice(0, 2));
      var strong = [
        { text: "Hint: the killer was " + (L[sol.l[m]].outdoor ? "outdoors" : "indoors") + " and used a " + (W[sol.w[m]].heavy ? "heavy" : "light") + " weapon.", kind: "hint" },
        { text: "Hint: the killer did not use the " + W[(sol.w[m] + 1) % SIZE].name + " and was not in the " + L[(sol.l[m] + 1) % SIZE].name + ".", kind: "hint" }
      ];
      hints = hints.concat([pick(strong, rng)]).slice(0, ATTEMPTS - 1);
      // Walkthrough: after each core clue, which facts became certain.
      var steps = [], wp = ALL, known = {};
      chosen.forEach(function (c, ci) {
        wp = filter(wp, [c]);
        var fresh = certain(wp).filter(function (f) { return !known[f]; });
        fresh.forEach(function (f) { known[f] = true; });
        steps.push({ clue: ci, facts: fresh, left: answers([], mc, wp).triples });
      });
      return {
        seed: String(seed),
        victim: pick(VICTIMS, rng),
        suspects: S, weapons: W, locations: L,
        solution: sol, murderer: m,
        answer: { s: m, w: sol.w[m], l: sol.l[m] },
        murderClue: mc.text, murderType: mc.type,
        theme: theme.name,
        clues: chosen.map(function (c) { return { text: c.text, plain: c.plain, code: c.code, method: c.method || null, puzzle: c.puzzle || null, cipher: !!c.cipher, kind: c.kind, source: c.source, speaker: c.speaker || null }; }),
        hints: hints.map(function (c) { return { text: c.text, kind: c.kind }; }),
        steps: steps,
        attempts: ATTEMPTS,
        _check: function () { return answers(chosen, mc); },
        _checkPrefix: function (k) { return answers(chosen.slice(0, k), mc); }
      };
    }
    throw new Error("Could not build a case for seed " + seed);
  }

  return { generate: generate, SIZE: SIZE, ATTEMPTS: ATTEMPTS, caesar: caesar, atbash: atbash, MORSE: MORSE };
})();
if (typeof module !== "undefined") module.exports = Redwing;
