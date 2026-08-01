# Experience VR Progress Floor Model

Status: canonical technical description of the implemented visual progress-floor subsystem. Gameplay direction beyond this bounded subsystem remains in the [Experience VR Gameplay Roadmap](../concept/EXPERIENCE_VR_GAMEPLAY_ROADMAP.md).

## Runtime ownership and lifecycle

`createVrProgressFloor` in `src/xr/floor/createVrProgressFloor.js` is the subsystem factory. `src/experienceVr.js` composes it under `worldRoot` after `AssetManager` has preloaded the five manifest models, passes clones of those models to the factory, calls `update(delta)` from the shared animation loop, and calls `dispose()` during page teardown.

The factory creates one shared `THREE.Group` named `VrTiltableFloorRoot`. Its world-relative Y position is the exported `FLOOR_WORLD_Y_OFFSET` (`-1.05` by default). It owns all five instantiated sectors and its cloned materials. `dispose()` is idempotent: it detaches the root and disposes every owned material clone. The name reserves a future tilting contract; the current root remains stationary.

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

## Relationship to crystals

The floor reacts to the concrete `page` delivered by the current Activate callback: the portal displays that page and `progressFloor.activatePage(page)` lights its mapped panel. Crystals remain page-bound. Previously collected crystals can therefore be activated in physical insertion order rather than branch card order. The floor correctly lights the page actually activated, but does not repair sequential card resolution.

## Explicitly not implemented

- `VrProgressionController`;
- branch-bound crystal contract;
- Activate-time sequential page resolution;
- global thresholds and rings;
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
