# Experience VR Handoff

Status: self-contained implementation state at **2026-08-01**. Read the [runtime model](../technical/VR_RUNTIME_MODEL.md) and [progress-floor model](../technical/VR_PROGRESS_FLOOR_MODEL.md) for the canonical technical contracts.

## Runtime and locomotion

Experience VR is an independent, dynamically imported WebXR runtime. It owns its renderer, scene, camera, `playerRig`, controllers, lifecycle, and animation loop. Sessions request `local-floor` with `local` fallback and start at `(0, 0, 5.8)` facing center. WebXR owns the tracked camera; entry alignment, left-stick continuous yaw, and right-stick tracked-head-relative horizontal movement transform only `playerRig` while preserving rig Y.

Session entry/end resets transient crystals, hands/socket ownership, hits, glyph feedback, buttons, reliquary, portal, and rig pose while reusing the prepared runtime.

Controller interaction has one `2.0 m` source of range for its visible pointer, glyph hits and crystal targeting/grab; trigger press does not extend it, while reliquary button limits are capped by it. The pointer is a transparent `0.010 m`-diameter low-poly tube with a short tapered end rather than a screen-width line. Actionable glyph and crystal ray targets use only effectively visible model meshes for a shared, subtle pulsating back-side silhouette shader. It expands in clip space by a configured pixel thickness and reads the current WebXR eye viewport in its render hook; hidden bases, technical helpers and fallback colliders are excluded. Target loss, state changes, reset and disposal clear it without postprocessing.

A glyph hold starts only from a real model hit. A miss pauses progress for a `0.15 s` grace period so a moving glyph can be reacquired; a longer miss, another glyph hit, trigger release or disconnect cancels immediately. Glyph hover lights retain their existing color and intensity but sit `1.0 m` horizontally inward from each glyph toward ring center.

## Cards, crystals, and progression

Five branches contain 18 cards in counts `3 / 3 / 3 / 4 / 5` and reuse 15 GLBs. A physical crystal represents only a branch and tier, with a visual variant selecting the shared model; it does not retain a page or card ID. A branch can stock its successive unrepresented tiers regardless of the current global tier.

On a completed glyph hold, the crystal captures the moving glyph's current world position and materializes `0.30 m` inward toward the central world object, at the resulting spatial height and independently of the viewer pose. Local minimum-spacing offsets prevent overlap, and the spawned crystal does not continue following the glyph.

Squeeze pulls an in-range targeted crystal to the grip socket while interpolating to the configurable hold correction, currently `holdRotationDegrees = { x: 30, y: 0, z: 0 }`; GLB-local and randomized world rotations remain unchanged.

The in-memory `VrProgressionController` owns committed pages. Tiers 1–3 require all five branches, tier 4 Metal and Water, and tier 5 Water. Only a crystal matching the current tier can be inserted. Activate resolves and previews the branch/tier page without progress or floor activation. Release after Activate commits exactly once, lights the matching floor panel, and may advance the tier. It also frees the socket immediately and starts a `0.55 s`, non-interactive `consuming` state: the crystal shrinks in place while 14 lightweight branch-colored points orbit, expand slightly, and fade; both are removed when the effect ends or transient state resets. Release without Activate returns the crystal to `available`. Transient reset preserves controller progress for the prepared runtime only.

The reliquary keeps its authored insertion-zone mesh hidden and mirrors its world sphere with a separate, translucent runtime halo while a held crystal is nearby. Green means Release can insert under the progression controller's current validation; red means it cannot. An invalid Release inside the zone moves the crystal through a temporary, non-targetable `rejecting` state and eases it deterministically beyond the capture sphere, then restores `available` without socket or progression changes. The halo and any rejection state are transient session state and are cleared by runtime reset and disposal.

## Complete five-sector visual floor

`createVrProgressFloor` composes five authored, non-placeholder sectors under the stationary `VrTiltableFloorRoot`:

- Creative AI / Fire — `/glb/floor_creative.glb` — 3 panels;
- Ethics / Earth — `/glb/floor_ethic.glb` — 3 panels;
- AI Guide / Wood — `/glb/floor_ai_guide.glb` — 3 panels;
- DIG Engine / Metal — `/glb/floor_dig_engine.glb` — 4 panels;
- Haiku Cosmos / Water — `/glb/floor_haiku_cosmos.glb` — 5 panels.

The five sectors share a center and are placed every 72°. Their **18 panels** map one-to-one to pages by `page.glyphId + page.order`. Activation produces a short emissive impulse followed by a stable glow; entries accumulate idempotently.

Five independent procedural global rings cover the full 360° for tiers 1–5, so tiers 4 and 5 remain complete circles despite their smaller branch requirements. The per-order median radial panel centroids are raw candidates and need not be tier-monotonic: runtime sorts them ascending and enforces `minimumRingGap >= ringThickness * 2` before assigning five concentric radii. After the final required page commit, the runtime checks `VrProgressionController.isTierComplete(page.order)` and idempotently completes that tier's ring. Its neutral cool-white material performs one short opacity impulse and retains a subtle glow. Ring state survives session exit/re-entry with the prepared floor; disposal explicitly releases ring geometries and materials.

The authored sectors and 18 named panels are critical. Procedural ring meshes are optional decoration: an isolated creation failure removes and disposes partial ring resources while preserving the usable sector/panel floor and VR readiness. Missing required models, bases, or panels can still fail floor construction.

The content registry `activatedPageIds` and floor registry `activatedEntries` both survive XR session exit/re-entry only while the already prepared page runtime exists. Reload or navigation loses both. The controller owns logical progress; the floor keeps its separate visual registry and is updated only after a successful commit.

## Not implemented / outside the current runtime

- progressively filled sector-background illumination;
- soft gradient progress boundary;
- central progression core;
- durable persistence;
- full-game reset;
- floor tilting;
- locomotion coupled to the floor's local plane;
- floor collisions and physics;
- antenna puzzle;
- final progression sequence.

The visual floor projects committed controller state and does not replace the progression controller. A Meta Quest 3S smoke test confirms that preload finishes, the scene reaches ready state, **Enter VR** enables, and an immersive session can be entered. Full readability, z-fighting, performance, transparent-overdraw, and end-to-end gameplay QA remain open.
