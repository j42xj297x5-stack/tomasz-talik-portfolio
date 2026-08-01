# Experience VR Runtime Model

Status: canonical description of the implemented runtime. Future gameplay is documented separately in the [approved concept roadmap](../concept/EXPERIENCE_VR_GAMEPLAY_ROADMAP.md).

## Runtime boundary, session start and reset

`src/experienceVr.js` is the composition root of an independent, dynamically imported WebXR runtime. It owns its renderer, scene, base camera, `playerRig`, two controllers and `renderer.setAnimationLoop`; it does not start Experience 3D. Runtime assets and modules are prepared before the direct **Enter VR** gesture requests `immersive-vr`. The requested reference space is `local-floor`, with `local` fallback.

Each session starts at configured rig position `(0, 0, 5.8)`, facing the world center. After the XR session is installed, the runtime reads the tracked head's world X/Z and offsets `playerRig` so the physical head reaches the configured start. WebXR owns the tracked camera: application code does not write its position or orientation. There is no active entry-glyph transition and `createVrEntryTransition` is not imported by the runtime.

Both session entry and session end reset transient scene state: all live crystals are removed, hand/socket ownership and controller hits are cleared, glyph holds/lights/orbit are reset, buttons and reliquary are reset, the portal waiting message is restored, and the rig returns to its configured position and orientation. The prepared runtime objects and listeners are reused.

## Locomotion

The left joystick applies continuous yaw to `playerRig`. The right joystick translates `playerRig` horizontally using the current world-space XR viewer orientation. For an `ArrayCamera`, the first tracked eye supplies that orientation. Head pitch is removed, diagonal input is capped to unit length, and rig Y is preserved. Physical head rotation and smooth rig yaw therefore both affect movement without steering the tracked camera.

## Glyph interaction and crystal spawn

Each controller independently raycasts the moving glyphs. A completed glyph hold spawns the first tier of that branch which is not already represented by a committed card or a live, non-released crystal. Acquisition is independent of the current global tier, so several future crystals may be stored. Branch capacities are `3 / 3 / 3 / 4 / 5`.

The crystal materialization point is captured from the activated glyph's current world position when the hold completes, then offset by `0.30 m` toward the central world object. It preserves the resulting world-space height and is independent of the viewer pose. Once created, the crystal remains at that captured location rather than following the orbiting glyph.

## Crystal instances and visual assets

A physical instance carries only `crystalId`, `glyphId/branchId`, `tier`, `visualVariant`, `crystalAssetId` and transient interaction state. It has no persistent `page`, `pageId` or `cardId`. `visualVariant = ((tier - 1) % 3) + 1` selects one of three shared GLBs per branch, for exactly 15 preloaded crystal models.

Spawn remains additive. A deterministic nearest-free search applies small local offsets around the glyph-derived materialization point to enforce spacing. Reset removes all live instances but does not reset committed progression.

## Insertion, preview, Release and progression

`VrProgressionController` is the single owner of committed card progress. The current tier begins at 1. Tiers 1–3 require the corresponding card from all five branches, tier 4 requires Metal and Water, and tier 5 requires Water. A crystal may enter `inserted` only when its tier equals the current global tier, its branch contains that tier, and the corresponding page has not been committed. Rejected insertion returns it to `available`.

While a held crystal is within the configurable proximity radius around the authored insertion sphere, a separate translucent runtime sphere shows whether releasing it would be accepted: green for valid and red for invalid. The authored technical mesh remains hidden and remains the source of the capture sphere. Releasing an invalid crystal inside that sphere starts a non-interactive `rejecting` state; a deterministic eased interpolation pushes it beyond the sphere before restoring `available`, without occupying the socket or changing progression. Feedback is cleared on departure, insertion, completed rejection, transient reset, session exit/re-entry, and disposal.

Activate accepts `inserted`, resolves the page by `branchId + tier`, verifies branch sequence, stores that page only as transient `previewPage`, changes the crystal to `active`, and calls the portal preview callback. It does not commit progress or illuminate the floor.

Release accepts `inserted` or `active`. Releasing an `inserted` crystal without Activate returns it safely to `available` without progress. Releasing `active` commits its preview exactly once through the progression controller, calls `progressFloor.activatePage(page)`, and advances the global tier when its requirements are complete. The socket is then released immediately while the crystal enters a non-interactive `consuming` state for the configured `0.55 s`: its root eases down to zero scale in place and a single lightweight `THREE.Points` effect (14 branch-colored points) rotates, expands slightly, and fades around it. Completion removes both the crystal and effect. Transient reset or disposal also removes and disposes an in-flight effect without reverting committed progress.

## Progress, reset and persistence

The progression controller exposes the current tier, insertion validation, branch/tier page resolution, commit, activated-page queries, and tier-completion queries. Its registry lives in the prepared page runtime, so committed cards survive XR exit/re-entry while transient crystals are reset. Reload or navigation creates a fresh controller. There is no `localStorage` or durable save.

The existing five-sector progress floor remains unchanged. Its 18 panels map by `glyphId + order`; it receives pages only after Release commits them. Global rings, sector backgrounds and other later visual progression are absent.

## Explicitly absent from the current runtime

Global rings, sector-background progression, shells, assembly orb, hand tools, small glyphs, floor tilting, runes, final radar, completion sequence, durable save and the full capabilities system are not implemented. The current five-sector floor and minimal card/tier controller are the bounded implementations described above.
