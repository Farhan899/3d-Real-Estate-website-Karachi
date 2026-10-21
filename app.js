/* ============================================================
   SAHIL ESTATES — Karachi
   UI + hand-built Three.js scenes. No external assets.
   ============================================================ */
(function () {
  "use strict";

  /* ----------------------------------------------------------
     0. Small helpers
     ---------------------------------------------------------- */
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var damp = function (a, b, lambda, dt) { return lerp(a, b, 1 - Math.exp(-lambda * dt)); };
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function escapeHTML(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function hashStr(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function pkrParts(value) {
    if (value >= 1e7) return { n: Number((value / 1e7).toFixed(2)), unit: "crore" };
    return { n: Number((value / 1e5).toFixed(2)), unit: "lakh" };
  }
  function formatPKR(value) {
    var p = pkrParts(value);
    return "PKR " + p.n.toLocaleString("en-US", { maximumFractionDigits: 2 }) + " " + p.unit;
  }
  function formatPKRShort(value) {
    var p = pkrParts(value);
    return "PKR " + p.n + (p.unit === "crore" ? " cr" : " lac");
  }
  function formatCount(n) {
    return n.toLocaleString("en-US");
  }

  var toastTimer;
  function toast(message) {
    var el = $("#toast");
    if (!el) return;
    $("#toastText").textContent = message;
    el.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove("is-visible"); }, 3200);
  }

  /* ----------------------------------------------------------
     1. The collection
     ---------------------------------------------------------- */
  var properties = [
    {
      id: "seaview-sky-penthouse",
      title: "Seaview Sky Penthouse",
      location: "Clifton Block 5",
      district: "Clifton",
      type: "penthouse",
      kind: "Penthouse",
      model: "penthouse",
      price: 87500000,
      beds: 4,
      baths: 5,
      size: 5200,
      sizeLabel: "5,200 sq ft",
      badge: "Sea view",
      badgeTone: "gold",
      palette: "dusk",
      floors: 12,
      desc: "The full twelfth floor, wrapped in glass and a 180-degree terrace. A private lift opens into a gallery hall; the primary suite occupies the seaward corner with its own plunge pool and a dressing room the size of a small study.",
      features: ["Wrap-around sea terrace", "Private lift lobby", "Infinity pool & gym", "Two covered parking bays"]
    },
    {
      id: "khayaban-e-saadi-villa",
      title: "Khayaban-e-Saadi Villa",
      location: "DHA Phase 8",
      district: "DHA",
      type: "villa",
      kind: "Villa",
      model: "villa",
      price: 135000000,
      beds: 5,
      baths: 6,
      size: 8000,
      sizeLabel: "8,000 sq ft",
      badge: "Signature",
      badgeTone: "gold",
      palette: "golden",
      floors: 2,
      desc: "A quiet, west-facing villa on a 500-square-yard corner plot. Double-height living spaces open onto a shaded courtyard and a 42-foot pool; five bedrooms sit above, each with its own terrace and a view into the treetops.",
      features: ["500 sq yd corner plot", "42-ft swimming pool", "Shaded courtyard & lawn", "Staff quarters + 3 car porch"]
    },
    {
      id: "creek-vista-residence",
      title: "Creek Vista Residence",
      location: "DHA Phase 6",
      district: "DHA",
      type: "apartment",
      kind: "Apartment",
      model: "tower",
      price: 54000000,
      beds: 3,
      baths: 4,
      size: 2850,
      sizeLabel: "2,850 sq ft",
      badge: "New",
      badgeTone: "",
      palette: "dawn",
      floors: 9,
      desc: "A high-floor residence looking over the creek and the mangrove line. Deep balconies, a open plan kitchen and a separate family lounge make this one of the most liveable layouts in Phase 6.",
      features: ["Creek & mangrove views", "Two deep balconies", "Gated building with concierge", "Shared gym and rooftop deck"]
    },
    {
      id: "bahria-ocean-heights",
      title: "Bahria Ocean Heights",
      location: "Bahria Town Karachi",
      district: "Bahria",
      type: "apartment",
      kind: "Apartment",
      model: "tower",
      price: 26500000,
      beds: 3,
      baths: 3,
      size: 2100,
      sizeLabel: "2,100 sq ft",
      badge: "Best value",
      badgeTone: "",
      palette: "day",
      floors: 11,
      desc: "A bright, efficient three-bedroom in Bahria's newest gated cluster. Wide windows, a covered terrace and access to the precinct's parks and community pool — a strong first home or rental hold.",
      features: ["Gated community", "Community pool & parks", "Covered parking", "24/7 security & power backup"]
    },
    {
      id: "gulshan-garden-duplex",
      title: "Gulshan Garden Duplex",
      location: "Gulshan-e-Iqbal Block 13D",
      district: "Gulshan",
      type: "villa",
      kind: "Duplex",
      model: "villa",
      price: 49000000,
      beds: 5,
      baths: 5,
      size: 3200,
      sizeLabel: "3,200 sq ft",
      badge: "Family",
      badgeTone: "",
      palette: "dawn",
      floors: 2,
      desc: "A generous family duplex on a 240-square-yard plot, moments from the main boulevard and some of the city's best schools. Two living rooms, a ground-floor bedroom and a roof garden already planted with lemon and neem.",
      features: ["240 sq yd plot", "Two living rooms", "Planted roof garden", "Walk to schools & mosque"]
    },
    {
      id: "pechs-park-lane",
      title: "PECHS Park Lane",
      location: "PECHS Block 6",
      district: "PECHS",
      type: "apartment",
      kind: "Apartment",
      model: "tower",
      price: 32000000,
      beds: 2,
      baths: 3,
      size: 1750,
      sizeLabel: "1,750 sq ft",
      badge: "Rental",
      badgeTone: "",
      palette: "night",
      floors: 7,
      desc: "A calm, low-rise apartment on a tree-lined PECHS street, with a park at the end of the lane. Renovated in 2024 with a new kitchen and bathrooms, it rents quickly to professionals working in the old city.",
      features: ["Park-facing street", "Renovated in 2024", "Two secure parking spaces", "Strong rental demand"]
    },
    {
      id: "scheme-33-hillside-plot",
      title: "Scheme 33 Hillside Plot",
      location: "Scheme 33 · Sector 5",
      district: "Scheme 33",
      type: "plot",
      kind: "Residential plot",
      model: "plot",
      price: 18500000,
      beds: 0,
      baths: 0,
      size: 2160,
      sizeLabel: "240 sq yd",
      badge: "Corner",
      badgeTone: "gold",
      palette: "golden",
      floors: 0,
      desc: "A cleared corner plot with a 40-foot road frontage in Scheme 33's Sector 5. Services are at the boundary, the layout is approved residential, and the hills sit close enough to feel like a horizon.",
      features: ["240 sq yd corner plot", "40-ft road frontage", "Services at boundary", "Clear title · ready to build"]
    },
    {
      id: "clifton-marine-loft",
      title: "Clifton Marine Loft",
      location: "Clifton Block 2",
      district: "Clifton",
      type: "apartment",
      kind: "Loft",
      model: "penthouse",
      price: 43500000,
      beds: 3,
      baths: 3,
      size: 2400,
      sizeLabel: "2,400 sq ft",
      badge: "Loft",
      badgeTone: "",
      palette: "night",
      floors: 6,
      desc: "A double-height loft tucked above the old Clifton shops, five minutes from the sea wall. Exposed concrete, black steel and a wall of north light; below, a private courtyard shared by just four neighbours.",
      features: ["Double-height living room", "Private shared courtyard", "Five minutes to Sea View", "Boutique four-unit building"]
    },
    {
      id: "dha-sky-terrace",
      title: "DHA Phase 5 Sky Terrace",
      location: "DHA Phase 5",
      district: "DHA",
      type: "penthouse",
      kind: "Penthouse",
      model: "penthouse",
      price: 62000000,
      beds: 3,
      baths: 4,
      size: 3100,
      sizeLabel: "3,100 sq ft",
      badge: "Terrace",
      badgeTone: "",
      palette: "dusk",
      floors: 8,
      desc: "A top-floor apartment with a 900-square-foot private terrace, an outdoor kitchen and a plunge pool that catches the evening breeze. Inside, three bedrooms and a study open off a long, light-filled gallery.",
      features: ["900 sq ft private terrace", "Outdoor kitchen & plunge pool", "Study / fourth bedroom", "Two lifts & backup power"]
    }
  ];

  var typeLabels = {
    villa: "Villas",
    apartment: "Apartments",
    penthouse: "Penthouses",
    plot: "Plots"
  };
  var modelLabels = {
    villa: "Garden villa",
    tower: "Sky residence",
    penthouse: "Penthouse",
    plot: "Development land"
  };

  /* ----------------------------------------------------------
     2. Neighbourhoods + market data
     ---------------------------------------------------------- */
  var areas = [
    {
      id: "clifton", district: "Clifton", name: "Clifton", pinLabel: "CLIFTON",
      note: "Sea view & old Karachi", x: 246, y: 342, labelDy: -20,
      price: 27400, growth: "+6.1%",
      blurb: "Sea air, wide old streets and the city's most established addresses. Blocks 2, 5 and 8 move at very different speeds.",
      tags: ["Sea view", "Established", "Walkable"]
    },
    {
      id: "dha", district: "DHA", name: "DHA Phase 8", pinLabel: "DHA",
      note: "Gated · coastal", x: 382, y: 352, labelDy: 24,
      price: 22500, growth: "+8.4%",
      blurb: "Karachi's benchmark for gated living. Phase 8 leads on new supply; Phase 6 offers the creek and better value per square foot.",
      tags: ["Gated", "Family", "Schools"]
    },
    {
      id: "bahria", district: "Bahria", name: "Bahria Town", pinLabel: "BAHRIA TOWN",
      note: "Gated · new build", x: 300, y: 112, labelDy: 22,
      price: 9400, growth: "+11.2%",
      blurb: "Master-planned, green and still expanding. The value end of the gated market, with the strongest headline growth of 2026.",
      tags: ["Gated", "New build", "Value"]
    },
    {
      id: "gulshan", district: "Gulshan", name: "Gulshan-e-Iqbal", pinLabel: "GULSHAN",
      note: "Central · family", x: 410, y: 232, labelDy: 22,
      price: 12200, growth: "+5.7%",
      blurb: "The city's family heartland: schools, hospitals and the university road, with a deep market of 240 to 400 square-yard homes.",
      tags: ["Central", "Family", "Transit"]
    },
    {
      id: "pechs", district: "PECHS", name: "PECHS", pinLabel: "PECHS",
      note: "Central · rental", x: 332, y: 288, labelDy: 22,
      price: 18600, growth: "+7.3%",
      blurb: "Planned in the 1950s around broad, shaded streets. Apartments here rent fast and hold value through cycles.",
      tags: ["Central", "Rental", "Heritage"]
    },
    {
      id: "scheme33", district: "Scheme 33", name: "Scheme 33", pinLabel: "SCHEME 33",
      note: "Plots · long hold", x: 468, y: 142, labelDy: 22,
      price: 8900, growth: "+9.8%",
      blurb: "Hillside plots and new housing schemes on the north-eastern edge. A patient buy: infrastructure is arriving faster than prices.",
      tags: ["Plots", "Long hold", "Growth"]
    }
  ];

  var market = [
    { name: "Clifton", sub: "Sea-facing · established", value: 27400, growth: "+6.1%" },
    { name: "DHA Phase 8", sub: "Gated · coastal", value: 22500, growth: "+8.4%" },
    { name: "PECHS", sub: "Central · rental", value: 18600, growth: "+7.3%" },
    { name: "Gulshan-e-Iqbal", sub: "Family · central", value: 12200, growth: "+5.7%" },
    { name: "Bahria Town", sub: "Gated · value", value: 9400, growth: "+11.2%" },
    { name: "Scheme 33", sub: "Plots · long hold", value: 8900, growth: "+9.8%" }
  ];

  var state = {
    type: "all",
    area: "all",
    sort: "featured",
    selectedId: "khayaban-e-saadi-villa",
    selectedArea: "dha"
  };

  /* ----------------------------------------------------------
     3. Procedural artwork for cards
     ---------------------------------------------------------- */
  var PALETTES = {
    dusk: {
      sky: ["#0a1523", "#22374e", "#6b5057", "#c8814f", "#f2bd7d"],
      sun: "#ffdcb0", glow: "rgba(255,178,105,0.6)", haze: "#cd8a5e",
      cityFar: "#17293c", facade: "#243a4e", side: "#182a3c", roof: "#31485c",
      window: "#ffd196", glass: "#2a5461", water: "#123444", waterHi: "#e5a97a",
      deck: "#26363f", ground: "#1a282c", accent: "#e5c894", foliage: "#2c4d3d", trunk: "#4c3b2b"
    },
    night: {
      sky: ["#050b15", "#0b1c2e", "#13293b", "#204c5c", "#0c1e28"],
      sun: "#eaf1f7", glow: "rgba(160,210,230,0.4)", haze: "#1d3a46",
      cityFar: "#102030", facade: "#182c3e", side: "#0f1f2d", roof: "#243c4e",
      window: "#ffd79a", glass: "#1c3d4a", water: "#0b2632", waterHi: "#a6c9d2",
      deck: "#1a2a32", ground: "#111d23", accent: "#e5c894", foliage: "#20382d", trunk: "#3a2e22"
    },
    golden: {
      sky: ["#101e2a", "#374b5c", "#936a52", "#dc9459", "#f8d196"],
      sun: "#ffe6b8", glow: "rgba(255,202,130,0.65)", haze: "#e0a56d",
      cityFar: "#1b2e3c", facade: "#293d4e", side: "#1b2d3e", roof: "#364c5e",
      window: "#ffdca8", glass: "#2e525e", water: "#17414e", waterHi: "#eab982",
      deck: "#28363a", ground: "#1e2823", accent: "#eccd9a", foliage: "#31503a", trunk: "#54402d"
    },
    dawn: {
      sky: ["#112029", "#2e4351", "#63707a", "#c89a79", "#f8e0c2"],
      sun: "#ffeccf", glow: "rgba(245,208,170,0.5)", haze: "#c0a48c",
      cityFar: "#1d3038", facade: "#27404c", side: "#1a2c36", roof: "#33495a",
      window: "#ffe2b6", glass: "#2c5460", water: "#17414a", waterHi: "#e0bc96",
      deck: "#253338", ground: "#1c2822", accent: "#e2c99f", foliage: "#2c4838", trunk: "#4c3b2c"
    },
    day: {
      sky: ["#3d6f88", "#709cb0", "#abc3c5", "#e3d3b4", "#f5ecd6"],
      sun: "#fff7e2", glow: "rgba(255,243,215,0.6)", haze: "#e6d8bd",
      cityFar: "#8ea8b2", facade: "#3c596c", side: "#2c4658", roof: "#50707f",
      window: "#fff2d3", glass: "#628c99", water: "#337586", waterHi: "#f9e9c6",
      deck: "#71807d", ground: "#5f6e5c", accent: "#d6bf94", foliage: "#48634c", trunk: "#634e38"
    }
  };

  function skylinePath(rnd, baseY, maxH) {
    var d = "M-5 " + baseY;
    var x = -5;
    while (x < 405) {
      var w = 10 + rnd() * 20;
      var h = 6 + rnd() * maxH;
      d += " L" + x.toFixed(1) + " " + (baseY - h).toFixed(1) +
        " L" + (x + w).toFixed(1) + " " + (baseY - h).toFixed(1) +
        " L" + (x + w).toFixed(1) + " " + baseY;
      x += w + 1 + rnd() * 5;
    }
    return d + " L405 300 L-5 300 Z";
  }

  function windowGrid(rnd, x, y, w, h, cols, rows, fill, gap) {
    var out = "";
    var cw = w / cols, ch = h / rows;
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        if (rnd() < 0.34) continue;
        var op = 0.25 + rnd() * 0.65;
        out += '<rect x="' + (x + c * cw + cw * 0.22).toFixed(1) + '" y="' +
          (y + r * ch + ch * 0.24).toFixed(1) + '" width="' +
          (cw * (gap || 0.52)).toFixed(1) + '" height="' + (ch * 0.46).toFixed(1) +
          '" fill="' + fill + '" opacity="' + op.toFixed(2) + '"/>';
      }
    }
    return out;
  }

  function palmSVG(x, baseY, size, pal) {
    var s = size;
    var fronds = "";
    for (var i = 0; i < 7; i++) {
      var a = -160 + i * 26;
      fronds += '<path d="M' + x + " " + (baseY - s * 1.9) + " q " +
        (Math.cos(a * Math.PI / 180) * s * 0.9) + " " +
        (Math.sin(a * Math.PI / 180) * s * 0.55 - s * 0.2) + " " +
        (Math.cos(a * Math.PI / 180) * s * 1.5) + " " +
        (Math.sin(a * Math.PI / 180) * s * 0.95 + s * 0.25) +
        '" fill="none" stroke="' + pal.foliage + '" stroke-width="' + (s * 0.11).toFixed(1) + '" stroke-linecap="round"/>';
    }
    return '<g opacity="0.95"><path d="M' + x + " " + baseY + " q " + (s * 0.1) + " " + (-s * 1.1) + " " + (s * 0.04) + " " + (-s * 1.9) + '" fill="none" stroke="' + pal.trunk + '" stroke-width="' + (s * 0.12).toFixed(1) + '"/>' + fronds + "</g>";
  }

  function waterBand(pal, y, id) {
    var out = '<rect x="0" y="' + y + '" width="400" height="' + (300 - y) + '" fill="url(#water' + id + ')"/>';
    out += '<ellipse cx="300" cy="' + (y + 4) + '" rx="46" ry="3" fill="' + pal.sun + '" opacity="0.28"/>';
    for (var i = 0; i < 4; i++) {
      var yy = y + 18 + i * 17;
      out += '<path d="M0 ' + yy + ' q 25 -4 50 0 t 50 0 t 50 0 t 50 0 t 50 0 t 50 0 t 50 0 t 50 0" fill="none" stroke="' + pal.waterHi + '" stroke-width="0.8" opacity="' + (0.2 - i * 0.03).toFixed(2) + '"/>';
    }
    return out;
  }

  function artworkSVG(p) {
    var id = "a" + p.id.replace(/[^a-z0-9]/gi, "");
    var pal = PALETTES[p.palette] || PALETTES.dusk;
    var rnd = mulberry32(hashStr(p.id));
    var kind = p.model || "tower";
    var s = "";

    s += '<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" role="img" aria-label="' + escapeHTML(p.title) + ' illustration">';
    s += "<defs>";
    s += '<linearGradient id="sky' + id + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="' + pal.sky[0] + '"/>' +
      '<stop offset="0.42" stop-color="' + pal.sky[1] + '"/>' +
      '<stop offset="0.68" stop-color="' + pal.sky[2] + '"/>' +
      '<stop offset="0.84" stop-color="' + pal.sky[3] + '"/>' +
      '<stop offset="1" stop-color="' + pal.sky[4] + '"/></linearGradient>';
    s += '<radialGradient id="sun' + id + '"><stop offset="0" stop-color="' + pal.sun + '" stop-opacity="0.9"/><stop offset="0.5" stop-color="' + pal.sun + '" stop-opacity="0.25"/><stop offset="1" stop-color="' + pal.sun + '" stop-opacity="0"/></radialGradient>';
    s += '<linearGradient id="water' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + pal.waterHi + '" stop-opacity="0.5"/><stop offset="1" stop-color="' + pal.water + '"/></linearGradient>';
    s += '<linearGradient id="glass' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + pal.glass + '" stop-opacity="0.95"/><stop offset="0.5" stop-color="' + pal.window + '" stop-opacity="0.35"/><stop offset="1" stop-color="' + pal.glass + '"/></linearGradient>';
    s += '<linearGradient id="pool' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#59c6bd"/><stop offset="1" stop-color="#12424b"/></linearGradient>';
    s += '<linearGradient id="vignette' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#040a10" stop-opacity="0.32"/><stop offset="0.6" stop-color="#040a10" stop-opacity="0"/><stop offset="1" stop-color="#040a10" stop-opacity="0.5"/></linearGradient>';
    s += "</defs>";

    s += '<rect width="400" height="300" fill="url(#sky' + id + ')"/>';

    if (p.palette === "night") {
      for (var st = 0; st < 34; st++) {
        s += '<circle cx="' + (rnd() * 400).toFixed(1) + '" cy="' + (rnd() * 170).toFixed(1) + '" r="' + (0.4 + rnd() * 0.8).toFixed(2) + '" fill="#dfeaf2" opacity="' + (0.2 + rnd() * 0.5).toFixed(2) + '"/>';
      }
    }

    var sunX = kind === "penthouse" ? 108 : 300, sunY = kind === "plot" ? 96 : 108;
    s += '<circle cx="' + sunX + '" cy="' + sunY + '" r="80" fill="url(#sun' + id + ')"/>';
    s += '<circle cx="' + sunX + '" cy="' + sunY + '" r="' + (p.palette === "night" ? 10 : 15) + '" fill="' + pal.sun + '" opacity="0.95"/>';

    var baseY = kind === "plot" ? 214 : 246;
    s += '<path d="' + skylinePath(rnd, baseY, kind === "plot" ? 30 : 46) + '" fill="' + pal.cityFar + '" opacity="0.6"/>';

    if (kind === "tower" || kind === "penthouse") {
      s += waterBand(pal, 252, id);
    } else {
      s += '<rect y="' + baseY + '" width="400" height="' + (300 - baseY) + '" fill="' + pal.ground + '"/>';
      s += '<path d="M0 ' + (baseY + 8) + ' Q 200 ' + (baseY - 4) + ' 400 ' + (baseY + 14) + ' L400 300 L0 300Z" fill="' + pal.deck + '" opacity="0.85"/>';
    }

    if (kind === "villa") {
      s += '<rect x="72" y="252" width="256" height="6" fill="' + pal.accent + '" opacity="0.22"/>';
      s += '<rect x="64" y="166" width="152" height="88" fill="' + pal.facade + '"/>';
      s += '<rect x="216" y="176" width="118" height="78" fill="' + pal.side + '"/>';
      s += '<rect x="100" y="112" width="214" height="58" fill="' + pal.facade + '"/>';
      s += '<rect x="92" y="104" width="234" height="8" fill="' + pal.roof + '"/>';
      s += '<rect x="92" y="170" width="234" height="5" fill="' + pal.roof + '"/>';
      s += '<rect x="112" y="126" width="164" height="30" fill="url(#glass' + id + ')"/>';
      s += '<rect x="74" y="182" width="70" height="52" fill="url(#glass' + id + ')"/>';
      s += '<rect x="154" y="190" width="34" height="42" fill="' + pal.trunk + '" opacity="0.7"/>';
      for (var ws = 0; ws < 6; ws++) {
        s += '<rect x="' + (156 + ws * 7) + '" y="190" width="1.6" height="42" fill="' + pal.accent + '" opacity="0.35"/>';
      }
      s += windowGrid(rnd, 96, 188, 180, 44, 7, 3, pal.window, 0.6);
      s += '<rect x="118" y="130" width="150" height="3" fill="' + pal.accent + '" opacity="0.4"/>';
      s += '<rect x="104" y="260" width="196" height="6" fill="' + pal.accent + '" opacity="0.18"/>';
      s += '<rect x="112" y="266" width="180" height="24" rx="2" fill="url(#pool' + id + ')"/>';
      s += '<rect x="112" y="266" width="180" height="24" rx="2" fill="none" stroke="' + pal.accent + '" stroke-opacity="0.3"/>';
      s += '<path d="M130 276 q 20 -3 40 0 t 40 0 t 40 0" fill="none" stroke="#bff3ee" stroke-width="0.8" opacity="0.5"/>';
      s += palmSVG(340, 270, 26, pal);
      s += palmSVG(44, 268, 20, pal);
      s += '<circle cx="78" cy="270" r="10" fill="' + pal.foliage + '" opacity="0.8"/>';
      s += '<circle cx="100" cy="274" r="7" fill="' + pal.foliage + '" opacity="0.6"/>';
      s += '<rect x="300" y="266" width="2" height="16" fill="' + pal.trunk + '"/><circle cx="301" cy="262" r="7" fill="#ffd9a0" opacity="0.5"/>';
    }

    if (kind === "tower") {
      s += '<rect x="146" y="52" width="112" height="198" fill="' + pal.facade + '"/>';
      s += '<rect x="258" y="60" width="22" height="190" fill="' + pal.side + '"/>';
      s += '<rect x="138" y="44" width="130" height="9" fill="' + pal.roof + '"/>';
      s += '<rect x="204" y="20" width="1.6" height="26" fill="' + pal.accent + '" opacity="0.5"/>';
      for (var f = 0; f < 14; f++) {
        var fy = 60 + f * 13.2;
        s += '<rect x="143" y="' + fy + '" width="122" height="2" fill="' + pal.accent + '" opacity="0.24"/>';
        s += windowGrid(rnd, 154, fy + 4, 96, 9, 6, 1, pal.window, 0.55);
      }
      s += '<rect x="154" y="72" width="96" height="156" fill="url(#glass' + id + ')" opacity="0.16"/>';
      s += '<rect x="126" y="242" width="160" height="30" fill="' + pal.side + '"/>';
      s += '<rect x="144" y="250" width="124" height="16" fill="url(#glass' + id + ')"/>';
      s += '<rect x="118" y="244" width="176" height="4" fill="' + pal.roof + '"/>';
      s += '<rect x="190" y="258" width="28" height="18" fill="' + pal.window + '" opacity="0.35"/>';
      s += palmSVG(78, 284, 26, pal);
      s += palmSVG(328, 288, 22, pal);
      s += '<rect x="0" y="286" width="400" height="1" fill="' + pal.accent + '" opacity="0.2"/>';
      for (var pr = 0; pr < 16; pr++) {
        s += '<rect x="' + (pr * 26) + '" y="286" width="1" height="14" fill="' + pal.accent + '" opacity="0.14"/>';
      }
    }

    if (kind === "penthouse") {
      s += '<rect x="148" y="128" width="104" height="130" fill="' + pal.facade + '"/>';
      s += '<rect x="252" y="136" width="22" height="122" fill="' + pal.side + '"/>';
      for (var pf = 0; pf < 9; pf++) {
        var py = 138 + pf * 13.4;
        s += '<rect x="142" y="' + py + '" width="116" height="2" fill="' + pal.accent + '" opacity="0.22"/>';
        s += windowGrid(rnd, 156, py + 4, 88, 8, 5, 1, pal.window, 0.55);
      }
      s += '<rect x="108" y="86" width="184" height="44" fill="' + pal.facade + '"/>';
      s += '<rect x="100" y="78" width="200" height="9" fill="' + pal.roof + '"/>';
      s += '<rect x="118" y="98" width="164" height="24" fill="url(#glass' + id + ')"/>';
      s += '<rect x="86" y="126" width="228" height="7" fill="' + pal.roof + '"/>';
      s += '<rect x="96" y="118" width="208" height="6" fill="' + pal.accent + '" opacity="0.22"/>';
      s += '<rect x="150" y="115" width="92" height="7" rx="2" fill="url(#pool' + id + ')"/>';
      s += '<rect x="156" y="120" width="16" height="3" fill="#bff3ee" opacity="0.5"/>';
      s += '<rect x="206" y="108" width="74" height="2" fill="' + pal.accent + '" opacity="0.5"/>';
      s += '<rect x="208" y="108" width="1.4" height="12" fill="' + pal.accent + '" opacity="0.5"/><rect x="278" y="108" width="1.4" height="12" fill="' + pal.accent + '" opacity="0.5"/>';
      s += '<circle cx="116" cy="118" r="7" fill="' + pal.foliage + '"/><circle cx="130" cy="116" r="5" fill="' + pal.foliage + '"/>';
      s += '<rect x="122" y="130" width="3" height="8" fill="' + pal.trunk + '"/>';
      s += palmSVG(76, 276, 24, pal);
      s += palmSVG(332, 282, 20, pal);
      s += '<rect x="0" y="282" width="400" height="1" fill="' + pal.accent + '" opacity="0.2"/>';
    }

    if (kind === "plot") {
      s += '<path d="M0 218 Q 90 200 200 210 T 400 206 L400 300 L0 300Z" fill="' + pal.ground + '"/>';
      s += '<path d="M0 240 Q 120 222 240 236 T 400 230 L400 300 L0 300Z" fill="' + pal.deck + '" opacity="0.75"/>';
      s += '<path d="M62 224 L318 214 L370 290 L42 294 Z" fill="' + pal.accent + '" opacity="0.055" stroke="' + pal.accent + '" stroke-opacity="0.55" stroke-width="1" stroke-dasharray="5 5"/>';
      s += '<path d="M92 231 L302 222 L344 281 L64 286 Z" fill="none" stroke="' + pal.accent + '" stroke-opacity="0.28" stroke-width="0.8" stroke-dasharray="2 5"/>';
      s += '<g fill="none" stroke="' + pal.accent + '" stroke-opacity="0.78" stroke-width="1.2">' +
        '<path d="M150 214 L238 209 L272 228 L182 234 Z"/>' +
        '<path d="M150 214 L150 250 L182 268 L182 234"/>' +
        '<path d="M238 209 L238 245 L272 262 L272 228"/>' +
        '<path d="M182 234 L182 268 L272 262"/>' +
        '<path d="M188 198 L238 194 L258 206 L208 210 Z"/>' +
        '<path d="M188 198 L188 226 L208 236 L208 210"/>' +
        '<path d="M238 194 L238 222 L258 232 L258 206"/>' +
        '<path d="M208 210 L208 236 L258 232"/></g>';
      s += '<rect x="228" y="246" width="32" height="12" fill="none" stroke="#59c6bd" stroke-opacity="0.6" stroke-dasharray="2 3"/>';
      s += '<g fill="' + pal.accent + '">' +
        '<circle cx="62" cy="224" r="2.2"/><circle cx="318" cy="214" r="2.2"/><circle cx="370" cy="290" r="2.2"/><circle cx="42" cy="294" r="2.2"/></g>';
      s += '<g stroke="' + pal.accent + '" stroke-width="1" opacity="0.5"><path d="M62 224v8M318 214v8M370 290v-8M42 294v-8"/></g>';
      s += '<rect x="16" y="228" width="106" height="50" fill="#071119" stroke="' + pal.accent + '" stroke-opacity="0.75"/>';
      s += '<rect x="16" y="228" width="106" height="11" fill="' + pal.accent + '" opacity="0.2"/>';
      s += '<text x="25" y="247" fill="' + pal.accent + '" font-family="Manrope, sans-serif" font-size="7.5" letter-spacing="1.7">SCHEME 33</text>';
      s += '<text x="25" y="268" fill="#f2e9d8" font-family="Georgia, serif" font-size="17">240 sq yd</text>';
      s += '<rect x="25" y="278" width="1.6" height="20" fill="' + pal.accent + '" opacity="0.6"/>';
      s += palmSVG(336, 270, 28, pal);
      s += palmSVG(302, 276, 20, pal);
      s += '<circle cx="70" cy="276" r="9" fill="' + pal.foliage + '" opacity="0.7"/><circle cx="88" cy="280" r="6" fill="' + pal.foliage + '" opacity="0.55"/>';
    }

    s += '<rect width="400" height="300" fill="url(#vignette' + id + ')"/>';
    s += "</svg>";
    return s;
  }

  /* ----------------------------------------------------------
     4. The grid
     ---------------------------------------------------------- */
  var gridEl, resultCountEl, resultAreaEl, emptyStateEl, resetFiltersBtn;

  function filteredProperties() {
    var list = properties.filter(function (p) {
      var typeOk = state.type === "all" || p.type === state.type;
      var areaOk = state.area === "all" || p.district === state.area;
      return typeOk && areaOk;
    });
    var sort = state.sort;
    if (sort === "price-asc") list = list.slice().sort(function (a, b) { return a.price - b.price; });
    if (sort === "price-desc") list = list.slice().sort(function (a, b) { return b.price - a.price; });
    if (sort === "size-desc") list = list.slice().sort(function (a, b) { return b.size - a.size; });
    return list;
  }

  function cardSpecs(p) {
    if (p.type === "plot") {
      return '<span><svg class="icon" aria-hidden="true"><use href="#i-area"/></svg>' + p.sizeLabel + '</span>' +
        '<span><svg class="icon" aria-hidden="true"><use href="#i-pin"/></svg>Corner plot</span>' +
        '<span><svg class="icon" aria-hidden="true"><use href="#i-check"/></svg>Possession ready</span>';
    }
    return '<span><svg class="icon" aria-hidden="true"><use href="#i-bed"/></svg>' + p.beds + " beds</span>" +
      '<span><svg class="icon" aria-hidden="true"><use href="#i-bath"/></svg>' + p.baths + " baths</span>" +
      '<span><svg class="icon" aria-hidden="true"><use href="#i-area"/></svg>' + p.sizeLabel + "</span>";
  }

  function cardTemplate(p, index) {
    var price = pkrParts(p.price);
    return '<article class="property-card card-enter" data-id="' + p.id + '" style="--d:' + (index * 0.055).toFixed(3) + 's">' +
      '<div class="card-art">' + artworkSVG(p) +
      '<div class="card-badges"><span class="card-badge ' + (p.badgeTone ? "card-badge--gold" : "") + '">' + escapeHTML(p.badge) + "</span></div>" +
      '<button class="card-3d" type="button" data-3d="' + p.id + '" aria-label="View ' + escapeHTML(p.title) + ' in 3D">' +
      '<svg class="icon" aria-hidden="true"><use href="#i-cube"/></svg>3D</button></div>' +
      '<div class="card-body">' +
      '<p class="card-location"><svg class="icon" aria-hidden="true"><use href="#i-pin"/></svg>' + escapeHTML(p.location) + "</p>" +
      '<h3 class="card-title">' + escapeHTML(p.title) + "</h3>" +
      '<div class="card-specs">' + cardSpecs(p) + "</div>" +
      "<hr>" +
      '<div class="card-foot">' +
      '<div class="card-price"><small>Guide price</small><strong>PKR ' + price.n + " <em>" + price.unit + "</em></strong></div>" +
      '<button class="card-view" type="button" data-3d="' + p.id + '" aria-label="Open ' + escapeHTML(p.title) + ' in the 3D studio">' +
      '<svg class="icon" aria-hidden="true"><use href="#i-arrow"/></svg></button>' +
      "</div></div></article>";
  }

  function attachTilt() {
    if (reducedMotion || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    $$(".property-card", gridEl).forEach(function (card) {
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        card.classList.add("is-tilting");
        card.style.transform = "perspective(1200px) rotateX(" + (-py * 3.6).toFixed(2) + "deg) rotateY(" + (px * 4.6).toFixed(2) + "deg) translateY(-3px)";
      });
      card.addEventListener("pointerleave", function () {
        card.classList.remove("is-tilting");
        card.style.transform = "";
      });
    });
  }

  function renderProperties() {
    if (!gridEl) return;
    var list = filteredProperties();
    gridEl.innerHTML = list.map(cardTemplate).join("");
    gridEl.hidden = list.length === 0;
    if (emptyStateEl) emptyStateEl.hidden = list.length !== 0;
    if (resultCountEl) resultCountEl.textContent = String(list.length);
    if (resultAreaEl) resultAreaEl.textContent = state.area === "all" ? "Karachi" : state.area;
    if (resetFiltersBtn) resetFiltersBtn.hidden = state.type === "all" && state.area === "all" && state.sort === "featured";
    updateActiveCard();
    attachTilt();
  }

  function updateActiveCard() {
    if (!gridEl) return;
    $$(".property-card", gridEl).forEach(function (card) {
      card.classList.toggle("is-active", card.dataset.id === state.selectedId);
    });
  }

  function setType(type) {
    state.type = type;
    $$(".chip").forEach(function (chip) {
      var active = chip.dataset.type === type;
      chip.classList.toggle("is-active", active);
      chip.setAttribute("aria-pressed", active ? "true" : "false");
    });
    renderProperties();
  }

  function setArea(area, options) {
    state.area = area;
    if (area === "all") state.type = "all";
    setType(state.type);
    if (area !== "all") {
      $$(".chip").forEach(function (chip) {
        var active = chip.dataset.type === "all";
        chip.classList.toggle("is-active", active);
        chip.setAttribute("aria-pressed", active ? "true" : "false");
      });
    }
    var areaSelect = $("#areaFilter");
    if (areaSelect) areaSelect.value = area;
    if (!options || !options.silent) {
      var count = filteredProperties().length;
      toast("Showing " + count + " home" + (count === 1 ? "" : "s") + (area === "all" ? " across Karachi" : " in " + area));
    }
  }

  /* ----------------------------------------------------------
     5. Featured card
     ---------------------------------------------------------- */
  function initFeaturedCard() {
    var p = properties.find(function (x) { return x.id === "khayaban-e-saadi-villa"; }) || properties[0];
    var art = $("#heroCardArt");
    if (art) art.innerHTML = artworkSVG(p);
    var areaEl = $("#heroCardArea");
    var titleEl = $("#heroCardTitle");
    if (areaEl) areaEl.textContent = p.location + " · Karachi";
    if (titleEl) titleEl.textContent = p.title;
    var meta = $(".hero-card__meta");
    if (meta) {
      meta.innerHTML = "<span>" + p.beds + " beds</span><span>" + p.sizeLabel + "</span><span>" + formatPKRShort(p.price) + "</span>";
    }
    var link = $("[data-featured-link]");
    if (link) {
      link.addEventListener("click", function () {
        selectProperty(p.id, { scroll: false });
      });
    }
  }

  /* ----------------------------------------------------------
     6. Neighbourhood map + list
     ---------------------------------------------------------- */
  function renderMap() {
    var pins = $("#mapPins");
    var list = $("#hoodList");
    if (!pins || !list) return;
    var ns = "http://www.w3.org/2000/svg";

    pins.innerHTML = "";
    areas.forEach(function (a) {
      var g = document.createElementNS(ns, "g");
      g.setAttribute("class", "map-pin" + (a.id === state.selectedArea ? " is-active" : ""));
      g.setAttribute("data-area", a.id);
      g.setAttribute("tabindex", "0");
      g.setAttribute("role", "button");
      g.setAttribute("aria-label", a.name + ", median " + formatCount(a.price) + " rupees per square foot, " + a.growth + " year on year");
      g.innerHTML =
        '<circle class="pin-halo" cx="' + a.x + '" cy="' + a.y + '" r="21"/>' +
        '<circle class="pin-ring" cx="' + a.x + '" cy="' + a.y + '" r="9.5"/>' +
        '<circle class="pin-dot" cx="' + a.x + '" cy="' + a.y + '" r="4.4"/>' +
        '<text class="pin-label" x="' + a.x + '" y="' + (a.y + a.labelDy) + '" text-anchor="middle">' + a.pinLabel + "</text>" +
        '<text class="pin-price" x="' + a.x + '" y="' + (a.y + a.labelDy + (a.labelDy < 0 ? -9 : 9)) + '" text-anchor="middle">PKR ' + formatCount(a.price) + "</text>";
      pins.appendChild(g);
    });

    list.innerHTML = areas.map(function (a, i) {
      return '<button class="hood-row' + (a.id === state.selectedArea ? " is-active" : "") + '" type="button" data-area="' + a.id + '">' +
        '<span class="hood-num">0' + (i + 1) + "</span>" +
        '<span class="hood-name"><strong>' + a.name + "</strong><small>" + a.note + "</small></span>" +
        '<span class="hood-price"><strong>PKR ' + formatCount(a.price) + "</strong><em>" + a.growth + "</em></span>" +
        '<svg class="icon hood-arrow" aria-hidden="true"><use href="#i-arrow"/></svg>' +
        "</button>";
    }).join("");

    var pinEls = $$(".map-pin", pins);
    pinEls.forEach(function (pin) {
      pin.addEventListener("click", function () { selectArea(pin.dataset.area); });
      pin.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          selectArea(pin.dataset.area);
        }
      });
    });

    $$(".hood-row", list).forEach(function (row) {
      row.addEventListener("click", function () { selectArea(row.dataset.area); });
    });

    selectArea(state.selectedArea, { silent: true });
  }

  function selectArea(id, options) {
    var a = areas.find(function (x) { return x.id === id; }) || areas[0];
    state.selectedArea = a.id;
    $$(".map-pin").forEach(function (pin) {
      pin.classList.toggle("is-active", pin.dataset.area === a.id);
    });
    $$(".hood-row").forEach(function (row) {
      row.classList.toggle("is-active", row.dataset.area === a.id);
    });
    var nameEl = $("#hoodName");
    var priceEl = $("#hoodPrice");
    var blurbEl = $("#hoodBlurb");
    var growthEl = $("#hoodGrowth");
    var tagsEl = $("#hoodTags");
    if (nameEl) nameEl.textContent = a.name;
    if (priceEl) priceEl.innerHTML = "PKR " + formatCount(a.price) + " <span>/ sq ft</span>";
    if (blurbEl) blurbEl.textContent = a.blurb;
    if (growthEl) { growthEl.textContent = a.growth; growthEl.style.color = "var(--teal)"; }
    if (tagsEl) tagsEl.innerHTML = a.tags.map(function (t) { return "<span>" + t + "</span>"; }).join("");
    var browse = $("#hoodBrowse");
    if (browse) {
      var count = properties.filter(function (p) { return p.district === a.district; }).length;
      browse.innerHTML = "Browse " + count + " home" + (count === 1 ? "" : "s") + ' <svg class="icon" aria-hidden="true"><use href="#i-arrow"/></svg>';
    }
    if (!options || !options.silent) {
      // no scroll, the map is already in view
    }
  }

  /* ----------------------------------------------------------
     7. Market chart
     ---------------------------------------------------------- */
  function renderMarket() {
    var chart = $("#marketChart");
    if (!chart) return;
    var max = 30000;
    chart.innerHTML = market.map(function (m, i) {
      var w = (m.value / max) * 96;
      return '<div class="bar-row">' +
        '<div class="bar-label"><span>' + m.name + "</span><small>" + m.sub + "</small></div>" +
        '<div class="bar-track"><i style="--w:' + w.toFixed(1) + '%;--d:' + (i * 0.07).toFixed(2) + 's"></i></div>' +
        '<span class="bar-value">' + formatCount(m.value) + "</span>" +
        '<span class="bar-change">' + m.growth + "</span>" +
        "</div>";
    }).join("");
  }

  /* ----------------------------------------------------------
     8. Studio details
     ---------------------------------------------------------- */
  function updateStudioDetails(p) {
    var map = {
      studioArea: p.location + " · Karachi",
      studioPrice: formatPKR(p.price),
      studioTitle: p.title,
      studioDesc: p.desc,
      studioBeds: p.type === "plot" ? "—" : p.beds,
      studioBaths: p.type === "plot" ? "—" : p.baths,
      studioSize: p.sizeLabel,
      studioKind: p.kind,
      studioTypeLabel: modelLabels[p.model] || "Residence"
    };
    Object.keys(map).forEach(function (key) {
      var el = document.getElementById(key);
      if (el) el.textContent = map[key];
    });
    var features = $("#studioFeatures");
    if (features) {
      features.innerHTML = p.features.map(function (f) {
        return '<li><svg class="icon" aria-hidden="true"><use href="#i-check"/></svg>' + f + "</li>";
      }).join("");
    }
    $$("#modelTabs button").forEach(function (btn) {
      btn.setAttribute("aria-pressed", btn.dataset.model === p.model ? "true" : "false");
    });
    var book = $("#studioBook");
    if (book) book.dataset.property = p.id;
  }

  function selectProperty(id, options) {
    var p = properties.find(function (x) { return x.id === id; });
    if (!p) return;
    state.selectedId = p.id;
    updateStudioDetails(p);
    updateActiveCard();
    if (window.__sahilStudio && window.__sahilStudio.setProperty) {
      window.__sahilStudio.setProperty(p);
    }
    if (options && options.scroll) {
      var studio = $("#studio");
      if (studio) studio.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
    }
  }

  /* ----------------------------------------------------------
     9. Navigation, filters, map actions, form
     ---------------------------------------------------------- */
  function initNavigation() {
    var header = $("#siteHeader");
    var menuBtn = $("#menuToggle");
    var menu = $("#mobileMenu");

    function onScroll() {
      if (header) header.classList.toggle("is-scrolled", window.scrollY > 24);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    function closeMenu() {
      if (!menu) return;
      menu.classList.remove("is-open");
      menu.setAttribute("aria-hidden", "true");
      document.body.classList.remove("nav-open");
      if (menuBtn) {
        menuBtn.setAttribute("aria-expanded", "false");
        menuBtn.setAttribute("aria-label", "Open menu");
      }
    }
    function openMenu() {
      if (!menu) return;
      menu.classList.add("is-open");
      menu.setAttribute("aria-hidden", "false");
      document.body.classList.add("nav-open");
      if (menuBtn) {
        menuBtn.setAttribute("aria-expanded", "true");
        menuBtn.setAttribute("aria-label", "Close menu");
      }
    }
    if (menuBtn) {
      menuBtn.addEventListener("click", function () {
        if (menu && menu.classList.contains("is-open")) closeMenu();
        else openMenu();
      });
    }
    if (menu) {
      $$("a", menu).forEach(function (a) { a.addEventListener("click", closeMenu); });
    }
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMenu();
    });

    // Scroll spy
    var navLinks = $$("[data-nav]");
    var sections = navLinks.map(function (link) {
      return document.querySelector(link.getAttribute("href"));
    }).filter(Boolean);
    if ("IntersectionObserver" in window && sections.length) {
      var spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          navLinks.forEach(function (link) {
            link.classList.toggle("is-active", link.getAttribute("href") === "#" + entry.target.id);
          });
        });
      }, { rootMargin: "-38% 0px -54% 0px", threshold: 0 });
      sections.forEach(function (sec) { spy.observe(sec); });
    }
  }

  function initFilters() {
    gridEl = $("#propertyGrid");
    resultCountEl = $("#resultCount");
    resultAreaEl = $("#resultArea");
    emptyStateEl = $("#emptyState");
    resetFiltersBtn = $("#resetFilters");
    var areaSelect = $("#areaFilter");
    var sortSelect = $("#sortFilter");

    $$(".chip").forEach(function (chip) {
      chip.addEventListener("click", function () { setType(chip.dataset.type); });
    });

    if (areaSelect) {
      areaSelect.addEventListener("change", function () {
        state.area = areaSelect.value;
        renderProperties();
        var match = areas.find(function (a) { return a.district === areaSelect.value; });
        if (match) selectArea(match.id, { silent: true });
        if (state.area === "all") toast("Showing all Karachi residences");
      });
    }
    if (sortSelect) {
      sortSelect.addEventListener("change", function () {
        state.sort = sortSelect.value;
        renderProperties();
      });
    }
    if (resetFiltersBtn) resetFiltersBtn.addEventListener("click", resetAllFilters);
    var emptyReset = $("#emptyReset");
    if (emptyReset) emptyReset.addEventListener("click", resetAllFilters);

    if (gridEl) {
      gridEl.addEventListener("click", function (e) {
        var trigger = e.target.closest("[data-3d]");
        if (!trigger) return;
        e.preventDefault();
        selectProperty(trigger.dataset["3d"], { scroll: true });
      });
    }

    renderProperties();
  }

  function resetAllFilters() {
    state.type = "all";
    state.area = "all";
    state.sort = "featured";
    var areaSelect = $("#areaFilter");
    var sortSelect = $("#sortFilter");
    if (areaSelect) areaSelect.value = "all";
    if (sortSelect) sortSelect.value = "featured";
    $$(".chip").forEach(function (chip) {
      var active = chip.dataset.type === "all";
      chip.classList.toggle("is-active", active);
      chip.setAttribute("aria-pressed", active ? "true" : "false");
    });
    renderProperties();
    selectArea("dha", { silent: true });
    toast("Collection reset");
  }

  function initMapActions() {
    var browse = $("#hoodBrowse");
    if (browse) {
      browse.addEventListener("click", function () {
        var a = areas.find(function (x) { return x.id === state.selectedArea; });
        if (!a) return;
        state.type = "all";
        state.area = a.district;
        var areaSelect = $("#areaFilter");
        if (areaSelect) areaSelect.value = a.district;
        $$(".chip").forEach(function (chip) {
          var active = chip.dataset.type === "all";
          chip.classList.toggle("is-active", active);
          chip.setAttribute("aria-pressed", active ? "true" : "false");
        });
        renderProperties();
        var res = $("#residences");
        if (res) res.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
        var count = properties.filter(function (p) { return p.district === a.district; }).length;
        toast("Showing " + count + " home" + (count === 1 ? "" : "s") + " in " + a.name);
      });
    }
    $$("[data-jump-area]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var district = btn.dataset.jumpArea;
        var a = areas.find(function (x) { return x.district === district; });
        if (a) {
          selectArea(a.id, { silent: true });
          state.area = district;
          state.type = "all";
          var areaSelect = $("#areaFilter");
          if (areaSelect) areaSelect.value = district;
          renderProperties();
          var res = $("#residences");
          if (res) res.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
          toast("Showing homes in " + a.name);
        }
      });
    });
  }

  function initStudioUI() {
    $$("#modelTabs button").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var p = properties.find(function (x) { return x.model === btn.dataset.model; });
        if (p) selectProperty(p.id, { scroll: false });
      });
    });
    var next = $("#studioNext");
    if (next) {
      next.addEventListener("click", function () {
        var idx = properties.findIndex(function (p) { return p.id === state.selectedId; });
        var p = properties[(idx + 1 + properties.length) % properties.length];
        selectProperty(p.id, { scroll: false });
      });
    }
    var book = $("#studioBook");
    if (book) {
      book.addEventListener("click", function () {
        var p = properties.find(function (x) { return x.id === state.selectedId; });
        var interest = $("#formInterest");
        if (p && interest) {
          var exists = Array.prototype.some.call(interest.options, function (o) { return o.value === p.title; });
          interest.value = exists ? p.title : "A private shortlist";
        }
      });
    }
    var rotate = $("#studioRotate");
    if (rotate) {
      rotate.addEventListener("click", function () {
        var api = window.__sahilStudio;
        if (api && api.toggleRotate) {
          var on = api.toggleRotate();
          rotate.setAttribute("aria-pressed", on ? "true" : "false");
        }
      });
    }
    var reset = $("#studioReset");
    if (reset) {
      reset.addEventListener("click", function () {
        if (window.__sahilStudio && window.__sahilStudio.resetView) window.__sahilStudio.resetView();
      });
    }
  }

  function initContactForm() {
    var form = $("#contactForm");
    if (!form) return;
    var name = $("#formName");
    var phone = $("#formPhone");
    var email = $("#formEmail");
    var consent = $("#formConsent");
    var consentError = $("#consentError");
    var submit = $("#formSubmit");
    var success = $("#formSuccess");
    var again = $("#formAgain");

    function fieldOf(input) { return input.closest(".field"); }
    function setError(input, hasError) {
      var field = fieldOf(input);
      if (field) field.classList.toggle("has-error", hasError);
    }
    function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
    function validPhone(v) { return v.replace(/[^\d]/g, "").length >= 7; }

    [name, phone, email].forEach(function (input) {
      if (!input) return;
      input.addEventListener("input", function () { setError(input, false); });
    });
    if (consent) {
      consent.addEventListener("change", function () {
        if (consentError) consentError.classList.remove("is-visible");
      });
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true;
      if (!name.value.trim()) { setError(name, true); ok = false; }
      if (!validPhone(phone.value)) { setError(phone, true); ok = false; }
      if (!validEmail(email.value.trim())) { setError(email, true); ok = false; }
      if (consent && !consent.checked) {
        if (consentError) consentError.classList.add("is-visible");
        ok = false;
      }
      if (!ok) {
        toast("Please check the highlighted fields.");
        var firstError = form.querySelector(".has-error input, .has-error select");
        if (firstError) firstError.focus();
        return;
      }
      if (submit) {
        submit.disabled = true;
        submit.innerHTML = "Sending…";
      }
      setTimeout(function () {
        var first = name.value.trim().split(/\s+/)[0] || "friend";
        var successName = $("#successName");
        if (successName) successName.textContent = first;
        form.hidden = true;
        if (success) {
          success.hidden = false;
          success.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "center" });
        }
        form.reset();
        if (submit) {
          submit.disabled = false;
          submit.innerHTML = 'Send enquiry <svg class="icon" aria-hidden="true"><use href="#i-arrow"/></svg>';
        }
        if (consentError) consentError.classList.remove("is-visible");
      }, 750);
    });

    if (again) {
      again.addEventListener("click", function () {
        if (success) success.hidden = true;
        form.hidden = false;
        if (name) name.focus();
      });
    }
  }

  /* ----------------------------------------------------------
     10. Reveals, counters, preloader
     ---------------------------------------------------------- */
  function initReveals() {
    var revealEls = $$("[data-reveal]");
    if (!("IntersectionObserver" in window) || reducedMotion) {
      revealEls.forEach(function (el) { el.classList.add("is-revealed"); });
    } else {
      revealEls.forEach(function (el, i) {
        el.classList.add("reveal-init");
        el.style.setProperty("--reveal-delay", (i % 4) * 0.06 + "s");
      });
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            io.unobserve(entry.target);
          }
        });
      }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
      revealEls.forEach(function (el) { io.observe(el); });
    }

    var chart = $(".chart-panel");
    if (chart) {
      if (!("IntersectionObserver" in window) || reducedMotion) {
        chart.classList.add("is-in");
      } else {
        var chartIO = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              chart.classList.add("is-in");
              chartIO.disconnect();
            }
          });
        }, { threshold: 0.18 });
        chartIO.observe(chart);
      }
    }
  }

  function animateHeroStats() {
    var stats = $$("[data-count]");
    stats.forEach(function (el) {
      var target = Number(el.dataset.count);
      var suffix = el.dataset.suffix || "";
      if (reducedMotion) {
        el.textContent = target + suffix;
        return;
      }
      var start = null;
      var duration = 1500;
      function step(ts) {
        if (start === null) start = ts;
        var t = clamp((ts - start) / duration, 0, 1);
        var eased = 1 - Math.pow(1 - t, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (t < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }

  function initPreloader() {
    document.body.classList.add("is-loading");
    var preloader = $("#preloader");
    var bar = $("#preloaderBar");
    var progress = 0;
    var done = false;
    var timer = setInterval(function () {
      progress = Math.min(90, progress + 5 + Math.random() * 10);
      if (bar) bar.style.width = progress + "%";
    }, 160);

    function finish() {
      if (done) return;
      done = true;
      clearInterval(timer);
      if (bar) bar.style.width = "100%";
      setTimeout(function () {
        if (preloader) preloader.classList.add("is-done");
        document.body.classList.remove("is-loading");
        document.body.classList.add("is-ready");
        animateHeroStats();
        setTimeout(function () {
          if (preloader && preloader.parentNode) preloader.parentNode.removeChild(preloader);
        }, 900);
      }, reducedMotion ? 40 : 420);
    }

    if (document.readyState === "complete") {
      setTimeout(finish, reducedMotion ? 0 : 600);
    } else {
      window.addEventListener("load", function () { setTimeout(finish, reducedMotion ? 0 : 650); });
    }
    setTimeout(finish, 5000);
  }

  function initFooterYear() {
    var year = $("#year");
    if (year) year.textContent = String(new Date().getFullYear());
  }

  /* ----------------------------------------------------------
     11. Boot
     ---------------------------------------------------------- */
  function initUI() {
    initFooterYear();
    initNavigation();
    initFeaturedCard();
    initFilters();
    initStudioUI();
    initMapActions();
    renderMap();
    renderMarket();
    initContactForm();
    initReveals();
    updateStudioDetails(properties.find(function (p) { return p.id === state.selectedId; }));
    initPreloader();
  }

  /* ============================================================
     12. HERO — procedural Karachi skyline in Three.js
     ============================================================ */
  function initHero3D() {
    var heroEl = $("#hero");
    var canvas = $("#heroCanvas");
    var toggle = $("#skyToggle");
    if (!canvas || !heroEl) return;

    function no3D() {
      heroEl.classList.add("no-3d");
      if (toggle) {
        toggle.addEventListener("click", function () {
          var on = toggle.getAttribute("aria-pressed") !== "true";
          toggle.setAttribute("aria-pressed", on ? "true" : "false");
          var label = toggle.querySelector(".sky-toggle__label");
          if (label) label.textContent = on ? "Daylight" : "Golden hour";
        });
      }
    }

    if (!window.THREE) { no3D(); return; }
    if (THREE.ColorManagement) THREE.ColorManagement.legacyMode = false;

    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
    } catch (err) {
      no3D();
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x07111b, 1);

    var scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x17262f, 0.00125);

    var camera = new THREE.PerspectiveCamera(38, 1, 0.5, 2400);
    camera.position.set(0, 54, 300);
    camera.lookAt(0, 36, -70);

    /* ---------- sky ---------- */
    var skyUniforms = {
      uTop: { value: new THREE.Color(0x050b17) },
      uHorizon: { value: new THREE.Color(0xb96c46) },
      uGlow: { value: new THREE.Color(0xffa45c) },
      uSunCol: { value: new THREE.Color(0xffd9a0) },
      uSunDir: { value: new THREE.Vector3(-0.42, 0.24, -0.88).normalize() }
    };
    var sky = new THREE.Mesh(
      new THREE.SphereGeometry(900, 36, 22),
      new THREE.ShaderMaterial({
        uniforms: skyUniforms,
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        vertexShader: "varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
        fragmentShader: [
          "varying vec3 vDir;",
          "uniform vec3 uTop; uniform vec3 uHorizon; uniform vec3 uGlow; uniform vec3 uSunCol; uniform vec3 uSunDir;",
          "void main(){",
          "  vec3 d = normalize(vDir);",
          "  float h = clamp(d.y, -0.06, 1.0);",
          "  vec3 col = mix(uHorizon, uTop, smoothstep(0.0, 0.62, h));",
          "  col = mix(col, uHorizon * 1.22, exp(-max(h, 0.0) * 8.5) * 0.55);",
          "  float sd = max(dot(d, normalize(uSunDir)), 0.0);",
          "  col += uGlow * pow(sd, 4.0) * 0.075;",
          "  col += uGlow * pow(sd, 26.0) * 0.2;",
          "  float disc = smoothstep(0.9994, 0.99982, sd);",
          "  col = mix(col, uSunCol * 1.55, disc * 0.95);",
          "  gl_FragColor = vec4(col, 1.0);",
          "  #include <tonemapping_fragment>",
          "  #include <encodings_fragment>",
          "}"
        ].join("\n")
      })
    );
    scene.add(sky);

    function makeGlowTexture() {
      var c = document.createElement("canvas");
      c.width = c.height = 128;
      var ctx = c.getContext("2d");
      var g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      g.addColorStop(0, "rgba(255,255,255,1)");
      g.addColorStop(0.14, "rgba(255,246,226,0.95)");
      g.addColorStop(0.34, "rgba(255,206,150,0.45)");
      g.addColorStop(0.68, "rgba(255,164,92,0.12)");
      g.addColorStop(1, "rgba(255,140,70,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 128, 128);
      var tex = new THREE.CanvasTexture(c);
      tex.encoding = THREE.sRGBEncoding;
      return tex;
    }
    var glowTex = makeGlowTexture();


    var starGeo = new THREE.BufferGeometry();
    var starPos = [];
    for (var si = 0; si < 420; si++) {
      var theta = Math.random() * Math.PI * 2;
      var phi = Math.random() * Math.PI * 0.36;
      var r = 760;
      starPos.push(Math.cos(theta) * Math.sin(phi) * r, Math.cos(phi) * r, Math.sin(theta) * Math.sin(phi) * r);
    }
    starGeo.setAttribute("position", new THREE.Float32BufferAttribute(starPos, 3));
    var starMat = new THREE.PointsMaterial({
      color: 0xcfdeee, size: 1.7, transparent: true, opacity: 0.55,
      depthWrite: false, fog: false, sizeAttenuation: true
    });
    var stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    /* ---------- lighting ---------- */
    var hemi = new THREE.HemisphereLight(0x9db8c8, 0x0a1218, 0.55);
    scene.add(hemi);

    var sunLight = new THREE.DirectionalLight(0xffb877, 2.2);
    sunLight.position.set(-180, 110, -330);
    sunLight.target.position.set(0, 0, -80);
    scene.add(sunLight);
    scene.add(sunLight.target);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(2048, 2048);
    sunLight.shadow.camera.left = -320;
    sunLight.shadow.camera.right = 320;
    sunLight.shadow.camera.top = 280;
    sunLight.shadow.camera.bottom = -180;
    sunLight.shadow.camera.near = 1;
    sunLight.shadow.camera.far = 1000;
    sunLight.shadow.bias = -0.0006;
    sunLight.shadow.normalBias = 0.7;

    var fill = new THREE.DirectionalLight(0x4f8a9a, 0.38);
    fill.position.set(220, 90, 130);
    scene.add(fill);

    /* ---------- materials ---------- */
    var windowMats = [];
    function windowMaterial(baseColor, opts) {
      var params = Object.assign({ color: baseColor, roughness: 0.78, metalness: 0.12 }, opts || {});
      var mat = new THREE.MeshStandardMaterial(params);
      mat.onBeforeCompile = function (shader) {
        shader.uniforms.uNight = { value: 1 };
        mat.userData.shader = shader;
        shader.vertexShader = shader.vertexShader
          .replace("#include <common>", "#include <common>\nvarying vec3 vWPos;\nvarying vec3 vWN;\nvarying float vSeed;")
          .replace("#include <worldpos_vertex>", [
            "#include <worldpos_vertex>",
            "vec4 wp4 = vec4(transformed, 1.0);",
            "vec3 wn = normal;",
            "#ifdef USE_INSTANCING",
            "  wp4 = instanceMatrix * wp4;",
            "  wn = mat3(instanceMatrix) * wn;",
            "  vSeed = instanceMatrix[3].x * 0.37 + instanceMatrix[3].z * 0.71;",
            "#else",
            "  vSeed = 0.0;",
            "#endif",
            "wp4 = modelMatrix * wp4;",
            "vWPos = wp4.xyz;",
            "vWN = normalize(mat3(modelMatrix) * wn);"
          ].join("\n"));
        shader.fragmentShader = shader.fragmentShader
          .replace("#include <common>", [
            "#include <common>",
            "varying vec3 vWPos; varying vec3 vWN; varying float vSeed;",
            "uniform float uNight;",
            "float winHash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }"
          ].join("\n"))
          .replace("#include <emissivemap_fragment>", [
            "#include <emissivemap_fragment>",
            "vec3 wnrm = abs(normalize(vWN));",
            "float facade = wnrm.x > wnrm.z ? vWPos.z : vWPos.x;",
            "float colId = floor(facade * 0.62);",
            "float rowId = floor(vWPos.y * 0.68);",
            "float fx = fract(facade * 0.62);",
            "float fy = fract(vWPos.y * 0.68);",
            "float win = step(0.2, fx) * step(fx, 0.7) * step(0.28, fy) * step(fy, 0.72) * step(wnrm.y, 0.42);",
            "float lit = step(0.46, winHash(vec2(colId + vSeed, rowId)));",
            "vec3 winCol = mix(vec3(1.0, 0.62, 0.26), vec3(0.62, 0.85, 0.86), step(0.9, winHash(vec2(rowId, colId))));",
            "totalEmissiveRadiance += win * lit * winCol * (1.0 * uNight);",
            "diffuseColor.rgb *= mix(1.0, 0.58, win * (1.0 - lit));"
          ].join("\n"));
      };
      mat.customProgramCacheKey = function () { return "sahil-windows-v1"; };
      windowMats.push(mat);
      return mat;
    }

    var marble = new THREE.MeshStandardMaterial({ color: 0xf2ede2, roughness: 0.52, metalness: 0.03 });
    var marbleDim = new THREE.MeshStandardMaterial({ color: 0xd9d2c3, roughness: 0.62, metalness: 0.03 });
    var goldMat = new THREE.MeshStandardMaterial({ color: 0xd8b46e, roughness: 0.3, metalness: 0.8, emissive: 0x4a320c, emissiveIntensity: 0.55 });
    var concrete = new THREE.MeshStandardMaterial({ color: 0x9fa6a5, roughness: 0.86, metalness: 0.05 });
    var darkSteel = new THREE.MeshStandardMaterial({ color: 0x2a3842, roughness: 0.62, metalness: 0.55 });
    var warmGlass = new THREE.MeshStandardMaterial({ color: 0x22404c, roughness: 0.18, metalness: 0.7, emissive: 0x162f38, emissiveIntensity: 0.5 });
    var greenMat = new THREE.MeshStandardMaterial({ color: 0x2d4a37, roughness: 0.9, metalness: 0.02 });

    var cityGroup = new THREE.Group();
    scene.add(cityGroup);

    function addBox(parent, w, h, d, x, y, z, mat, cast) {
      var mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      mesh.position.set(x, y, z);
      mesh.castShadow = cast !== false;
      mesh.receiveShadow = true;
      parent.add(mesh);
      return mesh;
    }

    /* ---------- land, sea, promenade ---------- */
    var land = new THREE.Mesh(
      new THREE.PlaneGeometry(1500, 500),
      new THREE.MeshStandardMaterial({ color: 0x0a141b, roughness: 0.96, metalness: 0.02 })
    );
    land.rotation.x = -Math.PI / 2;
    land.position.set(0, 0, -290);
    land.receiveShadow = true;
    scene.add(land);

    addBox(cityGroup, 1500, 0.6, 8, 0, 0.15, 57, new THREE.MeshStandardMaterial({ color: 0x29302c, roughness: 1 }), false);

    addBox(cityGroup, 1300, 1.2, 9, 0, 0.6, 55, new THREE.MeshStandardMaterial({ color: 0x1a262d, roughness: 0.85 }), false);
    addBox(cityGroup, 1300, 2.4, 1.8, 0, 1.2, 60.3, new THREE.MeshStandardMaterial({ color: 0x111b21, roughness: 0.9 }), false);
    addBox(cityGroup, 1300, 0.12, 15, 0, 0.08, 39, new THREE.MeshStandardMaterial({ color: 0x0c161c, roughness: 0.95 }), false);

    var waterUniforms = {
      uTime: { value: 0 },
      uDeep: { value: new THREE.Color(0x071820) },
      uShallow: { value: new THREE.Color(0x0e303a) },
      uSun: { value: new THREE.Color(0xe8a76c) },
      uHorizon: { value: new THREE.Color(0x7d4d3a) }
    };
    var water = new THREE.Mesh(
      new THREE.PlaneGeometry(2000, 1200, 110, 70),
      new THREE.ShaderMaterial({
        uniforms: waterUniforms,
        fog: false,
        vertexShader: [
          "varying vec3 vW; varying vec2 vUv;",
          "uniform float uTime;",
          "void main(){",
          "  vec3 p = position;",
          "  p.z += sin(p.x * 0.055 + uTime * 0.65) * 0.55 + sin(p.y * 0.04 - uTime * 0.45) * 0.45;",
          "  vec4 wp = modelMatrix * vec4(p, 1.0);",
          "  vW = wp.xyz; vUv = uv;",
          "  gl_Position = projectionMatrix * viewMatrix * wp;",
          "}"
        ].join("\n"),
        fragmentShader: [
          "varying vec3 vW; varying vec2 vUv;",
          "uniform float uTime; uniform vec3 uDeep; uniform vec3 uShallow; uniform vec3 uSun; uniform vec3 uHorizon;",
          "void main(){",
          "  vec3 col = mix(uDeep, uShallow, 0.35 + 0.25 * sin(vW.x * 0.025 + uTime * 0.2));",
          "  float b1 = sin(vW.z * 0.2 + uTime * 0.85 + sin(vW.x * 0.12 + uTime * 0.3) * 2.0);",
          "  float b2 = sin(vW.z * 0.44 - uTime * 0.7 + sin(vW.x * 0.07) * 3.0);",
          "  float glint = pow(max(0.0, b1 * 0.5 + 0.5), 60.0) + pow(max(0.0, b2 * 0.5 + 0.5), 96.0) * 0.5;",
          "  float sunPath = exp(-pow((vW.x + 120.0) / 260.0, 2.0));",
          "  col += uSun * glint * (0.045 + 0.2 * sunPath);",
          "  float dist = smoothstep(150.0, 700.0, length(vW.xz - vec2(0.0, 130.0)));",
          "  col = mix(col, uHorizon, dist * 0.32);",
          "  gl_FragColor = vec4(col, 1.0);",
          "  #include <tonemapping_fragment>",
          "  #include <encodings_fragment>",
          "}"
        ].join("\n")
      })
    );
    water.rotation.x = -Math.PI / 2;
    water.position.set(0, -0.55, 560);
    scene.add(water);

    /* ---------- procedural city ---------- */
    var zones = [
      [-105, -40, 50, 38], [48, -150, 32, 36], [155, -60, 40, 34],
      [80, -15, 44, 30], [-270, -20, 64, 32], [-320, 40, 30, 30]
    ];
    function excluded(x, z) {
      for (var i = 0; i < zones.length; i++) {
        var zn = zones[i];
        if (Math.abs(x - zn[0]) < zn[2] && Math.abs(z - zn[1]) < zn[3]) return true;
      }
      return false;
    }

    var rnd = mulberry32(864213);
    var blocks = [];
    var bands = [
      { count: 66, z0: -440, z1: -260, h0: 28, h1: 90, w0: 12, w1: 30 },
      { count: 62, z0: -250, z1: -130, h0: 18, h1: 64, w0: 10, w1: 24 },
      { count: 46, z0: -120, z1: -8, h0: 8, h1: 32, w0: 8, w1: 20 }
    ];
    bands.forEach(function (band) {
      var placed = 0;
      var guard = 0;
      while (placed < band.count && guard < band.count * 14) {
        guard++;
        var x = -360 + rnd() * 720;
        var z = band.z0 + rnd() * (band.z1 - band.z0);
        if (excluded(x, z)) continue;
        blocks.push({
          x: x, z: z,
          w: band.w0 + rnd() * (band.w1 - band.w0),
          d: band.w0 + rnd() * (band.w1 - band.w0),
          h: band.h0 + rnd() * (band.h1 - band.h0)
        });
        placed++;
      }
    });

    var boxGeo = new THREE.BoxGeometry(1, 1, 1);
    boxGeo.translate(0, 0.5, 0);
    var cityMat = windowMaterial(0xffffff, { roughness: 0.82, metalness: 0.14 });
    var cityMesh = new THREE.InstancedMesh(boxGeo, cityMat, blocks.length);
    cityMesh.castShadow = true;
    cityMesh.receiveShadow = true;
    var dummy = new THREE.Object3D();
    var cCol = new THREE.Color();
    blocks.forEach(function (b, i) {
      dummy.position.set(b.x, 0, b.z);
      dummy.scale.set(b.w, b.h, b.d);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      cityMesh.setMatrixAt(i, dummy.matrix);
      cCol.setHSL(0.56 + (rnd() - 0.5) * 0.05, 0.14, 0.12 + rnd() * 0.1);
      cityMesh.setColorAt(i, cCol);
    });
    cityMesh.instanceMatrix.needsUpdate = true;
    if (cityMesh.instanceColor) cityMesh.instanceColor.needsUpdate = true;
    cityGroup.add(cityMesh);

    // Rooftop details on the taller blocks
    var tall = blocks.filter(function (b) { return b.h > 28; });
    var roofCount = Math.min(tall.length, 42);
    var roofMesh = new THREE.InstancedMesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial({ color: 0x1a2831, roughness: 0.9 }),
      roofCount
    );
    for (var ri = 0; ri < roofCount; ri++) {
      var rb = tall[Math.floor(rnd() * tall.length)];
      dummy.position.set(rb.x + (rnd() - 0.5) * rb.w * 0.5, rb.h, rb.z + (rnd() - 0.5) * rb.d * 0.5);
      dummy.scale.set(2 + rnd() * 5, 1.4 + rnd() * 5, 2 + rnd() * 5);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      roofMesh.setMatrixAt(ri, dummy.matrix);
    }
    roofMesh.castShadow = false;
    cityGroup.add(roofMesh);

    /* ---------- Mazar-e-Quaid ---------- */
    var mazar = new THREE.Group();
    mazar.position.set(-105, 0, -40);
    cityGroup.add(mazar);
    addBox(mazar, 52, 1.6, 38, 0, 0.8, 0, marbleDim);
    addBox(mazar, 38, 2.2, 28, 0, 2.2, 0, marble);
    addBox(mazar, 22, 17, 22, 0, 11.7, 0, marble, true);
    addBox(mazar, 24, 1.2, 24, 0, 20.9, 0, marble);
    addBox(mazar, 9, 7.5, 0.4, 0, 8.8, 11.2, new THREE.MeshStandardMaterial({ color: 0x2a3034, roughness: 0.5 }));
    addBox(mazar, 0.4, 7.5, 9, 11.2, 8.8, 0, new THREE.MeshStandardMaterial({ color: 0x2a3034, roughness: 0.5 }));
    addBox(mazar, 2.6, 6.8, 0.25, 0, 8, 11.45, goldMat, false);
    var drum = new THREE.Mesh(new THREE.CylinderGeometry(9.6, 10.2, 2.4, 28), marble);
    drum.position.y = 22.1;
    drum.castShadow = true;
    mazar.add(drum);
    var dome = new THREE.Mesh(new THREE.SphereGeometry(10.3, 32, 18, 0, Math.PI * 2, 0, Math.PI / 2), marble);
    dome.position.y = 22.9;
    dome.scale.y = 0.86;
    dome.castShadow = true;
    mazar.add(dome);
    addBox(mazar, 0.28, 3.2, 0.28, 0, 33.7, 0, goldMat, false);
    var finial = new THREE.Mesh(new THREE.SphereGeometry(0.6, 12, 10), goldMat);
    finial.position.y = 35.4;
    mazar.add(finial);
    [[-13.4, -12], [-13.4, 12], [13.4, -12], [13.4, 12]].forEach(function (pos) {
      var minaret = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 1.05, 25, 12), marble);
      minaret.position.set(pos[0], 13.9, pos[1]);
      minaret.castShadow = true;
      mazar.add(minaret);
      var ring = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.35, 0.5, 12), marbleDim);
      ring.position.set(pos[0], 20.5, pos[1]);
      mazar.add(ring);
      var cap = new THREE.Mesh(new THREE.SphereGeometry(1.45, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), marble);
      cap.position.set(pos[0], 26.4, pos[1]);
      cap.castShadow = true;
      mazar.add(cap);
      var tip = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 6), goldMat);
      tip.position.set(pos[0], 28, pos[1]);
      mazar.add(tip);
    });
    var uplights = new THREE.MeshBasicMaterial({ color: 0xffc27a });
    [[-18, 14], [18, 14], [-18, -14], [18, -14]].forEach(function (p) {
      var lamp = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 6), uplights);
      lamp.position.set(p[0], 1.1, p[1]);
      mazar.add(lamp);
    });

    /* ---------- Habib Bank Plaza ---------- */
    var hbl = new THREE.Group();
    hbl.position.set(48, 0, -150);
    cityGroup.add(hbl);
    var hblMat = windowMaterial(0x2b3e4c, { roughness: 0.5, metalness: 0.35 });
    addBox(hbl, 21, 88, 13, 0, 44, 0, hblMat);
    for (var rib = -8; rib <= 8; rib += 4) {
      addBox(hbl, 0.55, 88, 0.7, rib, 44, 6.7, marbleDim, false);
    }
    for (var bandY = 10; bandY < 86; bandY += 11) {
      addBox(hbl, 21.6, 0.32, 0.5, 0, bandY, 6.75, marbleDim, false);
    }
    addBox(hbl, 17, 5.5, 10, 0, 90.5, 0, darkSteel);
    addBox(hbl, 16, 1, 8, 0, 93.7, 0, darkSteel);
    var hblMast = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.24, 11, 8), darkSteel);
    hblMast.position.y = 99.5;
    hbl.add(hblMast);
    var aviation = new THREE.Mesh(new THREE.SphereGeometry(0.36, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff5c45 }));
    aviation.position.y = 105.2;
    hbl.add(aviation);

    /* ---------- Ocean Towers ---------- */
    var ocean = new THREE.Group();
    ocean.position.set(155, 0, -60);
    cityGroup.add(ocean);
    addBox(ocean, 38, 3, 26, 0, 1.5, 0, marbleDim, false);
    var towerMat = windowMaterial(0x334b59, { roughness: 0.34, metalness: 0.48 });
    var ringGeo = new THREE.CylinderGeometry(8.6, 8.6, 0.22, 30, 1, true);
    var ringMat = new THREE.MeshStandardMaterial({ color: 0xc9c2b4, roughness: 0.62, metalness: 0.1, side: THREE.DoubleSide });
    var rings = new THREE.InstancedMesh(ringGeo, ringMat, 36);
    var ringIndex = 0;
    [-10.5, 10.5].forEach(function (tx) {
      var body = new THREE.Mesh(new THREE.CylinderGeometry(7.4, 8.1, 56, 30, 1), towerMat);
      body.position.set(tx, 31, 0);
      body.castShadow = true;
      body.receiveShadow = true;
      ocean.add(body);
      var roof = new THREE.Mesh(new THREE.CylinderGeometry(7.5, 7.5, 0.7, 30), marbleDim);
      roof.position.set(tx, 59, 0);
      ocean.add(roof);
      var antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.16, 6, 6), darkSteel);
      antenna.position.set(tx, 62, 0);
      ocean.add(antenna);
      for (var f = 0; f < 18; f++) {
        dummy.position.set(tx, 4 + f * 3.05, 0);
        dummy.scale.set(1, 1, 1);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        rings.setMatrixAt(ringIndex++, dummy.matrix);
      }
    });
    rings.instanceMatrix.needsUpdate = true;
    rings.castShadow = false;
    ocean.add(rings);

    /* ---------- Dolmen-style waterfront mall ---------- */
    var mall = new THREE.Group();
    mall.position.set(80, 0, -15);
    cityGroup.add(mall);
    var mallMat = windowMaterial(0x243a46, { roughness: 0.42, metalness: 0.32 });
    addBox(mall, 52, 16, 26, 0, 8, 0, mallMat);
    [2.4, 8, 13.6].forEach(function (y) {
      addBox(mall, 53, 0.45, 27, 0, y, 0, marbleDim, false);
    });
    addBox(mall, 57, 0.7, 31, 0, 16.4, 0, marbleDim, false);
    addBox(mall, 42, 1.4, 0.2, 0, 4.2, 13.1, new THREE.MeshBasicMaterial({ color: 0xffc27a }), false);
    addBox(mall, 22, 0.3, 8, 0, 6.6, 16, marble, false);
    for (var mp = -16; mp <= 16; mp += 8) {
      addBox(mall, 0.3, 6.4, 0.3, mp, 3.2, 18.5, darkSteel, false);
    }

    /* ---------- port cranes + containers ---------- */
    var port = new THREE.Group();
    port.position.set(-270, 0, -20);
    cityGroup.add(port);
    function crane(offsetX) {
      var g = new THREE.Group();
      g.position.x = offsetX;
      [[-4, -3], [4, -3], [-4, 3], [4, 3]].forEach(function (leg) {
        addBox(g, 0.65, 17, 0.65, leg[0], 8.5, leg[1], darkSteel, false);
      });
      addBox(g, 10, 0.7, 0.7, 0, 17, -3, darkSteel, false);
      addBox(g, 10, 0.7, 0.7, 0, 17, 3, darkSteel, false);
      var boom = addBox(g, 21, 0.5, 0.5, 6, 18.4, 0, darkSteel, false);
      boom.rotation.z = 0.16;
      addBox(g, 3.6, 1.4, 1.4, -2, 17.4, 0, new THREE.MeshStandardMaterial({ color: 0x7a4a33, roughness: 0.7 }), false);
      var cableMat = new THREE.LineBasicMaterial({ color: 0x566773, transparent: true, opacity: 0.6 });
      var cableGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 18.4, 0), new THREE.Vector3(14, 8, 0),
        new THREE.Vector3(4, 17, 3), new THREE.Vector3(4, 12, 3)
      ]);
      g.add(new THREE.LineSegments(cableGeo, cableMat));
      port.add(g);
    }
    crane(-9);
    crane(9);
    var containerColors = [0xa65f3e, 0x2f6b6a, 0xb08d4f, 0x36566b, 0x7a5138];
    var containerMesh = new THREE.InstancedMesh(
      new THREE.BoxGeometry(5.4, 2.5, 2.4),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.82, metalness: 0.1 }),
      22
    );
    for (var ci = 0; ci < 22; ci++) {
      dummy.position.set(-12 + rnd() * 24, 1.3 + (ci % 3) * 2.5, 8 + Math.floor(ci / 6) * 3);
      dummy.scale.set(1, 1, 1);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      containerMesh.setMatrixAt(ci, dummy.matrix);
      containerMesh.setColorAt(ci, new THREE.Color(containerColors[ci % containerColors.length]));
    }
    containerMesh.instanceMatrix.needsUpdate = true;
    if (containerMesh.instanceColor) containerMesh.instanceColor.needsUpdate = true;
    containerMesh.castShadow = false;
    port.add(containerMesh);

    /* ---------- Manora lighthouse ---------- */
    var lighthouse = new THREE.Group();
    lighthouse.position.set(-320, 0, 42);
    cityGroup.add(lighthouse);
    addBox(lighthouse, 20, 1.2, 18, 0, 0.6, 0, concrete, false);
    var lightTower = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 3, 18, 16), marble);
    lightTower.position.y = 10;
    lightTower.castShadow = true;
    lighthouse.add(lightTower);
    var redMat = new THREE.MeshStandardMaterial({ color: 0xa64b3f, roughness: 0.6 });
    [6, 12, 17.2].forEach(function (by) {
      var band = new THREE.Mesh(new THREE.CylinderGeometry(2.55, 2.75, 1.7, 16), redMat);
      band.position.y = by;
      lighthouse.add(band);
    });
    var lantern = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 1.9, 2.6, 12), new THREE.MeshBasicMaterial({ color: 0xffdda6 }));
    lantern.position.y = 20.1;
    lighthouse.add(lantern);
    var lanternRoof = new THREE.Mesh(new THREE.ConeGeometry(2.7, 2.2, 14), darkSteel);
    lanternRoof.position.y = 22.5;
    lighthouse.add(lanternRoof);
    var beacon = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTex, color: 0xffe3b0, transparent: true, opacity: 0.65,
      blending: THREE.AdditiveBlending, depthWrite: false
    }));
    beacon.scale.set(16, 16, 1);
    beacon.position.y = 20.4;
    lighthouse.add(beacon);

    /* ---------- palms along the promenade ---------- */
    var palmXs = [];
    for (var px = -480; px <= 480; px += 58) palmXs.push(px + (rnd() - 0.5) * 14);
    var trunkGeo = new THREE.CylinderGeometry(0.13, 0.34, 1, 6);
    trunkGeo.translate(0, 0.5, 0);
    var trunkMesh = new THREE.InstancedMesh(trunkGeo, new THREE.MeshStandardMaterial({ color: 0x4a3a29, roughness: 0.95 }), palmXs.length);
    var frondGeo = new THREE.ConeGeometry(0.42, 3.4, 4);
    frondGeo.translate(0, 1.7, 0);
    var frondMesh = new THREE.InstancedMesh(frondGeo, new THREE.MeshStandardMaterial({ color: 0x284433, roughness: 0.9, side: THREE.DoubleSide }), palmXs.length * 7);
    var frondIndex = 0;
    palmXs.forEach(function (x, idx) {
      var h = 9 + rnd() * 5;
      dummy.position.set(x, 1.2, 50 + (rnd() - 0.5) * 3);
      dummy.scale.set(1, h, 1);
      dummy.rotation.set(0, rnd() * 6.28, 0);
      dummy.updateMatrix();
      trunkMesh.setMatrixAt(idx, dummy.matrix);
      for (var f = 0; f < 7; f++) {
        dummy.position.set(x, h + 1.1, 50 + (rnd() - 0.5) * 1.4);
        dummy.scale.set(1, 1, 1);
        dummy.rotation.set(0, (f / 7) * Math.PI * 2 + rnd(), 1.02 + rnd() * 0.25, "YXZ");
        dummy.updateMatrix();
        frondMesh.setMatrixAt(frondIndex++, dummy.matrix);
      }
    });
    trunkMesh.instanceMatrix.needsUpdate = true;
    frondMesh.instanceMatrix.needsUpdate = true;
    trunkMesh.castShadow = true;
    frondMesh.castShadow = false;
    cityGroup.add(trunkMesh);
    cityGroup.add(frondMesh);

    // promenade lamps
    var lampGeo = new THREE.SphereGeometry(0.16, 6, 5);
    var lampMesh = new THREE.InstancedMesh(lampGeo, new THREE.MeshBasicMaterial({ color: 0xffc27a }), 40);
    for (var li = 0; li < 40; li++) {
      dummy.position.set(-468 + li * 24, 3.05, 47.2);
      dummy.scale.set(1, 1, 1);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      lampMesh.setMatrixAt(li, dummy.matrix);
    }
    lampMesh.instanceMatrix.needsUpdate = true;
    cityGroup.add(lampMesh);

    /* ---------- dhows ---------- */
    var boats = [];
    function makeDhow(scale) {
      var g = new THREE.Group();
      var hull = new THREE.Mesh(new THREE.BoxGeometry(6.2, 1, 2.1), new THREE.MeshStandardMaterial({ color: 0xdfd8c8, roughness: 0.7 }));
      hull.position.y = 0.55;
      g.add(hull);
      var deck = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.22, 1.7), new THREE.MeshStandardMaterial({ color: 0x6b4d32, roughness: 0.85 }));
      deck.position.set(-0.2, 1.14, 0);
      g.add(deck);
      var cabin = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.2, 1.35), new THREE.MeshStandardMaterial({ color: 0xcfc4ae, roughness: 0.8 }));
      cabin.position.set(-1.6, 1.85, 0);
      g.add(cabin);
      var mast = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.11, 5.4, 6), new THREE.MeshStandardMaterial({ color: 0x4b3b2b, roughness: 0.9 }));
      mast.position.set(0.5, 3.2, 0);
      g.add(mast);
      var sailGeo = new THREE.BufferGeometry();
      sailGeo.setAttribute("position", new THREE.Float32BufferAttribute([0.6, 1.2, 0, 0.6, 5.6, 0, 2.9, 1.5, 0], 3));
      sailGeo.computeVertexNormals();
      var sail = new THREE.Mesh(sailGeo, new THREE.MeshStandardMaterial({ color: 0xe9dfca, roughness: 0.85, side: THREE.DoubleSide }));
      g.add(sail);
      g.scale.setScalar(scale);
      return g;
    }
    [[-250, 150, 1], [-110, 215, 0.8], [20, 165, 0.9], [165, 235, 1.15], [285, 185, 0.75]].forEach(function (b, i) {
      var dhow = makeDhow(b[2]);
      dhow.position.set(b[0], -0.3, b[1]);
      dhow.rotation.y = (rnd() - 0.5) * 1.2;
      dhow.userData.phase = rnd() * 6.28;
      dhow.userData.baseY = -0.3;
      dhow.userData.speed = 0.035 + rnd() * 0.03;
      dhow.userData.x0 = b[0];
      dhow.userData.range = 12 + i * 3;
      scene.add(dhow);
      boats.push(dhow);
    });

    // distant cargo ship
    var ship = new THREE.Group();
    addBox(ship, 72, 4.5, 11, 0, 2.5, 0, new THREE.MeshStandardMaterial({ color: 0x27333b, roughness: 0.8 }), false);
    addBox(ship, 14, 9, 10, -22, 8, 0, new THREE.MeshStandardMaterial({ color: 0x3a4a52, roughness: 0.8 }), false);
    addBox(ship, 46, 4, 8, 6, 6.5, 0, new THREE.MeshStandardMaterial({ color: 0x4a4438, roughness: 0.9 }), false);
    ship.position.set(430, 0, 540);
    ship.rotation.y = -0.25;
    scene.add(ship);

    /* ---------- day / golden hour ---------- */
    var SKY = {
      dusk: {
        top: new THREE.Color(0x050b17), horizon: new THREE.Color(0xb96c46),
        glow: new THREE.Color(0xffa45c), fog: new THREE.Color(0x17262f),
        sun: new THREE.Color(0xffb877), sunI: 2.2, hemi: 0.55, fill: 0.38,
        disc: new THREE.Color(0xffd9a0),
        exposure: 1.05, stars: 0.55, night: 1,
        deep: new THREE.Color(0x071820), shallow: new THREE.Color(0x0e303a),
        waterSun: new THREE.Color(0xe8a76c), waterHorizon: new THREE.Color(0x7d4d3a)
      },
      day: {
        top: new THREE.Color(0x0d3c66), horizon: new THREE.Color(0x4f9ec9),
        glow: new THREE.Color(0xfff7e6), fog: new THREE.Color(0x8fb0bd),
        sun: new THREE.Color(0xfff0cf), sunI: 2.9, hemi: 1.75, fill: 1.35,
        disc: new THREE.Color(0xfffdf2),
        exposure: 1.06, stars: 0, night: 0.02,
        deep: new THREE.Color(0x14566a), shallow: new THREE.Color(0x3d8b9b),
        waterSun: new THREE.Color(0xfff0cf), waterHorizon: new THREE.Color(0xc9d8d6)
      }
    };
    var skyMix = 0;
    var skyTarget = 0;
    var sunDirDusk = new THREE.Vector3(-0.42, 0.24, -0.88).normalize();
    var sunDirDay = new THREE.Vector3(-0.3, 0.27, -0.92).normalize();
    var sunDirNow = new THREE.Vector3();

    function applySky(mix) {
      var d = SKY.dusk, n = SKY.day;
      skyUniforms.uTop.value.copy(d.top).lerp(n.top, mix);
      skyUniforms.uHorizon.value.copy(d.horizon).lerp(n.horizon, mix);
      skyUniforms.uGlow.value.copy(d.glow).lerp(n.glow, mix);
      sunDirNow.copy(sunDirDusk).lerp(sunDirDay, mix).normalize();
      skyUniforms.uSunDir.value.copy(sunDirNow);
      skyUniforms.uSunCol.value.copy(d.disc).lerp(n.disc, mix);
      starMat.opacity = lerp(d.stars, n.stars, mix);
      stars.visible = starMat.opacity > 0.01;
      hemi.intensity = lerp(d.hemi, n.hemi, mix);
      sunLight.intensity = lerp(d.sunI, n.sunI, mix);
      sunLight.color.copy(d.sun).lerp(n.sun, mix);
      fill.intensity = lerp(d.fill, n.fill, mix);
      renderer.toneMappingExposure = lerp(d.exposure, n.exposure, mix);
      scene.fog.color.copy(d.fog).lerp(n.fog, mix);
      waterUniforms.uDeep.value.copy(d.deep).lerp(n.deep, mix);
      waterUniforms.uShallow.value.copy(d.shallow).lerp(n.shallow, mix);
      waterUniforms.uSun.value.copy(d.waterSun).lerp(n.waterSun, mix);
      waterUniforms.uHorizon.value.copy(d.waterHorizon).lerp(n.waterHorizon, mix);
      var night = lerp(d.night, n.night, mix);
      windowMats.forEach(function (m) {
        if (m.userData.shader) m.userData.shader.uniforms.uNight.value = night;
      });
    }

    var daylight = false;
    if (toggle) {
      toggle.addEventListener("click", function () {
        daylight = !daylight;
        skyTarget = daylight ? 1 : 0;
        toggle.setAttribute("aria-pressed", daylight ? "true" : "false");
        var label = toggle.querySelector(".sky-toggle__label");
        if (label) label.textContent = daylight ? "Daylight" : "Golden hour";
        sunLight.shadow.needsUpdate = true;
        renderer.shadowMap.needsUpdate = true;
      });
    }

    applySky(0);
    renderer.shadowMap.autoUpdate = false;
    renderer.shadowMap.needsUpdate = true;

    /* ---------- camera interaction ---------- */
    var pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    heroEl.addEventListener("pointermove", function (e) {
      var r = heroEl.getBoundingClientRect();
      pointer.tx = clamp(((e.clientX - r.left) / r.width - 0.5) * 2, -1, 1);
      pointer.ty = clamp(((e.clientY - r.top) / r.height - 0.5) * 2, -1, 1);
    });
    heroEl.addEventListener("pointerleave", function () { pointer.tx = 0; pointer.ty = 0; });

    var visible = true;
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
      }, { threshold: 0 }).observe(heroEl);
    }

    function resize() {
      var w = canvas.clientWidth;
      var h = canvas.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    if ("ResizeObserver" in window) new ResizeObserver(resize).observe(heroEl);
    window.addEventListener("resize", resize);
    resize();

    var camX = 0;
    var camY = 54;
    var start = performance.now();
    var last = start;

    function animate(now) {
      requestAnimationFrame(animate);
      var dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!visible || document.hidden) return;
      var t = (now - start) / 1000;

      if (Math.abs(skyMix - skyTarget) > 0.0005) {
        skyMix = damp(skyMix, skyTarget, 2.4, dt);
        applySky(skyMix);
      }

      if (!reducedMotion) {
        pointer.x = damp(pointer.x, pointer.tx, 2.5, dt);
        pointer.y = damp(pointer.y, pointer.ty, 2.5, dt);
        var amp = window.innerWidth < 820 ? 5 : 14;
        camX = damp(camX, pointer.x * amp + Math.sin(t * 0.07) * 4, 1.4, dt);
        camY = damp(camY, 54 - pointer.y * 4 + Math.sin(t * 0.09) * 1.4, 1.4, dt);
        camera.position.x = camX;
        camera.position.y = camY;
        camera.lookAt(0, 36 - pointer.y * 2, -70);
        waterUniforms.uTime.value = t;
        boats.forEach(function (b) {
          b.position.y = b.userData.baseY + Math.sin(t * 0.8 + b.userData.phase) * 0.24;
          b.rotation.z = Math.sin(t * 0.55 + b.userData.phase) * 0.025;
          b.position.x = b.userData.x0 + Math.sin(t * b.userData.speed + b.userData.phase) * b.userData.range;
        });
        beacon.material.opacity = 0.5 + Math.sin(t * 1.6) * 0.22;
      } else {
        waterUniforms.uTime.value = 12;
        camera.position.x = 0;
        camera.position.y = 54;
        camera.lookAt(0, 36, -70);
      }

      renderer.render(scene, camera);
    }
    requestAnimationFrame(animate);
  }

  /* ============================================================
     13. 3D STUDIO — architecture viewer
     ============================================================ */
  function initStudio3D() {
    var canvas = $("#studioCanvas");
    var stage = $("#studioStage");
    var fallback = $("#stageFallback");
    if (!canvas || !stage) return;
    if (!window.THREE) {
      if (fallback) fallback.hidden = false;
      return;
    }
    if (THREE.ColorManagement) THREE.ColorManagement.legacyMode = false;
    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch (err) {
      if (fallback) fallback.hidden = false;
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x000000, 0);

    var scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x0a1620, 46, 108);
    var camera = new THREE.PerspectiveCamera(34, 1, 0.5, 260);
    camera.position.set(0, 20, 36);
    camera.lookAt(0, 5.5, 0);

    var hemi = new THREE.HemisphereLight(0x9fc4cc, 0x081014, 0.6);
    scene.add(hemi);
    var key = new THREE.DirectionalLight(0xffc891, 2.5);
    key.position.set(-17, 27, 16);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -24;
    key.shadow.camera.right = 24;
    key.shadow.camera.top = 32;
    key.shadow.camera.bottom = -12;
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 90;
    key.shadow.bias = -0.0005;
    key.shadow.normalBias = 0.4;
    scene.add(key);
    var rim = new THREE.DirectionalLight(0x54c8c0, 1.05);
    rim.position.set(20, 12, -18);
    scene.add(rim);
    var fill = new THREE.DirectionalLight(0x7fa2c0, 0.45);
    fill.position.set(8, 5, 24);
    scene.add(fill);

    var glowCanvas = document.createElement("canvas");
    glowCanvas.width = glowCanvas.height = 128;
    var gctx = glowCanvas.getContext("2d");
    var grad = gctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, "rgba(120,230,220,0.55)");
    grad.addColorStop(0.4, "rgba(60,160,160,0.18)");
    grad.addColorStop(1, "rgba(20,60,60,0)");
    gctx.fillStyle = grad;
    gctx.fillRect(0, 0, 128, 128);
    var glowTex = new THREE.CanvasTexture(glowCanvas);
    var aura = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTex, color: 0x9fe8df, transparent: true, opacity: 0.4,
      blending: THREE.AdditiveBlending, depthWrite: false
    }));
    aura.scale.set(42, 42, 1);
    aura.position.set(0, 8, -16);
    scene.add(aura);

    /* ---------- materials ---------- */
    function std(color, roughness, metalness) {
      return new THREE.MeshStandardMaterial({ color: color, roughness: roughness, metalness: metalness || 0 });
    }
    var M = {
      white: std(0xe9e2d4, 0.58, 0.04),
      cream: std(0xd5cdbd, 0.68, 0.03),
      stone: std(0x9a9d97, 0.82, 0.05),
      dark: std(0x17242c, 0.78, 0.2),
      glass: new THREE.MeshStandardMaterial({ color: 0x1d3b47, roughness: 0.12, metalness: 0.62, emissive: 0x0b2028, emissiveIntensity: 0.55 }),
      glassRail: new THREE.MeshStandardMaterial({ color: 0x78b8bd, roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.28 }),
      wood: std(0x6b4c32, 0.8, 0.05),
      green: std(0x2e4a37, 0.92, 0.02),
      greenLight: std(0x436449, 0.9, 0.02),
      water: new THREE.MeshStandardMaterial({ color: 0x2aa3a0, roughness: 0.14, metalness: 0.28, emissive: 0x0c3c40, emissiveIntensity: 0.75, transparent: true, opacity: 0.92 }),
      gold: new THREE.MeshStandardMaterial({ color: 0xd5b57c, roughness: 0.28, metalness: 0.82, emissive: 0x4b320d, emissiveIntensity: 0.6 }),
      lamp: new THREE.MeshBasicMaterial({ color: 0xffcf95 }),
      sand: std(0x736047, 0.98, 0.02),
      road: std(0x1b2429, 0.92, 0.04)
    };

    function makeSandTexture() {
      var c = document.createElement("canvas");
      c.width = c.height = 256;
      var ctx = c.getContext("2d");
      ctx.fillStyle = "#6d5a43";
      ctx.fillRect(0, 0, 256, 256);
      var sr = mulberry32(4129);
      for (var i = 0; i < 5200; i++) {
        var tone = 70 + Math.floor(sr() * 70);
        ctx.fillStyle = "rgba(" + tone + "," + (tone - 12) + "," + (tone - 28) + "," + (0.08 + sr() * 0.18).toFixed(2) + ")";
        var size = 0.6 + sr() * 2.4;
        ctx.fillRect(sr() * 256, sr() * 256, size, size);
      }
      var tex = new THREE.CanvasTexture(c);
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(3, 2);
      tex.encoding = THREE.sRGBEncoding;
      return tex;
    }
    var sandTex = makeSandTexture();

    function makeSignTexture(p) {
      var c = document.createElement("canvas");
      c.width = 512; c.height = 256;
      var ctx = c.getContext("2d");
      ctx.fillStyle = "#071119";
      ctx.fillRect(0, 0, 512, 256);
      ctx.strokeStyle = "#d5b57c";
      ctx.lineWidth = 5;
      ctx.strokeRect(14, 14, 484, 228);
      ctx.fillStyle = "#d5b57c";
      ctx.font = "600 19px Manrope, sans-serif";
      ctx.letterSpacing = "6px";
      ctx.fillText("SAHIL ESTATES", 40, 64);
      ctx.fillStyle = "#ece3d2";
      ctx.font = "500 54px Georgia, serif";
      ctx.fillText(p.sizeLabel, 40, 136);
      ctx.fillStyle = "#93a3b1";
      ctx.font = "500 20px Manrope, sans-serif";
      ctx.fillText("SCHEME 33  ·  RESIDENTIAL", 40, 184);
      ctx.fillStyle = "#5ec8bf";
      ctx.font = "600 16px Manrope, sans-serif";
      ctx.fillText("CLEAR TITLE  ·  READY TO BUILD", 40, 219);
      var tex = new THREE.CanvasTexture(c);
      tex.encoding = THREE.sRGBEncoding;
      return tex;
    }

    /* ---------- platform ---------- */
    var platform = new THREE.Mesh(
      new THREE.CylinderGeometry(16.5, 17.2, 1.2, 64),
      std(0x0e1b23, 0.86, 0.16)
    );
    platform.position.y = -0.6;
    platform.receiveShadow = true;
    scene.add(platform);
    var platformTop = new THREE.Mesh(
      new THREE.CircleGeometry(16.45, 64),
      std(0x101e26, 0.72, 0.2)
    );
    platformTop.rotation.x = -Math.PI / 2;
    platformTop.position.y = 0.001;
    platformTop.receiveShadow = true;
    scene.add(platformTop);
    var goldRing = new THREE.Mesh(new THREE.TorusGeometry(16.42, 0.035, 6, 140), M.gold);
    goldRing.rotation.x = Math.PI / 2;
    goldRing.position.y = 0.02;
    scene.add(goldRing);
    var innerRing = new THREE.Mesh(new THREE.TorusGeometry(12.2, 0.02, 6, 120), new THREE.MeshBasicMaterial({ color: 0x5ec8bf, transparent: true, opacity: 0.22 }));
    innerRing.rotation.x = Math.PI / 2;
    innerRing.position.y = 0.025;
    scene.add(innerRing);

    var shadowCatcher = new THREE.Mesh(
      new THREE.PlaneGeometry(180, 180),
      new THREE.ShadowMaterial({ opacity: 0.26 })
    );
    shadowCatcher.rotation.x = -Math.PI / 2;
    shadowCatcher.position.y = 0;
    shadowCatcher.receiveShadow = true;
    scene.add(shadowCatcher);

    /* ---------- builders ---------- */
    function box(w, h, d, mat, x, y, z, cast) {
      var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      m.position.set(x, y, z);
      m.castShadow = cast !== false;
      m.receiveShadow = true;
      return m;
    }
    function cyl(rt, rb, h, seg, mat, x, y, z) {
      var m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
      m.position.set(x, y, z);
      m.castShadow = true;
      m.receiveShadow = true;
      return m;
    }
    function palm(x, z, scale, group) {
      scale = scale || 1;
      var root = new THREE.Group();
      root.position.set(x, 0, z);
      root.scale.setScalar(scale);
      var trunk = cyl(0.1, 0.24, 4.4, 6, M.wood, 0, 2.2, 0);
      root.add(trunk);
      for (var i = 0; i < 6; i++) {
        var frondGeo = new THREE.ConeGeometry(0.34, 2.8, 4);
        frondGeo.translate(0, 1.4, 0);
        var frond = new THREE.Mesh(frondGeo, i % 2 ? M.green : M.greenLight);
        frond.position.y = 4.35;
        frond.rotation.set(0, (i / 6) * Math.PI * 2, 1.02 + (i % 3) * 0.12, "YXZ");
        frond.castShadow = true;
        root.add(frond);
      }
      group.add(root);
      return root;
    }
    function shrub(x, z, s, group, light) {
      var m = new THREE.Mesh(new THREE.IcosahedronGeometry(s, 0), light ? M.greenLight : M.green);
      m.position.set(x, s * 0.68, z);
      m.scale.y = 0.72;
      m.castShadow = true;
      m.receiveShadow = true;
      group.add(m);
      return m;
    }
    function lounger(x, z, rot, group) {
      var g = new THREE.Group();
      g.position.set(x, 0, z);
      g.rotation.y = rot || 0;
      g.add(box(0.7, 0.16, 1.8, M.white, 0, 0.34, 0));
      var back = box(0.7, 0.12, 0.9, M.white, 0, 0.52, -0.72);
      back.rotation.x = -0.55;
      g.add(back);
      g.add(box(0.06, 0.3, 0.06, M.dark, -0.26, 0.16, 0.7, false));
      g.add(box(0.06, 0.3, 0.06, M.dark, 0.26, 0.16, 0.7, false));
      group.add(g);
      return g;
    }
    function addWindows(parent, width, depth, baseY, height, floors, cols) {
      var geo = new THREE.PlaneGeometry(0.52, 0.64);
      var mat = new THREE.MeshStandardMaterial({ color: 0x0a1217, roughness: 0.3, metalness: 0.1, emissive: 0xffb972, emissiveIntensity: 1.15 });
      var items = [];
      var stepY = height / floors;
      for (var f = 0; f < floors; f++) {
        for (var c = 0; c < cols; c++) {
          if ((f * 5 + c * 3) % 9 === 0) continue;
          var y = baseY + stepY * (f + 0.52);
          var x = (c - (cols - 1) / 2) * (width / cols);
          var z = (c - (cols - 1) / 2) * (depth / cols);
          items.push({ x: x, y: y, z: depth / 2 + 0.03, ry: 0 });
          items.push({ x: x, y: y, z: -depth / 2 - 0.03, ry: Math.PI });
          items.push({ x: -width / 2 - 0.03, y: y, z: z, ry: -Math.PI / 2 });
          items.push({ x: width / 2 + 0.03, y: y, z: z, ry: Math.PI / 2 });
        }
      }
      var mesh = new THREE.InstancedMesh(geo, mat, items.length);
      var d = new THREE.Object3D();
      items.forEach(function (it, i) {
        d.position.set(it.x, it.y, it.z);
        d.rotation.set(0, it.ry, 0);
        d.updateMatrix();
        mesh.setMatrixAt(i, d.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
      mesh.castShadow = false;
      parent.add(mesh);
      return mesh;
    }

    function buildVilla() {
      var g = new THREE.Group();
      g.add(box(22, 0.5, 15, M.stone, 0, 0.25, 0));
      g.add(box(17.6, 0.14, 9.4, M.cream, 0.5, 0.56, 5.6));

      var lower = box(13, 4.1, 8, M.white, -1.2, 2.6, -1.2);
      g.add(lower);
      g.add(box(9.2, 2.8, 0.18, M.glass, -1.2, 2.4, 2.85));
      g.add(box(3.2, 2.9, 0.22, M.wood, 2.8, 2.45, 2.88));
      for (var ws = 0; ws < 7; ws++) {
        g.add(box(0.12, 2.9, 0.05, M.dark, 3.05 + ws * 0.19, 2.45, 3.01, false));
      }
      var upper = box(11.4, 3.4, 7.4, M.white, -2.1, 6.25, -1.5);
      g.add(upper);
      g.add(box(8.4, 1.85, 0.18, M.glass, -2.1, 6.3, 2.25));
      g.add(box(14.2, 0.3, 8.7, M.dark, -1.2, 4.85, -1.1));
      g.add(box(12.6, 0.26, 8.2, M.dark, -2.1, 8.05, -1.5));
      g.add(box(0.4, 4.1, 8, M.stone, 5.35, 2.6, -1.2));
      g.add(box(0.32, 3.2, 0.32, M.dark, 5.6, 6.2, 2.3));

      // entrance path and steps
      g.add(box(3.4, 0.16, 2.2, M.cream, 1.5, 0.16, 5.3));
      g.add(box(3.8, 0.1, 0.7, M.cream, 1.5, 0.08, 6.6));

      // pool + deck
      g.add(box(11, 0.22, 5.4, M.cream, 2.2, 0.62, 7.1));
      g.add(box(9.8, 0.18, 4.3, M.water, 2.2, 0.75, 7.1));
      g.add(box(10.5, 0.08, 4.9, M.gold, 2.2, 0.72, 7.1, false)).material = new THREE.MeshStandardMaterial({ color: 0xd5b57c, transparent: true, opacity: 0.18 });
      lounger(-1.1, 8.5, 0.1, g);
      lounger(0.2, 8.5, 0.1, g);

      // roof pergola + garden
      for (var pp = 0; pp < 4; pp++) {
        g.add(box(0.18, 2.1, 0.18, M.dark, 0.2 + (pp % 2) * 3.6, 9.2, -3.4 + Math.floor(pp / 2) * 2.4, false));
      }
      for (var sl = 0; sl < 6; sl++) {
        g.add(box(4.2, 0.1, 0.12, M.wood, 2, 10.3, -3.6 + sl * 0.48, false));
      }
      g.add(box(3.6, 0.5, 2.4, M.green, 2, 8.45, -2.2, false));
      palm(-8.4, 5.8, 1.05, g);
      palm(9.1, -2.2, 0.9, g);
      shrub(-6.4, 8.8, 0.7, g, true);
      shrub(8.8, 6.8, 0.55, g);
      shrub(6.4, 4.6, 0.4, g, true);
      for (var l = 0; l < 4; l++) {
        var lamp = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 5), M.lamp);
        lamp.position.set(-6.5 + l * 4.4, 0.75, 4.2);
        g.add(lamp);
      }
      return g;
    }

    function buildTower() {
      var g = new THREE.Group();
      var floors = 11;
      var baseH = 2.4;
      var fh = 1.34;
      var bodyH = floors * fh;
      g.add(box(13.2, baseH, 13.2, M.stone, 0, baseH / 2, 0));
      g.add(box(9.8, 1.9, 0.2, M.glass, 0, 1.35, 6.62));
      g.add(box(11, 0.35, 1.2, M.white, 0, 2.5, 6.9, false));
      g.add(box(8.4, bodyH, 7.6, M.glass, 0, baseH + bodyH / 2, 0));
      [-4.2, 4.2].forEach(function (x) {
        [-3.8, 3.8].forEach(function (z) {
          g.add(box(0.3, bodyH + 0.5, 0.3, M.white, x, baseH + bodyH / 2, z, false));
        });
      });
      for (var f = 0; f < floors; f++) {
        var y = baseH + f * fh;
        g.add(box(9.7, 0.13, 8.9, M.white, 0, y, 0, false));
        g.add(box(9.7, 0.52, 0.06, M.glassRail, 0, y + 0.33, 4.46, false));
      }
      addWindows(g, 8.4, 7.6, baseH, bodyH, floors, 5);
      g.add(box(9.4, 0.3, 8.6, M.white, 0, baseH + bodyH, 0, false));
      g.add(box(1.1, 0.16, 1.1, M.dark, 2.9, baseH + bodyH + 0.2, 2.6, false));
      g.add(box(4.3, 0.9, 2.7, M.green, -2.2, baseH + bodyH + 0.55, -2.2, false));
      g.add(box(3.1, 0.18, 1.6, M.water, 2.2, baseH + bodyH + 0.25, -2, false));
      for (var rp = 0; rp < 4; rp++) {
        g.add(box(0.12, 2.1, 0.12, M.dark, 1 + (rp % 2) * 2.6, baseH + bodyH + 1.2, 1.4 + Math.floor(rp / 2) * 1.4, false));
      }
      for (var rs = 0; rs < 5; rs++) {
        g.add(box(2.8, 0.08, 0.1, M.wood, 2.3, baseH + bodyH + 2.25, 1.5 + rs * 0.34, false));
      }
      palm(-8.4, 6.2, 1.1, g);
      palm(9.4, -1.8, 0.95, g);
      shrub(-6.9, -3.4, 0.65, g, true);
      shrub(8.1, 6.6, 0.55, g);
      shrub(-9.2, 1.4, 0.45, g);
      return g;
    }

    function buildPenthouse() {
      var g = new THREE.Group();
      var floors = 9;
      var baseH = 2.1;
      var fh = 1.15;
      var bodyH = floors * fh;
      g.add(box(12.6, baseH, 12.6, M.stone, 0, baseH / 2, 0));
      g.add(box(9.2, 1.7, 0.2, M.glass, 0, 1.2, 6.32));
      g.add(box(8.6, bodyH, 8.2, M.glass, 0, baseH + bodyH / 2, 0));
      for (var f = 0; f < floors; f++) {
        var y = baseH + f * fh;
        g.add(box(8.5, 0.12, 8.1, M.white, 0, y, 0, false));
        g.add(box(8.5, 0.45, 0.05, M.glassRail, 0, y + 0.28, 4.08, false));
      }
      addWindows(g, 8.6, 8.2, baseH, bodyH, floors, 4);
      var terraceY = baseH + bodyH;
      g.add(box(15.6, 0.28, 11.4, M.white, 1.2, terraceY, 0.4, false));
      g.add(box(15.6, 0.7, 0.08, M.glassRail, 1.2, terraceY + 0.45, 5.8, false));
      g.add(box(0.08, 0.7, 11.4, M.glassRail, 8.98, terraceY + 0.45, 0.4, false));
      g.add(box(0.08, 0.7, 11.4, M.glassRail, -6.58, terraceY + 0.45, 0.4, false));
      // top unit
      g.add(box(10.6, 3.2, 6.8, M.white, -0.8, terraceY + 1.8, -2.2));
      g.add(box(8.4, 1.9, 0.16, M.glass, -0.8, terraceY + 1.9, 1.25));
      g.add(box(11.4, 0.28, 7.6, M.dark, -0.8, terraceY + 3.54, -2.2, false));
      // pool + terrace furniture
      g.add(box(4.9, 0.16, 3.3, M.water, 4.3, terraceY + 0.2, 3.2, false));
      g.add(box(0.16, 0.5, 0.16, M.dark, 1.8, terraceY + 0.45, 1.7, false));
      g.add(box(0.16, 0.5, 0.16, M.dark, 6.8, terraceY + 0.45, 1.7, false));
      for (var sl = 0; sl < 7; sl++) {
        g.add(box(5.2, 0.09, 0.1, M.wood, 4.3, terraceY + 2.1, 1.6 + sl * 0.48, false));
      }
      lounger(6.4, 4.9, -0.4, g);
      lounger(7.6, 3.9, -0.4, g);
      palm(-5.2, 4.3, 0.8, g);
      shrub(-4.2, -0.6, 0.5, g, true);
      shrub(8.2, -3.6, 0.45, g);
      shrub(1.8, 4.8, 0.35, g, true);
      for (var l = 0; l < 3; l++) {
        var lamp = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 5), M.lamp);
        lamp.position.set(-4 + l * 4.2, terraceY + 0.35, 5.2);
        g.add(lamp);
      }
      return g;
    }

    function buildPlot(p) {
      var g = new THREE.Group();
      var groundMat = new THREE.MeshStandardMaterial({ color: 0x7a6549, roughness: 1, metalness: 0, map: sandTex });
      g.add(box(23, 0.4, 16.5, groundMat, 0, 0.2, 0));
      g.add(box(23.4, 0.18, 2.4, M.road, 0, 0.34, -8.1, false));
      for (var rd = 0; rd < 9; rd++) {
        g.add(box(1.4, 0.02, 0.08, M.cream, -10 + rd * 2.5, 0.44, -8.1, false));
      }
      // boundary markers
      var edgeMat = M.gold;
      g.add(box(20.4, 0.06, 0.06, edgeMat, 0, 0.48, -6.6, false));
      g.add(box(20.4, 0.06, 0.06, edgeMat, 0, 0.48, 6.6, false));
      g.add(box(0.06, 0.06, 13.2, edgeMat, -10.2, 0.48, 0, false));
      g.add(box(0.06, 0.06, 13.2, edgeMat, 10.2, 0.48, 0, false));
      [[-10.2, -6.6], [10.2, -6.6], [10.2, 6.6], [-10.2, 6.6]].forEach(function (pt) {
        g.add(box(0.28, 0.75, 0.28, M.cream, pt[0], 0.55, pt[1], false));
        var cap = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 6), M.gold);
        cap.position.set(pt[0], 0.96, pt[1]);
        g.add(cap);
      });

      // vision wireframe
      var lineMat = new THREE.LineBasicMaterial({ color: 0xd5b57c, transparent: true, opacity: 0.5 });
      var house = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(9, 4.6, 7)), lineMat);
      house.position.set(-1.5, 2.7, 0.4);
      g.add(house);
      var roofPts = [
        -6.2, 5.0, 4.2, 2.6, 7.1, 4.2, 2.6, 7.1, -3.2, -6.2, 5.0, -3.2,
        -6.2, 5.0, 4.2, 2.6, 7.1, -3.2, 2.6, 7.1, 4.2, -6.2, 5.0, -3.2
      ];
      var roofGeo = new THREE.BufferGeometry();
      roofGeo.setAttribute("position", new THREE.Float32BufferAttribute(roofPts, 3));
      g.add(new THREE.LineSegments(roofGeo, lineMat));
      var poolOutline = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(4.2, 0.1, 2.6)),
        new THREE.LineBasicMaterial({ color: 0x5ec8bf, transparent: true, opacity: 0.5 })
      );
      poolOutline.position.set(4.6, 0.65, 3.6);
      g.add(poolOutline);

      // sign
      var sign = new THREE.Mesh(
        new THREE.PlaneGeometry(5.2, 2.6),
        new THREE.MeshBasicMaterial({ map: makeSignTexture(p), transparent: false })
      );
      sign.position.set(-6.4, 2.4, -5.1);
      sign.rotation.y = 0.18;
      g.add(sign);
      g.add(box(0.1, 1.3, 0.1, M.dark, -8.4, 0.65, -5.1, false));
      g.add(box(0.1, 1.3, 0.1, M.dark, -4.4, 0.65, -5.1, false));

      palm(9.2, -4.4, 1.05, g);
      palm(-10, 4.6, 0.85, g);
      shrub(7.4, 5.4, 0.6, g);
      shrub(8.4, 4.6, 0.4, g, true);
      shrub(-9.2, -2, 0.45, g, true);
      // site lamp
      var pole = cyl(0.04, 0.05, 2.4, 6, M.dark, 9.4, 1.2, 2.2);
      g.add(pole);
      var sl = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 5), M.lamp);
      sl.position.set(9.4, 2.45, 2.2);
      g.add(sl);
      return g;
    }

    function buildModel(p) {
      if (p.model === "tower") return buildTower(p);
      if (p.model === "penthouse") return buildPenthouse(p);
      if (p.model === "plot") return buildPlot(p);
      return buildVilla(p);
    }

    /* ---------- camera orbit ---------- */
    var orbit = {
      theta: 0.82, phi: 1.12, dist: 35,
      targetY: 5.2, auto: !reducedMotion, dragging: false
    };
    var drag = { active: false, x: 0, y: 0 };
    var currentGroup = null;
    var selected = properties.find(function (p) { return p.id === state.selectedId; }) || properties[0];
    var viewDistances = { villa: 47, tower: 62, penthouse: 56, plot: 42 };
    var viewTargets = { villa: 5.2, tower: 10.4, penthouse: 8.4, plot: 2.4 };

    function disposeGroup(group) {
      group.traverse(function (obj) {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.isSprite && obj.material && obj.material.map && obj.material.map !== glowTex) {
          obj.material.map.dispose();
        }
      });
    }

    function updateCamera() {
      var r = Math.sin(orbit.phi) * orbit.dist;
      camera.position.set(Math.sin(orbit.theta) * r, orbit.targetY + Math.cos(orbit.phi) * orbit.dist, Math.cos(orbit.theta) * r);
      camera.lookAt(0, orbit.targetY, 0);
    }

    function setProperty(p) {
      if (!p) return;
      selected = p;
      if (currentGroup) {
        scene.remove(currentGroup);
        disposeGroup(currentGroup);
      }
      currentGroup = buildModel(p);
      scene.add(currentGroup);
      orbit.dist = viewDistances[p.model] || 36;
      orbit.targetY = viewTargets[p.model] || 6;
      orbit.phi = 1.1;
      orbit.theta = 0.82;
      updateCamera();
      renderer.shadowMap.needsUpdate = true;
    }

    function toggleRotate() {
      orbit.auto = !orbit.auto;
      return orbit.auto;
    }
    function resetView() {
      orbit.theta = 0.82;
      orbit.phi = 1.1;
      orbit.dist = viewDistances[selected.model] || 36;
      orbit.targetY = viewTargets[selected.model] || 6;
      updateCamera();
    }

    /* ---------- interaction ---------- */
    stage.addEventListener("pointerdown", function (e) {
      if (e.target.closest("button, a")) return;
      drag.active = true;
      drag.x = e.clientX;
      drag.y = e.clientY;
      orbit.dragging = true;
      stage.classList.add("is-dragging");
      if (stage.setPointerCapture) {
        try { stage.setPointerCapture(e.pointerId); } catch (err) {}
      }
    });
    stage.addEventListener("pointermove", function (e) {
      if (!drag.active) return;
      var dx = e.clientX - drag.x;
      var dy = e.clientY - drag.y;
      drag.x = e.clientX;
      drag.y = e.clientY;
      orbit.theta -= dx * 0.0062;
      orbit.phi = clamp(orbit.phi - dy * 0.0045, 0.55, 1.38);
    });
    function endDrag() {
      drag.active = false;
      orbit.dragging = false;
      stage.classList.remove("is-dragging");
    }
    stage.addEventListener("pointerup", endDrag);
    stage.addEventListener("pointercancel", endDrag);
    stage.addEventListener("pointerleave", function () {
      if (drag.active) endDrag();
    });
    stage.addEventListener("wheel", function (e) {
      e.preventDefault();
      orbit.dist = clamp(orbit.dist + e.deltaY * 0.024, 24, 82);
    }, { passive: false });

    var rotateBtn = $("#studioRotate");
    if (rotateBtn) rotateBtn.setAttribute("aria-pressed", orbit.auto ? "true" : "false");

    /* ---------- sizing / visibility ---------- */
    function resize() {
      var w = canvas.clientWidth;
      var h = canvas.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    if ("ResizeObserver" in window) new ResizeObserver(resize).observe(stage);
    window.addEventListener("resize", resize);
    resize();

    var visible = false;
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
      }, { threshold: 0.05 }).observe($("#studio"));
    } else {
      visible = true;
    }

    renderer.shadowMap.autoUpdate = false;
    setProperty(selected);

    var last = performance.now();
    function animate(now) {
      requestAnimationFrame(animate);
      var dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!visible || document.hidden) return;
      if (orbit.auto && !orbit.dragging && !reducedMotion) orbit.theta += dt * 0.16;
      updateCamera();
      renderer.render(scene, camera);
    }
    requestAnimationFrame(animate);

    window.__sahilStudio = {
      setProperty: setProperty,
      toggleRotate: toggleRotate,
      resetView: resetView
    };

    // If a card was chosen before the studio initialised, honour it.
    var wanted = properties.find(function (p) { return p.id === state.selectedId; });
    if (wanted && wanted.id !== selected.id) setProperty(wanted);
  }

  /* ----------------------------------------------------------
     14. Boot
     ---------------------------------------------------------- */
  function boot() {
    initUI();
    initHero3D();

    var studioStarted = false;
    function startStudio() {
      if (studioStarted) return;
      studioStarted = true;
      initStudio3D();
    }
    var studioSection = $("#studio");
    if ("IntersectionObserver" in window && studioSection) {
      var studioIO = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) {
          startStudio();
          studioIO.disconnect();
        }
      }, { rootMargin: "500px 0px" });
      studioIO.observe(studioSection);
    } else {
      startStudio();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
