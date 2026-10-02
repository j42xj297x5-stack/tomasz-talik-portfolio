# Dependency Map

Status: **CURRENT**, synchronized with implemented runtime on 2026-10-02.

## Documentation flow

`PROJECT_INDEX → canonical model → runtime evidence`. Runtime behavior is authoritative evidence; historical audits and legacy plans do not override CURRENT models.

- Scenario/runtime: [`VR_RUNTIME_MODEL.md`](../technical/VR_RUNTIME_MODEL.md) and [`VR_SCENARIO_DIRECTOR_MODEL.md`](../technical/VR_SCENARIO_DIRECTOR_MODEL.md).
- Experience VR audio: [`VR_AUDIO_MODEL.md`](../technical/VR_AUDIO_MODEL.md).
- Rune state: [`VR_RUNE_STONES_MODEL.md`](../technical/VR_RUNE_STONES_MODEL.md).
- Resonator and field: [`VR_ASTERION_RESONATOR_MODEL.md`](../technical/VR_ASTERION_RESONATOR_MODEL.md) and [`VR_ASTERION_RESONATOR_FIELD_MODEL.md`](../technical/VR_ASTERION_RESONATOR_FIELD_MODEL.md).
- Late experience/finale: [`EXPERIENCE_VR_RUNES_RESONATOR_FINALE.md`](../concept/EXPERIENCE_VR_RUNES_RESONATOR_FINALE.md).

## Experience VR composition and authored boundary

```text
SPINE → SCENARIO → DIRECTOR → RuntimeExperience → actors / domain owners

4.80 → 5.10 → 5.15 → 5.20 → 5.30 → 5.40 → 5.50
→ 5.60 → 5.70 → 5.80 → 6.10 → 6.20 → 6.30 → 100.10
```

`5.60` is the full-Resonator teaching boundary, not the end of authored Scenario. `5.70` owns the final Water hunt, `5.80` the farewell, `6.10` world release, `6.20` credits, `6.30` the brand slate, and `100.10` terminal XR exit. Scenario owns ordering and semantics; domain owners retain physical and committed truth.

The bounded Rings 1–3 reconciler remains a forward-only observer of domain truth through stable `5.10`. It neither owns nor limits the implemented later Scenario tail.

## Furnace and audio dependency flow

```text
accepted insertion / process kind / settled Rune or Ether truth
→ bounded audio projection
→ VrAudioBridge
→ prepared decoded cache
→ shared bus or HRTF emitter
```

The Furnace owns five kinds: `SHELL_EXTRACTION`, `SMALL_GLYPH_ESSENCE_EXTRACTION`, `RUNE_TUNING`, `ASTERION_CONSTRUCTION` and `ASTRO_ATTRACTOR_CONSTRUCTION`. Its insertions and processes use the Furnace spatial emitter. Scenario selects main ambient programs, including active `ambient_05` at Tier 4 completion; the audio model owns exact cue and tail mappings. READY remains downstream of complete reachable-audio preparation, so runtime playback is cache-only.

## Rune, Ether, Resonator and finale flow

```text
fourth natural Rune + Tier 4
→ final-Water two-ring rejection
→ Ether intervention / tuning / transport
→ Ether CAPTURED at Monkey
→ Water readiness and ordinary installation
→ five natural Runes / full Resonator teaching
→ balanced 222 / M22 / W22 lock
→ final Water acquisition and Tier 5
→ farewell → world release → credits → brand → END_XR_SESSION
```

Ether never enters a natural slot. Capture persists Water readiness and projects one Monkey-anchored `noise_laud_loop_09` emitter; reconstruction restores the emitter silently. Water control, `waterSyncLock`, the final cap policy and the complete finale are implemented, not future dependencies. There is no Water Sync Contact, strong Haiku damping, final-Water acceleration or additional lightning work.

## Ownership invariants

- Installed natural Rune truth powers its sector; sector control and Field Actor own physical control/descriptor truth.
- Field presentation and lightning read the descriptor; they do not confirm gameplay state.
- Target acquisition owns rings, ceiling cycling and `PULL_READY`; Astrolabium owns the legal pull.
- Scenario/Guidance/finale actors own authored ordering, hints and terminal presentation.
- Audio observes semantic/domain truth and never mutates it.
- Unowned physical audio assets are not dependencies or backlog.

## Future boundary

Only genuinely unimplemented work belongs in the gameplay roadmap. Implemented Water synchronization, final Water Guidance/hunt, farewell, world release, credits, brand slate and XR exit must not be routed as future work.
