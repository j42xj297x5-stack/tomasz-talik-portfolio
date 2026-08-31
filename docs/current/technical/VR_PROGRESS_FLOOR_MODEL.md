# Experience VR Progress Floor Model

Status: canonical technical description of the implemented progress-floor and platform-root subsystem synchronized after the M1.20F and hardware-QA ownership corrections. Gameplay direction beyond this bounded subsystem remains in the [Experience VR Gameplay Roadmap](../concept/EXPERIENCE_VR_GAMEPLAY_ROADMAP.md).

## Runtime ownership and lifecycle

`createVrProgressFloor` in `src/xr/floor/createVrProgressFloor.js` is the domain/presentation projection owner: it owns page-to-panel mapping, activated entries, completed tiers, Scenario hydration and the public progress projection. It creates one `createVrProgressFloorActor`, then delegates bounded physical commands without directly creating or mutating floor THREE nodes. The Floor Actor is the sole owner of the shared platform root, five-sector collection, tier rings and physical presentation lifecycle; it creates every sector through the single generic `createVrProgressFloorSectorActor` implementation. `src/experienceVr.js` composes the subsystem under `ExperienceVrRoot` after `AssetManager` has preloaded the five manifest models, calls `update(delta)` from the shared animation loop, and calls `dispose()` during page teardown.

The Floor Actor creates one shared `THREE.Group` named `VrTiltableFloorRoot`. Its identity transform defines the absolute platform center `(0,0,0)` and the platform reference plane `Y=0`. Below `PlatformGeometryRoot` it owns five independent stable ActorRoots and, when creation succeeds, five procedural tier rings. Each Sector Actor owns its cloned authored visual hierarchy and cloned materials. Floor Actor `dispose()` is idempotent and delegates sector presentation disposal before releasing procedural ring resources; later activation, completion and update calls are inert.

`VrTiltableFloorRoot` now has two active roles: it is the visual progress floor root and the platform transform root driven by the QA Asterion gyro. Progress ownership and transform ownership remain separate. `createVrProgressFloor` only projects committed portfolio progress through Floor Actor commands; the Asterion gyro writes the root quaternion and does not take over card, tier or furnace progression logic.

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

Each actor root is named `VrProgressFloorSectorActorRoot:${glyphId}` and contains exactly one stable `VrProgressFloorSectorMotionRoot:${glyphId}`. The MotionRoot contains both the authored visual hierarchy named `VrProgressFloorSector:${glyphId}` and the sector's Rune Installation Frame. Every ActorRoot has local position `(0,0,0)`, local scale `(1,1,1)` and local Y rotation `rotationIndex * 2π / 5`; it is the canonical five-part platform slot and remains a child of `PlatformGeometryRoot`. Every MotionRoot starts at identity position, quaternion and scale, inherits the ActorRoot and `VrTiltableFloorRoot`, and is the sole physical owner of per-sector runtime translation and rotation. Every sector has `placeholder: false`; no placeholder sector remains and no branch-specific world translation exists.

The generic Sector Actor owns reveal visibility, presentation-body fade, panel emission state, local sector motion and its own lifecycle. Its canonical presentation states are `HIDDEN → REVEALING → REVEALED`. It exposes the separate commands `reveal()` and `activatePanel(order)`, plus `setMotionTransform({ position, quaternion })`, `update(delta)`, `resetMotion()`, `reset()` and `dispose()`, and the bounded queries `getPanelObject(order)`, `getPresentationState()`, `getRuneInstallationFrame()` and `getMotionTransform()`. The motion command accepts only finite MotionRoot-local position and non-zero quaternion values, copies them, safely normalizes the quaternion and keeps scale fixed at `(1,1,1)`; invalid input fails without mutation and calls after disposal are inert. The motion query returns defensive copies of the MotionRoot's current local position, quaternion and scale; the mutable MotionRoot is not exposed. `resetMotion()` restores only that root's identity transform, while `reset()` uses the same motion-reset contract in addition to resetting presentation. `reveal()`, `activatePanel(order)` and `update(delta)` do not mutate motion. `reveal()` accepts only `HIDDEN → REVEALING`; `activatePanel(order)` changes only panel emission and never visibility or presentation state. Only `update(delta)` may settle `REVEALING → REVEALED`. It does not own Scenario points, progression truth, tier completion, Rune readiness/tuning or bridge state. The Floor Actor delegates `setSectorMotion(glyphId, transform)`, `getSectorMotionTransform(glyphId)` and `resetSectorMotion(glyphId)` without exposing its actor registry; `createVrProgressFloor` projects the same bounded surface without adding motion truth, persistence or gates. Unknown sector identifiers fail without mutation.

### Canonical sector-local spatial frame

Every identity MotionRoot preserves the same right-handed canonical local frame: `+X` tangential/across the sector, `+Y` platform normal and `+Z` radial outward. It receives no construction rotation, glTF-axis compensation, world-space offset or branch correction. A stable child `VrRuneInstallationFrame_<BRANCH>` is placed on `X=0`, at the outward `maxZ` boundary of the visible presentation body, with Y at the center of that body's thickness. Its transform is derived in MotionRoot-local space from `path4` for Creative and `path1` for all other sectors; the invisible reference BASE never supplies its installation plane. Because the authored visual and installation frame are siblings below the identity MotionRoot, their prior world placement is unchanged and both inherit future sector motion, the ActorRoot's 72-degree canonical rotation and every later transform of `VrTiltableFloorRoot`.

`createVrProgressFloor.getRuneInstallationFrame(branchId)` delegates through the Floor Actor and returns this stable frame without exposing mutable actor state. The current `RuneBridgeActor` instances are parented directly to these frames. Static alignment maps the authored `BRIDGE_PLATFORM_SOCKET` to frame origin, authored socket-to-`BRIDGE_STONE_ANCHOR` forward to sector-local `+Z`, bridge support normal to sector-local `+Y`, and bridge across to sector-local `+X`. Consequently every bridge is centered on the radial axis and follows sector/platform rotation without branch offsets.

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

Every authored sector visual starts with `visible = false`; its Sector Actor is the only owner of this visibility state, while `createVrProgressFloor` owns the mapping from progression pages to that presentation command. Intro neither reads nor changes sector visibility. The first successful commit in a branch reveals that branch's sector, and the discovered-sector registry survives XR exit and re-entry within the same prepared page runtime. Geometries may remain shared through the deep object clone, while every sector instance receives cloned materials.

The implemented production contract separates two sibling roles. The neutral `VR_PROGRESS_SECTOR_*_BASE` is a required technical/reference mesh (the reference "pizza") and its absence fails construction, but it is set permanently invisible and never participates in the reveal or final presentation. The authored `path4` for Creative and `path1` for the other four assets are independently required: they are the actual visible openwork sector geometry/ornament whose materials are prepared and animated for presentation.

On the first committed crystal in a branch, the projection owner first issues `revealSector(glyphId)` and then `activatePanel(glyphId, order)`. The reveal command makes the sector object visible and starts fading only its authored ornament from zero back to the authored target opacity; panel activation independently starts emission. `transparent = true` and `depthWrite = false` are exclusively a transient fade state. Once `update(delta)` settles the reveal, each ornament material restores its own authored opacity, transparency mode, and depth-write mode, and the Sector Actor enters `REVEALED`; its authored side is preserved throughout. Later cards in that branch issue only panel activation and do not restart the reveal. The reference BASE remains hidden through later activations, tier completion, progression shortcuts, and XR session exit/re-entry.

At preparation time each panel's emissive intensity becomes zero. A missing emissive color or an emissive color equal to black receives the branch fallback: Creative `0xff4b2b`, Ethics `0xc8752a`, Water `0x35a9ff`, Metal `0x8cd1ff`, and Wood `0x29e86f`. A non-black authored emissive color is preserved.

## Activation mapping and state

The public `activatePage(page)` API resolves exactly one panel using the pair `page.glyphId + page.order`. A valid, not-yet-activated pair is added once; unsupported and repeated pairs return `false`. Activation is cumulative and idempotent. `getActivatedEntries()` returns defensive `{ glyphId, order }` copies rather than exposing the internal registry.

For the first valid activation in a branch, `createVrProgressFloor` derives first-page status from `activatedEntries`, requires the separate sector reveal and panel activation commands to be accepted, and only then records the page. Later page activations issue only the panel command, leaving sector visibility and the in-progress or completed body reveal untouched. `getRevealedSectorIds()` remains a projection of committed `activatedEntries`, not Sector Actor state; no second progression registry exists. Every newly activated panel starts a short emissive impulse (`pulseIntensity = 2.8`, `pulseDuration = 0.22 s` by default), then converges to a stable glow (`stableIntensity = 1.35`). The update is a response-speed blend, not a cyclic slow pulse.

The floor object and its `activatedEntries` registry belong to the prepared page runtime. Session entry/end resets do not reconstruct or clear the floor, so highlights survive XR exit and re-entry in that same runtime. Reload, navigation, or page teardown creates a fresh registry. `dispose()` releases the cloned materials along with detaching the root.

## Global tier rings

The floor creates exactly five independent `THREE.RingGeometry` meshes as direct children of `VrTiltableFloorRoot`, one for each tier. Every ring covers 360 degrees, including tier 4 (Metal + Water) and tier 5 (Water only); branch requirement counts never determine angular coverage.

W przyszłym authored Rune Stone Act antenna hunt dostarcza kryształy Metal + Water kończące Tier 4. Commit domyka Metal do `4/4`, ale Water pozostaje celowo `4/5`. Pełny sektor Metal daje **platform installation readiness** dla Metal Rune Stone; nie daje tuning eligibility, ponieważ natural tuning nie czyta floor ani sector completion. Water zachowuje deadlock aż przyszły specjalny Eter beat nada wyłącznie Water installation-readiness override. Override nie dopisuje panelu i nie zmienia floor truth. Dopiero przyszły ostatni Water Crystal po instalacji pięciu elementarnych Rune Stones i sukcesie `FINAL_WATER_HUNT` przechodzi przez Reliquary, commituje Water `5/5` i domyka Tier 5.

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
# R2B sector-motion projection

Progress Floor remains the bounded physical projection for R2B through `setSectorMotion`, `getSectorMotionTransform` and `resetSectorMotion`; mutable sector actors and MotionRoots remain private. A new defensive `getSectorControlFrame(glyphId)` snapshot exposes only the stable sector frame position/quaternion needed to interpret hand intent without reading the moving MotionRoot. EARTH and WOOD rotate around canonical sector-local Z with opposite signs; FIRE rotates around canonical sector-local X. R2B changes quaternion only and keeps position at identity.

## Asterion acquisition target and glow — IMPLEMENTED

Each sector owns `VrAsterionSectorTargetAnchor:<glyphId>` at the actual bounds center of authored panel order 3 in `VrProgressFloorSectorMotionRoot:<glyphId>` local space. The hierarchy therefore inherits ActorRoot, `VrTiltableFloorRoot` and R2B motion without world-space resynchronization. Floor APIs expose only defensive current world-position/platform-normal queries and the bounded presentation command `setAsterionSectorAcquisitionGlow`; no mutable anchor or sector registry escapes.

The presentation-only whole-sector overlay reuses authored geometry with an owned additive material and does not overwrite progression emissive state. It is hidden at zero, cleared by reset/dispose, and its owned material is disposed with the sector. Acquisition lightning/sparks, `FLOOR_DRIVE`, drive/detent audio, `RUNE_INSTALL` VFX/audio, field/lensing presentation and target response remain **NOT IMPLEMENTED**.
