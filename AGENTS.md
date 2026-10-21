# AGENTS.md

Operating instructions for AI coding agents working on **Sahil Estates** — a static, self-contained 3D real-estate site for Karachi.

Read [`README.md`](./README.md) first for the user-facing overview. This file documents the internals, conventions, known traps and the workflow expected for changes.

---

## 1. What this project is

- A **single-page static site**: `index.html` + `styles.css` + `app.js` + a vendored Three.js build.
- Two hand-built **Three.js** scenes: a procedural Karachi skyline in the hero and a lazy-loaded residence viewer ("3D studio").
- **No build step, no framework, no package manager, no backend.**
- All visuals are procedural: inline SVG, Canvas textures, CSS, and Three.js geometry. The only external request is Google Fonts.
- All listings, prices, areas and testimonials are **fictional demo data**.

### Non-negotiable constraints

1. **Keep it static and offline-capable.** Do not introduce a bundler, dev server requirement, SSR, database or API dependency.
2. **Do not add npm dependencies** unless the user explicitly asks. Three.js is vendored in `vendor/`.
3. **No external images, textures, models, icon packs or fonts** beyond the existing Google Fonts link. Generate assets in code.
4. **Keep classic scripts.** No `type="module"`, `import`/`export`, `fetch`/XHR or dynamic imports in the shipped page — it must keep working from `file://`.
5. **Follow the existing JS style:** ES5 syntax (`var`, `function`, string concatenation), semicolons, double-quoted strings. Do not introduce `let`/`const`, arrow functions, template literals or classes. Modern DOM APIs already in use (`Element.closest`, `Array.find`, `IntersectionObserver`, `ResizeObserver`, pointer events) are fine.
6. **Preserve the DOM contract** in [§7](#7-dom-contract): IDs, classes, data attributes and state classes are referenced by JS, CSS and automation.
7. **Preserve `window.__sahilStudio`** — `{ setProperty, toggleRotate, resetView }` is a stable test hook.
8. **Escape dynamic text** inserted with `innerHTML` (`escapeHTML`) unless it is authored, trusted data. Some current fields (features/tags/badges) skip this; do not add user-editable fields without escaping.
9. **Match the visual language** — midnight navy, sand, muted gold, teal, editorial serif, restrained motion. Do not restyle to generic Bootstrap/Tailwind patterns.
10. **Update docs when behaviour changes**, and run the checks in [§13](#13-testing).

---

## 2. Commands

There is no install, build, lint or test script in the repository.

```bash
# 1. Syntax check the only JS file
node --check app.js

# 2. Serve locally (recommended for development)
python3 -m http.server 8000
# → http://localhost:8000/

# 3. Optional: verify direct file access still works
#    Open index.html in a browser. No fetch/modules, so it should.
```

If a server is already running, reuse it. Do not add a `package.json` just to run checks.

### Local QA environment (this workspace)

Playwright and Chromium may be available outside the repo. Discover rather than assume:

```bash
ls "$HOME/.cache/ms-playwright"
node -e "console.log(require.resolve('playwright'))"   # if NODE_PATH points at it
```

The existing setup uses:

```bash
NODE_PATH=/home/pc/.npm/_npx/f0a362733743bae2/node_modules
CHROME="$HOME/.cache/ms-playwright/chromium-1148/chrome-linux/chrome"
# launch args: --no-sandbox --enable-unsafe-swiftshader
```

Playwright is **not** a project dependency. Keep test scripts in `/tmp` (or another scratch directory), not in the repo, unless the user asks for a test suite.

---

## 3. Repository map

```
3d Real estate/
├── index.html          # markup, icon sprite, static copy, SVG map shell, form
├── styles.css          # tokens, layout, components, responsive, motion, print
├── app.js              # data, SVG art, UI wiring, two Three.js scenes
├── vendor/three.min.js # Three.js r149 UMD
├── README.md           # user-facing documentation
└── AGENTS.md           # this file
```

### `index.html` — comment blocks

| Block | Contents |
| --- | --- |
| Icon library | Inline `<symbol>` sprite (`#i-arrow`, `#i-cube`, `#i-sun`, …) |
| Preloader | `#preloader`, `#preloaderBar` |
| Header | `.site-header`, primary nav, `#menuToggle`, `#mobileMenu` |
| Hero | `#hero`, `#heroCanvas`, copy, featured card, `#skyToggle`, stats |
| Marquee | Decorative CSS ticker |
| Residences | `#propertyGrid` (empty in HTML; rendered by JS), filters, empty state |
| 3D Studio | `#studioCanvas`, stage tools, model tabs, info panel, fallback |
| Neighbourhoods | SVG map shell, `#mapPins`, `#hoodCard`, `#hoodList` |
| Market | Stats + `#marketChart` (rendered by JS) |
| Quote | Static testimonial |
| Contact | Studio details + `#contactForm` / `#formSuccess` |
| Footer | Nav, area shortcuts, wordmark, `#year`, disclaimer |

### `styles.css` — section order

```
:root tokens
reset + base
type helpers / buttons
PRELOADER
HEADER
HERO
MARQUEE
SECTIONS
FILTERS
PROPERTY CARDS
3D STUDIO
NEIGHBOURHOODS / MAP
MARKET
QUOTE
CONTACT
FOOTER
TOAST
REVEAL
RESPONSIVE          (1180 → 1020 → 820 → 700 → 520)
MOTION / PRINT
```

Keep new component CSS in the matching section and responsive rules in the existing media queries — do not scatter breakpoints through the file.

### `app.js` — numbered sections

| § | Name | Key symbols |
| --- | --- | --- |
| 0 | Small helpers | `$`, `$$`, `clamp`, `lerp`, `damp`, `escapeHTML`, `toast` |
| 1 | The collection | `properties`, `typeLabels`, `modelLabels` |
| 2 | Neighbourhoods + market data | `areas`, `market`, `state` |
| 3 | Procedural artwork for cards | `PALETTES`, `artworkSVG`, `palmSVG`, `waterBand` |
| 4 | The grid | `filteredProperties`, `cardTemplate`, `renderProperties`, `setType` |
| 5 | Featured card | `initFeaturedCard` |
| 6 | Neighbourhood map + list | `renderMap`, `selectArea` |
| 7 | Market chart | `renderMarket` |
| 8 | Studio details | `updateStudioDetails`, `selectProperty` |
| 9 | Navigation, filters, map actions, form | `initNavigation`, `initFilters`, `initMapActions`, `initStudioUI`, `initContactForm` |
| 10 | Reveals, counters, preloader | `initReveals`, `animateHeroStats`, `initPreloader` |
| 11 | Boot | `initUI` |
| 12 | HERO — procedural Karachi skyline | `initHero3D` + inner helpers |
| 13 | 3D STUDIO — architecture viewer | `initStudio3D` + builders |
| 14 | Boot | `boot` |

> Section headers are stable; line numbers drift. Always search for symbols, not line numbers.

---

## 4. Runtime architecture

### Boot sequence

```js
DOMContentLoaded
└── boot()
    ├── initUI()                 // all DOM wiring and initial renders
    │   ├── initFooterYear()
    │   ├── initNavigation()     // header state, mobile menu, scroll spy
    │   ├── initFeaturedCard()   // hero card (hard-coded property)
    │   ├── initFilters()        // chips, selects, grid delegation, initial render
    │   ├── initStudioUI()       // tabs, next, book, rotate, reset
    │   ├── initMapActions()     // browse button + footer area jumps
    │   ├── renderMap()          // pins + list + initial selection
    │   ├── renderMarket()       // bars
    │   ├── initContactForm()
    │   ├── initReveals()        // scroll reveals + chart animation
    │   ├── updateStudioDetails(selected)
    │   └── initPreloader()
    ├── initHero3D()             // renders immediately
    └── IntersectionObserver     // initStudio3D() when #studio is within 500px
```

- The studio is **lazy**. `window.__sahilStudio` does not exist until the section approaches the viewport.
- All callers of the studio API guard with `if (window.__sahilStudio && …)`. Keep those guards.
- If a property is selected before studio init, `initStudio3D` reads `state.selectedId` and builds it at the end.
- `prefers-reduced-motion` is read **once at load** into `reducedMotion`. Changing the OS setting requires a reload.

### State

```js
var state = {
  type: "all",                            // all | villa | apartment | penthouse | plot
  area: "all",                            // all | district label (e.g. "DHA")
  sort: "featured",                       // featured | price-asc | price-desc | size-desc
  selectedId: "khayaban-e-saadi-villa",   // studio + active card
  selectedArea: "dha"                     // map area id (not district)
};
```

There is **no persistence** — no URL params, no `localStorage`. Reload resets everything.

### Data flow

```
properties[] ──filteredProperties()──> renderProperties() ──> #propertyGrid.innerHTML
      │                                                        │
      │                                                        └─ delegated [data-3d] click
      └─ selectProperty(id) ──> updateStudioDetails(p)
                              ├─> updateActiveCard()
                              └─> window.__sahilStudio.setProperty(p)

areas[] ──renderMap()──> #mapPins + #hoodList
   │                         │
   │                         └─ selectArea(id) ──> #hoodName/#hoodPrice/#hoodBlurb/#hoodTags
   └─ #hoodBrowse ──> state.area = district ──> renderProperties() + scroll
```

Key invariants:

- **`selectProperty` is the only supported way** to change the studio property. It updates details, the active card and the 3D scene together.
- **`renderProperties` replaces all cards.** Event listeners must be delegated on `#propertyGrid` (as `[data-3d]` is) or attached inside `attachTilt()` after each render.
- **`renderMap` recreates pins and rows** and reattaches their listeners each time. Static controls (`#hoodBrowse`, footer buttons) are wired once.
- **`state.area` is a `district` string**, not an `areas[].id`. `state.selectedArea` is the map id.
- Changing `state.type` should go through `setType()` so chips and `aria-pressed` stay in sync.
- `setArea()` exists but is currently **unused**; filtering is wired through `initFilters` and `initMapActions`. Do not assume it is called.

---

## 5. Data reference

### 5.1 `properties` (9 entries)

| Field | Type | Used for |
| --- | --- | --- |
| `id` | string | Unique slug; `data-id`, selection, artwork seed |
| `title` | string | Card, studio, featured card |
| `location` | string | Card location line and studio area |
| `district` | string | Area filtering and map "Browse" counts — must match an `areas[].district` |
| `type` | `villa` \| `apartment` \| `penthouse` \| `plot` | Type chips, plot-specific card specs |
| `kind` | string | Studio "Type" spec |
| `model` | `villa` \| `tower` \| `penthouse` \| `plot` | Card illustration branch + studio builder |
| `price` | number | PKR; formatted as crore/lakh |
| `beds`, `baths` | number | Cards and studio (plots show "—") |
| `size` | number | Numeric sq ft for "Largest first" |
| `sizeLabel` | string | Display value |
| `badge` | string | Card badge |
| `badgeTone` | `""` \| `"gold"` | Gold badge styling |
| `palette` | `dusk` \| `night` \| `golden` \| `dawn` \| `day` | SVG artwork only |
| `floors` | number | **Currently unused** (descriptive metadata) |
| `desc` | string | Studio paragraph |
| `features` | string[] | Studio feature list |

Price is stored in rupees, not crore. Formatting:

```js
pkrParts(87500000) → { n: 8.75, unit: "crore" }
// >= 1e7 → crore, otherwise lakh
```

### 5.2 `areas` (6 entries)

| Field | Notes |
| --- | --- |
| `id` | Map/list identifier (`clifton`, `dha`, …) |
| `district` | Must match `properties[].district` for filtering |
| `name` | Display name |
| `pinLabel` | Short uppercase map label |
| `note` | Subtitle in the list |
| `x`, `y` | Coordinates in the `620 × 620` SVG |
| `labelDy` | Vertical label offset (negative = above pin) |
| `price` | Median PKR/sq ft |
| `growth` | YoY string, e.g. `"+8.4%"` |
| `blurb` | Detail-card paragraph |
| `tags` | Short tag array |

### 5.3 `market`

`{ name, sub, value, growth }`. Values render as horizontal bars scaled to a hard-coded `30000` maximum in `renderMarket()`.

### 5.4 `PALETTES`

Five keys: `dusk`, `night`, `golden`, `dawn`, `day`. Each provides:

```
sky[5]  sun  glow  haze  cityFar  facade  side  roof  window  glass
water   waterHi  deck  ground  accent  foliage  trunk
```

Artwork is deterministic: `mulberry32(hashStr(p.id))`. Do not replace this with `Math.random()` or illustrations will change on every render.

### 5.5 Unused / dead values

- `typeLabels` is defined but unused (chip labels are in HTML).
- `floors` is unused.
- `setArea()` is unused.

Leave them alone unless you are deliberately cleaning up; do not build features on the assumption they are wired.

---

## 6. Feature modules (how they work)

### Filters

- Type chips: `.chip[data-type]`, active state `.is-active` + `aria-pressed`.
- `#areaFilter`: values are **district strings** (`Clifton`, `DHA`, …); changing it also selects the matching map area.
- `#sortFilter`: sorts a copy of the filtered list.
- `#resetFilters` is shown for any non-default state; `#emptyReset` resets from the empty state.
- `#resultCount` / `#resultArea` update in `renderProperties()`.
- Cards: `.property-card[data-id]`, generated by `cardTemplate()`. Clicking `[data-3d]` calls `selectProperty(id, { scroll: true })`.
- Tilt: `attachTilt()` only runs for fine pointers and when motion is allowed.

### Hero featured card

- `initFeaturedCard()` looks up `khayaban-e-saadi-villa` (falls back to `properties[0]`), fills `#heroCardArt`, `#heroCardArea`, `#heroCardTitle` and `.hero-card__meta`, and wires `[data-featured-link]`.
- It is **hard-coded**, not driven by `state.selectedId`.
- Hero stats (`240+`, `14`, `17 yrs`) are hard-coded via `[data-count]` / `[data-suffix]` and animated once after the preloader.

### Map

- Pins are `<g class="map-pin" data-area="…" tabindex="0" role="button">` with `Enter`/`Space` handlers.
- `selectArea` only updates the detail card and browse count; it does **not** scroll.
- `#hoodBrowse` sets the area filter, re-renders the grid, scrolls to `#residences` and toasts.
- Footer `[data-jump-area]` buttons do the same without changing the visible map selection first (they call `selectArea` silently).

### Studio UI

- Tabs `#modelTabs button[data-model]` jump to the **first property using that model** (not a separate model-only preview).
- `#studioNext` cycles `properties` array order.
- `#studioBook` pre-selects the property in `#formInterest` only if an option with that exact title exists; otherwise it selects "A private shortlist".
- `#studioRotate` calls `window.__sahilStudio.toggleRotate()` and mirrors the return value into `aria-pressed`.
- `#studioReset` calls `resetView()`.

### Reveals / counters / preloader

- `[data-reveal]` gets `.reveal-init`, then `.is-revealed` via IntersectionObserver (`rootMargin: -8%`, threshold 0.08). Without IO or with reduced motion, everything is revealed immediately.
- The market chart gets `.is-in` when 18% visible, which triggers bar widths.
- `animateHeroStats()` runs after the preloader and uses `requestAnimationFrame` (1.5 s, cubic ease-out); reduced motion jumps to the final value.
- Preloader fakes progress to 90% on a 160 ms interval, then completes on `load` (+420 ms) or at a hard 5 s timeout; it is removed from the DOM 900 ms after completing.
- Toast: one global timer, auto-hides after 3.2 s.

### Contact form

Client-side only. `initContactForm()` validates:

| Field | Rule |
| --- | --- |
| `#formName` | non-empty after trim |
| `#formPhone` | ≥ 7 digits after stripping non-digits |
| `#formEmail` | `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` |
| `#formConsent` | checked |

Errors use `.field.has-error`; consent uses `#consentError.is-visible`. On failure, the first invalid text field is focused and a toast appears. On success, a 750 ms simulated send hides the form, fills `#successName` and shows `#formSuccess`. No network request exists.

If asked to connect a backend: replace the `setTimeout` in `initContactForm()` with `fetch`, keep the visual states, add server-side validation and spam protection, and update the README/AGENTS docs. Note that adding `fetch` is fine for the hosted site but breaks the form's offline/`file://` behavior — guard or document it.

---

## 7. DOM contract

These are load-bearing. Renaming requires updating `app.js`, `styles.css`, automation and this document.

### Global / header

| Selector | Purpose |
| --- | --- |
| `#top` | Page top / brand link target |
| `#main` | Skip-link target |
| `#preloader`, `#preloaderBar` | Loader |
| `#siteHeader` | Gets `.is-scrolled` after 24 px |
| `#menuToggle` | `aria-expanded`, `aria-controls="mobileMenu"` |
| `#mobileMenu` | `.is-open`, `aria-hidden` |
| `body.nav-open` | Menu icon swap |
| `body.is-loading`, `body.is-ready` | Preloader state |
| `#toast`, `#toastText` | Global toast; `.is-visible` |
| `#year` | Footer year |

### Hero

| Selector | Purpose |
| --- | --- |
| `#hero` | Pointer parallax, visibility observer, `.no-3d` |
| `#heroCanvas` | Hero renderer canvas |
| `#skyToggle` | `aria-pressed`; toggles golden hour/daylight |
| `[data-hero]` | Staggered entrance; needs `body.is-ready` |
| `#heroCardArt`, `#heroCardArea`, `#heroCardTitle`, `.hero-card__meta` | Featured card |
| `[data-featured-link]` | Opens featured property in studio |
| `[data-count]`, `[data-suffix]` | Animated hero stats |

### Residences

| Selector | Purpose |
| --- | --- |
| `#propertyGrid` | Card container; delegated `[data-3d]` clicks |
| `.property-card[data-id]` | Card; `.is-active` for selected |
| `.chip[data-type]` | Type filter; `.is-active`, `aria-pressed` |
| `#areaFilter`, `#sortFilter` | Select filters |
| `#resultCount`, `#resultArea` | Result summary |
| `#resetFilters` | Clear filters |
| `#emptyState`, `#emptyReset` | No-results state |
| `.reveal-init`, `.is-revealed` | Scroll reveal classes |
| `.is-tilting` | Card tilt state |

### Studio

| Selector | Purpose |
| --- | --- |
| `#studio` | Lazy-init observer target |
| `#studioStage` | Pointer/wheel target; `.is-dragging` |
| `#studioCanvas` | Studio renderer canvas |
| `#stageFallback` | Shown when Three.js/WebGL is unavailable |
| `#modelTabs button[data-model]` | Model tabs; `aria-pressed` |
| `#studioRotate`, `#studioReset` | Controls |
| `#studioTypeLabel`, `#studioArea`, `#studioPrice`, `#studioTitle` | Header/details |
| `#studioDesc`, `#studioBeds`, `#studioBaths`, `#studioSize`, `#studioKind` | Details |
| `#studioFeatures`, `#studioBook`, `#studioNext` | Features/actions |

### Map

| Selector | Purpose |
| --- | --- |
| `#karachiMap`, `#mapPins` | SVG map and generated pins |
| `.map-pin[data-area]` | Focusable pin; `.is-active` |
| `#hoodList`, `.hood-row[data-area]` | Neighbourhood list; `.is-active` |
| `#hoodName`, `#hoodPrice`, `#hoodGrowth`, `#hoodBlurb`, `#hoodTags` | Detail card |
| `#hoodBrowse` | Filter residences to selected district |
| `[data-jump-area]` | Footer shortcuts |

### Market / contact

| Selector | Purpose |
| --- | --- |
| `#marketChart` | Generated bars |
| `#contactForm` | Form; `hidden` after success |
| `#formName`, `#formPhone`, `#formEmail`, `#formInterest`, `#formBudget`, `#formMessage` | Inputs |
| `#formConsent`, `#consentError` | Consent + error |
| `#formSubmit`, `#formSuccess`, `#successName`, `#formAgain` | Submit/success |
| `.field.has-error` | Invalid field |

### State classes and data attributes

```
.is-active  .is-open  .is-scrolled  .is-loading  .is-ready
.has-error  .is-visible  .is-revealed  .is-tilting  .is-dragging  .is-in
.reveal-init  .card-enter

data-nav  data-hero  data-count  data-suffix  data-3d  data-id
data-type  data-area  data-jump-area  data-featured-link  data-model  data-reveal
```

---

## 8. 3D subsystem rules

### 8.1 Shared colour pipeline

Both scenes must keep this setup:

```js
if (THREE.ColorManagement) THREE.ColorManagement.legacyMode = false;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
```

Custom `ShaderMaterial`s end with:

```glsl
#include <tonemapping_fragment>
#include <encodings_fragment>
```

Without these includes, sky/water colours will not match the standard materials. Do not "simplify" them away.

### 8.2 Hero scene (`initHero3D`)

- Renderer: antialias, opaque, DPR ≤ 2, PCF soft shadows, `FogExp2(0x17262f, 0.00125)`.
- Camera: `PerspectiveCamera(38, …, 0.5, 2400)` at `(0, 54, 300)`, looking at `(0, 36, -70)`.
- World: Y up; sea at `y ≈ -0.55`; coastline/promenade around `z = 60`; city extends into negative Z.
- `cityGroup` holds the city and landmarks. Add new landmarks there.
- Procedural blocks are placed by `bands` and rejected inside `zones`. **If you add a landmark, add a matching exclusion zone** so blocks do not grow through it.
- Windows use `windowMaterial()` (an `onBeforeCompile` shader) and register in `windowMats`. `applySky()` updates their `uNight` uniform. If you create window materials after the initial `applySky(0)`, update them or call `applySky(skyMix)`.
- `SKY.dusk` / `SKY.day` are the single source of mood. `applySky(mix)` interpolates sky, sun disc, sun direction, stars, hemi/sun/fill intensity, exposure, fog, water uniforms and window night factor.
- The sky sun is **shader-drawn** (disc + two glow lobes). Do not re-add sprite-based suns; they get fogged.
- Pointer parallax amplitude: 14 desktop, 5 mobile, damped with `lambda 2.5`; camera idle drift uses sine.
- Rendering pauses when `#hero` is off-screen or `document.hidden`.
- **Shadow maps are frozen** (`shadowMap.autoUpdate = false`). After changing sun/geometry, set `renderer.shadowMap.needsUpdate = true` (the sky toggle already does).
- `makeGlowTexture()` / `glowTex` are shared by lamps and dhows — do not dispose or remove.

### 8.3 Studio scene (`initStudio3D`)

- Transparent renderer, DPR ≤ 2, ACES, exposure 1.12, `Fog(0x0a1620, 46, 108)`.
- Platform at `y = 0`, radius ≈ 17; models are built in local coordinates on top of it.
- Camera orbit: custom `theta`/`phi`/`dist` + `targetY`; no OrbitControls.
- Builders: `buildVilla`, `buildTower`, `buildPenthouse`, `buildPlot`; dispatch in `buildModel(p)`.
- Geometry helpers: `box`, `cyl`, `palm`, `shrub`, `lounger`, `addWindows`; shared materials in `M`.
- `setProperty(p)` removes the old group, calls `disposeGroup`, builds the new one, resets orbit and requests a shadow update.
- Lazy init via IntersectionObserver (`rootMargin: "500px 0px"`); `#studioCanvas` must have non-zero CSS size before `resize()` works.
- Test API:

```js
window.__sahilStudio = {
  setProperty,   // (propertyObject) => void
  toggleRotate,  // () => boolean (new auto-rotate state)
  resetView      // () => void
};
```

- Auto-rotate is `!reducedMotion` initially and advances `theta` at 0.16 rad/s.
- Drag: `theta -= dx * 0.0062`, `phi` clamped `0.55–1.38`. Wheel zoom clamped `24–82`.
- `touch-action: pan-y` on the stage allows vertical page scroll; horizontal orbit works.

### 8.4 Disposal and leaks

`disposeGroup()` disposes **geometry** and sprite maps, but **not shared materials** (correct — they are reused). Per-build materials/textures (e.g. the plot sign's canvas texture and material) are not disposed.

If you add a builder that creates its own materials or textures:

- Prefer adding them to the shared `M` object.
- If they must be per-build, extend `disposeGroup` to dispose `obj.material` / `obj.material.map` when they are not in `M` and not `glowTex`.
- Never dispose `glowTex` or shared materials.

### 8.5 Shadow policy

- Hero and studio both disable per-frame shadow updates (`shadowMap.autoUpdate = false`).
- After adding/moving shadow-casting meshes or changing lights: `renderer.shadowMap.needsUpdate = true`.
- If you add genuinely animated shadow casters, re-enable `autoUpdate` only for that scene, and note the performance cost.

### 8.6 Fallbacks

- If `!window.THREE` or `new WebGLRenderer` throws in the hero: `#hero` gets `.no-3d`, CSS shows `.hero__fallback`. In this mode `#skyToggle` only flips label/`aria-pressed`; the fallback scene is fixed golden hour.
- If the studio fails: `#stageFallback` becomes visible; property text stays usable; `window.__sahilStudio` is not created.
- Keep the fallback markup and the `.no-3d` rule intact when editing the hero.

---

## 9. Styling rules

- **Tokens live in `:root`** (`--ink`, `--sand`, `--gold`, `--teal`, `--line`, `--max`, `--header-h`, `--ease`, …). Reuse them; avoid new hard-coded brand colours.
- **Naming:** BEM-ish (`block__element`, `block--modifier`) with state classes (`is-*`). Follow existing names.
- **Indentation:** 2 spaces. One selector per rule block; avoid deep nesting (plain CSS, no preprocessor).
- **Responsive:** all breakpoints live at the bottom in descending order (`1180`, `1020`, `820`, `700`, `520`). Add to the relevant existing query.
- **Fluid sizing:** use `clamp()` like the rest of the file instead of new breakpoints where possible.
- **Focus:** keep `:focus-visible` styles and add them for new interactive elements. Never remove outlines without a replacement.
- **Motion:** respect `prefers-reduced-motion`; the global rule collapses durations, but JS-driven motion must also be gated (`reducedMotion`).
- **Z-index ladder** (do not casually leapfrog):
  - mobile menu `110`
  - header `120`
  - hero card/content `1–4`
  - toast `400`
  - preloader `2500`
  - body grain overlay `3000` (`pointer-events: none`)
  - skip link `5000`
- **`[hidden]` is global** (`display: none !important`). Prefer the `hidden` attribute over inline `display` toggles.
- **Print styles** hide the header, menu, hero media, marquee, toast and preloader. Keep new decorative chrome out of print.
- **Grain:** `body::after` adds a fixed SVG noise overlay at opacity 0.035. It sits above most UI but ignores pointer events.
- The hero uses layered scrims and a radial copy wash; preserve contrast if changing the background.

---

## 10. Common tasks

### 10.1 Add a residence

1. Append an object to `properties` (see [§5.1](#51-properties-9-entries)).
2. Use an existing `district` so area filters and the map work.
3. Use an existing `model` unless you also add a builder ([§10.2](#102-add-a-new-3d-model-type)).
4. Pick a `palette`; the card art is seeded from `id`.
5. Reload. No other file needs changing unless you add a new type/district.
6. Test: card count, filter, sort, studio open, "Next home" cycle.

Reference object:

```js
{
  id: "clifton-courtyard-house",
  title: "Clifton Courtyard House",
  location: "Clifton Block 8",
  district: "Clifton",
  type: "villa",
  kind: "Villa",
  model: "villa",
  price: 96000000,
  beds: 4, baths: 5, size: 6000, sizeLabel: "6,000 sq ft",
  badge: "Courtyard", badgeTone: "",
  palette: "golden",
  floors: 2,
  desc: "…",
  features: ["…", "…", "…", "…"]
}
```

### 10.2 Add a new 3D model type

Only do this if the user asks for a genuinely new building form; otherwise reuse an existing model.

1. Add a builder in §13 (`buildX`) returning a `THREE.Group` positioned on the platform (`y = 0`).
2. Reuse `box`, `cyl`, `palm`, `shrub`, `lounger`, `addWindows` and shared `M` materials.
3. Dispatch it in `buildModel(p)`.
4. Add a label in `modelLabels`.
5. Add `viewDistances` and `viewTargets` entries.
6. Add a tab button in `#modelTabs` with `data-model="x"`.
7. Add an artwork branch in `artworkSVG` if the default villa/plot illustration is unsuitable.
8. Add a `type` chip in `index.html` only if you are also introducing a new property `type`.
9. Test switching in and out repeatedly; check for console errors and GPU memory growth.

### 10.3 Add a neighbourhood

1. Append to `areas` with `x`/`y` inside the `620 × 620` viewBox and a `district` that matches one or more properties.
2. Add the district as an `<option>` in `#areaFilter`.
3. Optionally append to `market` for a chart row.
4. Optionally add a footer `[data-jump-area]` button.
5. Check pin collisions and label offsets on both desktop and mobile map layouts.
6. Test pin click and keyboard activation, detail card, "Browse N homes" count.

### 10.4 Add a hero landmark

1. Build a group inside `initHero3D`, add it to `cityGroup`.
2. Use `addBox`/meshes with `castShadow`/`receiveShadow` as appropriate.
3. Add an exclusion rectangle to `zones` covering the landmark footprint.
4. Place it in world coordinates: promenade `z ≈ 60`, city into negative `z`, ground `y = 0`.
5. Keep it outside the camera's near clip and the `FogExp2` far haze; test both golden hour and daylight.
6. No shadow refresh needed at build time (initial map update covers it); if added later, request `shadowMap.needsUpdate`.

### 10.5 Change the sky/mood

Edit `SKY.dusk` and `SKY.day` inside `initHero3D`. `applySky()` handles interpolation. If you change `sunDir*`, keep vectors normalized and remember the shader uses them for the disc/glow. Update this document's values if they are referenced elsewhere.

### 10.6 Change contact details or brand copy

Search `index.html` for the relevant string (`SAHIL`, `Sahil`, `hello@sahil.estate`, `+92`, `Dolmen City`) and update all instances, including the mobile menu, contact cards, footer and form options. Update the README if the public story changes.

### 10.7 Add a section

1. Add semantic markup in `index.html` with a unique `id` and a `data-reveal` where appropriate.
2. Add a nav link with `data-nav` if it belongs in primary navigation; scroll spy picks it up automatically.
3. Add component styles in the matching `styles.css` section and responsive overrides in the existing queries.
4. If it needs JS, add an `initX()` function and call it from `initUI()`. Guard missing nodes.
5. Test anchor offset (`section { scroll-margin-top: 90px; }`) and mobile menu close-on-click.

---

## 11. Accessibility rules

- Keep the skip link and semantic landmarks.
- Interactive elements must be `<button>`/`<a>` where appropriate, not clickable `<div>`s. Map pins are the exception: SVG `<g role="button" tabindex="0">` with key handlers.
- Maintain `aria-pressed` on toggles/chips/tabs, `aria-expanded`/`aria-hidden` on the menu, and `aria-label` on icon-only controls.
- Do not communicate errors, selection or status by colour alone. Keep text messages and `aria-live` where present (`#toast`, `#hoodList`).
- Keep `:focus-visible` treatment for every new focusable element.
- Gate JS motion with `reducedMotion`; do not rely only on the CSS override.
- Dynamic HTML must escape text (`escapeHTML`) to avoid breaking markup and to prevent injection.
- Test keyboard-only: skip link → nav → hero → filters → cards → studio controls → map pins → form → footer.

---

## 12. Performance rules

- DPR cap is 2; keep it.
- Hero pauses off-screen/hidden; studio pauses off-screen. Preserve these observers.
- Do not allocate objects inside `animate()` loops (reuse vectors/colors like the existing code).
- Prefer `InstancedMesh` for repeated geometry (palms, city blocks, rings).
- Keep shadows static unless animation requires otherwise.
- Avoid new network requests; generate textures on canvas.
- Keep the studio lazy; do not call `initStudio3D()` from `initUI()`.
- Test on a throttled CPU if making the scene heavier; the hero is intentionally low-poly.

---

## 13. Testing

### 13.1 Fast static checks

```bash
node --check app.js
```

Check for accidental module syntax:

```bash
grep -nE "type=\"module\"|^import |^export |fetch\(|XMLHttpRequest" index.html app.js
```

(Existing code has none; adding any breaks the `file://` guarantee.)

### 13.2 Manual smoke test

Start a server and verify:

1. Preloader completes; no infinite loading.
2. Hero renders; toggle golden hour ↔ daylight; pointer parallax works.
3. All 9 cards render; type/area/sort filters and "Clear filters" work.
4. Each card's 3D button opens that property in the studio; studio scrolls into view.
5. All four model tabs load; drag, wheel, auto-rotate, reset and "Next home" work.
6. Map pins (mouse + keyboard) update the detail card; "Browse N homes" filters and scrolls.
7. Market bars animate once in view.
8. Form rejects invalid name/phone/email/consent; valid submit shows the personalised success panel; "Send another enquiry" resets.
9. Mobile menu opens/closes via toggle, link, `Escape`; layout has no horizontal overflow.
10. Keyboard-only pass and reduced-motion pass.

### 13.3 Playwright smoke script

Use this as a starting point (run from `/tmp`, with Playwright resolvable). It assumes a server on port `8000`.

```js
const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROME ||
      process.env.HOME + "/.cache/ms-playwright/chromium-1148/chrome-linux/chrome",
    args: ["--no-sandbox", "--enable-unsafe-swiftshader"]
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", e => errors.push(e.message));

  await page.goto("http://localhost:8000/", { waitUntil: "load" });
  await page.waitForSelector("body.is-ready");
  await page.waitForSelector(".property-card");

  const count = await page.locator(".property-card").count();
  if (count !== 9) throw new Error("expected 9 cards, got " + count);

  await page.locator('.chip[data-type="apartment"]').click();
  if (await page.locator(".property-card").count() !== 4) throw new Error("apartment filter failed");
  await page.locator('.chip[data-type="all"]').click();

  // dispatchEvent avoids Playwright scrolling the pin beneath the fixed header
  await page.locator('.map-pin[data-area="clifton"]').dispatchEvent("click");
  if ((await page.locator("#hoodName").textContent()).trim() !== "Clifton") throw new Error("map select failed");

  await page.locator("#studio").scrollIntoViewIfNeeded();
  await page.waitForFunction(() => !!window.__sahilStudio, null, { timeout: 10000 });
  await page.locator('#modelTabs button[data-model="tower"]').click();
  if ((await page.locator("#studioTitle").textContent()).trim() !== "Creek Vista Residence") throw new Error("studio switch failed");

  await page.locator("#formName").fill("Test User");
  await page.locator("#formPhone").fill("+92 300 1234567");
  await page.locator("#formEmail").fill("test@example.com");
  await page.locator("label.check").click(); // custom checkbox: click the visible label
  if (!(await page.locator("#formConsent").isChecked())) throw new Error("consent toggle failed");
  await page.locator("#formSubmit").click();
  await page.waitForSelector("#formSuccess:not([hidden])");
  if ((await page.locator("#successName").textContent()).trim() !== "Test") throw new Error("form success failed");

  await page.setViewportSize({ width: 390, height: 844 });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  if (overflow) throw new Error("horizontal overflow at 390px");

  if (errors.length) throw new Error("console/page errors:\n" + errors.join("\n"));
  console.log("smoke test passed");
  await browser.close();
})().catch(err => { console.error(err); process.exit(1); });
```

Run with:

```bash
NODE_PATH=/home/pc/.npm/_npx/f0a362733743bae2/node_modules node /tmp/smoke.js
```

### 13.4 Responsive / a11y checks

- Viewports: **390**, **834**, **1440** px. Assert `document.documentElement.scrollWidth <= innerWidth + 1`.
- Keyboard: Tab through the page, activate a map pin with `Enter`, open/close the menu with `Escape`, submit the form with errors.
- Reduced motion: emulate `prefers-reduced-motion: reduce` and verify the hero is static, cards do not tilt, the studio does not auto-rotate, reveals are visible.
- No WebGL: launch with WebGL disabled or stub `window.THREE`, verify the hero fallback and `#stageFallback`.

### 13.5 Headless rendering caveat

Headless Chromium with SwiftShader can composite a tiled ghost of page DOM text over WebGL canvases in screenshots. This is an environment artifact, not necessarily a page bug. Verify the canvas itself with `canvas.toDataURL()` or test in a GPU-backed browser before chasing it.

---

## 14. Known rough edges

| Area | Note |
| --- | --- |
| Featured hero card | Hard-coded to `khayaban-e-saadi-villa`; hero stats are static `data-count` values. |
| Area select | Options are authored in HTML, not generated from `areas`. Keep in sync. |
| Dead code | `setArea()` is unused; `typeLabels` and `floors` are unused. |
| Studio tab semantics | Tabs select the first **property** using that model, so tab labels are model names, not standalone models. |
| Disposal | Per-build materials/textures (plot sign) are not disposed when switching models. |
| Mobile menu | Does not lock background scroll; only the icon/aria state changes. |
| Reduced motion | Captured once at page load, not live-updated. |
| Hero fallback | Sky toggle only changes its label in `.no-3d` mode. |
| Shader uniforms | New `windowMaterial()` instances created after `applySky` start at `uNight = 1` until the next sky mix. |
| Shadow updates | Frozen maps mean late-added/moved shadow casters need an explicit `needsUpdate`. |
| Form | Simulated only; no backend, no persistence, no spam protection. |
| Deep links | No URL/hash state for filters, selection or sky mode. |
| Fonts | Google Fonts is the only network dependency; offline falls back to system fonts. |
| Images | All artwork is procedural; never add stock images to "fill" a section. |
| Escaping | `features`, `tags` and `badge` are injected into HTML without `escapeHTML`. Keep them authored/plain text. |
| Screenshots | See the headless caveat above. |

---

## 15. Definition of done

Before reporting a change as complete:

- [ ] `node --check app.js` passes.
- [ ] No console or page errors on load.
- [ ] The page still works when opened via `file://` (no modules/fetch added).
- [ ] Existing counts/behaviour intact, or intentionally updated everywhere (HTML copy, README).
- [ ] Interactive changes tested with mouse **and** keyboard.
- [ ] `aria-*` states match visual state.
- [ ] 390 / 834 / 1440 px have no horizontal overflow.
- [ ] Reduced-motion path checked for new animation.
- [ ] WebGL fallbacks still render if the scene changed.
- [ ] No new external assets or dependencies.
- [ ] `README.md` / `AGENTS.md` updated if public behaviour or internals changed.
- [ ] No unrelated refactors or restyling bundled into the change.

---

## 16. Reference

- [`README.md`](./README.md) — features, data tables, user-facing setup and customization.
- `vendor/three.min.js` — Three.js **r149** (UMD, MIT).
- Key external APIs used: WebGL, Canvas 2D, SVG, IntersectionObserver, ResizeObserver, Pointer Events, `prefers-reduced-motion`.
- All prices are PKR and formatted in crore/lakh; areas are sq ft unless a `sizeLabel` says otherwise (the plot is 240 sq yd).
- Coordinates in the hero are Three.js world units; the map is a `620 × 620` SVG viewBox.

When in doubt, prefer a small, targeted edit that preserves the existing architecture over a rewrite.
