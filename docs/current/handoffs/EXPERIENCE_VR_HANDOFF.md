# Experience VR Handoff

Status: self-contained implementation state at **2026-07-31**. Read the [runtime model](../technical/VR_RUNTIME_MODEL.md) and [progress-floor model](../technical/VR_PROGRESS_FLOOR_MODEL.md) for the canonical technical contracts.

## Runtime and locomotion

Experience VR is an independent, dynamically imported WebXR runtime. It owns its renderer, scene, camera, `playerRig`, controllers, lifecycle, and animation loop. Sessions request `local-floor` with `local` fallback and start at `(0, 0, 5.8)` facing center. WebXR owns the tracked camera; entry alignment, left-stick continuous yaw, and right-stick tracked-head-relative horizontal movement transform only `playerRig` while preserving rig Y.

Session entry/end resets transient crystals, hands/socket ownership, hits, glyph feedback, buttons, reliquary, portal, and rig pose while reusing the prepared runtime.

## Cards, crystals, and known ordering limitation

Five branches contain **18 logical cards** in counts `3 / 3 / 3 / 4 / 5`. They reuse **15 crystal GLBs**, three visual variants per branch; later cards cycle through those variants. A glyph hold spawns the first eligible ordered page, and each physical crystal is currently page-bound with its concrete `page`, `cardId`, and `crystalId`.

Activate records `insertedInstance.page.id` in `activatedPageIds` and passes that same page to the portal and floor callbacks. Thus crystals collected earlier can reveal pages in physical insertion order rather than branch order. The floor lights the page actually activated, but does not solve this limitation.

## Complete five-sector visual floor

`createVrProgressFloor` composes five authored, non-placeholder sectors under the stationary `VrTiltableFloorRoot`:

- Creative AI / Fire — `/glb/floor_creative.glb` — 3 panels;
- Ethics / Earth — `/glb/floor_ethic.glb` — 3 panels;
- AI Guide / Wood — `/glb/floor_ai_guide.glb` — 3 panels;
- DIG Engine / Metal — `/glb/floor_dig_engine.glb` — 4 panels;
- Haiku Cosmos / Water — `/glb/floor_haiku_cosmos.glb` — 5 panels.

The five sectors share a center and are placed every 72°. Their **18 panels** map one-to-one to pages by `page.glyphId + page.order`. Activation produces a short emissive impulse followed by a stable glow; entries accumulate idempotently.

The content registry `activatedPageIds` and floor registry `activatedEntries` both survive XR session exit/re-entry only while the already prepared page runtime exists. Reload or navigation loses both. They are separate in-memory owners and have no common progression controller.

## Not implemented / outside the current runtime

- `VrProgressionController`;
- branch-bound crystal contract;
- Activate-time sequential page resolution;
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

## Nearest approved architectural step

The next task remains the crystal semantic correction:

```text
branch-bound crystal
→ choose the next unactivated page during Activate
```

Only after that correction should a `VrProgressionController` become the shared progression layer. Do not reimplement the existing five-sector visual foundation.
