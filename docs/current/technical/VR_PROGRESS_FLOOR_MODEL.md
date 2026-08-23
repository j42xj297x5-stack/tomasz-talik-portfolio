# Experience VR Progress Floor Model

Status: canonical technical description of the implemented progress-floor and platform-root subsystem synchronized after the M1.20F and hardware-QA ownership corrections. Gameplay direction beyond this bounded subsystem remains in the [Experience VR Gameplay Roadmap](../concept/EXPERIENCE_VR_GAMEPLAY_ROADMAP.md).

## Runtime ownership and lifecycle

`createVrProgressFloor` in `src/xr/floor/createVrProgressFloor.js` is the subsystem factory. `src/experienceVr.js` composes it under `ExperienceVrRoot` after `AssetManager` has preloaded the five manifest models, passes clones of those models to the factory, calls `update(delta)` from the shared animation loop, and calls `dispose()` during page teardown.

The factory creates one shared `THREE.Group` named `VrTiltableFloorRoot`. Its identity transform defines the absolute platform center `(0,0,0)` and the platform reference plane `Y=0`. It owns all five instantiated sectors, cloned sector materials and, when creation succeeds, five procedural tier rings with their materials and geometries. `dispose()` is idempotent: it marks the subsystem inactive, detaches the root, and disposes every owned material and procedural geometry; later activation, completion and update calls are inert.

`VrTiltableFloorRoot` now has two active roles: it is the visual progress floor root and the platform transform root driven by the QA Asterion gyro. Progress ownership and transform ownership remain separate. `createVrProgressFloor` only projects committed portfolio progress; the Asterion gyro writes the root quaternion and does not take over card, tier or furnace progression logic.

The floor model owns only sectors/rings and the `VrTiltableFloorRoot` contract. Runtime composition also parents actor, fixture and passenger roots below that platform transform, but their complete hierarchy and visibility rules belong to the [VR Runtime Model](VR_RUNTIME_MODEL.md), not this document. Locomotion depends on `VrFloorPassengerRoot → playerRig`: movement resolves along the platform-local tangent plane, preserves rig local Y and uses the explicit `worldBaseRadius = 7.6 m` as its radial boundary. The world-stable Large Glyph actor and shell field remain outside the platform root.
## Sector layout

All authored sectors share the same local center, receive no local translation, and rotate around Y by `rotationIndex * 2π / 5`:

| `rotationIndex` | Stable `glyphId` | Element / branch | Presentation |
| ---: | --- | --- | --- |
| 0 | `spotify-digger` | Metal | DIG Engine |
| 1 | `haiku-cosmos` | Water | Haiku Cosmos |
| 2 | `ai-guide` | Wood | AI Guide |
| 3 | `creative-ai` | Fire | Creative AI |
| 4 | `ethics-life-protection` | Earth | Ethics |

Each runtime instance is named `VrProgressFloorSector:${glyphId}`. Every sector has `placeholder: false`; no placeholder sector remains.

## Asset and object contracts

One authored GLB corresponds to one branch. Missing required bases or panels fail floor construction.

| Branch | Asset | Required base | Required panels | Count |
| --- | --- | --- | --- | ---: |
| Creative AI / Fire | `/glb/floor_creative.glb` | `VR_PROGRESS_SECTOR_FIRE_BASE` | `VR_PROGRESS_CARD_FIRE_01` through `VR_PROGRESS_CARD_FIRE_03` | 3 |
| Ethics / Earth | `/glb/floor_ethic.glb` | `VR_PROGRESS_SECTOR_EARTH_BASE` | `VR_PROGRESS_CARD_EARTH_01` through `VR_PROGRESS_CARD_EARTH_03` | 3 |
| AI Guide / Wood | `/glb/floor_ai_guide.glb` | `VR_PROGRESS_SECTOR_WOOD_BASE` | `VR_PROGRESS_CARD_WOOD_01` through `VR_PROGRESS_CARD_WOOD_03` | 3 |
| DIG Engine / Metal | `/glb/floor_dig_engine.glb` | `VR_PROGRESS_SECTOR_METAL_BASE` | `VR_PROGRESS_CARD_METAL_01` through `VR_PROGRESS_CARD_METAL_04` | 4 |
| Haiku Cosmos / Water | `/glb/floor_haiku_cosmos.glb` | `VR_PROGRESS_SECTOR_WATER_BASE` | `VR_PROGRESS_CARD_WATER_01` through `VR_PROGRESS_CARD_WATER_05` | 5 |

The layout therefore contains **18 panels**: Creative AI 3, Ethics 3, AI Guide 3, DIG Engine 4, and Haiku Cosmos 5.

## Materials and visibility

Every sector instance starts with `visible = false`; `createVrProgressFloor` is the **only** owner of this visibility state. Intro neither reads nor changes `sector.visible`. The first successful commit in a branch reveals that branch's sector, and the discovered-sector registry survives XR exit and re-entry within the same prepared page runtime. Geometries may remain shared through the deep object clone, while every sector instance receives cloned materials.

The implemented production contract separates two sibling roles. The neutral `VR_PROGRESS_SECTOR_*_BASE` is a required technical/reference mesh (the reference "pizza") and its absence fails construction, but it is set permanently invisible and never participates in the reveal or final presentation. The authored `path4` for Creative and `path1` for the other four assets are independently required: they are the actual visible openwork sector geometry/ornament whose materials are prepared and animated for presentation.

On the first committed crystal in a branch, the existing one-shot activation makes the sector object visible and fades only its authored ornament from zero back to the authored target opacity. `transparent = true` and `depthWrite = false` are exclusively a transient fade state. Once the reveal settles, each ornament material restores its own authored opacity, transparency mode, and depth-write mode; its authored side is preserved throughout. Later cards in that branch do not restart the reveal. The reference BASE remains hidden through later activations, tier completion, progression shortcuts, and XR session exit/re-entry.

At preparation time each panel's emissive intensity becomes zero. A missing emissive color or an emissive color equal to black receives the branch fallback: Creative `0xff4b2b`, Ethics `0xc8752a`, Water `0x35a9ff`, Metal `0x8cd1ff`, and Wood `0x29e86f`. A non-black authored emissive color is preserved.

## Activation mapping and state

The public `activatePage(page)` API resolves exactly one panel using the pair `page.glyphId + page.order`. A valid, not-yet-activated pair is added once; unsupported and repeated pairs return `false`. Activation is cumulative and idempotent. `getActivatedEntries()` returns defensive `{ glyphId, order }` copies rather than exposing the internal registry.

The first valid activation for a branch reveals its sector regardless of page order. Later page activations leave sector visibility and the in-progress or completed body reveal untouched. Every newly activated panel starts a short emissive impulse (`pulseIntensity = 2.8`, `pulseDuration = 0.22 s` by default), then converges to a stable glow (`stableIntensity = 1.35`). The update is a response-speed blend, not a cyclic slow pulse.

The floor object and its `activatedEntries` registry belong to the prepared page runtime. Session entry/end resets do not reconstruct or clear the floor, so highlights survive XR exit and re-entry in that same runtime. Reload, navigation, or page teardown creates a fresh registry. `dispose()` releases the cloned materials along with detaching the root.

## Global tier rings

The floor creates exactly five independent `THREE.RingGeometry` meshes as direct children of `VrTiltableFloorRoot`, one for each tier. Every ring covers 360 degrees, including tier 4 (Metal + Water) and tier 5 (Water only); branch requirement counts never determine angular coverage.

Ring radii are not layout constants. After all sectors have been placed, the factory measures each existing panel's bounding-box center in floor-root local space, groups radial XZ distances by `order`, and uses their median as that order's raw candidate radius. The raw candidates do **not** have to increase with semantic tier number. Runtime copies and sorts all five candidates ascending, assigns the normalized inward-to-outward values to tiers 1–5, and raises every later value as needed to preserve `minimumRingGap`. The effective gap is `max(configured minimumRingGap, ringThickness * 2)`. Non-monotonic or crowded authored centroids are consequently normalized rather than treated as a critical geometry error.

Deriving a positive finite candidate for every order still depends on the required panels and is part of validating their usable geometry. Once candidates exist, procedural mesh creation is an optional visual layer. If an exception occurs while that layer is being built, the factory removes any partial ring meshes, disposes their materials and geometries, clears the ring registry, warns, and returns the otherwise functional five-sector, 18-panel floor. Thus a safely isolatable decorative-ring failure does not block runtime readiness, while missing required models or named bases/panels still fails floor construction.

Successful rings use 80 radial segments, a thin neutral cool-white transparent `MeshBasicMaterial`, no light or bloom dependency, and `depthWrite = false`. Their small local Y offset keeps them separated from authored surfaces without moving sectors or cards.

Rings begin at zero opacity. `completeTier(tier)` accepts integers 1–5, returns `true` only for the first activation of an available ring, and starts a short strong opacity impulse. Without the optional ring layer it returns `false` and does not manufacture visual completion state. `update(delta)` independently blends panel emission toward its pulse/stable target and ring opacity toward its pulse/stable target. Unsupported and repeated calls return `false`; `getCompletedTiers()` returns a defensive array. Completed rings accumulate for the prepared runtime and are unaffected by transient XR session reset.

## Relationship to crystals and progression

Crystals are branch-and-tier bound and do not carry a page identity. `VrProgressionController` owns committed progress and resolves the concrete sequential page during Activate for preview. Release performs the commit; only after that succeeds does the runtime call `progressFloor.activatePage(page)`. It then asks the controller whether `page.order` is complete and calls the idempotent `progressFloor.completeTier(page.order)` when appropriate. The floor is a visual projection of controller state and does not change tier requirements or page resolution.

## Explicitly not implemented

- progressively filled sector-background illumination;
- soft gradient progress boundary;
- central progression core;
- durable persistence;
- full-game reset;
- floor collisions or physics;
- antenna puzzle;
- final progression sequence.

Implemented in the current QA/platform stage, but not owned by `createVrProgressFloor`: platform quaternion control by the QA Asterion Sphere, passenger/fixtures inheritance and local-plane locomotion with the safe radial boundary.
