// Detective Redwing case engine: seeded generation + brute-force uniqueness check.
var Redwing = (function () {
  // Crime scenes. Each has its own guests, weapons, rooms and people to question. Every room is either "out"
  // (outdoors, on deck, in the open air) or not, and each scene words the clues about that in its own way.
  // trivia and know disguise item and room names for the coded clues (see encodeCryptic).
  var SCENES = [
    {
      id: "manor", name: "Redwing Manor", at: "at Redwing Manor", guests: "guests",
      out: { tag: ["Outdoors", "Indoors"], where: ["outdoors", "indoors"],
        shoes: ["'s shoes were caked in mud, so they were outdoors", "'s shoes were spotless, so they stayed indoors"],
        item: ["found outdoors, damp with dew", "kept indoors all night"] },
      groups: { household: "What the household told you", witness: "What others told you" },
      suspects: [
        { name: "Lady Vesper", tall: true, left: false, role: "the widowed aunt" },
        { name: "Dr. Thorne", tall: true, left: true, role: "the family physician" },
        { name: "Miss Hollis", tall: false, left: false, role: "the governess" },
        { name: "Captain Grey", tall: true, left: false, role: "a retired naval officer" },
        { name: "Reverend Ashby", tall: false, left: true, role: "the village vicar" },
        { name: "Madame Lark", tall: false, left: false, role: "a touring soprano" },
        { name: "Mr. Fennick", tall: false, left: true, role: "the estate solicitor" },
        { name: "Professor Quill", tall: true, left: true, role: "an amateur chemist" }
      ],
      weapons: [
        { name: "Candlestick", heavy: true }, { name: "Letter Opener", heavy: false },
        { name: "Revolver", heavy: false }, { name: "Poison Vial", heavy: false },
        { name: "Rope", heavy: false }, { name: "Fire Poker", heavy: true },
        { name: "Walking Cane", heavy: true }, { name: "Bronze Bust", heavy: true }
      ],
      rooms: [
        { name: "Library", outdoor: false }, { name: "Conservatory", outdoor: false },
        { name: "Wine Cellar", outdoor: false }, { name: "Billiard Room", outdoor: false },
        { name: "Garden Maze", outdoor: true }, { name: "Stables", outdoor: true },
        { name: "Boathouse", outdoor: true }, { name: "Orchard", outdoor: true }
      ],
      victims: ["Lord Ashcombe", "Sir Edmund Pryce", "Mrs. Delacourt", "Colonel Hartley",
        "Baroness Wren", "Mr. Silas Mott", "Lady Imogen Crane", "Judge Albright"],
      staff: ["The butler", "The cook", "The footman", "A housemaid", "The chauffeur", "The head gardener"],
      witnesses: ["The village constable", "A passing postman", "The vicar's wife", "A neighbouring farmer", "The station porter", "The doctor's receptionist"],
      trivia: {
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
      },
      // General-knowledge disguises: you must know what these things are a type of to tell which item or room is meant.
      know: {
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
      }
    },
    {
      id: "liner", name: "the SS Aurelia", at: "aboard the SS Aurelia, mid-Atlantic", guests: "passengers",
      out: { tag: ["On deck", "Inside"], where: ["out on deck", "inside the ship"],
        shoes: ["'s coat was damp with salt spray, so they were out on deck", "'s coat was bone dry, so they stayed inside the ship"],
        item: ["found out on deck, crusted with salt", "kept inside the ship all night"] },
      groups: { household: "What the crew told you", witness: "What other passengers told you" },
      suspects: [
        { name: "Countess Orlova", tall: true, left: false, role: "a Russian émigré" },
        { name: "Mr. Bancroft", tall: true, left: true, role: "an American oil heir" },
        { name: "Miss Penrose", tall: false, left: false, role: "a lady's companion" },
        { name: "Commander Hale", tall: true, left: false, role: "the ship's first officer" },
        { name: "Father Doyle", tall: false, left: true, role: "a travelling priest" },
        { name: "Signora Vitale", tall: false, left: false, role: "a fashion designer" },
        { name: "Mr. Okafor", tall: false, left: true, role: "a marine insurer" },
        { name: "Dr. Lindqvist", tall: true, left: true, role: "the ship's surgeon" }
      ],
      weapons: [
        { name: "Boat Hook", heavy: true }, { name: "Flare Gun", heavy: false },
        { name: "Champagne Bottle", heavy: true }, { name: "Sextant", heavy: true },
        { name: "Hatpin", heavy: false }, { name: "Belaying Pin", heavy: true },
        { name: "Piano Wire", heavy: false }, { name: "Sleeping Draught", heavy: false }
      ],
      rooms: [
        { name: "Grand Ballroom", outdoor: false }, { name: "Engine Room", outdoor: false },
        { name: "Purser's Office", outdoor: false }, { name: "Smoking Lounge", outdoor: false },
        { name: "Promenade Deck", outdoor: true }, { name: "Sun Deck", outdoor: true },
        { name: "Lifeboat Station", outdoor: true }, { name: "Crow's Nest", outdoor: true }
      ],
      victims: ["Mr. Cornelius Vance", "Lady Margot Steyne", "Baron von Halden", "Mrs. Ada Whitcombe",
        "Mr. Julius Pell", "Dame Honoria Fisk"],
      staff: ["The chief steward", "A cabin boy", "The ship's cook", "A stewardess", "The bosun", "The radio officer"],
      witnesses: ["A deckhand", "A fellow passenger", "The ship's photographer", "The bandleader", "A honeymooning bride", "A card player"],
      trivia: {
        "Boat Hook": "weapon whose second word names Peter Pan's pirate captain",
        "Flare Gun": "weapon whose shot is a distress signal at sea",
        "Champagne Bottle": "weapon traditionally smashed on a ship's bow at its launch",
        "Sextant": "instrument named for a sixth of a circle",
        "Hatpin": "weapon whose length Chicago capped by law in 1910",
        "Belaying Pin": "weapon whose first word is the climber's term for securing a rope",
        "Piano Wire": "weapon whose first word is short for pianoforte",
        "Sleeping Draught": "weapon Juliet drank to seem dead",
        "Grand Ballroom": "room where Cinderella danced until midnight",
        "Engine Room": "room the bridge telegraph rings for 'full speed ahead'",
        "Purser's Office": "office of the officer who keeps a ship's money",
        "Smoking Lounge": "room where gentlemen once retired with cigars after dinner",
        "Promenade Deck": "deck named for the French word for a leisurely walk",
        "Sun Deck": "deck named for the star at the centre of our solar system",
        "Lifeboat Station": "place the Titanic had too few boats for",
        "Crow's Nest": "lookout from which Frederick Fleet spotted the Titanic's iceberg"
      },
      know: {
        "Boat Hook": "item a deckhand uses to catch a mooring line",
        "Flare Gun": "item of the Very pistol kind",
        "Champagne Bottle": "item that held the Moët and the Krug",
        "Sextant": "instrument a navigator sights the noon sun with",
        "Hatpin": "item that held a cloche or a picture hat in place",
        "Belaying Pin": "item a sailor makes a line fast around on the pin rail",
        "Piano Wire": "item tightened with a tuning hammer",
        "Sleeping Draught": "item laced with laudanum",
        "Grand Ballroom": "room where the quickstep and the tango are danced",
        "Engine Room": "room of the boilers, pistons and turbines",
        "Purser's Office": "office where passengers lodge jewels in the ship's safe",
        "Smoking Lounge": "room that smells of Havanas and pipe tobacco",
        "Promenade Deck": "deck lined with steamer chairs for an afternoon stroll",
        "Sun Deck": "deck where passengers sunbathe and play deck quoits",
        "Lifeboat Station": "place of the davits and the cork life jackets",
        "Crow's Nest": "lookout high on the foremast"
      }
    },
    {
      id: "lodge", name: "the Hotel Edelweiss", at: "at the Hotel Edelweiss, high in the Alps", guests: "guests",
      out: { tag: ["Outside", "Inside"], where: ["outside in the snow", "inside the hotel"],
        shoes: ["'s boots were wet with melted snow, so they were outside", "'s boots were dry, so they stayed inside the hotel"],
        item: ["found outside, frosted over", "kept inside the hotel all night"] },
      groups: { household: "What the hotel staff told you", witness: "What others told you" },
      suspects: [
        { name: "Baroness Kessler", tall: true, left: false, role: "a Viennese art patron" },
        { name: "Herr Brandt", tall: true, left: true, role: "the ski instructor" },
        { name: "Miss Calloway", tall: false, left: false, role: "a champion figure skater" },
        { name: "Monsieur Duval", tall: false, left: true, role: "a Geneva banker" },
        { name: "Colonel Ashdown", tall: true, left: false, role: "a veteran mountaineer" },
        { name: "Frau Weber", tall: false, left: false, role: "the hotel's owner" },
        { name: "Mr. Takeda", tall: true, left: true, role: "a travelling photographer" },
        { name: "Dr. Marchetti", tall: false, left: true, role: "a sanatorium doctor" }
      ],
      weapons: [
        { name: "Ice Axe", heavy: true }, { name: "Ski Pole", heavy: false },
        { name: "Fondue Fork", heavy: false }, { name: "Cowbell", heavy: true },
        { name: "Alpenhorn", heavy: true }, { name: "Cuckoo Clock", heavy: true },
        { name: "Climbing Rope", heavy: false }, { name: "Icicle", heavy: false }
      ],
      rooms: [
        { name: "Fireside Lounge", outdoor: false }, { name: "Sauna", outdoor: false },
        { name: "Ski Room", outdoor: false }, { name: "Observatory", outdoor: false },
        { name: "Ski Slope", outdoor: true }, { name: "Ice Rink", outdoor: true },
        { name: "Chairlift", outdoor: true }, { name: "Hot Spring", outdoor: true }
      ],
      victims: ["Herr Otto Reinhardt", "Madame Celeste Fournier", "Sir Rupert Calder", "Mrs. Helena Strand",
        "Count Emil Varga", "Miss Priscilla Dunmore"],
      staff: ["The concierge", "A chambermaid", "The head chef", "The night porter", "The barman", "A bellhop"],
      witnesses: ["A mountain guide", "The lift operator", "A ski patroller", "A fellow guest", "The village postmistress", "A sleigh driver"],
      trivia: {
        "Ice Axe": "tool Trotsky was killed with in 1940",
        "Ski Pole": "item whose first word comes from an Old Norse word for a split stick",
        "Fondue Fork": "item whose first word is French for 'melted'",
        "Cowbell": "instrument a famous comedy sketch demanded more of",
        "Alpenhorn": "instrument blown in the Ricola cough drop adverts",
        "Cuckoo Clock": "clock Harry Lime mocks as Switzerland's great invention in The Third Man",
        "Climbing Rope": "item Hillary and Tenzing tied together with on Everest",
        "Icicle": "weapon in the classic riddle that melts away before the police arrive",
        "Fireside Lounge": "room named for the spot of Roosevelt's radio 'chats'",
        "Sauna": "room whose name is a word borrowed from Finnish",
        "Ski Room": "room named for the sport Sondre Norheim helped modernise",
        "Observatory": "kind of building that Greenwich and Jodrell Bank are famous for",
        "Ski Slope": "place the French call a piste",
        "Ice Rink": "place where Torvill and Dean skated their Boléro",
        "Chairlift": "ride first built in 1936 from a banana-loading hoist design",
        "Hot Spring": "place where Japan's snow monkeys famously bathe"
      },
      know: {
        "Ice Axe": "tool with an adze and a pick, carried up the Eiger",
        "Ski Pole": "item with a basket at its tip, planted at every turn",
        "Fondue Fork": "item dipped in the Gruyère and Emmental pot",
        "Cowbell": "item hung on a Simmental's collar",
        "Alpenhorn": "instrument carved from spruce and several metres long",
        "Cuckoo Clock": "clock with a carved bird and pine-cone weights",
        "Climbing Rope": "item tied with a figure-eight and a clove hitch",
        "Icicle": "item formed when meltwater drips from the eaves and freezes",
        "Fireside Lounge": "room of the inglenook, the logs and the bellows",
        "Sauna": "room of hot stones, birch whisks and steam",
        "Ski Room": "room where the boots, the wax and the bindings are kept",
        "Observatory": "room under a dome with a telescope trained on Orion",
        "Ski Slope": "place with the green, blue, red and black runs",
        "Ice Rink": "place where the axel and the salchow are jumped",
        "Chairlift": "ride with a safety bar that carries you up the mountain",
        "Hot Spring": "place where geothermal water steams in the snow"
      }
    },
    {
      id: "train", name: "the Silver Arrow", at: "aboard the Silver Arrow night train", guests: "passengers",
      out: { tag: ["Open air", "Inside"], where: ["out in the open air", "inside the carriages"],
        shoes: ["'s collar was flecked with soot and cinders, so they were out in the open air", "'s collar was spotless, so they stayed inside the carriages"],
        item: ["found out in the open, gritty with soot", "kept inside the carriages all night"] },
      groups: { household: "What the train crew told you", witness: "What other passengers told you" },
      suspects: [
        { name: "Princess Amara", tall: true, left: false, role: "an exiled royal" },
        { name: "Mr. Whitlock", tall: true, left: true, role: "a diamond merchant" },
        { name: "Miss Darrow", tall: false, left: false, role: "a crime novelist" },
        { name: "General Petrov", tall: true, left: false, role: "a retired general" },
        { name: "Sister Agnes", tall: false, left: true, role: "a nursing nun" },
        { name: "Mr. Abernethy", tall: false, left: false, role: "a railway inspector" },
        { name: "Mademoiselle Roux", tall: false, left: true, role: "a cabaret dancer" },
        { name: "Herr Falk", tall: true, left: true, role: "a chess grandmaster" }
      ],
      weapons: [
        { name: "Coal Shovel", heavy: true }, { name: "Signal Lantern", heavy: true },
        { name: "Ticket Punch", heavy: false }, { name: "Silk Scarf", heavy: false },
        { name: "Steak Knife", heavy: false }, { name: "Railway Spike", heavy: true },
        { name: "Fountain Pen", heavy: false }, { name: "Spanner", heavy: true }
      ],
      rooms: [
        { name: "Dining Car", outdoor: false }, { name: "Sleeping Car", outdoor: false },
        { name: "Baggage Car", outdoor: false }, { name: "Lounge Car", outdoor: false },
        { name: "Observation Platform", outdoor: true }, { name: "Coal Tender", outdoor: true },
        { name: "Station Platform", outdoor: true }, { name: "Carriage Roof", outdoor: true }
      ],
      victims: ["Mr. Leopold Grieve", "Madame Ilse Barta", "Lord Peregrine Holt", "Mrs. Constance Avery",
        "Count Dmitri Volkov", "Dr. Ambrose Kettle"],
      staff: ["The conductor", "A sleeping-car attendant", "The dining-car chef", "The guard", "A porter", "The fireman"],
      witnesses: ["A fellow passenger", "The stationmaster", "A newspaper seller", "A signalman", "A border official", "A travelling salesman"],
      trivia: {
        "Coal Shovel": "tool a fireman swung on the Flying Scotsman's footplate",
        "Signal Lantern": "item hung in Boston's Old North Church to signal Paul Revere",
        "Ticket Punch": "tool from Mark Twain's maddening jingle 'Punch, brothers, punch'",
        "Silk Scarf": "item that killed the dancer Isadora Duncan",
        "Steak Knife": "knife named for the cut that includes the T-bone and the sirloin",
        "Railway Spike": "item of which a golden one finished America's first transcontinental railroad",
        "Fountain Pen": "item the proverb says is mightier than the sword",
        "Spanner": "tool Americans call a wrench",
        "Dining Car": "carriage George Pullman's company made famous for fine meals",
        "Sleeping Car": "carriage where Agatha Christie's Ratchett is stabbed",
        "Baggage Car": "carriage named for what Americans call luggage",
        "Lounge Car": "carriage named for what a 'lounge lizard' haunts",
        "Observation Platform": "platform at the back from which US presidents gave whistle-stop speeches",
        "Coal Tender": "wagon whose name means gentle in Elvis's 'Love Me ___'",
        "Station Platform": "place Harry Potter reaches at number nine and three-quarters",
        "Carriage Roof": "place where film heroes brawl atop a speeding train"
      },
      know: {
        "Coal Shovel": "tool that feeds the firebox with anthracite",
        "Signal Lantern": "item with red and green glass that a guard swings",
        "Ticket Punch": "tool that clips a hole in a third-class fare",
        "Silk Scarf": "item of the Hermès carré kind",
        "Steak Knife": "item laid beside the sirloin and the ribeye",
        "Railway Spike": "item hammered in to hold a rail to its sleeper",
        "Fountain Pen": "item with a nib, an ink sac and a converter",
        "Spanner": "tool of the open-ended and ring kind",
        "Dining Car": "carriage with white tablecloths, silver service and a menu",
        "Sleeping Car": "carriage of bunks, berths and compartments",
        "Baggage Car": "carriage stacked with trunks, hatboxes and mailbags",
        "Lounge Car": "carriage with armchairs, a bar and a gramophone",
        "Observation Platform": "railed balcony at the very back of the last carriage",
        "Coal Tender": "wagon heaped with coal and coupled behind the engine",
        "Station Platform": "place of the porters, the clock and 'mind the gap'",
        "Carriage Roof": "place above the compartments, open to the wind"
      }
    }
  ];
  // Theft cases swap the weapons for valuables. These travel with whichever scene the theft happens in.
  var VALUABLES = {
    items: [
      { name: "Ruby Brooch", heavy: false }, { name: "Pearl Necklace", heavy: false },
      { name: "Penny Black", heavy: false }, { name: "Emerald Ring", heavy: false },
      { name: "Jade Dragon", heavy: true }, { name: "Silver Candelabra", heavy: true },
      { name: "Carriage Clock", heavy: true }, { name: "Bronze Horse", heavy: true }
    ],
    trivia: {
      "Ruby Brooch": "jewel whose stone matches Dorothy's slippers in the 1939 film",
      "Pearl Necklace": "necklace of the gem in Vermeer's famous girl's earring",
      "Penny Black": "stamp that was the world's first adhesive postage stamp, in 1840",
      "Emerald Ring": "ring set with the gem that names Oz's city",
      "Jade Dragon": "carving of the creature on the Welsh flag",
      "Silver Candelabra": "holder Liberace kept on his piano",
      "Carriage Clock": "clock named for the horse-drawn coaches it travelled in",
      "Bronze Horse": "statue cast in the metal of the third-place Olympic medal"
    },
    know: {
      "Ruby Brooch": "pin set with a red corundum",
      "Pearl Necklace": "strand of what an oyster grows around a grain of grit",
      "Penny Black": "stamp bearing young Queen Victoria's profile",
      "Emerald Ring": "ring set with a green beryl",
      "Jade Dragon": "carving of nephrite in the shape of a winged serpent",
      "Silver Candelabra": "branched holder of sterling for five tapers",
      "Carriage Clock": "brass travelling clock with a handle on top",
      "Bronze Horse": "statue of a stallion cast from copper and tin"
    }
  };
  // Wording that changes between a murder and a theft.
  var KINDS = {
    murder: {
      culprit: "killer", itemsLabel: "Weapons", item: "weapon", itemCat: "the weapon whose name",
      tag: ["Heavy", "Light"], carried: [" carried a heavy object all evening.", " carried a light object all evening."],
      seen: " was seen carrying the ", took: "used"
    },
    theft: {
      culprit: "thief", itemsLabel: "Valuables", item: "piece", itemCat: "the piece whose name",
      tag: ["Heavy", "Small"], carried: [" held a heavy piece all evening.", " held a small piece all evening."],
      seen: " was seen holding the ", took: "took"
    }
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

  function buildCandidates(S, W, L, sol, m, rng, X) {
    var c = [];
    var w = sol.w, l = sol.l;
    function add(text, f, kind, obs) { c.push({ text: text, f: f, kind: kind, obs: !!obs }); }
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
      function (x, y) { return "Nobody took the " + x + " to the " + y + "."; }
    ];
    for (var i = 0; i < SIZE; i++) {
      for (var j = 0; j < SIZE; j++) {
        (function (i, j) {
          if (w[i] === j) {
            if (i !== m) add(S[i].name + X.kind.seen + W[j].name + ".", function (a) { return a.w[i] === j; }, "pos");
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
        if (holder !== m) add("The " + W[wj].name + " was last seen in the " + L[lk].name + ".", f, "pos", true);
      } else { var t = pick(negWL, rng)(W[wj].name, L[lk].name); add(t, f, "neg", t.indexOf("not found") >= 0); }
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
      add(S[s].name + X.scene.out.shoes[out ? 0 : 1] + ".",
        function (a) { return L[a.l[s]].outdoor === out; }, "attr", true);
      var hv = W[w[s]].heavy;
      add(S[s].name + X.kind.carried[hv ? 0 : 1],
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
      add("The " + W[q].name + " was " + X.scene.out.item[out ? 0 : 1] + ".",
        function (a) { return L[a.l[a.w.indexOf(q)]].outdoor === out; }, "attr", true);
    })(q);
    return c;
  }

  // The scene of the crime: the one fact that ties the culprit to the rest. A theft never names the stolen piece,
  // because working out what went missing is part of the puzzle.
  function murderClue(S, W, L, sol, m, rng, X) {
    var opts = [];
    var lm = sol.l[m], wm = sol.w[m], theft = X.type === "theft";
    opts.push({
      type: "location",
      text: theft ? "The theft happened in the " + L[lm].name + ", and the thief was there all evening."
        : "The body was found in the " + L[lm].name + ".",
      who: function (a) { return a.l.indexOf(lm); }
    });
    if (!theft) opts.push({
      type: "weapon",
      text: "The coroner is certain: the fatal blow came from the " + W[wm].name + ".",
      who: function (a) { return a.w.indexOf(wm); }
    });
    var sameTrait = S.filter(function (x) { return x.tall === S[m].tall && x.left === S[m].left; }).length;
    if (sameTrait === 1) opts.push({
      type: "trait",
      text: pick(X.scene.staff, rng) + " glimpsed the " + X.kind.culprit + " slipping away: " + (S[m].tall ? "tall" : "short") + " and " + (S[m].left ? "left" : "right") + "-handed.",
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
  function findName(c, S, W, L, code, X) {
    if (code !== "trivia" && code !== "knowledge") {
      var s = S.filter(function (x) { return c.text.indexOf(x.name) >= 0 && c.text.indexOf(x.name + "'s") < 0; })[0];
      if (s) return { from: s.name, word: letters(s.name.split(" ").pop()), cat: "the guest whose surname", the: false, name: s.name };
    }
    var groups = [[W, X.kind.itemCat], [L, "the place whose name"]];
    var map = code === "trivia" ? X.trivia : code === "knowledge" ? X.know : null;
    for (var g = 0; g < groups.length; g++) {
      var e = groups[g][0].filter(function (x) { return (c.text.indexOf("the " + x.name) >= 0 || c.text.indexOf("The " + x.name) >= 0) && (!map || map[x.name]); })[0];
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
  function encodeCryptic(clues, S, W, L, rng, theme, X) {
    var out = clues.map(function (c) { return { text: c.text, plain: c.text, kind: c.kind, f: c.f, obs: c.obs, code: null }; });
    var free = shuffle(out.map(function (_, i) { return i; }), rng);
    free = free.slice(0, Math.max(1, out.length - 2));  // always leave at least two plain clues
    theme.codes.forEach(function (code) {
      for (var n = 0; n < free.length; n++) {
        var c = out[free[n]];
        if (NOTE_CODES[code]) {
          var r = NOTE_CODES[code](c.text, rng);
          c.text = r.text; c.code = "Coded note"; c.method = r.label.replace("Coded note · ", ""); c.cipher = true;
        } else {
          var hit = findName(c, S, W, L, code, X);
          if (!hit) continue;
          var nc = NAME_CODES[code] ? NAME_CODES[code](hit.word, hit.cat, rng) : null;
          var phrase = code === "trivia" ? "the " + X.trivia[hit.name] : code === "knowledge" ? "the " + X.know[hit.name] : nc.phrase;
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
  function assignSources(clues, rng, X) {
    var staff = shuffle(X.scene.staff, rng), wit = shuffle(X.scene.witnesses, rng), turn = rng() < 0.5 ? 0 : 1;
    clues.forEach(function (c) {
      if (c.obs) c.source = "observed";
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

  // Daily rotation. Scenes go round in a freshly shuffled order every few days, never the same place twice running.
  // Every pair of days holds one murder and one theft in a random order, so there are never more than two of a kind in a row.
  function sceneFor(day) {
    var n = SCENES.length, block = Math.floor(day / n);
    var order = shuffle(SCENES.map(function (_, i) { return i; }), rngFrom("scenes-" + block));
    var prev = shuffle(SCENES.map(function (_, i) { return i; }), rngFrom("scenes-" + (block - 1)));
    if (order[0] === prev[n - 1]) { var t = order[0]; order[0] = order[1]; order[1] = t; }
    return order[((day % n) + n) % n];
  }
  function typeFor(day) {
    var first = rngFrom("kinds-" + Math.floor(day / 2))() < 0.5 ? "murder" : "theft";
    return day % 2 === 0 ? first : first === "murder" ? "theft" : "murder";
  }

  function generate(seed, opts) {
    opts = opts || {};
    var rng = rngFrom(seed);
    var dm = String(seed).match(/(\d{4})-(\d{2})-(\d{2})$/);
    var weekday = opts.weekday != null ? opts.weekday
      : dm ? new Date(+dm[1], +dm[2] - 1, +dm[3]).getDay() : Math.floor(rng() * 7);
    var day = dm ? Math.round(Date.UTC(+dm[1], +dm[2] - 1, +dm[3]) / 864e5) : null;
    var scene = opts.scene != null ? SCENES.filter(function (x) { return x.id === opts.scene; })[0]
      : day != null ? SCENES[sceneFor(day)] : pick(SCENES, rng);
    var type = opts.type || (day != null ? typeFor(day) : rng() < 0.5 ? "murder" : "theft");
    var X = { scene: scene, type: type, kind: KINDS[type] };
    X.trivia = Object.assign({}, scene.trivia, type === "theft" ? VALUABLES.trivia : {});
    X.know = Object.assign({}, scene.know, type === "theft" ? VALUABLES.know : {});
    var ITEMS = type === "theft" ? VALUABLES.items : scene.weapons;
    var theme = THEMES[weekday];
    for (var tries = 0; tries < 60; tries++) {
      var S, W, L;
      do { S = shuffle(scene.suspects, rng).slice(0, SIZE); } while (!mixed(S, "tall") || !mixed(S, "left"));
      do { W = shuffle(ITEMS, rng).slice(0, SIZE); } while (!mixed(W, "heavy"));
      do { L = shuffle(scene.rooms, rng).slice(0, SIZE); } while (!mixed(L, "outdoor"));
      var idx = []; for (var z = 0; z < SIZE; z++) idx.push(z);
      var sol = { w: shuffle(idx, rng), l: shuffle(idx, rng) };
      var m = Math.floor(rng() * SIZE);
      var mc = murderClue(S, W, L, sol, m, rng, X);
      var cand = buildCandidates(S, W, L, sol, m, rng, X);
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
      chosen = assignSources(encodeCryptic(chosen, S, W, L, rng, theme, X), rng, X);
      // Hints: extra clues unsealed by wrong accusations, weakest first, so the core set alone stays sufficient.
      var used = {}; chosen.forEach(function (c) { used[c.text] = true; });
      var spare = shuffle(cand.filter(function (c) { return !used[c.text]; }), rng);
      var hints = spare.filter(function (c) { return c.kind === "attr"; }).slice(0, 2)
        .concat(spare.filter(function (c) { return c.kind === "pos"; }).slice(0, 2));
      var strong = [
        { text: "Hint: the " + X.kind.culprit + " was " + scene.out.where[L[sol.l[m]].outdoor ? 0 : 1] + " and " + X.kind.took + " a " + X.kind.tag[W[sol.w[m]].heavy ? 0 : 1].toLowerCase() + " " + X.kind.item + ".", kind: "hint" },
        { text: "Hint: the " + X.kind.culprit + " did not " + (type === "theft" ? "take" : "use") + " the " + W[(sol.w[m] + 1) % SIZE].name + " and was not in the " + L[(sol.l[m] + 1) % SIZE].name + ".", kind: "hint" }
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
        victim: pick(scene.victims, rng),
        type: type, scene: { id: scene.id, name: scene.name, at: scene.at, guests: scene.guests, out: scene.out.tag, groups: scene.groups },
        words: { culprit: X.kind.culprit, item: X.kind.item, itemsLabel: X.kind.itemsLabel, tag: X.kind.tag },
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

  return { generate: generate, SCENES: SCENES.map(function (x) { return x.id; }), SIZE: SIZE, ATTEMPTS: ATTEMPTS, caesar: caesar, atbash: atbash, MORSE: MORSE };
})();
if (typeof module !== "undefined") module.exports = Redwing;
