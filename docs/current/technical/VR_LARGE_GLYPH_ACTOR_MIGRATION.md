# Experience VR Large Glyph Actor Migration

Status: **MIGRATION COMPLETE / IMPLEMENTATION RECORD / NOT RUNTIME AUTHORITY**

## Completion status

- M1 COMPLETE — `5b47549` foundation
- M2 COMPLETE — `77df0b3` rigid rotation
- M3 COMPLETE — `4135302` elevation
- M4 COMPLETE — `c725fda` expansion
- M5 COMPLETE — `ffa88ab` transient ownership
- M6 COMPLETE — `d971b88` Scenario ownership
- M7A COMPLETE — `9ad4cbf` cleanup
- M7B COMPLETE — documentation synchronization

**CURRENT runtime authority znajduje się w canonical runtime/domain docs i kodzie. Sekcje CURRENT w tym dokumencie opisują pre-migration audit/history i nie są bieżącym runtime.**

## 1. STATUS / PURPOSE

This document is the completed historical execution contract for migrating the five Experience VR Large Glyphs from the current distributed `glyphRing + glyphOrbit + postRing + p2Radial` model to one physical/spatial actor. It is deliberately divided into three kinds of statements:

- **CURRENT** is an audit of the code that exists now. The current runtime and its canonical runtime models remain authority for implemented behavior.
- **TARGET** is the approved migration contract. It becomes runtime truth only as the named M1–M7 phases are implemented and their canonical docs are synchronized.
- **FUTURE** is designed capacity, not implemented runtime. In particular, `SPHERE_FAR` has no authored Scenario point, event, capability, or transition.

This is an implementation record, not an instruction to begin M1. `LargeGlyphActor`, its implemented stages, rigid rotation and consolidated hydration are current runtime; `SPHERE_FAR` alone remains **FUTURE / NOT AUTHORED / NOT IMPLEMENTED**. Ordinary work must begin in canonical runtime/domain documentation, not here.

## 2. PRODUCT DECISIONS

The following values and rules are binding for the migration and must not be reinterpreted from legacy code.

| Decision | Contract | Status / note |
| --- | --- | --- |
| World/platform base `R` | `7.6 m` | KEEP; independent source for locomotion and spherical layers |
| Large Glyph initial radius | `8.5 m` | TARGET; not `settings.spatial.ringRadius` |
| Elevated offset | `+2.4 m` | preserve current parameter; not a newly authored domain decision |
| Elevation duration | `2.5 s` | preserve current behavior |
| Expanded delta | `+10 m` from initial | TARGET |
| Expanded radius | `18.5 m` | TARGET; replaces legacy `3.3R = 25.08 m` |
| Far delta | approximately `+50 m` from expanded | FUTURE target |
| Far radius | `68.5 m` | FUTURE; not absolute `50 m` |
| Canonical visual scale | `3×` | Actor establishes before Intro/reveal |
| Stable movement | one rigid `RotationRoot` update | no five independent orbits |
| Child self-orbit / self-rotation | none | children inherit parent rotation |
| Stable per-child spatial recalculation | none | no per-frame child `sin/cos`, radial position write, or compensation quaternion |
| Large Glyph layer type | separate five-slot surface structure | never a `VR_SPHERICAL_LAYER_IDS` volume |

The implemented canonical stage names are `RING_INITIAL`, `RING_ELEVATED`, and `RING_EXPANDED`. `SPHERE_FAR` remains **FUTURE / NOT AUTHORED / NOT IMPLEMENTED**.

## 3. PRE-MIGRATION BASELINE / HISTORICAL

### 3.1 Construction and composition

**CURRENT:** `experienceVr.js` resolves the five portfolio records, calls `createOrbitNodes`, receives `{ group: glyphRing, nodes }`, writes `baseScale = 3`, scales every node, adds `glyphRing` to `WorldStableRoot`, then constructs `createVrGlyphOrbit`. It passes raw nodes to ordinary interaction, lights, and Large Glyph attraction; passes the ring to Intro fog, Intro visibility/hydration, and PostRing; and calls orbit/ring-related update, reset, matrix, and visibility operations.

`createOrbitNodes` is a shared Experience 3D helper. It constructs fallback meshes and cached GLB visuals, fits and centers models, creates hover lights and presentation metadata, but also authors a `3.8` radius, sinusoidal Y offsets, orbit angles, hover spatial animation, and an Experience 3D orbit controller. VR currently inherits this mixed construction result and replaces only part of its spatial behavior.

### 3.2 Stable orbit

**CURRENT:** `createVrGlyphOrbit` snapshots each node's authored `orbitAngle`, Y and rotation, owns `phase` and `currentRadius`, and on every update computes each node's X/Z with `cos/sin`. It writes a canonical transform to `node.userData.vrCanonicalOrbitTransform`, then writes position and restores the authored child rotation unless the node is suspended. This preserves a world-fixed child orientation inherited from Experience 3D rather than a radial, parent-inherited VR orientation.

### 3.3 Stage movement

**CURRENT:** elevation and expansion have separate transform owners:

- `createVrPostRingPresentation` captures `glyphRing.position.y`, interpolates it by `glyphVerticalOffset`, resets it, and hydrates it.
- `createVrP2RadialPresentation` reads and writes `glyphOrbit.getRadius()/setRadius()`, performs the P2 interpolation, emits completion, resets its state, and hydrates the old `mainGlyphsRadial` truth.

### 3.4 Transient attraction

**CURRENT:** `createVrLargeGlyphAttractorInteraction` owns the interaction state machine `ORBIT → PULLING → CAPTURED → RETURNING → ORBIT`, targeting, pull/capture/return interpolation, and family eligibility. Physical canonical ownership is nevertheless delegated back to `glyphOrbit.suspendNode()`, `getCanonicalTransform()`, and `resumeNode()`. Return follows the orbit's continuously refreshed canonical transform, but the node remains under its old parent and the orbit implements a `suspended Set` exception.

### 3.5 Downstream presentation and gameplay

- `createVrGlyphInteraction` owns ordinary controller ray hit-testing, hover, `0.5 s` hold, and crystal creation. It consumes nodes, not orbit semantics.
- `createVrGlyphLights` reads each node's world position per frame and positions its light relative to the center. This is presentation work, not spatial ownership.
- Intro fog traverses `glyphRing` only as a visual patch root; Intro hydration directly writes `glyphRing.visible`.
- Scenario and reconstruction split settled Large Glyph truth between `postRing.mainGlyphsElevated` and `p2World.mainGlyphsRadial`.

## 4. PRE-MIGRATION OWNERSHIP PROBLEMS / HISTORICAL

| Conflict | Current owners | Why invalid |
| --- | --- | --- |
| Physical nodes and baseline scale | `createOrbitNodes` + `experienceVr.js` | A composition root constructs, scales, parents, and exposes a domain object's internals. |
| Stable position and rotation | `createVrGlyphOrbit` | Five individual orbital writes model one rigid structure; orientation contract is legacy 3D behavior. |
| Vertical transform | `createVrPostRingPresentation` | A beat orchestrator directly owns another domain object's transform and hydration. |
| Radial transform | `createVrP2RadialPresentation` + orbit radius API | A disposable transition module owns persistent spatial state. |
| Pulled node exception | attractor + orbit `suspended Set` | Canonical owner stops writing a node but does not provide a true actor-owned transient hierarchy. |
| Visibility | Intro + composition reset | Intro reaches into a shared root instead of requesting presentation state from its owner. |
| Stable truth | `postRing` + `p2World` owner sections | One physical stage is reconstructed through two unrelated owners. |
| Radius semantics | orbit + composition + locomotion + spherical ranges | `effectiveRadius` incorrectly means both Large Glyph radius and world base `R`. |
| Lifecycle | composition + orbit + PostRing + P2 + attractor | Update/reset/dispose ordering is spread across modules and easy to desynchronize. |

The primary migration cause is therefore **multiple transform and lifecycle owners for one physical entity**, not performance. Five `sin/cos` calls are cheap; the ownership model is wrong and blocks coherent future stages.

## 5. PRE-MIGRATION DEPENDENCY GRAPH / HISTORICAL

```text
experienceVr.js
├─ resolvePortfolioNodes → portfolioNodes (five identities/content)
├─ createOrbitNodes
│  └─ glyphRing + raw nodes + GLB/fallback/hover metadata
├─ createVrGlyphOrbit(nodes, spatial.ringRadius = 7.6)
│  ├─ update/reset/dispose
│  ├─ effectiveRadius/getRadius/setRadius
│  └─ suspendNode/getCanonicalTransform/resumeNode
├─ createVrGlyphInteraction(nodes) → ordinary ray/hold/crystals
├─ createVrGlyphLights(nodes) → per-frame world-position presentation
├─ createVrLargeGlyphAttractorInteraction(nodes, glyphOrbit)
│  ├─ HandModeController → LARGE_GLYPHS band
│  ├─ AttractorTool → scan/Panel 1/audio projection
│  └─ ProtoAstroTuningController → resolveVrPageProtoAstro family gate
├─ IntroFogReveal(roots: glyphRing) → material shader patch only
├─ IntroSequence(glyphRing) → direct visibility hydration
├─ PostRingPresentation(glyphRing, shellSystem)
│  └─ direct glyphRing.position.y elevation
├─ P2RadialPresentation(glyphOrbit)
│  └─ direct getRadius/setRadius interpolation
├─ RuntimeExperience effect handlers
│  ├─ ELEVATE_MAIN_GLYPHS → PostRing
│  └─ BEGIN_P2_RADIAL_PRESENTATION → P2Radial
├─ Scenario / stateAt / hydrate
│  ├─ postRing.mainGlyphsElevated
│  └─ p2World.mainGlyphsRadial
├─ locomotion boundary ← floorWalkRadius ← glyphOrbit.effectiveRadius
└─ spherical layer ranges base R ← glyphOrbit.effectiveRadius
   ├─ ShellSystem
   └─ SmallGlyphSystem
```

## 6. PRE-MIGRATION SYMBOL INVENTORY / HISTORICAL

| Symbol | File | Current role | Target disposition |
| --- | --- | --- | --- |
| `createOrbitNodes` | `src/scene/orbitNodes.js` | mixed visual construction and Experience 3D spatial behavior | ADAPT: consume shared visual factory in 3D; no longer used directly by VR |
| `fitModelToNode` / `attachNodeModel` | `src/scene/orbitNodes.js` | cached GLB clone, fit, center, fallback handling | MOVE into shared `createGlyphVisualNode` factory; do not copy |
| `createOrbitController`, `updateOrbitNodes` | `src/scene/orbitNodes.js` | Experience 3D orbit/wobble | KEEP for Experience 3D only |
| `glyphRing` | `src/experienceVr.js` | raw group and cross-module transform seam | REMOVE after actor composition replaces it |
| `nodes` | `src/experienceVr.js` | raw five-node collection | ADAPT to read-only `largeGlyphActor.nodes` |
| scale loop / `baseScale` | `src/experienceVr.js` | establishes VR `3×` | MOVE to actor construction |
| `createVrGlyphOrbit` | `src/xr/createVrGlyphOrbit.js` | stable orbit, radius, canonical transforms, transient exception | REMOVE in M7 after consumers migrate |
| `effectiveRadius` | orbit + composition | Large radius, walk boundary and layer base | REMOVE as shared source; replace by actor extent and explicit world base |
| `getRadius/setRadius` | orbit | P2 radial transition seam | REMOVE; actor stage transition owns radius |
| `suspendNode/getCanonicalTransform/resumeNode` | orbit | attractor transient seam | REMOVE; replaced by actor transient API |
| `vrCanonicalOrbitTransform` | node `userData` | continuously refreshed world transform | REMOVE; slot hierarchy is canonical transform |
| `entryReady` | orbit | nearest node inside entry-angle threshold | REMOVE with orbit; runtime has no consumer (see §10) |
| `createVrPostRingPresentation` | progression | Shell reveal plus direct ring elevation | ADAPT to thin shared-beat orchestrator; no transform writes |
| `createVrP2RadialPresentation` | progression | radius interpolation only | REMOVE in M4/M7; actor owns expansion and completion callback |
| `ELEVATE_MAIN_GLYPHS` | Scenario effect | begins current elevation beat | KEEP; route through actor-aware PostRing seam |
| `BEGIN_P2_RADIAL_PRESENTATION` | Scenario effect | begins current radial beat | KEEP; Runtime invokes actor `beginExpansion()` |
| `P2_RADIAL_PRESENTATION_COMPLETED` | Scenario event | preserves point `4.20` completion | KEEP |
| `mainGlyphsElevated` | `postRing` consequence | settled elevation truth | MOVE to `largeGlyphs.stage` in M6 |
| `mainGlyphsRadial` | `p2World` consequence | settled expansion truth | MOVE to `largeGlyphs.stage` in M6 |
| `createVrLargeGlyphAttractorInteraction` | glyphs | scan/target/pull/capture/return gameplay | ADAPT spatial seam only |
| `createVrGlyphInteraction` | XR | ordinary glyph/crystal gameplay | KEEP |
| `createVrGlyphLights` | XR | hover light presentation | KEEP |
| `resolveVrPageProtoAstro` | protoAstro | sole page/glyph identity adapter | KEEP; no second identity map |
| `createVrSphericalLayerActor` | world | deterministic volume field | KEEP; comparison only, never Large Glyph owner |
| `largeGlyphTargetRadius` | composition | legacy `effectiveRadius * 3.3` | REMOVE |
| `largeGlyphMaxTargetDistance` | composition | target radius plus walk allowance | ADAPT to actor targeting-range contract |
| `SPHERE_FAR` | target actor | future deterministic five-slot `4π` layout | FUTURE; design only |

### 6.1 Required search classification

The repository search also finds test contracts and current docs. Runtime-relevant classifications are:

| Use | Class | Migration action |
| --- | --- | --- |
| orbit construction/update/reset/dispose and P2 radius | A — Large Glyph | actor API then removal |
| `floorWalkRadius = glyphOrbit.effectiveRadius` | B — player/platform base | source from explicit world `R = 7.6` |
| `resolveVrSphericalLayerRanges({ baseRadius: glyphOrbit.effectiveRadius })` | C — spherical layer base | source from explicit world `R = 7.6` |
| `largeGlyphTargetRadius = effectiveRadius * 3.3` | D — target-distance derivative | replace with actor extent/range contract |
| Intro fog `setRadius/getRadius` results | E — unrelated fog API | KEEP; same symbol names, not glyph orbit |
| orbit and presentation tests | E — contract coverage | update in the implementing phase; do not use as runtime owner |

No additional production consumer of `entryReady` was found. No production `createVrEntryTransition` remains. Documentation references to the old coupling must be synchronized only in M7, not rewritten as current truth now.

## 7. TARGET LARGE GLYPH ACTOR

The selected module and factory name are:

```text
src/xr/glyphs/createVrLargeGlyphActor.js
createVrLargeGlyphActor(...)
```

**TARGET owner responsibilities:** physical glyph nodes; canonical `3×` baseline; identity-bound slots; hierarchy; radial local orientation; spatial stage; stable rigid rotation; transition interpolation between authored stages; actor-owned `TransientRoot`; canonical slot transforms; presentation visibility; target extent query; reset; settled-state hydration; and dispose.

Recommended public contract:

```js
{
  object,                 // VrLargeGlyphActor visual/spatial root
  nodes,                  // stable read-only collection for existing consumers
  getStage(),
  getSpatialExtent(),     // read-only current maximum slot radius/extent
  getTargetingRange(),    // optional actor policy; must not include player allowance implicitly
  setPresentationVisible(value),
  beginElevation(),
  beginExpansion(),
  beginTransient(node),
  getSlotWorldTransform(node),
  restoreToSlot(node),
  update(delta),
  reset(),
  hydrateScenarioState({ stage }),
  dispose()
}
```

`beginTransient`, `getSlotWorldTransform`, and `restoreToSlot` are the canonical public names selected by this contract. Invalid nodes, double leases, conflicting transitions, or restore without a lease must fail explicitly rather than silently invent ownership.

The actor emits/accepts completion callbacks at composition time so existing Scenario events remain external. Scenario must never know radii, slot transforms, quaternion math, or Fibonacci distribution.

## 8. TARGET OBJECT HIERARCHY

```text
WorldStableRoot
└── VrLargeGlyphActor                    (object; presentation visibility / actor world placement)
    ├── RotationRoot                     (single continuous stable rotation)
    │   ├── Slot_KA                      (fixed canonical local transform for current stage)
    │   │   └── KA
    │   ├── Slot_TA
    │   │   └── TA
    │   ├── Slot_SA
    │   │   └── SA
    │   ├── Slot_LA
    │   │   └── LA
    │   └── Slot_RA
    │       └── RA
    └── TransientRoot                    (actor-owned lease space)
```

No additional transform layer is currently justified. Actor root covers stable world placement/elevation and visibility; `RotationRoot` covers common angular motion; slots cover identity-specific local position/orientation; `TransientRoot` covers leased nodes. If M3 proves elevation must rotate with a distinct center during an active transition, that is a **STOP condition requiring an explicit contract amendment**, not permission to add an arbitrary wrapper.

## 9. SPATIAL STAGES

### `RING_INITIAL` — CURRENT MIGRATION TARGET

- Five stable identity slots, separated by exactly `72°`.
- Horizontal ring: all slot centers share the same actor-local Y.
- Radius `8.5 m`; canonical glyph scale `3×`.
- Radial orientation and one rigid rotation.
- The sinusoidal Y inherited from `createOrbitNodes` is not retained.

### `RING_ELEVATED` — CURRENT MIGRATION TARGET

- Same horizontal slot layout and `8.5 m` radius.
- Whole structure settles at `+2.4 m` from the initial actor/root baseline.
- Current duration remains `2.5 s`.
- Actor performs the movement; PostRing may only request it and coordinate Shell reveal.

### `RING_EXPANDED` — CURRENT MIGRATION TARGET

- Same horizontal five-slot structure, radial orientation and elevated Y.
- Radius moves from `8.5 m` to exactly `18.5 m` (`+10 m`).
- Existing point `4.20` and `P2_RADIAL_PRESENTATION_COMPLETED` remain the authored flow.
- `25.08 m` (`7.6 × 3.3`) is legacy and must not be restored to avoid overlap.

### `SPHERE_FAR` — FUTURE AUTHORED USE

- Five identity-stable directions distributed deterministically over full `4π`; no `Math.random()`.
- A deterministic Fibonacci-sphere pattern for `N=5` is acceptable, with a documented stable index/identity order.
- All slots share radius `68.5 m`, i.e. approximately `+50 m` after `18.5 m`, not an absolute `50 m` radius.
- Slots remain radial and the same `RotationRoot` rotates the full structure at one common speed.
- This phase does **not** authorize a Scenario point, event, capability, transition, Rune Stone flow, or long-range attraction behavior.

## 10. RIGID ROTATION CONTRACT

In every settled stage, slot local transforms are immutable until a stage transition. Continuous motion is exactly one `RotationRoot` quaternion/rotation update per frame. No stable frame may calculate five orbital angles, write five radial positions, or compensate child quaternions to remain world-fixed.

During a stage transition, the actor may interpolate the minimum transforms needed and then settle exact canonical values. During attraction, one leased glyph may move. Those bounded updates do not weaken the stable rigid contract.

### `entryReady` decision

**DISCOVERED CONSTRAINT:** `createVrGlyphOrbit` still calculates `entryReady` using `entryDirection`, threshold, and hysteresis, and its unit test covers that behavior. Repository search finds no production consumer; `experienceVr.js` does not read it and a contract test explicitly protects the absence of the old entry-transition seam. It is therefore a **legacy/dead public seam in current runtime**, not an Intro/progression dependency.

M2 must remove `entryReady` together with its settings and update/retire its isolated test coverage. No replacement belongs in `LargeGlyphActor`. STOP if a new production consumer appears before M2; then the phase must identify the actual product behavior and assign it explicitly rather than recreate angle polling by default.

## 11. RADIAL ORIENTATION CONTRACT

Each slot owns a canonical local quaternion derived from its center-relative radial direction. The visible sign faces the center and its opposite/back faces outward. The exact asset-forward axis must be verified once in M1/M2 against the extracted visual factory and encoded once in slot construction.

Because slots and children inherit `RotationRoot`, glyph orientation rotates with the rigid structure. The current `createVrGlyphOrbit` behavior—restoring a child's authored rotation independently of orbital phase—is explicitly **legacy Experience 3D behavior** and is not preserved in VR.

## 12. TRANSIENT ATTRACTOR OWNERSHIP

```text
ORBIT:
  RotationRoot → Slot_X → glyph

beginTransient(glyph):
  validate identity/state
  TransientRoot.attach(glyph) preserving world transform
  Slot_X stays empty and keeps rotating

PULLING / CAPTURED:
  Attractor owns gameplay interpolation
  Actor still owns glyph under TransientRoot

RETURNING:
  each update asks getSlotWorldTransform(glyph)
  destination follows the currently rotating slot; it is not a pull-start snapshot

restoreToSlot(glyph):
  attach glyph to Slot_X
  set exact canonical local position/quaternion/scale
  clear actor lease

ORBIT restored
```

The actor never relinquishes any glyph to an external root. The orbit-era `suspended Set`, `vrCanonicalOrbitTransform`, `suspendNode`, `getCanonicalTransform`, and `resumeNode` are **TO BE REMOVED**. Reset and dispose must resolve any active lease deterministically before clearing actor state.

## 13. OWNERSHIP MATRIX

| Owner | Owns after migration | Explicitly does not own |
| --- | --- | --- |
| Scenario | when a beat begins; capabilities; settled symbolic consequence | radii, slots, transforms, Fibonacci, interpolation |
| `RuntimeExperience` | effect-to-owner dispatch; completion event bridge | physical state or geometry |
| `LargeGlyphActor` | nodes, scale, hierarchy, slots, stages, transitions, rigid rotation, transient root, restore/reset/hydration/dispose | ray gameplay, Astro eligibility, story order |
| Large Glyph Attractor | scan, target, pull, captured, return interpolation, family eligibility projection | canonical slots, global stage, actor lifecycle |
| Ordinary Glyph Interaction | ray hit, hover/hold, crystal creation | spatial stage and actor hierarchy |
| Glyph Lights | hover light presentation and current per-frame world-position read | canonical transform or rigid movement |
| Intro | reveal timing/guidance; requests actor visibility; supplies actor visual root to fog | actor hierarchy or direct visibility/transform writes |
| PostRing | coordinates Shell reveal and actor elevation request | Large Glyph transforms/hydration |
| Composition | constructs and connects actors; calls lifecycle | radius math, slots, scaling, transitions, pull/return implementation |

## 14. WORLD RADIUS DECOUPLING

`WORLD / PLATFORM BASE R = 7.6 m` and `LARGE GLYPH INITIAL RADIUS = 8.5 m` are different domain values.

The recommended world source remains `settings.spatial.ringRadius` during compatibility phases, but M7 must rename it to a semantic world setting such as `settings.spatial.worldBaseRadius` and update consumers atomically. It must remain outside `settings.largeGlyphs`. Until that rename lands, code must alias it once as `worldBaseRadius` and must not read it from the actor.

World base `R` continues to feed:

- player locomotion/crossing boundary;
- spherical-layer range resolution;
- Shell and Small Glyph field ranges;
- reserved Rune Stone, Star, and Hidden Glyph ranges.

Large Glyph actor settings independently own initial/expanded/far radii. `glyphOrbit.effectiveRadius` must not survive as a common source.

The canonical ranges remain unchanged:

| Layer | Range |
| --- | --- |
| Shells | `7.6–15.2 m` |
| Small Glyphs | `17.1–24.7 m` |
| Rune Stones | `26.6–34.2 m` |
| Stars | `36.1–43.7 m` |
| Hidden Glyphs | `45.6–53.2 m` |

## 15. KNOWN SPATIAL OVERLAPS

**KNOWN / ACCEPTED SPATIAL OVERLAP:** `RING_EXPANDED = 18.5 m` lies inside the current Small Glyph spherical volume `17.1–24.7 m`.

This is an accepted product decision, not an error for Codex to repair. No phase may automatically restore `25.08 m`, move the Small Glyph field, change layer thickness/gaps, or reinterpret `+10 m`. Hardware/perceptual QA may report the result, but a later product decision is required to change it.

## 16. RESERVED-LAYER INTERACTION

`SPHERE_FAR = 68.5 m` is outside the outermost current registered/reserved range (`HIDDEN_GLYPHS` ends at `53.2 m`). A radius of `50 m` would intersect that reserved volume and is not the decision.

Large Glyph remains outside `VR_SPHERICAL_LAYER_IDS`. Shell/Small Glyph actors represent thick volume fields with slot-count and radial-depth semantics. Large Glyph is a five-element rigid surface structure: no thickness, random radial depth, registry entry, or volume slot-count semantics. Fibonacci-like direction distribution in `SPHERE_FAR` is an algorithmic similarity only.

## 17. SCENARIO / STATEAT / HYDRATION MIGRATION

### Current-to-target truth

| Current settled consequence | Target owner truth |
| --- | --- |
| no `postRing` elevation and no `p2World` radial truth | `largeGlyphs: { stage: 'RING_INITIAL' }` baseline |
| `postRing.mainGlyphsElevated = true` | `largeGlyphs: { stage: 'RING_ELEVATED' }` |
| `p2World.mainGlyphsRadial = true` (with earlier elevation implied by spine) | `largeGlyphs: { stage: 'RING_EXPANDED' }` |
| none | `SPHERE_FAR` remains un-authored FUTURE |

Target wiring is `scenarioOwners.largeGlyphs = largeGlyphActor`; `hydrateVrScenarioState` delegates one section to `largeGlyphActor.hydrateScenarioState({ stage })`. Hydration settles exact canonical transforms without replaying transitions or emitting story events.

M6 must change Scenario consequences, `OWNER_SECTIONS`, owner wiring, `stateAt()` expectations, direct `activatePoint()`, debug checkpoints, and baseline restoration in one coherent patch. During M1–M5, adapters at composition may preserve existing `postRing`/`p2World` hydration; do not add permanent legacy aliases. There is no durable cross-version save-game requirement.

Required ordering invariant: baseline reset first; reconstruct declarative state; hydrate actor stage; then activate the chosen point. Points `3.10`, `4.20`, `4.30`, and `4.40` must reconstruct their correct settled predecessor/current truth without replay or duplicate completion.

## 18. POSTRING MIGRATION

Keep `createVrPostRingPresentation` as a thin orchestrator because it still coordinates two independent sides of one beat: Shell reveal and Large Glyph elevation completion.

Minimal target API change:

```text
createVrPostRingPresentation({ shellSystem, largeGlyphActor, ... })
ELEVATE_MAIN_GLYPHS
→ postRingPresentation.elevateMainGlyphs()
→ largeGlyphActor.beginElevation()
```

PostRing may track whether both requested presentations completed and emit `POST_RING_WORLD_PRESENTATION_COMPLETED`; it must not read/write `object.position`, calculate offsets, or hydrate actor transforms. `glyphVerticalOffset` and `glyphElevationDuration` move under Large Glyph settings; `shellRevealDuration` remains PostRing/Shell orchestration configuration.

## 19. P2 RADIAL MIGRATION

Decision: **REMOVE `createVrP2RadialPresentation.js`**. After the actor owns expansion, this module has no independent domain responsibility.

```text
BEGIN_P2_RADIAL_PRESENTATION
→ RuntimeExperience handler
→ largeGlyphActor.beginExpansion()
→ actor transition completes
→ P2_RADIAL_PRESENTATION_COMPLETED
```

The actor moves `8.5 → 18.5 m` and owns exact settlement/hydration. Preserve point `4.20`, its entry effect, completion event, and transition semantics. Remove `largeGlyphRadiusMultiplier`; move/rename duration as actor expansion duration. Physical `SPHERE_FAR` transition remains out of scope.

## 20. EXPERIENCEVR COMPOSITION CLEANUP

### MOVE OUT

- `resolvePortfolioNodes`/visual-node creation for Large Glyph into actor construction (content resolution may be injected, but actor owns resulting nodes).
- `createOrbitNodes` VR use into the shared visual factory + actor.
- per-node `baseScale` and `scale.setScalar(3)` into actor.
- Large Glyph center/radius/slot calculations into actor.
- Large Glyph target spatial extent calculation into actor read-only API.
- direct `glyphRing.visible` baseline/hydration into `setPresentationVisible`.

### KEEP AS COMPOSITION

- construct `largeGlyphActor` and add/receive its `object` under `WorldStableRoot` according to factory convention;
- pass `largeGlyphActor.nodes` to ordinary interaction and lights;
- pass `largeGlyphActor` to Large Glyph attractor, PostRing, Runtime/Scenario owners, and Intro visibility seam;
- pass `largeGlyphActor.object` as the Intro fog visual root;
- call actor `update`, `reset`, and `dispose` in lifecycle order;
- bridge actor completion callbacks to existing Scenario events;
- add any player walk allowance to actor-provided targeting extent if the gameplay contract still requires it.

### REMOVE AFTER MIGRATION

- `glyphRing`, `glyphOrbit`, `largeGlyphTargetRadius`, and legacy `largeGlyphMaxTargetDistance` formula;
- `worldStableRoot.add(glyphRing)` and `glyphRing.updateMatrixWorld(true)` special case;
- direct `glyphOrbit.update/reset/dispose`, P2 actor update/reset, and ring visibility reset;
- `effectiveRadius` as locomotion/layer input;
- imports of `createOrbitNodes`, `createVrGlyphOrbit`, and `createVrP2RadialPresentation` from VR composition.

## 21. CREATEORBITNODES EXTRACTION

Selected shared factory: `createGlyphVisualNode` in `src/scene/createGlyphVisualNode.js`.

The `src/scene` location follows the existing shared scene construction convention and avoids an XR dependency in Experience 3D. M1 must extract, not duplicate, the existing fitting code.

| Reusable visual construction | Experience 3D-only spatial/presentation behavior |
| --- | --- |
| fallback node/visual root construction | radius `3.8` |
| cached `cloneGltfScene` by glyph identity | sinusoidal initial Y |
| `fitModelToNode` target fit and centering | authored orbit angle/radius/Y offset |
| attach visual and hide fallback material | `createOrbitController` |
| content/userData identity required by consumers | `updateOrbitNodes` X/Z/wobble |
| model/fallback ownership needed for disposal | 3D orbit-phase behavior |
| minimal common visual metadata | hover spatial animation remains an explicit consumer concern |

The factory must return one constructed node/visual and have no radius, slot, phase, Intro, XR, or Scenario knowledge. `createOrbitNodes` keeps its 3D arrangement by consuming the factory; `LargeGlyphActor` supplies VR slot arrangement. Preserve presentation metadata actually used by ordinary interaction/lights, but do not make the shared factory own their runtime.

## 22. LARGE GLYPH ATTRACTOR ADAPTATION

### Preserve exactly

- `VR_ATTRACTOR_BANDS.LARGE_GLYPHS` and dynamic B-band cycle;
- `CAN_SCAN_LARGE_GLYPHS`, `CAN_TARGET_LARGE_GLYPHS`, `CAN_PULL_LARGE_GLYPHS`;
- `ProtoAstroTuningController.canAttractLargeGlyph()` and `resolveVrPageProtoAstro()`;
- natural family I↔A eligibility (KI↔KA, TI↔TA, SI↔SA, LI↔LA, RI↔RA); VI does not unlock a Large Glyph;
- green band, Panel 1 A SVG/projection, Large Glyph attractor audio;
- bounding-sphere safe stand-off and configured minimum clearance;
- `ORBIT → PULLING → CAPTURED → RETURNING → ORBIT` behavior and moving-destination return.

### Replace only

| Old orbit seam | Actor seam |
| --- | --- |
| `glyphOrbit.suspendNode(node)` | `largeGlyphActor.beginTransient(node)` |
| `glyphOrbit.getCanonicalTransform(node)` | `largeGlyphActor.getSlotWorldTransform(node)` plus actor baseline scale contract |
| `glyphOrbit.resumeNode(node)` | `largeGlyphActor.restoreToSlot(node)` |
| fixed composition `maxTargetDistance` from `3.3R` | actor read-only current extent/range plus explicit player allowance |

`getSlotWorldTransform` must be queried throughout RETURN so the target follows `RotationRoot`. `SPHERE_FAR` attraction range/band behavior is a future product dependency; M5 must not silently enable attraction from `68.5 m`.

## 23. INVARIANTS

1. Five identities remain: `ethics-life-protection → KA`, `spotify-digger → TA`, `haiku-cosmos → SA`, `ai-guide → LA`, `creative-ai → RA`.
2. `resolveVrPageProtoAstro()` remains the only Proto-Astro page/glyph adapter; no duplicate identity map.
3. Canonical Experience VR scale remains `3×`, established before Intro/reveal.
4. Ordinary hit-testing, hover, `0.5 s` hold, crystal identity/variant, acquisition progression, reliquary and crystal flow remain owned by `createVrGlyphInteraction` and its downstream systems.
5. Glyph Lights stays a presentation helper. Its per-frame world-position update may remain and must not be rewritten merely for stylistic rigidness.
6. Large Glyph Astro band, dynamic B switching, green presentation, Panel 1 A SVG, audio, capabilities, family gate, VI exclusion, stand-off and interaction lifecycle remain unchanged.
7. Shell and Small Glyph systems and all spherical ranges remain unchanged.
8. World/platform `R = 7.6 m` remains unchanged and independent of actor radius.
9. Existing Scenario points/effects/completion events remain until an explicitly authored scenario migration says otherwise.
10. No durable persistence compatibility layer is introduced.

## 24. MIGRATION PHASES

Each future task must cite `VR_LARGE_GLYPH_ACTOR_MIGRATION.md → Mx`, perform only that phase, preserve postponed removals, run only validation explicitly authorized by its prompt, update affected tests/docs as authorized, make one task commit, and stop.

### M1 — VISUAL FACTORY / ACTOR FOUNDATION

- **Goal:** extract `createGlyphVisualNode`; create `createVrLargeGlyphActor`; actor owns five nodes, `3×` scale, initial horizontal slots at `8.5 m`, object hierarchy and baseline lifecycle while compatibility seams keep consumers working.
- **Expected files:** `src/scene/orbitNodes.js`, new `src/scene/createGlyphVisualNode.js`, new `src/xr/glyphs/createVrLargeGlyphActor.js`, `src/experienceVr.js`, focused construction/config/tests/docs authorized by the task.
- **Old owner → new owner:** `createOrbitNodes` + composition node/scale ownership → shared visual factory + actor.
- **Invariants:** identities, GLB fitting/fallbacks, hover metadata, `3×`, Intro visibility, ordinary interaction/lights/Astro consumers, world `R=7.6`.
- **Dependencies:** content resolver, asset manager, current orbit node visual construction, actor conventions.
- **Completion condition:** VR obtains all five nodes from actor; actor has exact `RING_INITIAL` slot transforms at `8.5 m`; external consumers still receive stable nodes; no Scenario or attractor semantic change.
- **Explicitly not done:** rigid continuous rotation replacement if it cannot be isolated safely; elevation, expansion, transient API migration, Scenario consolidation, `SPHERE_FAR`.
- **Removal postponed:** old orbit and its APIs, P2 module, old consequence sections.
- **Validation needed:** focused visual-factory/actor construction contracts and later hardware confirmation of asset axis/scale; exact commands must be authorized by M1 prompt.

### M2 — RIGID ROTATION

- **Goal:** make fixed slots under `RotationRoot` the stable spatial model; one parent rotation update; radial child orientation.
- **Expected files:** actor, `experienceVr.js`, old orbit compatibility/removal boundary, glyph-orbit/actor tests, relevant config/docs.
- **Old owner → new owner:** per-child `createVrGlyphOrbit.applyPositions` → actor `RotationRoot`.
- **Invariants:** angular speed `0.14`, direction, five stable identities, external node references, stage positions, attractor compatibility until M5.
- **Dependencies:** M1 hierarchy and verified asset-forward axis.
- **Completion condition:** settled-frame movement writes only the common root rotation; slots remain fixed; children inherit radial orientation; no runtime `entryReady` consumer exists.
- **Explicitly not done:** elevation/expansion owner migration, attractor transient migration, Scenario consolidation.
- **Removal postponed:** orbit transient APIs may remain as a narrowly documented compatibility adapter until M5; full file removal in M7.
- **Validation needed:** fixed-slot and one-root rotation contracts; explicit inspection of `entryReady` search. Hardware/perceptual orientation validation belongs to the user.

### M3 — ELEVATION OWNERSHIP

- **Goal:** actor owns `RING_INITIAL → RING_ELEVATED`; PostRing only coordinates actor request and Shell reveal.
- **Expected files:** actor, PostRing, composition/effect wiring, settings, focused Scenario/presentation tests.
- **Old owner → new owner:** `glyphRing.position.y` in PostRing → actor transition/state.
- **Invariants:** `+2.4 m`, `2.5 s`, Shell reveal/interaction behavior, `ELEVATE_MAIN_GLYPHS`, `POST_RING_WORLD_PRESENTATION_COMPLETED`.
- **Dependencies:** M2 stable hierarchy and completion callback seam.
- **Completion condition:** PostRing performs no Large Glyph transform write; actor settles exact `RING_ELEVATED`; current reconstruction still produces elevated glyphs through a temporary owner adapter if M6 is not done.
- **Explicitly not done:** expansion, attraction, Scenario truth consolidation.
- **Removal postponed:** `postRing.mainGlyphsElevated` until M6; obsolete PostRing glyph config validation until M7.
- **Validation needed:** elevation timing/completion/hydration compatibility and Shell coordination; commands require prompt authorization.

### M4 — EXPANSION OWNERSHIP

- **Goal:** actor owns `RING_ELEVATED → RING_EXPANDED` at `8.5 → 18.5 m`; retire P2 radial presentation.
- **Expected files:** actor, composition Runtime effect handler, `createVrP2RadialPresentation.js` removal, settings, point `4.20` focused tests/docs.
- **Old owner → new owner:** P2 module + orbit `setRadius` → actor expansion transition.
- **Invariants:** `BEGIN_P2_RADIAL_PRESENTATION`, point `4.20`, duration `2.5 s`, completion event, no scale animation, accepted overlap.
- **Dependencies:** M3 actor transition mechanism.
- **Completion condition:** actor settles exact `18.5 m` and emits existing completion; P2 module has no production import/use; no code computes `3.3R` as Large target radius.
- **Explicitly not done:** Small Glyph range changes, overlap avoidance, `SPHERE_FAR`, Scenario owner consolidation.
- **Removal postponed:** old `p2World.mainGlyphsRadial` may be temporarily adapted until M6; old orbit file until M7.
- **Validation needed:** point `4.20` begin/completion and settled actor radius, plus user hardware/perceptual overlap QA later.

### M5 — ASTROLABIUM TRANSIENT OWNERSHIP

- **Goal:** migrate attraction to actor-owned `TransientRoot` and moving slot return.
- **Expected files:** actor, `createVrLargeGlyphAttractorInteraction.js`, composition target-range wiring, focused attractor tests/docs.
- **Old owner → new owner:** orbit suspend/canonical/resume exception → actor begin/get-slot/restore lease contract.
- **Invariants:** all Astro semantics listed in §22, bounding-sphere stand-off, audio, family gate, lifecycle, ordinary interaction priority.
- **Dependencies:** stable slots/rotation from M2, expanded extent from M4, actor lease validation.
- **Completion condition:** pulled glyph is reparented under actor `TransientRoot` preserving world transform; return queries moving slot; restore sets exact local canonical transform; attractor has no `glyphOrbit` dependency.
- **Explicitly not done:** long-range `SPHERE_FAR` gameplay or new bands/capabilities.
- **Removal postponed:** orbit compatibility implementation/file until M7 if another consumer remains.
- **Validation needed:** cancel at each lifecycle state, moving-slot return, reset/dispose lease recovery, eligibility/audio/panel invariants; only authorized commands.

### M6 — SCENARIO OWNER / HYDRATION CONSOLIDATION

- **Goal:** one `largeGlyphs` owner section and one `stage` truth across Scenario, reconstruction, direct activation and hydration.
- **Expected files:** `vrExperienceScenario.js`, `reconstructVrScenarioState.js`, `hydrateVrScenarioState.js`, composition owner map, actor, Scenario/reconstruction/debug tests and canonical docs.
- **Old owner → new owner:** `postRing.mainGlyphsElevated` + `p2World.mainGlyphsRadial` → `scenarioOwners.largeGlyphs = largeGlyphActor`.
- **Invariants:** mainline points/events, reset baseline, stateAt semantics, no replayed completion, no save-game compatibility aliases.
- **Dependencies:** M3/M4 exact actor settled stages.
- **Completion condition:** current points map deterministically to `RING_INITIAL/ELEVATED/EXPANDED`; owner hydrates once; old Large Glyph booleans are absent; checkpoints/direct `activatePoint()` reconstruct correctly.
- **Explicitly not done:** authoring `SPHERE_FAR` or further P2 story.
- **Removal postponed:** final composition/config/docs cleanup to M7.
- **Validation needed:** stateAt through `4.40`, debug checkpoints, direct point activation, reset→hydrate ordering; exact test commands must be named by prompt.

### M7 — COMPOSITION CLEANUP / LEGACY REMOVAL

- **Goal:** remove dead orbit/radius/config seams, leave composition-only wiring, and synchronize current runtime documentation.
- **Expected files:** `experienceVr.js`, removal of `createVrGlyphOrbit.js`, settings/schema normalization, dead tests/imports, affected canonical technical docs/index/handoff/decision references as explicitly scoped.
- **Old owner → new owner:** all remaining composition/orbit knowledge → actor or explicit world spatial config.
- **Invariants:** world `R=7.6`, actor initial `8.5`, expanded `18.5`, all gameplay/presentation invariants, clean lifecycle.
- **Dependencies:** M1–M6 complete with no runtime orbit consumer.
- **Completion condition:** repository production search finds no `glyphOrbit`, `glyphRing`, `effectiveRadius`, orbit transient API, `mainGlyphsElevated`, `mainGlyphsRadial`, or `largeGlyphRadiusMultiplier`; composition matches §20; current docs describe implemented actor without claiming FUTURE.
- **Explicitly not done:** `SPHERE_FAR` authored progression or hardware validation claims.
- **Removal postponed:** none within current migration; FUTURE remains separately authorized.
- **Validation needed:** authorized static/contracts/integration suite and user-owned hardware/perceptual QA matrix.

### FUTURE — `SPHERE_FAR`

Not part of M1–M7 implementation unless separately authorized after authored product/Scenario design. A future task must decide activation beat, transition timing, targeting/band range, camera/fog/readability and hardware comfort before code.

## 25. REMOVAL LIST

Remove only after the named dependencies have migrated:

| Removal | Earliest phase / condition |
| --- | --- |
| VR direct use of `createOrbitNodes` | M1 after shared factory parity |
| per-child stable orbit calculation and legacy rotation compensation | M2 |
| `entryReady`, threshold and hysteresis | M2 after production search remains empty |
| direct PostRing `glyphRing.position.y` | M3 |
| `createVrP2RadialPresentation.js` and production tests/import | M4 |
| `largeGlyphRadiusMultiplier = 3.3` and `largeGlyphTargetRadius` formula | M4 |
| `suspendNode/getCanonicalTransform/resumeNode`, `suspended Set`, `vrCanonicalOrbitTransform` | M5 |
| `postRing.mainGlyphsElevated`, `p2World.mainGlyphsRadial` | M6 |
| `createVrGlyphOrbit.js`, `glyphRing`, `glyphOrbit`, shared `effectiveRadius` | M7 after zero consumers |
| obsolete config validators/docs/tests | M7 |

Do not remove `createOrbitController`/`updateOrbitNodes` if Experience 3D still consumes them, ordinary glyph interaction, Glyph Lights, Astro features, or spherical-layer actors.

## 26. VALIDATION MATRIX

This document authorizes no implementation validation by itself. Each future prompt must name exact commands. Required evidence categories are:

| Area | Automated unit/contract | Production-path smoke/integration | Hardware/perceptual (user) |
| --- | --- | --- | --- |
| Visual factory | clone/fit/identity/fallback parity | both 3D and VR consumers construct | GLB scale/readability |
| Initial actor | five slots, `72°`, `8.5`, equal Y, `3×` | Intro and consumers receive nodes | radial facing and no platform intrusion |
| Rigid rotation | fixed locals, one root update, reset | render loop/lifecycle wiring | direction/speed/comfort |
| Elevation | `+2.4`, `2.5 s`, exact settle | point `3.10` completion with Shell reveal | beat timing/readability |
| Expansion | `18.5`, completion once | direct `4.20`, reconstruct `4.30/4.40` | ACCEPTED overlap observation |
| Transient | world-preserving attach, moving return, exact restore | live Astro capability/family path | scan/pull/stand-off/audio/panel |
| Hydration | stage mapping and reset | stateAt/checkpoints/direct activation | visual settled state |
| Radius decoupling | world ranges exact | locomotion + Shell/Small Glyph composition | walk boundary and field placement |

Automated PASS never implies WebXR, audio, comfort, or perceptual PASS. Screenshots are insufficient for headset behavior. Only the user may assign hardware-validated status.

## 27. STOP CONDITIONS / RISKS

Stop the active phase and report the discovered constraint rather than improvising if:

1. Changing Large Glyph radius alters locomotion or any spherical range; world `R` was not decoupled correctly.
2. A production consumer of `entryReady` appears before M2 removal.
3. Asset forward axes cannot produce the radial orientation contract with one canonical slot quaternion rule.
4. A glyph can be parented outside actor root during attraction, leased twice, lost on reset, or restored to a snapshot instead of the moving slot.
5. Scenario reconstruction requires replaying a transition/event to settle a stage.
6. Point `3.10` or `4.20` completion can fire twice or before both required beat components settle.
7. A phase changes ordinary glyph/crystal behavior, Astro eligibility/bands/audio/panel, Shell/Small Glyph ranges, or world `R`.
8. Code attempts to resolve the accepted `18.5 m` overlap by changing the approved radius or layer field.
9. Code adds Large Glyph to `VR_SPHERICAL_LAYER_IDS` or gives it volume thickness/random depth.
10. `SPHERE_FAR` work starts without a separate authored authorization.
11. Target range for current expanded glyphs cannot be derived without hard-coding a stage radius in the interaction; stop and define actor extent semantics.
12. An extra hierarchy layer appears necessary; amend this contract with the concrete transform constraint first.

Primary risks are visual-axis ambiguity from GLB fitting, transition/attractor concurrency, completion ordering, transient reset recovery, accidental world-radius coupling, documentation claiming target as current, and future attraction reach at `68.5 m`.

## DOCUMENTATION DRIFT

**CURRENT discovered drift:** `VR_PROTO_ASTRO_MODEL.md` contains both implemented Large Glyph statements and older future/not-implemented classification; `VR_SCENARIO_DIRECTOR_MODEL.md` likewise describes current capabilities while retaining stale future wording. Other current docs explicitly name `glyphOrbit.effectiveRadius` as locomotion/world truth.

This task intentionally does not broadly synchronize those runtime models or rewrite them to the TARGET actor state. M7 must audit and synchronize affected canonical docs against the code actually implemented at that time. Until then, runtime code decides IMPLEMENTED status, this document routes migration work, and TARGET/FUTURE text here must not be cited as current runtime authority.

## Configuration disposition

| Current setting | Target disposition |
| --- | --- |
| `settings.spatial.ringRadius = 7.6` | RENAME in M7 to semantic world base; KEEP value and outside actor settings |
| `settings.largeGlyphs.scaleMultiplier = 3` | KEEP AS-IS semantically under Large Glyph settings |
| `settings.glyphRing.enabled/angularSpeed/direction` | MOVE/RENAME under Large Glyph actor rotation settings |
| `settings.glyphRing.entryAngleThreshold/entryAngleHysteresis` | REMOVE with dead `entryReady` |
| `settings.postRingPresentation.glyphVerticalOffset` | MOVE under Large Glyph stage/transition settings |
| `settings.postRingPresentation.glyphElevationDuration` | MOVE under Large Glyph transition settings |
| `settings.postRingPresentation.shellRevealDuration` | KEEP AS-IS under PostRing orchestration |
| `settings.p2RadialPresentation.durationSeconds` | MOVE/RENAME as Large Glyph expansion duration |
| `settings.p2RadialPresentation.largeGlyphRadiusMultiplier` | REMOVE; use explicit `18.5 m`/`+10 m` actor contract |
| `settings.largeGlyphAttractor.minimumClearance` | KEEP AS-IS |
| Large Glyph initial/expanded/far radii | ADD under Large Glyph settings in implementing phases; far may remain FUTURE constant/config until authored |
| stable five-slot count/identity | code/content invariant, not spherical volume config |

## 28. FINAL TARGET GRAPH

```text
Scenario (when / capability / settled stage)
└─ RuntimeExperience (symbolic effect dispatch)
   └─ LargeGlyphActor
      ├─ object → RotationRoot → five identity slots → five nodes
      ├─ TransientRoot + beginTransient/getSlotWorldTransform/restoreToSlot
      ├─ RING_INITIAL → RING_ELEVATED → RING_EXPANDED
      ├─ SPHERE_FAR [FUTURE, no authored trigger]
      └─ update/reset/hydrate/dispose

largeGlyphActor.nodes ─┬→ GlyphInteraction (ordinary ray/hold/crystals)
                       └→ GlyphLights (presentation)

largeGlyphActor ───────┬→ LargeGlyphAttractorInteraction (Astro gameplay)
                       ├→ PostRing (elevation request + Shell orchestration)
                       └→ Intro (visibility seam)

largeGlyphActor.object ─→ IntroFogReveal (visual shader-patch root)

settings.spatial.worldBaseRadius = 7.6 [independent]
├→ locomotion/player boundary
└→ spherical layer registry
   ├→ Shell field
   └→ Small Glyph field

LargeGlyphActor.initialRadius = 8.5 [independent]
```

The final architecture has one physical/spatial owner, while gameplay and presentation consumers remain separate. A future task can therefore execute, for example, “Read `VR_LARGE_GLYPH_ACTOR_MIGRATION.md` and implement M1,” without reopening decisions assigned to later phases.
