# Experience VR Progress Floor Model

Status: canonical technical description of the implemented visual progress-floor subsystem. Gameplay direction beyond this bounded subsystem remains in the [Experience VR Gameplay Roadmap](../concept/EXPERIENCE_VR_GAMEPLAY_ROADMAP.md).

## Runtime ownership and lifecycle

`createVrProgressFloor` in `src/xr/floor/createVrProgressFloor.js` is the subsystem factory. `src/experienceVr.js` composes it under `worldRoot` after `AssetManager` has preloaded the five manifest models, passes clones of those models to the factory, calls `update(delta)` from the shared animation loop, and calls `dispose()` during page teardown.

The factory creates one shared `THREE.Group` named `VrTiltableFloorRoot`. Its world-relative Y position is the exported `FLOOR_WORLD_Y_OFFSET` (`-1.05` by default). It owns all five instantiated sectors, five procedural tier rings, cloned sector materials, and the rings' materials and geometries. `dispose()` is idempotent: it detaches the root and disposes every owned material and procedural geometry. The name reserves a future tilting contract; the current root remains stationary.

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

Every sector instance receives cloned materials; geometries may remain shared through the deep object clone. The required base and all mesh descendants of that base are made transparent with `opacity = 0` and `depthWrite = false`. Ornaments and panels remain visible, and panels retain their own emissive materials.

At preparation time each panel's emissive intensity becomes zero. A missing emissive color or an emissive color equal to black receives the branch fallback: Creative `0xff4b2b`, Ethics `0xc8752a`, Water `0x35a9ff`, Metal `0x8cd1ff`, and Wood `0x29e86f`. A non-black authored emissive color is preserved.

## Activation mapping and state

The public `activatePage(page)` API resolves exactly one panel using the pair `page.glyphId + page.order`. A valid, not-yet-activated pair is added once; unsupported and repeated pairs return `false`. Activation is cumulative and idempotent. `getActivatedEntries()` returns defensive `{ glyphId, order }` copies rather than exposing the internal registry.

New activation starts a short emissive impulse (`pulseIntensity = 2.8`, `pulseDuration = 0.22 s` by default), then converges to a stable glow (`stableIntensity = 1.35`). The update is a response-speed blend, not a cyclic slow pulse.

The floor object and its `activatedEntries` registry belong to the prepared page runtime. Session entry/end resets do not reconstruct or clear the floor, so highlights survive XR exit and re-entry in that same runtime. Reload, navigation, or page teardown creates a fresh registry. `dispose()` releases the cloned materials along with detaching the root.

## Global tier rings

The floor creates exactly five independent `THREE.RingGeometry` meshes as direct children of `VrTiltableFloorRoot`, one for each tier. Every ring covers 360 degrees, including tier 4 (Metal + Water) and tier 5 (Water only); branch requirement counts never determine angular coverage.

Ring radii are not layout constants. After all sectors have been placed, the factory measures each existing panel's bounding-box center in floor-root local space, groups radial XZ distances by `order`, and uses their median as that tier's candidate radius. The five positive finite candidates are sorted and assigned inward-to-outward to tiers 1–5; candidates that are equal or too close are separated by a minimum gap of at least twice the ring thickness. Raw panel centroids therefore do not have to follow semantic tier order and cannot block floor construction merely by being non-monotonic. Construction still fails clearly when a positive finite candidate cannot be derived from required panels. A failure isolated to procedural ring creation degrades to the otherwise functional five-sector, 18-panel floor. Rings use 80 radial segments, a thin neutral cool-white transparent `MeshBasicMaterial`, no light or bloom dependency, and `depthWrite = false`. Their small local Y offset keeps them separated from authored surfaces without moving sectors or cards.

Rings begin at zero opacity. `completeTier(tier)` accepts integers 1–5, returns `true` only for the first activation, and starts a short strong opacity impulse which `update(delta)` settles to a subtle persistent glow. Unsupported and repeated calls return `false`. `getCompletedTiers()` returns a defensive array. Completed rings accumulate for the prepared runtime and are unaffected by transient XR session reset.

## Relationship to crystals and progression

Crystals are branch-and-tier bound and do not carry a page identity. `VrProgressionController` owns committed progress and resolves the concrete sequential page during Activate for preview. Release performs the commit; only after that succeeds does the runtime call `progressFloor.activatePage(page)`. It then asks the controller whether `page.order` is complete and calls the idempotent `progressFloor.completeTier(page.order)` when appropriate. The floor is a visual projection of controller state and does not change tier requirements or page resolution.

## Explicitly not implemented

- progressively filled sector-background illumination;
- soft gradient progress boundary;
- central progression core;
- durable persistence;
- full-game reset;
- floor tilting (despite the future-facing `VrTiltableFloorRoot` name);
- locomotion coupled to the floor's local plane;
- floor collisions or physics;
- antenna puzzle;
- final progression sequence.
