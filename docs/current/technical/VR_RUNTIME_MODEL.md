# Experience VR Runtime Model

## Runtime boundary and lifecycle

Experience VR is dynamically imported after WebXR capability succeeds and the visitor selects VR. `src/experienceVr.js` owns an independent renderer, scene, base camera, `playerRig`, controller records, runtime modules and animation loop; it neither imports nor starts Experience 3D. WebXR owns the tracked-camera pose. Application motion transforms `playerRig` only.

Preparation and immersive entry are separate user-flow stages. Models and reusable objects are prepared first; a second direct **Enter VR** gesture requests `immersive-vr`. The requested reference space is `local-floor`, with a tested fallback to `local`.

The prepared runtime is reused across sessions. A common reset sequence runs before each request, on session end and after a failed request. It restores the rig, locomotion, orbit, lights, transition, activation, portal/canvas, reliquary, both buttons, crystals and both glyph/crystal controller-hit fields without re-creating models, listeners, animation mixers or the release proxy.

## Scene and entry invariants

The configured spawn is `(0, 0, 8.6)`. Five glyphs have authored base radius `3.8` and runtime multiplier `2`, producing effective radius `7.6`. They continue orbiting during and after activation. `entryReady` uses threshold `0.24` and hysteresis `0.04`; trigger activation is resolved against current moving meshes/fallback colliders, never stored orbital positions.

`createVrEntryTransition` computes the destination from ring center toward configured spawn using `targetRadiusFactor = 0.76`: `7.6 × 0.76 = 5.776`, approximately `5.8`. At start it obtains the XR camera's physical X/Z offset relative to the rig, then moves the rig so the head—not merely the rig origin—arrives at the target. Rig Y and orientation are preserved; the tracked camera is not written.

## Portal and canvas contract

`createVrPortalDisplay` owns the preloaded `/glb/portal.glb`. It is placed and grounded once from the monkey bounds, configured spawn and portal settings. It stays in a fixed world-space composition, does not read XR head pose and is not moved or hidden by arrival.

The valid asset contract is `PORTAL_CANVAS_SURFACE`. Blender owns its geometry, UVs, aspect, hierarchy and local transform. `createVrSpatialPlaque` keeps that mesh in its authored parent and replaces only its material with one backed by `CanvasTexture`; canvas pixels are fitted within configured maxima while preserving surface aspect. A warned generated plane using `portalCanvas.width`, `height` and `offset` exists only when the mesh/geometry/UV contract fails. `createVrSpatialPlaque` is therefore the canvas renderer despite its legacy generic name; no arrival stone object or above-monkey canvas belongs to the current composition.

The portal also exposes an invisible, bounds-derived `VrPortalCrystalSocket`. It is only a compatibility insertion target when a valid reliquary zone is unavailable.

## Page data and asset ownership

`experienceVrPagesByGlyphId` maps five stable portfolio glyph IDs to three immutable page records each. Every record has stable `page.id`, matching `glyphId`, order, `crystalAssetId`, logical GLB path and a content selector. `resolveExperienceVrPage()` reads localized fields from the resolved shared `portfolioNodes` entry rather than copying portfolio content.

The deferred-warm manifest contains `/glb/portal.glb`, `/glb/portal_crystal_reliquary.glb`, both companion-button GLBs and all 15 crystal GLBs. `experienceVr.js` filters its VR preload set from the manifest. `AssetManager` is the sole source: spawn clones cached scenes and performs no network fetch.

## Deterministic materialization

Arrival completion calls `spawn()` with only the activated glyph's pages. An FNV-style hash of `page.id` provides stable scale in `0.22–0.28`, X/Z offsets, yaw and small X/Z tilt. The anchor-to-spawn horizontal direction places the group about `1.55 m` before the monkey. Collision-free spacing attempts are deterministic. Bounds center each authored model on X/Z and translate its lowest point to floor Y=0.

Each wrapper begins in `materializing`: stagger `0.12 s`, duration `0.55 s`, scale `0.18 → 1` by smoothstep, rise `0.12 m`, and a small yaw settling to zero. Only `available` wrappers enter the target list, so incomplete materialization cannot be raycast or grabbed.

## Controller targeting and pull

Each controller record owns `currentHit` for glyphs and separate `currentCrystalHit`/`currentCrystalHitDistance` for crystals. The crystal raycaster uses controller world position and local `-Z`, intersects available wrappers recursively, then resolves descendants through `objectToCrystal`. Target highlight changes wrapper scale to `1.04` without mutating model scale.

On `squeezestart`, `grab()` accepts only that controller's available hit, only within `rayGrabMaxDistance = 1.8`, and prevents one hand or instance from being assigned twice. `holdSocket.attach()` preserves world transform. Position and quaternion then smoothstep to `holdOffset` and identity over `pullDuration = 0.25 s`. Early `squeezeend` while `pulling` uses `scene.attach()`, retaining the current world transform and returning to `available`; completion yields `held`.

This is raycast plus hierarchy/parenting, not proximity selection. There is no rigid body, gravity, collision, velocity or throw behavior.

## Reliquary hierarchy and authored/runtime anchors

`createVrCrystalReliquary` builds:

```text
VrCrystalReliquary                         # shared placement root, Y=0
├─ VrCrystalReliquaryModelRoot             # heightOffset = 0.5
│  └─ VrCrystalReliquaryAuthoredRoot        # bounds centering/grounding
│     ├─ authored GLB
│     │  └─ RELIQUARY_CRYSTAL_INSERT_ZONE (hidden)
│     │     └─ RELIQUARY_CRYSTAL_ANCHOR may occur here
│     └─ VrReliquaryCrystalDisplayAnchor   # visible runtime anchor
└─ VrCrystalReliquaryCompanionsRoot        # does not inherit heightOffset
   ├─ ActivateButtonPlacementRoot → ActivateButtonScaleRoot → GLB
   └─ ReleaseButtonPlacementRoot  → ReleaseButtonScaleRoot  → GLB
```

Visible bounds exclude the technical insertion subtree. The model root lifts model, insertion zone, anchors and inserted crystal by `0.5 m`. `RELIQUARY_CRYSTAL_INSERT_ZONE` remains hidden and non-raycastable but its authored geometry/transform yields the world insertion sphere.

`RELIQUARY_CRYSTAL_ANCHOR` is retained as `authoredCrystalAnchor`, an authored transform marker. Its world matrix is copied into `VrReliquaryCrystalDisplayAnchor` under the visible authored root. `runtimeCrystalAnchor` and compatibility alias `crystalAnchor` refer to that visible object. This split is required because the authored marker may inherit `visible = false` from the insertion mesh. Before accepting insertion, the collection forces object visibility and checks effective visibility across all ancestors. A visible `VrReliquaryCrystalFallbackAnchor` is created when the runtime anchor is absent or its hierarchy is effectively hidden.

Portal world quaternion supplies a horizontal local-front direction, corrected to face configured spawn. The reliquary placement is exactly `1.5 m` along that axis from portal, with no lateral component. Companion placement is computed independently: both are `1 m` farther front, activate `0.5 m` left and release `0.5 m` right. Dedicated scale roots use `0.3`; companions neither scale the reliquary nor inherit its `0.5 m` lift.

## Insertion, activation and release

On `squeezeend` from `held`, model bounds determine crystal center. If it lies inside the visible reliquary's authored insertion sphere (or portal compatibility sphere), and no instance is already inserted, the wrapper is attached to the visible anchor and centered there. State becomes `inserted`; visibility remains true. A failed zone test or occupied socket returns the instance to scene as `available`.

The activate GLB exposes a render-transparent but raycast-active trigger. Per-controller hit maps are independent. Hover is enabled only when the inserted state is exactly `inserted`. Emissive intensity is `0 / 1 / 5` for idle / hover / latched. A successful `selectstart` calls `activateInserted()`, changes state to `active`, updates the existing canvas, and plays `Relic_Reliquary_ActivateButton_Press` with `LoopOnce` and `clampWhenFinished`. The crystal remains attached and visible.

The release implementation resolves an authored trigger defensively, derives bounds, and creates exactly one transparent `VrReliquaryReleaseButtonHitArea` with `hitAreaScale = 2`. It is raycast-active even though it writes no color. Release is available in `inserted` or `active`; emissions are likewise `0 / 1 / 5`. Press enters a locked `releasing` state and, when the exact `Relic_Reliquary_ReleaseButton_Press` clip resolves, plays it once with clamping. After `releaseDelaySeconds = 1`, `releaseInserted()` removes only the current crystal, frees the socket and returns both buttons to idle.

The current release GLB metadata declares that contract name, but its glTF animation is actually exported as `Animation`. Unlike activate, the release module has no sole-declared-clip fallback, so its `action` is `null` on the production asset even though raycast, emission, delay and release remain functional. Automated button tests use a correctly named fixture and do not catch this asset/runtime mismatch. This is a confirmed documentation-audit finding, not a failure of release-state mechanics, and is intentionally not repaired in this documentation-only task.

## Complete crystal state machine

```text
materializing → available → pulling → held → inserted → active → released
```

- `materializing`: visible animation; excluded from raycast and squeeze.
- `available`: visible, raycastable and grabbable.
- `pulling`: visible under one hold socket; not targetable; early release restores `available` at the current world transform.
- `held`: visible under one hold socket; not targetable; can be released to insertion or world.
- `inserted`: visible on the runtime/fallback anchor; not targetable; socket occupied; page not newly activated.
- `active`: visible on the anchor; not targetable; socket occupied; its page is displayed.
- `released`: hidden and detached; socket free. Only this transition removes a crystal.

## Runtime read state

The collection owns `readPageIds`, `hasReadPage(pageId)` and copy-returning `getReadPageIds()`. Releasing an `active` instance records its page; releasing merely `inserted` does not. `reset()` deliberately does not clear the Set, so reads survive pre-entry reset, failed start, session end and re-entry within the same prepared page runtime. `dispose()` calls reset but also does not clear the Set; the disposed collection is not reusable. Navigation/reload creates a new instance and loses the data. There is no persistence, read UI or crystal marking.

## Locomotion

`createVrLocomotion` reads WebXR gamepad axes with deadzone `0.18`. Right-stick Y moves forward/back and X strafes using the tracked head's world forward projected onto XZ. Left-stick X applies continuous rig yaw. Speed settings are `1.8` movement and `1.35` turn. The module restores the captured rig Y after movement and never writes camera transforms. It intentionally has no collision, gravity, teleport, jump or snap turn.

## Frame and reset ordering

Each frame runs orbit/readiness; glyph world-matrix refresh and glyph raycast; crystal update/targeting; activate update; release update; readiness assignment and lights; entry transition; locomotion; canvas animation; render. This retains orbit movement after entry and keeps crystal/button hit states distinct.

Reset order is transition, collection, activate, release, reliquary, portal/canvas waiting content, locomotion, rig spawn/orientation, activated glyph, orbit, lights and glyph interaction. Collection reset clears `currentCrystalHit`; glyph reset clears `currentHit`. `pagehide` additionally disposes both button listeners/mixers/materials, collection squeeze listeners, release runtime hit area and reliquary root.

## Validation boundary and exclusions

Automated VR tests validate capability, normalization, orbit, lights, moving glyph hits, head-offset entry, portal/canvas contracts, locomotion, all crystal behaviors, reliquary hierarchy/visibility, manifest wiring and both buttons. They do not substitute for Meta Quest 3S QA.

Out of scope: persistent read storage/UI/marking, physics, gravity, collision, throwing, velocity, teleport, jump, snap turn, VR audio, atmosphere, galaxies and bridge construction. The release button and locomotion are implemented current behavior.
