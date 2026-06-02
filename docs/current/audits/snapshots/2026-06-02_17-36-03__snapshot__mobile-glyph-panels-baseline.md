# Snapshot — Mobile glyph panels baseline

Timestamp: 2026-06-02 17:36:03 UTC
Status: documentation checkpoint for the closed mobile glyph panel baseline.

## 1. Stage goal

This checkpoint closes the mobile baseline stage for the five glyph overlay panels/cards.

Goals covered by this stage:
- organize the mobile panels/cards for all five glyphs;
- keep text readable on mobile viewports;
- stabilize panel theming through `data-panel-theme`;
- separate the mobile panel baseline from desktop frame/background behavior;
- preserve the existing Three.js, raycaster, hover, and click interaction behavior.

This is a documentation snapshot only. It records the current baseline and does not introduce runtime, CSS, JS, portfolio-content, asset, Three.js, raycaster, hover/click, loader, or progression changes.

## 2. Runtime files covered by the completed stage

Runtime state recorded by this snapshot:

- `src/styles/main.css`
  - owns the mobile overlay panel readability baseline through CSS variables and mobile media-query rules;
  - sets one opaque mobile panel background on the root panel/wrapper via `--panel-bg`;
  - keeps mobile panel text, headings, muted text, links, close button, SVG frame, and ornament colors tied to panel variables;
  - disables mobile glass/backdrop behavior and internal transparent overlays below text;
  - disables `::before` / `::after` pseudo-elements as mobile panel backgrounds.
- `src/ui/overlay.js`
  - keeps the overlay as an HTML/CSS UI layer above the Three.js canvas;
  - assigns `data-gate-id` from content node IDs;
  - assigns stable `data-panel-theme` values used by mobile CSS;
  - suppresses desktop panel background images on mobile through `applyPanelBackground(...)` when the `(max-width: 768px)` media query matches;
  - preserves the existing close/open/raycast-driven interaction contract.

## 3. Stable panel mapping

The mobile overlay uses `data-panel-theme` as the stable CSS theming contract for the five glyph panels:

| Content/runtime gate | Stable mobile `data-panel-theme` |
| --- | --- |
| `ai-guide` | `ai-guide` |
| `creative-ai` | `creative-ai` |
| `ethics-life-protection` | `ethics` |
| `spotify-digger` | `spotify-digger` |
| `haiku-cosmos` | `haiku-cosmos` |

The real content `gateId` for Ethics remains `ethics-life-protection`, but the UI maps it to `data-panel-theme="ethics"`. This prevents CSS naming drift and conflicts between legacy/desktop class names such as `theme-ethics-life-protection` and mobile selectors such as `.overlay__panel--ethics`.

## 4. Mobile panel layering contract

Do not treat this as visual preference; this is the baseline contract for future mobile panel work:

1. The root panel / correct wrapper receives exactly one complete, opaque background.
2. The mobile panel background is not semi-transparent.
3. Mobile panels do not use `backdrop-filter`, `-webkit-backdrop-filter`, or glassmorphism.
4. Mobile panels do not add separate internal overlay layers under text.
5. Mobile panels do not use `::before` / `::after` pseudo-elements as panel backgrounds.
6. The SVG frame sits above the opaque panel background.
7. The ornament may sit above the SVG frame.
8. Text and controls sit at the highest readable layer.
9. Text must not be covered by the frame, ornament, background, or any decorative layer.
10. Mobile panel contrast must remain independent of the Three.js scene behind the overlay.

## 5. Theme/color baseline for the five panels

The current CSS variables in `src/styles/main.css` define the mobile palette baseline. Do not invent replacement colors without an explicit redesign task.

### AI Guide / Drewno

Direction: dark green, organic background, light text, and a close button whose normal state uses readable dark-green text.

| Variable | Current value |
| --- | --- |
| `--panel-bg` | `linear-gradient(160deg, #172218 0%, #17241a 45%, #35462d 78%, #4f5833 100%)` |
| `--panel-text` | `#edf6df` |
| `--panel-heading` | `#f4e8a8` |
| `--panel-muted` | `#c8d4b3` |
| `--panel-link` | `#e0d482` |
| `--panel-frame` | `#959661` |
| close normal text | `#172218` |

### Creative AI / Ogień

Direction: dark ember base with orange/copper/amber accents and light text.

| Variable | Current value |
| --- | --- |
| `--panel-bg` | `linear-gradient(160deg, #13130d 0%, #1a130b 45%, #56280c 78%, #9c5517 100%)` |
| `--panel-text` | `#fff0d2` |
| `--panel-heading` | `#ffd37a` |
| `--panel-muted` | `#e7b56f` |
| `--panel-link` | `#ffcf70` |
| `--panel-frame` | `#e3941e` |

### Ethics / Ziemia

Direction: light sandy/mineral opaque background, dark text, and a brown-gold frame.

| Variable | Current value |
| --- | --- |
| `--panel-bg` | `linear-gradient(160deg, #f4ead4 0%, #e7d2ad 42%, #d2b784 72%, #b4935d 100%)` |
| `--panel-text` | `#24180b` |
| `--panel-heading` | `#3a240c` |
| `--panel-muted` | `#5b4220` |
| `--panel-link` | `#6f4a18` |
| `--panel-frame` | `#8f754b` |
| fallback background color | `#e7d2ad` |

### Spotify Digger / Metal

Direction: metallic/technical palette with readable text contrast.

| Variable | Current value |
| --- | --- |
| `--panel-bg` | `linear-gradient(160deg, #0f151a 0%, #16242e 42%, #2a3944 72%, #4f5d67 100%)` |
| `--panel-text` | `#eaf7ff` |
| `--panel-heading` | `#f4fbff` |
| `--panel-muted` | `#b9d8e8` |
| `--panel-link` | `#9fdcff` |
| `--panel-frame` | `#6d8a9a` |

### Haiku Cosmos / Woda

Direction: light blue/cosmic panel with dark text in the current contrast-safe CSS baseline.

| Variable | Current value |
| --- | --- |
| `--panel-bg` | `linear-gradient(160deg, #f3f7fc 0%, #d9ecfb 38%, #aad2f4 72%, #689ddb 100%)` |
| `--panel-text` | `#0e1d33` |
| `--panel-heading` | `#102f63` |
| `--panel-muted` | `#244f7e` |
| `--panel-link` | `#1c57a3` |
| `--panel-frame` | `#4d71c4` |

## 6. Fixed problems recorded historically

This baseline records the resolution of the following mobile-panel issues:

- earlier mobile backgrounds and semi-transparent treatments were inconsistent across glyph panels;
- Ethics previously risked transparency and/or inherited desktop-style background behavior through pseudo-elements or background-image logic;
- Spotify Digger previously risked insufficient text contrast;
- AI Guide close button previously had text that was too light in the normal state;
- these fixes were scoped to mobile panel readability and were not intended to change desktop behavior or interaction logic.

## 7. Do not regress

Future mobile panel work must not:

- restore glassmorphism on mobile panels;
- add separate semi-transparent layers under text;
- set a mobile panel background through a desktop pseudo-element;
- remove the mobile background without checking computed styles;
- make text contrast depend on the 3D scene behind the overlay;
- change `data-panel-theme` without updating documentation;
- use light text on a light background;
- use dark text on a dark background;
- touch desktop panel behavior during mobile fixes without an explicit reason.

## 8. QA checklist

Manual QA checklist for this baseline:

- [ ] AI Guide mobile: text is readable, and close button normal state has readable dark-green text.
- [ ] Creative AI mobile: text is readable.
- [ ] Ethics mobile: light sandy opaque background is present and the scene does not bleed through.
- [ ] Spotify Digger mobile: text is readable and contrast-safe.
- [ ] Haiku Cosmos mobile: text is readable.
- [ ] SVG frames are visible.
- [ ] Ornaments do not cover text.
- [ ] No additional overlays exist under text.
- [ ] No `backdrop-filter` / glassmorphism is active on mobile panels.
- [ ] No pseudo-elements act as the mobile panel background.
- [ ] Panel close action works.
- [ ] Glyph hover/click works.
- [ ] Desktop remains free of regression.

## 9. Test result

Command run during this snapshot pass:

```text
npm run build
```

Result: passed on 2026-06-02. Vite built successfully in 3.38s after transforming 29 modules and producing `dist/index.html`, `dist/assets/index-DgtWZPQI.css`, and `dist/assets/index-BDvUUhbd.js`.

Notes:
- npm emitted `Unknown env config "http-proxy"`; this is an environment/npm configuration warning and did not fail the build.
- Vite emitted the existing chunk-size warning for a JavaScript chunk larger than 500 kB after minification; this did not fail the build.
