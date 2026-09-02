# Experience VR Platform Energy VFX Model

Status: **KANON / PARTIALLY IMPLEMENTED (R3b + R3c + Asterion energy profiles and arc visual upgrade)**. Dokument opisuje wspólną warstwę proceduralnej energii platformy. `RUNE_BINDER_REVEAL`, `SECTOR_ACQUISITION` i `FLOOR_DRIVE` działają w runtime; `RUNE_INSTALL` pozostaje targetem. Liczby w settings są TUNING, nie kanonem architektury.

## Stan implementacji R3b

**IMPLEMENTED:** jeden shared pair-generic `PlatformEnergyVfxActor`, cienkie read-only projections oraz stochastic leader-inspired, physics-inspired presentation model ścieżki. Midpoint/fractal generator buduje angular, niewygładzany kanał w bolt-local perpendicular frame, skaluje macro tortuosity długością bolta i nakłada hierarchiczne macro + micro załamania. Zachowuje longitudinal variable width, jasny wąski core i miękką additive halo w jednym ribbon shaderze, bounded per-bolt variation, płytki 3D surface lift, bounded `0..N` jednopoziomowe branches oraz profile `RUNE_BINDER_REVEAL`, `SECTOR_ACQUISITION` i `FLOOR_DRIVE`. Branches zajmują zwykłe sloty tego samego bounded poola, nie rekurują i są fail-soft pomijane przy saturation. Reusable slot geometry/material i midpoint/fractal storage powstają tylko przy construction; spawn nie alokuje nowych GPU resources ani nie przelicza bounding sphere. Bounded shallow depth pozostaje w rozszerzonym envelope. Binder feed zachowuje exact true presentation endpoint, a pierwszy i ostatni punkt main path pozostają exact. Model nie jest symulacją elektromagnetyczną.

**NOT IMPLEMENTED:** niezależne wielowarstwowe bolt shells (core + halo jest jednym shaderem), gwarantowany retry final pulse przy wyczerpanym poolu, `RUNE_INSTALL`, detent sparks, motion/detent audio, field/lensing i target response.

## Klasyfikacja ustaleń

- **KANON** — wiążąca granica architektury, ownership albo przepływ danych przyszłej implementacji.
- **FACT** — istniejący stan runtime, na którym model polega i którego VFX nie może zastąpić.
- **TUNING** — parametr prezentacyjny wymagający osobnej decyzji i testów; nie jest prawem architektonicznym.

## Current ownership and source flows

One pair-generic `PlatformEnergyVfxActor` is the implemented owner of reusable platform-energy presentation resources. Thin projections read existing owner state and issue bounded presentation commands. Actor and projections never write progression, Rune installation truth, acquisition truth, sector levels, physical motion or Resonator Field truth.

Implemented flows are:

```text
sector-complete readiness transition → RUNE_BINDER_REVEAL ─┐
R2A ACQUIRING state + progress       → SECTOR_ACQUISITION ─┼→ read-only projections → PlatformEnergyVfxActor → sector-local ribbon bolts
R2B same-frame physical angle change → FLOOR_DRIVE ────────┘
```

`RUNE_INSTALL` is a separate future profile. Its intended source is read-only Rune installation transient state, but no current projection or actor API implements that profile. The CURRENT `FLOOR_DRIVE` source is local EARTH/WOOD/FIRE physical angle change, not the old global Asterion Gyro `driveActive` / angular-speed / lock contract. This current ownership does not prohibit a separately designed global-drive energy concept in the future.

### Implemented source truth

- `RUNE_BINDER_REVEAL` consumes live successful sector-complete readiness transitions. Hydration restores settled `DOCKED`/`BOUND` state without replaying VFX or audio.
- `SECTOR_ACQUISITION` consumes only the existing R2A `ACQUIRING` state and normalized acquisition progress. Leaving `ACQUIRING`, including transition to `LOCKED`, stops new acquisition spawns.
- `FLOOR_DRIVE` requires the moving glyph plus an actual same-frame change in `currentAngleDegrees`. Stationary `DRIVING` or `DETENT_HOLD` labels do not produce energy, while physically changing `SETTLING` angles do.
- Binder feeds query the live Rune Bridge presentation endpoint. When it is available, world-to-sector-local conversion preserves the true moving endpoint; when unavailable, the actor fails soft to a sector-surface bolt.
- `VrTiltableFloorRoot` remains the common global platform transform. Sector-local mounts and bounds make effects inherit global and local MotionRoot transforms without magic world offsets.

### Spatial and rendering contract

Each sector provides a bounded, invisible sector-local energy region used only to sample bolt endpoints. It is not a collider, trigger or gameplay source. Platform Energy bolts are shader-expanded screen-facing ribbons with longitudinal variable width and a combined near-white narrow core plus softer additive halo in one shader/material. They are distinct from the sector acquisition beam, which is a separate true volumetric tapered tube.

The shared stochastic, leader-inspired / physics-inspired generator creates angular, unsmoothed paths in stable bolt-local perpendicular frames. Macro tortuosity scales from bolt length and smaller hierarchical bends provide micro structure with bounded shallow depth. Spawn-time path and variation sampling uses `Math.random()`; per-frame flicker is deterministic from stored seed and age. This is presentation, not an electromagnetic simulation.

Branches are implemented and bounded. Origins are curvature-biased from final rendered main-path points, with a legal internal-point fallback for practically straight paths. One-generation branches depart forward from the local parent tangent in a stable bolt-local perpendicular frame, use reduced leader tortuosity and never create branches of branches. Reveal, `FLOOR_DRIVE` and Binder feeds allow `0..3`; acquisition is strength-scaled and capped at one. A saturated shared pool may omit a branch without cancelling its main bolt. Independent multilayer bolt shells are future and not implemented.

### Profiles

#### `RUNE_BINDER_REVEAL` — implemented

Sector completion materializes the persistent Rune Binder independently of Rune installation. The profile carries sector-local energy toward the live Binder presentation endpoint and drives reveal progress without creating readiness or persistent truth. The physical live arrival remains `arrivalDistanceMeters = 130` and `arrivalDurationSeconds = 4.0`; RuneBridge, not VFX, owns `HIDDEN → ARRIVING → DOCKED` truth and translation.

**CURRENT TUNING:** `revealTravelSeconds = 0.7` and `binderMaterializeSeconds = 0.42` still control only the initial travel/materialization choreography. They are not stretched to four seconds. `platformEnergyVfx.runeBinderRevealDurationSeconds = 4.0` instead defines the **spawn lifecycle duration**: from `t=0.0`, ordinary short-lived pooled reveal bolts continue spawning through the early materialization and after it, until approximately `t=4.0 s`. Then the actor stops scheduling ordinary reveal bolts and attempts the final reveal pulse; already-active slots expire naturally according to their unchanged short `boltLifetimeSeconds`. A final pulse may be omitted if the pool is saturated; retry is not guaranteed.

The sustained presentation does not increase `maxActiveBolts`, extend individual bolt lifetime or create simultaneous unbounded geometry. It extends only the temporal duration of the existing stochastic presentation over the same bounded shared pool, preserving Quest 3S as the performance boundary. Hydration/reconstruction of an already-complete Binder restores settled state directly: no live four-second arrival, reveal lifecycle, `electricity_short_06` or `zwornik_*` replay.

#### `SECTOR_ACQUISITION` — implemented

Acquisition progress controls a conservative sector-local spawn rate and strength. The profile owns presentation only and stops spawning at `LOCKED`; it does not acquire, power or lock a sector.

#### `FLOOR_DRIVE` — implemented

Actual same-frame local sector angle changes drive sector-local arcs. A bounded fraction may feed the live Binder endpoint. The profile does not infer motion from stale phase names and does not integrate or command sector motion.

#### `RUNE_INSTALL` — future / not implemented

A future profile may read an existing legal installation transient and present circuit closure without owning capture, readiness, installation or persistent truth. Its exact command surface and final-pulse semantics remain future work.

## Actor lifecycle and API status

| Operation | Current status and ownership |
| --- | --- |
| `beginRuneBinderReveal(branchId)` | **IMPLEMENTED:** begins presentation for an observed readiness transition; does not complete a sector or create Binder truth. |
| `setSectorAcquisitionEnergy(branchId, strength)` | **IMPLEMENTED:** accepts read-only acquisition progress and controls only its VFX envelope. |
| `setFloorDriveEnergy(branchId, active)` | **IMPLEMENTED:** receives the result of actual-angle-change detection; does not accept or create a motion command. |
| `update(deltaSeconds)` | **IMPLEMENTED:** advances bounded presentation lifetimes, deterministic seeded flicker, reveal progress and pooled bolts. |
| `reset()` | **IMPLEMENTED:** clears transient presentation state and active bolts without changing gameplay truth or replaying persistent state. |
| `dispose()` | **IMPLEMENTED:** releases actor-owned geometry/material resources without disposing dependencies. |
| Rune installation start/progress/completion commands | **FUTURE / NOT IMPLEMENTED:** reserved for `RUNE_INSTALL`; no current actor API owns them. |

The known settings contract does not restore ordering for `acquisitionSpawnIntervalStartSeconds` / `acquisitionSpawnIntervalEndSeconds` or `acquisitionStrengthMin` / `acquisitionStrengthMax`. Values retain finite runtime paths, so this gap is not an undefined/NaN-path failure.

## Adaptacja Lightning-VFX

**FACT:** źródłem inspiracji/adaptacji jest [Lightning-VFX](https://github.com/SahilK-027/Lightning-VFX), autor Sahil K, licencja MIT (2026). Upstream jest demem Three.js, nie biblioteką o docelowym API projektu.

**KANON — adaptować tylko potrzebny rdzeń:** procedural path generation, midpoint/fractal displacement, bounded one-generation branching, a shader-expanded screen-facing ribbon, `ShaderMaterial`, additive blending and short reveal/fade oraz opcjonalnie bardzo oszczędne sparks albo lokalny flash geometrii.

**KANON — nie przenosić:** upstreamowej sceny, kamery, camera shake, screen flash/overlay, terrain/grid, ground cracks, debris, shockwave, auto storm, `lil-gui`, `vite-plugin-glsl` ani osobnej zależności npm `three`.

**KANON:** przyszła implementacja korzysta z istniejącego vendored Three.js projektu. Shader może być lokalnym modułem/stringiem zgodnym z istniejącym buildem; nie ustanawia się pluginu GLSL. Jeśli implementacja skopiuje lub zaadaptuje istotne fragmenty upstreamowego kodu, musi zachować wymagane przez MIT copyright i permission notice. Ten dokument nie kopiuje kodu ani pliku licencji.

## Meta Quest 3S — granica wydajności i komfortu

**KANON:** Meta Quest 3S jest urządzeniem docelowym i boundary dla projektu efektu:

- brak camera shake i screen-space flash;
- brak wymagania bloom lub postprocessingu;
- brak dynamicznej fizyki debris i ciężkiej osobnej sceny efektowej;
- bounded liczba jednoczesnych wyładowań;
- reuse/pooling zasobów GPU zamiast nieograniczonego tworzenia i usuwania;
- additive transparent materials z `depthWrite = false`;
- poprawne działanie camera-facing ribbon w stereoskopowym WebXR;
- hardware/perceptual QA na Quest 3S pozostaje osobną bramką, a nie twierdzeniem tego dokumentu.

**TUNING:** limit aktywnych boltów, liczba segmentów i branches, spawn rate, jasność, grubość, kolor, fade time, wszystkie krzywe intensywności oraz paleta. Dokument nie ustanawia semantycznych kolorów rodzin.

## Wyłączenia

**CANON:** the model does not own audio, Resonator Field truth, Scenario or Director behavior and does not change Rune lifecycle, acquisition, sector-control, progression or runtime dependencies. `RUNE_INSTALL`, independent multilayer shells, Field/lensing, target response, relevant audio and hardware/perceptual QA remain outside the implemented boundary.


Pole Rezonatora ma odrębny język prezentacyjny inspirowany soczewkowaniem grawitacyjnym — rozjaśnienie, powiększenie, zakrzywienie, caustic-like arcs i deformację obrazu — zamrożony w [`VR_ASTERION_RESONATOR_FIELD_MODEL.md`](VR_ASTERION_RESONATOR_FIELD_MODEL.md). Field lensing presentation może otrzymywać read-only wynik Resonator Field Domain, lecz nie należy do `PlatformEnergyVfxActor`; dokładna nazwa klasy/API i podział projection/actor pozostają otwarte. `PlatformEnergyVfxActor` nie wyprowadza descriptoru, nie interpretuje `α/β/γ` jako gameplay truth i nie posiada target response. Nie wolno łączyć platform energy VFX, field, lensing i motion w jeden megasystem.


## Asterion energy profiles — IMPLEMENTED

The one shared bounded ribbon pool and midpoint/fractal generator now serve three presentation-transient semantics: `RUNE_BINDER_REVEAL`, `SECTOR_ACQUISITION`, and `FLOOR_DRIVE`. Acquisition reads the existing 1.0 s progress and increases a conservative shallow sector-local arc rate and strength; leaving `ACQUIRING`, including transition to `LOCKED`, stops new acquisition spawns while existing bolts expire naturally.

A thin read-only Asterion projection resolves glyphs through Progress Floor and detects physical drive solely from same-frame changes in `currentAngleDegrees` (epsilon `1e-4°`) plus the moving glyph. Consequently stale `DRIVING` during trigger suppression produces no energy, while real `SETTLING` motion does. Drive bolts sample the full sector wedge; a bounded fraction feeds the authored `BRIDGE_STONE_CAPTURE`. Rune Bridge returns its defensive world position from inside the scaled/offset presentation subtree, and the actor converts it with `mount.worldToLocal`; the feed envelope is the union of sector bounds and explicit endpoints, so downward MotionRoot hinges and the true endpoint remain intact. Missing endpoints fail soft to surface bolts.

The visual upgrade is implemented across all three profiles: asymmetric longitudinal width, a near-white narrow core with a soft colored halo and edge falloff, subtle per-spawn width/brightness/lifetime/tortuosity variation, deterministic seeded pseudo-flicker, shallow 3D surface lift, and bounded one-generation branches. Its stochastic leader-inspired, physics-inspired presentation model derives a perpendicular lateral/depth frame from every current sector-local segment, uses bolt-length-scaled macro displacement with a non-zero bounded macro magnitude, then faster-decaying micro displacement. The resulting channel remains angular and unsmoothed; depth is subordinate and clamped to the shallow surface envelope. Branch origins are curvature-biased exclusively on the final rendered `slot.points`, with a uniform legal-internal-point fallback for practically straight paths. Each branch starts at that exact point, follows the local parent tangent with a forward-biased `25–55°` departure, spans about `18–42%` of main length, and reuses the leader generator at reduced tortuosity while preserving its exact start and free endpoint. Reveal, drive, and Binder feeds allow `0..3` branches at full base probability; acquisition retains strength-scaled probability and at most one. Branch recursion is forbidden. Branches consume ordinary slots in the same pool and are omitted fail-soft at saturation; reusable midpoint/fractal storage allocates no geometry/material per spawn and no bounding sphere is recomputed. Main endpoints, including the true Binder endpoint, remain exact. This is not an electromagnetic simulation.

Still not implemented: independent multilayer bolt shells beyond the equivalent single-shader core + halo, `RUNE_INSTALL`, detent sparks, motion/detent audio, Field/lensing, target response, and Metal/Water motion. Hardware/perceptual QA has not been performed.
