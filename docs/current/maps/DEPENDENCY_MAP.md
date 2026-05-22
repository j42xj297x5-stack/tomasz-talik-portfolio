# Dependency Map

## High-level flow
Concept docs -> Technical model -> Runtime implementation -> Decision updates -> Future polish/model integration

## Detailed dependency graph
- `concept/CONCEPT_AND_ROADMAP.md`
  - informs `technical/ARCHITECTURE.md`
  - informs `concept/INTERACTION_MODEL.md`
  - informs `concept/VISUAL_DIRECTION.md`
- `technical/ARCHITECTURE.md`
  - informs runtime module boundaries in `src/scene`, `src/ui`, `src/content`
- `technical/FRONTEND_RUNTIME_MODEL.md`
  - defines current layered runtime and vendored Three.js bridge
- `technical/THREE_SCENE_MODEL.md`
  - maps scene responsibilities to concrete modules
- `technical/CONTENT_MODEL.md`
  - defines gate metadata used by orbit nodes and overlays
- `technical/GLYPH_HOVER_EFFECTS_MODEL.md`
  - defines the canonical five-glyph hover-effects language (element mapping, motion symbolism, consistency rules, and implementation order) for visual polish stages

## Runtime status dependency
- Monkey model loading depends on the vendored GLTFLoader module path `vendor/three/examples/jsm/loaders/GLTFLoader.js` and asset path `/glb/monkey.glb`.
- Placeholder fallback remains a required runtime dependency when loader/asset resolution fails.
- MVP scene exists with placeholder center object and five interactive gates.
- Scene content depends on `src/content/portfolioNodes.js` (including per-node optional glyph metadata such as AI Guide `/glb/glyph_1.glb`, Spotify Digger `/glb/glyph_4.glb`, Creative AI `/glb/glyph_2.glb`, Ethics / Life Protection `/glb/glyph_3.glb`, and Haiku Cosmos `/glb/glyph_5.glb`).
- UI overlay/hover depends on node metadata and raycast picking.
- Next dependency step: visual refinement and replacement of placeholder center with a real GLB meditating monkey asset.

- Vendored Three.js baseline is `r184`; GLTFLoader must also be sourced from `r184` only.
- Required loader file path: `vendor/three/examples/jsm/loaders/GLTFLoader.js`.
- Runtime monkey asset URL: `/glb/monkey.glb` (local file: `public/glb/monkey.glb`, manually managed binary).
- Placeholder fallback is mandatory when loader or GLB is unavailable.
- npm `three` dependency remains intentionally unused in runtime integration.

- GLTFLoader r184 is vendored at `vendor/three/examples/jsm/loaders/GLTFLoader.js`.
- Required GLTFLoader utilities are vendored at `vendor/three/examples/jsm/utils/BufferGeometryUtils.js` and `vendor/three/examples/jsm/utils/SkeletonUtils.js`.
- Vite resolve alias maps bare `three` imports to local vendored module `vendor/three/three.module.js` via `vite.config.js`.

## Milestone dependency status — monkey + five glyph baseline
- Runtime scene baseline now depends on one central monkey GLB (`/glb/monkey.glb`) and five content-mapped glyph GLBs (`/glb/glyph_1.glb` … `/glb/glyph_5.glb`).
- Content metadata (`modelPath`) is the source of truth for glyph binding per portfolio node.
- Fallback dependencies remain mandatory: monkey placeholder fallback and per-node sphere collider fallback.
- Visual polish (scale/orientation/lighting tuning) remains a separate, downstream dependency phase.
