# Sahil Estates — 3D Real Estate, Karachi

A single-page, self-contained property showcase for a fictional Karachi real-estate studio. It combines an editorial luxury aesthetic with two hand-built Three.js scenes: a procedural golden-hour Karachi skyline and an interactive 3D residence viewer.

No build step, no framework, no backend, no external images. Everything — the coastline, city, furniture, card artwork, map and icons — is generated in code.

> **Demo content:** all properties, prices, market figures and the Sahil Estates brand are illustrative fiction. Not a live listing feed or a valuation tool.

---

## Contents

- [Quick start](#quick-start)
- [Highlights](#highlights)
- [Project structure](#project-structure)
- [Page sections](#page-sections)
- [The 3D scenes](#the-3d-scenes)
  - [Hero skyline](#hero-skyline)
  - [3D studio](#3d-studio)
- [The collection & filtering](#the-collection--filtering)
- [Neighbourhood map & market](#neighbourhood-map--market)
- [Contact form](#contact-form)
- [Data model & customization](#data-model--customization)
  - [Adding a residence](#adding-a-residence)
  - [Adding a neighbourhood](#adding-a-neighbourhood)
  - [Changing the look](#changing-the-look)
  - [Changing the hero sky](#changing-the-hero-sky)
  - [Studio camera per model](#studio-camera-per-model)
- [Design system](#design-system)
- [Accessibility & UX](#accessibility--ux)
- [Performance](#performance)
- [Browser support & fallbacks](#browser-support--fallbacks)
- [Verification](#verification)
- [Known limitations](#known-limitations)
- [Credits & licensing](#credits--licensing)

---

## Quick start

### Option 1 — open it directly

Open `index.html` in a modern browser. The Three.js build is vendored locally and all scripts are classic (non-module) scripts, so the page works from `file://` with no server.

### Option 2 — local server (recommended)

```bash
cd "/home/pc/3d Real estate"
python3 -m http.server 8000
```

Then visit <http://localhost:8000/>.

Any static host works (GitHub Pages, Netlify, S3, nginx). Upload the whole folder, including `vendor/`.

### Requirements

- A modern browser with JavaScript enabled.
- WebGL for the two 3D scenes. Without WebGL the page falls back gracefully (see [Browser support](#browser-support--fallbacks)).
- Internet access **only** for Google Fonts. Offline, the site falls back to Times New Roman / system sans / serif and remains fully usable.

There is nothing to install, compile or configure. No `package.json`, bundler or environment variables.

---

## Highlights

- **Procedural Karachi skyline** — Mazar-e-Quaid, Habib Bank Plaza, Ocean Towers, a waterfront mall, port cranes, Manora lighthouse, palms, dhows and a distant cargo ship.
- **Golden hour ↔ daylight** — live interpolation of sky, sun, fog, sea, lighting, window lights, stars and tone-mapping exposure.
- **Interactive 3D studio** — villa, tower, penthouse and land models with orbit, zoom, auto-rotate, reset and per-property details.
- **9 curated residences** across 6 Karachi neighbourhoods, with type/area/sort filtering and an empty state.
- **Procedural SVG artwork** — five palettes (`dusk`, `night`, `golden`, `dawn`, `day`) generated deterministically per property.
- **Stylised SVG map** of the Karachi coast with keyboard-accessible pins and a linked neighbourhood list.
- **Market section** with animated bars, median prices, yields and growth.
- **Validated enquiry form** with inline errors and a success panel (client-side simulation only).
- **Accessible, responsive and motion-aware** — skip link, ARIA states, focus-visible styles, reduced-motion and print modes.
- **Zero external imagery** — SVG icon sprite, CSS fallback skyline, canvas textures and shader water.

---

## Project structure

```
3d Real estate/
├── index.html              # Page structure, icon sprite, SVG map, copy
├── styles.css              # Design tokens, layout, components, responsive, print
├── app.js                  # Data, SVG artwork, UI logic, hero + studio Three.js
├── vendor/
│   └── three.min.js        # Three.js r149 UMD build (vendored, offline)
└── README.md
```

| File | Lines | Size |
| --- | ---: | ---: |
| `index.html` | 683 | 39 KB |
| `styles.css` | 2,590 | 66 KB |
| `app.js` | 2,699 | 112 KB |
| `vendor/three.min.js` | — | 594 KB |

Total payload is roughly **830 KB** uncompressed, with no runtime dependencies beyond Three.js and optional web fonts.

### Script order

```html
<script src="vendor/three.min.js"></script>
<script src="app.js"></script>
```

`app.js` is an IIFE in strict mode. It exposes only one intentional global for testing/automation:

```js
window.__sahilStudio = { setProperty, toggleRotate, resetView };
```

---

## Page sections

| # | Section | Anchor | What it does |
| --- | --- | --- | --- |
| — | Preloader | — | Animated brand mark + progress bar; reveals the page on `load` (with a 5 s safety timeout). |
| — | Header | — | Sticky glass header, scroll state, active-section scroll spy, phone CTA, mobile menu. |
| 00 | Hero | `#hero` | Live 3D skyline, headline, featured residence card, stats counters, sky toggle, scroll cue. |
| — | Marquee | — | Infinite CSS marquee of service/location phrases (decorative, `aria-hidden`). |
| 01 | Residences | `#residences` | Filter bar, result count, 9 cards with generated artwork and tilt, empty state. |
| 02 | 3D Studio | `#studio` | Lazy-loaded Three.js viewer + property facts, features and actions. |
| 03 | Neighbourhoods | `#neighbourhoods` | SVG Karachi map, clickable pins, detail card, linked area list. |
| 04 | Market | `#market` | Citywide stats, commentary and a per-square-foot bar chart. |
| — | Testimonial | — | Client quote with avatar initials and 5-star rating. |
| 05 | Contact | `#contact` | Studio details, telephone/WhatsApp/email links, validated enquiry form. |
| — | Footer | — | Navigation, area shortcuts, social links, oversized wordmark, disclaimer. |

Additional global components:

- **Toast** (`#toast`) — bottom-center status message, auto-hides after 3.2 s.
- **Mobile menu** — full-screen panel; closes on link click or `Escape`.
- **Skip link** — jumps to `#main`.

---

## The 3D scenes

Both scenes use Three.js r149 with a consistent colour pipeline:

```js
THREE.ColorManagement.legacyMode = false;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
```

Custom shaders end with `#include <tonemapping_fragment>` and `#include <encodings_fragment>` so the sky and water match the tone-mapped scene rather than clipping.

### Hero skyline

**Scene composition**

- Coastline at `z = 60`, promenade, seawall and beach strip.
- Procedural city blocks with shader-driven window lights.
- Landmarks: **Mazar-e-Quaid** (marble cube, dome, four minarets), **Habib Bank Plaza** (ribbed tower with aviation light), **Ocean Towers** (twin cylinders with balcony rings), a Dolmen-style **waterfront mall**, **port cranes and containers**, and the **Manora lighthouse** with a pulsing beacon.
- Instanced palms along the promenade, animated dhows on the water and a cargo ship on the horizon.
- Sky dome (radius 900) with an analytic **sun disc** and two glow lobes.
- Custom sea shader: layered sine swells, two glint bands, a sun path and horizon fade.
- `FogExp2(0x17262f, 0.00125)` for coastal haze.

**Lighting & mood**

| Setting | Golden hour | Daylight |
| --- | --- | --- |
| Sky top / horizon | `#050b17` / `#b96c46` | `#0d3c66` / `#4f9ec9` |
| Sun direction | `(-0.42, 0.24, -0.88)` | `(-0.30, 0.27, -0.92)` |
| Sun intensity | 2.2 | 2.9 |
| Hemisphere | 0.55 | 1.75 |
| Fill | 0.38 | 1.35 |
| Exposure | 1.05 | 1.06 |
| Stars / window night-factor | 0.55 / 1.0 | 0.0 / 0.02 |

The toggle (`#skyToggle`) updates `aria-pressed` and its label. Transitions are damped (`lambda = 2.4`) rather than instant, so the scene eases between moods.

**Interaction & lifecycle**

- Pointer parallax: desktop ±14 units, mobile ±5, with a slow idle drift.
- Camera: `PerspectiveCamera(38, …, 0.5, 2400)` at `(0, 54, 300)`, looking at `(0, 36, -70)`.
- Rendering pauses when the hero is off-screen or the tab is hidden.
- Shadow maps are frozen (`shadowMap.autoUpdate = false`) and refreshed only on sky change.
- Device pixel ratio is capped at 2.

### 3D studio

**Scene**

- Transparent renderer over the page background.
- Circular display platform with gold and teal rings, plus a shadow catcher.
- Warm key light, teal rim light, cool fill and hemisphere ambient; 2048² soft shadows.
- A subtle additive aura sprite behind the model.
- Procedural sand texture for the land model and a canvas-generated site sign.

**Models**

| Tab | Builder | Description |
| --- | --- | --- |
| Villa | `buildVilla()` | Two-storey house, pool and deck, pergola, roof garden, palms, loungers. |
| Tower | `buildTower()` | 11-floor glass tower, balcony rails, rooftop garden, pool and pergola. |
| Penthouse | `buildPenthouse()` | 9-floor building topped by a private terrace, plunge pool and top unit. |
| Land | `buildPlot()` | Sand plot, road, boundary markers, wireframe house vision, pool outline and sign. |

The model is selected by the property's `model` field. Each card's **3D** button and arrow open that property in the studio; the tab buttons jump to the first property using that model.

**Controls**

- **Drag** — orbit (`theta`, `phi`).
- **Scroll / trackpad** — zoom, clamped to distance `24–82`.
- **Auto-rotate** — on by default, toggled with the rotate button; disabled by default under `prefers-reduced-motion`.
- **Reset** — restores the per-model camera.
- **Next home** — cycles forward through all 9 properties.
- **Book a private viewing** — pre-selects the property in the contact form's "I'm interested in" field when available.

**Per-model camera**

```js
var viewDistances = { villa: 47, tower: 62, penthouse: 56, plot: 42 };
var viewTargets   = { villa: 5.2, tower: 10.4, penthouse: 8.4, plot: 2.4 };
```

**Lazy initialisation**

The studio is created only when `#studio` approaches the viewport (`IntersectionObserver`, `rootMargin: "500px 0px"`). This keeps the hero smooth on first load. If a property was chosen before initialisation, the selected model is applied when the viewer starts.

---

## The collection & filtering

Nine residences across four types:

| Residence | Area | Type | Price (PKR) | Beds / baths | Size | 3D model | Palette |
| --- | --- | --- | ---: | ---: | ---: | --- | --- |
| Seaview Sky Penthouse | Clifton Block 5 | Penthouse | 8.75 crore | 4 / 5 | 5,200 sq ft | penthouse | dusk |
| Khayaban-e-Saadi Villa | DHA Phase 8 | Villa | 13.5 crore | 5 / 6 | 8,000 sq ft | villa | golden |
| Creek Vista Residence | DHA Phase 6 | Apartment | 5.4 crore | 3 / 4 | 2,850 sq ft | tower | dawn |
| Bahria Ocean Heights | Bahria Town | Apartment | 2.65 crore | 3 / 3 | 2,100 sq ft | tower | day |
| Gulshan Garden Duplex | Gulshan-e-Iqbal | Villa | 4.9 crore | 5 / 5 | 3,200 sq ft | villa | dawn |
| PECHS Park Lane | PECHS Block 6 | Apartment | 3.2 crore | 2 / 3 | 1,750 sq ft | tower | night |
| Scheme 33 Hillside Plot | Scheme 33 · Sector 5 | Plot | 1.85 crore | — | 240 sq yd | plot | golden |
| Clifton Marine Loft | Clifton Block 2 | Apartment | 4.35 crore | 3 / 3 | 2,400 sq ft | penthouse | night |
| DHA Phase 5 Sky Terrace | DHA Phase 5 | Penthouse | 6.2 crore | 3 / 4 | 3,100 sq ft | penthouse | dusk |

**Filters**

- Type chips: All homes / Villas / Apartments / Penthouses / Plots.
- Area select: All Karachi, Clifton, DHA, Bahria, Gulshan, PECHS, Scheme 33.
- Sort: Featured first / Price low→high / Price high→low / Largest first.
- Result line updates (`"N residences in <area>"`).
- "Clear filters" appears whenever a non-default state is active.
- Empty state appears if no property matches, with a reset button.

**Card behaviour**

- Artwork is an inline SVG with `role="img"` and a descriptive label.
- Each card carries its type and palette; the illustration is seeded from the property `id`, so it is stable across reloads.
- Fine-pointer devices get a subtle 3D tilt; disabled for touch and reduced motion.
- The selected property's card receives `.is-active`.

**Price formatting** follows South Asian units: values ≥ 1 crore are shown in crore, otherwise in lakh (`formatPKR`, `formatPKRShort`).

---

## Neighbourhood map & market

The map is a hand-drawn SVG (`viewBox 0 0 620 620`) with a stylised coastline, Malir River, Korangi Creek, Manora island, grid, range rings and a compass. Pin coordinates live in the `areas` data.

| Neighbourhood | Pin (x, y) | Median (PKR/sq ft) | YoY |
| --- | --- | ---: | ---: |
| Clifton | 246, 342 | 27,400 | +6.1% |
| DHA Phase 8 | 382, 352 | 22,500 | +8.4% |
| Bahria Town | 300, 112 | 9,400 | +11.2% |
| Gulshan-e-Iqbal | 410, 232 | 12,200 | +5.7% |
| PECHS | 332, 288 | 18,600 | +7.3% |
| Scheme 33 | 468, 142 | 8,900 | +9.8% |

**Interactions**

- Clicking a pin or list row updates the detail card: name, price, growth, blurb and tags.
- Pins are focusable (`tabindex="0"`, `role="button"`) and respond to `Enter` / `Space`.
- "Browse N homes" filters the collection to that district and scrolls to `#residences`.
- Footer area shortcuts do the same jump.
- Pin labels, list rows and growth values are generated from the same data as the chart.

The market chart renders the same six medians as animated horizontal bars (values scaled to a `30,000` maximum), with citywide stats: median `PKR 16,400/sq ft`, yield `5.4%`, days on market `42`.

---

## Contact form

The form is a **front-end demonstration** — it does not send data anywhere.

**Validation**

| Field | Rule |
| --- | --- |
| Name | Non-empty after trimming. |
| Phone / WhatsApp | At least 7 digits after stripping non-numeric characters. |
| Email | Matches `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`. |
| Consent | Checkbox must be ticked. |

Invalid fields receive `.field.has-error`; the consent message uses `#consentError.is-visible`. Errors clear as the user types or toggles consent. On a failed submit the first invalid text field is focused (when there is one) and a toast appears.

**Success flow**

1. Submit button becomes disabled with "Sending…".
2. After 750 ms the form is hidden and `#formSuccess` is shown.
3. The first name is inserted into "Shukriya, `<name>`."
4. "Send another enquiry" restores and resets the form.

To make this real, replace the `setTimeout` block in `initContactForm()` with a `fetch()` to your endpoint, and keep the same validation/error handling. Remember to add server-side validation and spam protection.

---

## Data model & customization

All content lives in plain arrays/functions near the top of `app.js`:

| Data | Location | Count |
| --- | --- | --- |
| `properties` | `app.js` ~line 69 | 9 |
| `typeLabels` / `modelLabels` | ~line 254 | 4 each |
| `areas` | ~line 270 | 6 |
| `market` | ~line 315 | 6 |
| `PALETTES` | ~line 335 | 5 |
| `SKY` | inside `initHero3D()` ~line 1911 | 2 moods |

Copy that is not data-driven lives in `index.html` (hero, section headings, testimonial, contact details, footer).

### Adding a residence

Append an object to `properties`. The grid, filters, studio and map counts update automatically.

```js
{
  id: "my-new-home",              // unique slug; also seeds the SVG artwork
  title: "My New Home",
  location: "DHA Phase 7",        // shown on the card
  district: "DHA",                // must match an `areas[].district` for area filters
  type: "villa",                  // villa | apartment | penthouse | plot
  kind: "Villa",                  // label shown in studio specs
  model: "villa",                 // villa | tower | penthouse | plot
  price: 75000000,                // PKR, numeric
  beds: 4,
  baths: 5,
  size: 4200,                     // sq ft, used by "Largest first"
  sizeLabel: "4,200 sq ft",       // display string
  badge: "New",
  badgeTone: "",                  // "gold" for a gold badge, otherwise ""
  palette: "dusk",                // dusk | night | golden | dawn | day
  floors: 2,                      // descriptive metadata
  desc: "A short paragraph for the 3D studio panel.",
  features: ["Feature one", "Feature two", "Feature three", "Feature four"]
}
```

Notes:

- `type` controls filtering and the plot-specific spec row.
- `model` controls both the card illustration and which studio builder is used.
- `palette` only affects the SVG artwork; the three.js studio has its own fixed lighting.
- The studio "Next home" order follows array order.
- If you add a new district, add a matching entry to `areas` so the area filter and map can select it.

### Adding a neighbourhood

```js
{
  id: "korangi",                  // used by pins and list rows
  district: "Korangi",            // must match properties[].district for "Browse homes"
  name: "Korangi",
  pinLabel: "KORANGI",            // short uppercase map label
  note: "Industrial · value",     // small subtitle in the list
  x: 430, y: 470,                 // SVG coordinates (viewBox 0 0 620 620)
  labelDy: -20,                   // label offset above/below the pin
  price: 7800,                    // PKR per sq ft
  growth: "+4.2%",
  blurb: "One or two sentences for the detail card.",
  tags: ["Value", "Industrial", "Growth"]
}
```

Also append the neighbourhood to `market` if it should appear in the chart. The area `<select>` options in `index.html` are static — add an `<option value="Korangi">Korangi</option>` there as well.

### Changing the look

Design tokens are defined once at the top of `styles.css`:

```css
:root {
  --ink: #060b11;        /* page background */
  --panel: #0a131d;      /* panels */
  --sand: #ece3d2;       /* primary text */
  --muted: #93a3b1;      /* secondary text */
  --gold: #d5b57c;       /* primary accent */
  --teal: #5ec8bf;       /* secondary accent */
  --max: 1320px;         /* content width */
  --header-h: 86px;      /* sticky header height */
  --radius: 16px;
}
```

- **Fonts:** Cormorant Garamond (display), Manrope (UI) and Noto Nastaliq Urdu (loaded but not currently used in the UI). Loaded from Google Fonts in `index.html`; update `--serif` / `--sans` / `--urdu` to swap.
- **Brand name/contact:** search `index.html` for `SAHIL`, `Sahil`, `hello@sahil.estate`, `+92`, and `Dolmen City`.
- **Favicon:** inline SVG data URI in the `<head>`.
- **Icons:** add a `<symbol>` to the inline sprite at the top of `index.html`, then reference it with `<use href="#i-name"/>`.
- **Hero fallback:** `.hero__fallback` in `index.html` and its styles in `styles.css` render when WebGL is unavailable.

### Changing the hero sky

Edit the two entries in `SKY` inside `initHero3D()`:

```js
var SKY = {
  dusk: {
    top: new THREE.Color(0x050b17),
    horizon: new THREE.Color(0xb96c46),
    glow: new THREE.Color(0xffa45c),
    fog: new THREE.Color(0x17262f),
    sun: new THREE.Color(0xffb877), sunI: 2.2, hemi: 0.55, fill: 0.38,
    disc: new THREE.Color(0xffd9a0),
    exposure: 1.05, stars: 0.55, night: 1,
    deep: new THREE.Color(0x071820),
    shallow: new THREE.Color(0x0e303a),
    waterSun: new THREE.Color(0xe8a76c),
    waterHorizon: new THREE.Color(0x7d4d3a)
  },
  day: { /* ... */ }
};
```

`applySky(mix)` interpolates every value, including the sun direction, star opacity, window-night factor, water colours and exposure. If you change the sun direction, keep the vector normalized; the shader compares it with the view direction.

### Studio camera per model

```js
var viewDistances = { villa: 47, tower: 62, penthouse: 56, plot: 42 };
var viewTargets   = { villa: 5.2, tower: 10.4, penthouse: 8.4, plot: 2.4 };
```

Raise `viewDistances` to pull the camera back, or raise `viewTargets` to lift the orbit pivot. Zoom limits (`24–82`) and pitch limits (`0.55–1.38`) are set in the pointer/wheel handlers.

---

## Design system

- **Mood:** midnight navy + warm sand + muted gold, with teal as a secondary signal.
- **Display type:** Cormorant Garamond, light/italic for editorial emphasis.
- **UI type:** Manrope, 300–700, wide letter-spacing on eyebrows and buttons.
- **Surfaces:** near-black panels, 1 px warm hairlines (`--line`), soft glass header, restrained shadows.
- **Motion:** long easing curves (`--ease`, `--ease-out`), reveal-on-scroll, counters, marquee, bar growth, card tilt, hero parallax.
- **Layout:** max width 1320 px; CSS Grid layouts; generous section spacing.

**Responsive breakpoints**

| Breakpoint | Key changes |
| --- | --- |
| ≤ 1180 px | Tighter hero grid and narrower featured card / map card. |
| ≤ 1020 px | Desktop nav → mobile menu; 2-column cards; studio stacks; map list becomes 2 columns; market stats become 3 columns. |
| ≤ 820 px | Single-column hero (featured card hidden); smaller header; quote simplified; footer disclaimer hidden. |
| ≤ 700 px | Single-column cards and contact cards; scrollable filter chips; studio 420 px; map card flows below map; chart labels condensed. |
| ≤ 520 px | Smaller display type; stacked hero buttons; compact stats; full-width studio actions; reduced market grid. |

`prefers-reduced-motion: reduce` collapses animations/transitions, forces revealed content visible, stops the hero camera drift and disables the studio auto-rotate and card tilt.

`@media print` hides the header, menu, hero media, marquee, toast and preloader, and switches to a white background.

---

## Accessibility & UX

- Skip link to `#main`.
- Semantic landmarks: `header`, `nav`, `main`, `section`, `footer`; labelled sections and navs.
- Visible `:focus-visible` outline; dedicated focus styles for map pins and checkbox.
- All icon-only buttons have `aria-label`; toggles expose `aria-pressed`.
- Filter chips and model tabs use `aria-pressed`; result counts are textual.
- Map pins are keyboard operable (`Enter` / `Space`) with descriptive `aria-label`s including price and growth.
- Mobile menu updates `aria-expanded`, `aria-hidden` and closes on `Escape`.
- Form errors are text, not colour-only; the first invalid text field receives focus; the consent warning is visible text.
- Decorative artwork is `aria-hidden`; generated card SVGs are labelled as images.
- Motion respects the OS setting; no autoplaying video or audio.
- The preloader has a hard 5 s timeout so it can never trap the page.

---

## Performance

- **No runtime dependencies** beyond a local Three.js file; no network requests for imagery.
- **DPR capped at 2** on both renderers.
- **Hero** pauses rendering when off-screen or when the tab is hidden; shadow maps are static.
- **Studio** initialises lazily, 500 px before it enters the viewport; pauses rendering when off-screen.
- **Instancing** for palms; low-poly geometry for the city.
- **Deterministic procedural art** avoids large asset downloads; SVGs are inline and cheap.
- **Fonts** are the only third-party request and degrade to system fonts offline.

If you need to trim further: lower `viewDistances`/geometry counts sparingly, reduce `devicePixelRatio` cap to 1.5, or drop the Google Fonts link (the design degrades to the declared fallbacks).

---

## Browser support & fallbacks

| Capability | Behaviour |
| --- | --- |
| WebGL | Required for 3D. If unavailable, the hero adds `.no-3d` and shows the CSS skyline; the studio shows `#stageFallback` with the property details still usable. |
| `IntersectionObserver` | Used for reveals, scroll spy and lazy studio/hero pausing. Fallbacks show content immediately or start the studio eagerly. |
| `ResizeObserver` | Keeps canvases crisp; window `resize` is also wired. |
| `prefers-reduced-motion` | Disables non-essential motion as described above. |
| Touch devices | Orbit uses pointer events; card tilt is hover/fine-pointer only; wheel zoom is desktop-oriented. |
| `file://` | Works because scripts are classic and Three.js is local. Google Fonts still needs internet. |

Tested in current Chromium. Recent Firefox, Safari and Edge are expected to work; WebGL performance depends on the GPU.

---

## Verification

The implementation was exercised in headless Chromium (Playwright) with these checks:

- Page loads with **no console or page errors**.
- 9 property cards render; type filters yield 9 / 4 apartments / 1 plot; area and sort controls update results.
- All 6 map pins and 6 neighbourhood rows render; selecting a pin updates the detail card; "Browse" filters to that area.
- All 4 studio models load; "Next home" cycles; rotate and reset respond.
- Form validation flags missing name, invalid phone, invalid email and missing consent; valid submission shows the personalised success panel.
- Mobile menu opens and closes via the toggle, link clicks and `Escape`.
- No horizontal overflow at 390 px, 834 px or 1440 px.
- `node --check app.js` passes.

To repeat the basic static checks:

```bash
node --check app.js
python3 -m http.server 8000
```

Then open the site and test the hero toggle, filters, map, studio and form.

---

## Known limitations

- **Fictional content.** Listings, prices, growth figures, testimonials, phone numbers and the brand are demonstration data. The footer says so.
- **No backend.** The enquiry form simulates success; nothing is stored or emailed. Social links other than WhatsApp are placeholders (`#`).
- **Representative 3D.** Studio models are stylised, not architectural drawings; fixtures, finishes and views are not literal. The UI includes this disclaimer.
- **Static area options.** The area `<select>` is authored in HTML rather than generated from `areas`; keep them in sync when adding districts.
- **Hero card is hard-coded.** The featured card is built from Khayaban-e-Saadi Villa and the hero headline is static copy.
- **No deep linking.** Filters, selected property and sky mode are not stored in the URL or `localStorage`; reloading resets them.
- **Fonts require network.** The site is otherwise offline-capable.
- **Headless screenshots.** Software-rendered browsers can composite DOM ghosts over WebGL canvases in screenshots; this is a capture artifact, not a page bug.

---

## Credits & licensing

- **Three.js r149** — MIT License. Vendored as `vendor/three.min.js`.
- **Cormorant Garamond, Manrope, Noto Nastaliq Urdu** — SIL Open Font License, served via Google Fonts.
- **Design, copy, SVG artwork, map, shaders and 3D models** — original work for this demo.
- No stock photography or third-party imagery is used.

No project license file is included. Treat the code and content as a demonstration; add a license before publishing or redistributing commercially.

---

**Sahil Estates** · Karachi, Pakistan · 24.8607° N, 67.0011° E
