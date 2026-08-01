# Experience VR Handoff

Status: self-contained implementation state at **2026-07-31**. Read the [runtime model](../technical/VR_RUNTIME_MODEL.md) and [progress-floor model](../technical/VR_PROGRESS_FLOOR_MODEL.md) for the canonical technical contracts.

## Runtime and locomotion

Experience VR is an independent, dynamically imported WebXR runtime. It owns its renderer, scene, camera, `playerRig`, controllers, lifecycle, and animation loop. Sessions request `local-floor` with `local` fallback and start at `(0, 0, 5.8)` facing center. WebXR owns the tracked camera; entry alignment, left-stick continuous yaw, and right-stick tracked-head-relative horizontal movement transform only `playerRig` while preserving rig Y.

Session entry/end resets transient crystals, hands/socket ownership, hits, glyph feedback, buttons, reliquary, portal, and rig pose while reusing the prepared runtime.

## Cards, crystals, and progression

Five branches contain 18 cards in counts `3 / 3 / 3 / 4 / 5` and reuse 15 GLBs. A physical crystal represents only a branch and tier, with a visual variant selecting the shared model; it does not retain a page or card ID. A branch can stock its successive unrepresented tiers regardless of the current global tier.

On a completed glyph hold, the crystal captures the moving glyph's current world position and materializes `0.30 m` inward toward the central world object, at the resulting spatial height and independently of the viewer pose. Local minimum-spacing offsets prevent overlap, and the spawned crystal does not continue following the glyph.

The in-memory `VrProgressionController` owns committed pages. Tiers 1–3 require all five branches, tier 4 Metal and Water, and tier 5 Water. Only a crystal matching the current tier can be inserted. Activate resolves and previews the branch/tier page without progress or floor activation. Release after Activate commits exactly once, lights the matching floor panel, and may advance the tier. Release without Activate returns the crystal to `available`. Transient reset preserves controller progress for the prepared runtime only.

The reliquary keeps its authored insertion-zone mesh hidden and mirrors its world sphere with a separate, translucent runtime halo while a held crystal is nearby. Green means Release can insert under the progression controller's current validation; red means it cannot. An invalid Release inside the zone moves the crystal through a temporary, non-targetable `rejecting` state and eases it deterministically beyond the capture sphere, then restores `available` without socket or progression changes. The halo and any rejection state are transient session state and are cleared by runtime reset and disposal.

## Complete five-sector visual floor

`createVrProgressFloor` composes five authored, non-placeholder sectors under the stationary `VrTiltableFloorRoot`:

- Creative AI / Fire — `/glb/floor_creative.glb` — 3 panels;
- Ethics / Earth — `/glb/floor_ethic.glb` — 3 panels;
- AI Guide / Wood — `/glb/floor_ai_guide.glb` — 3 panels;
- DIG Engine / Metal — `/glb/floor_dig_engine.glb` — 4 panels;
- Haiku Cosmos / Water — `/glb/floor_haiku_cosmos.glb` — 5 panels.

The five sectors share a center and are placed every 72°. Their **18 panels** map one-to-one to pages by `page.glyphId + page.order`. Activation produces a short emissive impulse followed by a stable glow; entries accumulate idempotently.

The content registry `activatedPageIds` and floor registry `activatedEntries` both survive XR session exit/re-entry only while the already prepared page runtime exists. Reload or navigation loses both. The controller owns logical progress; the floor keeps its separate visual registry and is updated only after a successful commit.

## Not implemented / outside the current runtime

- global thresholds and rings;
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

The visual floor foundation was implemented before the progression controller and does not replace it. Meta Quest readability, z-fighting, performance, and transparent-overdraw gates have not been completed.
