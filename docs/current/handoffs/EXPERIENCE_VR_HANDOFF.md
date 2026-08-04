# Experience VR Handoff

Status: self-contained current snapshot for the next implementation stage, **2026-08-03**. The [runtime model](../technical/VR_RUNTIME_MODEL.md) is the detailed authority; code is implementation evidence.

## IMPLEMENTED

- Experience VR is an independent WebXR runtime with `playerRig` locomotion, tracked-controller handedness resolved after connection, ordinary `2.3 m` rays and transient-session reset. Committed page and furnace progress survives XR re-entry in the prepared page only; there is no durable save.
- The portfolio loop is glyph hold → branch+tier crystal → reliquary Activate preview → Release commit → floor panel/tier ring. `VrProgressionController` exclusively owns this card/tier domain.
- Tier 1 unlocks Astro and 18 orbiting shells (six assets × three instances). Right A switches `NORMAL_HAND ↔ ASTRO_ATTRACTOR`; squeeze scans analytically, trigger pulls, and a `capture_ready` shell requires explicit left ordinary-ray+squeeze takeover. Placed shells remain ordinary-ray re-grabbable.
- Astro Furnace starts unconfigured (`activeMode = null`). Option is the first step: its stronger local hover opens the panel, selection of Asterion Sphere activates `floor_gyroscope_sphere`, and the knob rotates `+90°` on local Y. Open, insertion and Activate remain gated until that selection.
- A configured open chamber continuously shows its cylindrical insertion guide. Entry of a held shell's `boundingCenter` triggers automatic takeover for a missing required type; duplicate/unknown shells receive invalid feedback and are pushed out immediately. Snap also uses `boundingCenter`, preserves world scale and only downscales to fit. Reopening before processing permits retrieval.
- Activate runs one synchronized 18-second profile: **SPINUP 0–3 s, STEADY 3–6 s, EXTRACTION 6–15 s, COOLDOWN 15–18 s**. One `extractionProgress 0→1`, active only in EXTRACTION, drives both physical-shell dissolve and panel dissolve/patch assembly. Commit remains strictly `CONSUMED + COMPLETE`.
- Chamber spin is isolated to the process pivot. `fire_cell` and shell pulses share process phase; the shadowless internal `PointLight` counter-rotates against the chamber around a stable axis/reference.
- The panel uses front and back `FrontSide` planes with one shared `CanvasTexture`, providing normal, unmirrored reading from either side. It is placed at about `0.10 m` gap and `-12°` yaw. The visible Asterion screen redraws at a throttled rate even in IDLE, so its sphere rotates continuously.
- The panel has real mini-wireframes and **BRAK / W PROCESIE / ZGROMADZONA** states. Its rotating Asterion visualization combines a deterministic full-sphere ghost with six audit-derived, identity-fixed `±X / ±Y / ±Z` shell patches, curved spherical mapping with subdivision, and front/back culling. During EXTRACTION the current wireframe dissolves while the corresponding pending patch appears; it commits only at COMPLETE.
- `VrAstroFurnaceProgressionController` exclusively owns one binary slot for each exact `shell-relic-1` through `shell-relic-6`. The panel is a read-only projection. `6/6` means a complete material/holographic panel model, not a physical object. Runtime consumes exported data from the [deterministic six-GLB audit](../audits/asterion-shells/asterion-shell-geometry-audit.md); it performs no PCA or GLB analysis.

## FUTURE — NEXT STAGE

- [ ] Construct and materialize the **physical Asterion Sphere** from the completed six-material set; `UTWÓRZ` belongs to this new system, not to the existing panel.
- [ ] Equip the physical sphere in the left hand.
- [ ] Add later bounded floor control/spatial-gyroscope behavior.
- [ ] Continue progression through small glyphs.

The next stage must preserve furnace-controller ownership of material progression and must not reinterpret the panel preview or `6/6` as an already materialized sphere.
