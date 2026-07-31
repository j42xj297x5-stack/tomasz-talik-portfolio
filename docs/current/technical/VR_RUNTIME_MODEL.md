# Experience VR Runtime Model

Status: canonical description of the implemented runtime. Future gameplay is documented separately in the [approved concept roadmap](../concept/EXPERIENCE_VR_GAMEPLAY_ROADMAP.md).

## Runtime boundary, session start and reset

`src/experienceVr.js` is the composition root of an independent, dynamically imported WebXR runtime. It owns its renderer, scene, base camera, `playerRig`, two controllers and `renderer.setAnimationLoop`; it does not start Experience 3D. Runtime assets and modules are prepared before the direct **Enter VR** gesture requests `immersive-vr`. The requested reference space is `local-floor`, with `local` fallback.

Each session starts at configured rig position `(0, 0, 5.8)`, facing the world center. After the XR session is installed, the runtime reads the tracked head's world X/Z and offsets `playerRig` so the physical head reaches the configured start. WebXR owns the tracked camera: application code does not write its position or orientation. There is no active entry-glyph transition and `createVrEntryTransition` is not imported by the runtime.

Both session entry and session end reset transient scene state: all live crystals are removed, hand/socket ownership and controller hits are cleared, glyph holds/lights/orbit are reset, buttons and reliquary are reset, the portal waiting message is restored, and the rig returns to its configured position and orientation. The prepared runtime objects and listeners are reused.

## Locomotion

The left joystick applies continuous yaw to `playerRig`. The right joystick translates `playerRig` horizontally using the current world-space XR viewer orientation. For an `ArrayCamera`, the first tracked eye supplies that orientation. Head pitch is removed, diagonal input is capped to unit length, and rig Y is preserved. Physical head rotation and smooth rig yaw therefore both affect movement without steering the tracked camera.

## Glyph interaction and card selection for spawn

Each controller independently raycasts the current moving glyph meshes (or a fallback collider). `selectstart` captures a currently hit, active glyph; `update(delta)` advances the hold for the configured duration (`0.5 s` by default). Target loss, `selectend`, disconnect or reset cancels it. One `selectstart` can complete at most once.

On completion, `experienceVr.js` sorts that glyph's pages by `order` and chooses the first page which is neither activated nor already represented by a non-released live crystal. It calls `spawnOne(page, viewerFrame)`. A branch without such a page remains visible and orbiting but is not targetable. The five branch counts are `3 / 3 / 3 / 4 / 5`, for **18 logical cards**.

## Crystal instances and visual assets

Every spawned instance is currently page-bound. It contains the complete `page` object plus `cardId` and `crystalId`; its deterministic model transform also derives from `page.id`. A page cannot have more than one non-released live instance and an activated page cannot respawn.

The 18 logical cards do not have 18 physical models. `visualVariant = ((order - 1) % 3) + 1` maps cards cyclically to three shared variants per branch. Five branches therefore preload and reuse exactly **15 GLB models**. Spawn clones the corresponding `AssetManager` result and performs no fetch.

Spawn is additive and floor-grounded in front of the current viewer direction. A deterministic nearest-free search enforces `minimumSpacing`. As many as all 18 page-bound instances may coexist across `materializing`, `available`, `pulling` and `held`. Both hands may hold separate instances. There is no crystal physics, gravity, collision, velocity or throwing.

## Grab, insertion, Activate and Release

Only an `available` crystal is ray-targetable. Squeeze pulls the pointed in-range crystal to that controller's `holdSocket`; an early release returns it to `available`. Releasing a held crystal inside a free reliquary insertion zone attaches it visibly and changes it to `inserted`. The single socket permits only one `inserted` or `active` instance. A release outside the zone, or into an occupied socket, returns the instance to `available`.

The Activate button accepts only `inserted`. `activateInserted()` changes that instance to `active`, adds `insertedInstance.page.id` to `activatedPageIds`, and passes **that same `insertedInstance.page`** to the portal callback. A repeated Activate on the active instance is rejected. The Release button accepts `inserted` or `active`, waits for its configured button sequence, then `releaseInserted()` marks the instance `released`, hides/removes it and frees the socket. Release does not undo activation.

### Confirmed ordering limitation

Because each physical instance is assigned a concrete page at spawn and Activate displays `insertedInstance.page`, several crystals collected earlier can reveal content in their physical insertion order rather than the branch's logical page order. The current runtime does **not** resolve the next branch page during Activate. This is a confirmed implementation limitation, not an implemented branch-bound contract.

## Progress, reset and persistence

`activatedPageIds` is the activation registry. Activation records a page immediately; `hasActivatedPage()` and copy-returning `getActivatedPageIds()` expose it. `hasReadPage()` and `getReadPageIds()` are compatibility aliases to the same registry, not a distinct read-progress system. `isLevelComplete()` checks for 18 activated IDs, but no victory sequence or next level exists.

The scene also contains a prototype progress floor at the world origin. It assembles a full circle from five unshifted sectors rotated at 72-degree intervals and currently uses two authored source models: Creative `floor_creative.glb` and Ethics `floor_ethic.glb`. Creative AI occupies its target upper-left slot, Ethics its target lower-left slot, and AI Guide has the target upper-right slot reserved. The DIG Engine, Haiku Cosmos and AI Guide sectors still use the Creative model as placeholders, so four sectors currently use Creative and one uses Ethics.

Activating a page with `order` 1, 2 or 3 temporarily pulses and then steadily illuminates the corresponding authored panel in all five sectors, including the Earth panels in Ethics and Fire panels in the other sectors. This global order-based mapping is deliberately temporary: target mapping by branch or `glyphId` is not implemented and there is no central progression system.

`createVrCrystalCollection.reset()` deliberately removes transient crystal instances while preserving `activatedPageIds` for the lifetime of the already prepared page runtime. Consequently activated pages cannot respawn after ending and re-entering an XR session on that page. Navigation or reload creates a fresh runtime. There is no `localStorage`, server save, versioned save data, persistent progress UI or full-game reset contract.

## Explicitly absent from the current runtime

The approved roadmap's branch-bound crystals, Activate-time sequential page resolver, central progression controller, final branch-mapped floor progression and global rings, gameplay tiers, shells, assembly orb, hand tools, small glyphs, floor tilting, runes, final radar, completion sequence and durable save system are not implemented. The current five-sector floor is only the bounded visual prototype described above.
