# Snapshot — Central Monkey + Five Glyph Orbit Nodes Runtime Baseline

Date: 2026-05-22
Timestamp: 2026-05-22 15:38:35 UTC

## 1. SNAPSHOT SUMMARY
This snapshot captures the first complete symbolic 3D portfolio scene baseline: one fixed central monkey model and five GLB glyph orbit nodes.

## 2. CURRENT RUNTIME STATUS
- Vite runtime works locally.
- Vanilla JS module architecture is active.
- Three.js r184 is vendored.
- npm `three` is intentionally not used.
- GLTFLoader r184 is vendored and working.
- Vite alias resolves bare `three` imports to vendored Three.js.
- Central monkey model loads from `/glb/monkey.glb`.
- Five glyphs load from `/glb/glyph_1.glb` through `/glb/glyph_5.glb`.
- Mouse-driven camera orbit works around the monkey pivot.
- Hover labels and overlay panels remain functional.
- Fallback placeholder/collider policy remains active.

## 3. ASSET MAP
Central:
- `public/glb/monkey.glb` -> `/glb/monkey.glb`

Glyphs:
- `public/glb/glyph_1.glb` -> `/glb/glyph_1.glb` -> AI Guide
- `public/glb/glyph_2.glb` -> `/glb/glyph_2.glb` -> Creative AI
- `public/glb/glyph_3.glb` -> `/glb/glyph_3.glb` -> Ethics / Life Protection / AI Dharma
- `public/glb/glyph_4.glb` -> `/glb/glyph_4.glb` -> Spotify Digger
- `public/glb/glyph_5.glb` -> `/glb/glyph_5.glb` -> Haiku Cosmos

## 4. TECHNICAL STRUCTURE
Key runtime modules and dependencies:
- `src/main.js`
- `src/vendor/three.js`
- `src/scene/monkeyModel.js`
- `src/scene/orbitNodes.js`
- `src/scene/cameraRig.js`
- `src/content/portfolioNodes.js`
- `src/ui/hoverLabel.js`
- `src/ui/overlay.js`
- `vite.config.js`
- `vendor/three/examples/jsm/loaders/GLTFLoader.js`
- `vendor/three/examples/jsm/utils/BufferGeometryUtils.js`
- `vendor/three/examples/jsm/utils/SkeletonUtils.js`

## 5. CAMERA MODEL
- Camera orbits around monkey/pivot based on mouse position.
- Monkey remains fixed as scene center.
- Horizontal max orbit is intended as 45 degrees.
- Vertical orbit is limited/configurable.
- No OrbitControls dependency is used.

## 6. FALLBACK / SAFETY MODEL
- Monkey placeholder remains fallback if monkey GLB fails.
- Glyph sphere/collider remains fallback and interaction safety if glyph GLB fails.
- Hover/click metadata remains content-driven.
- Runtime should not crash when an asset fails.

## 7. KNOWN LIMITATIONS
- Visual tuning is still early.
- Glyph scale/orientation may need unified polish.
- Lighting may need further balance.
- Mobile behavior remains basic/desktop-first.
- Final copy/branding/content are still draft.
- No audio/post-processing yet.
- Performance should be observed as asset complexity grows.

## 8. NEXT RECOMMENDED STEP
Primary recommendation: run a glyph composition polish pass to:
- unify glyph scale,
- tune glyph rotation/orientation,
- check readability at camera extremes,
- adjust orbit depth/radius,
- refine hover/click collider if needed.

Alternative next step: start drafting real panel content only after scene composition feels stable.
