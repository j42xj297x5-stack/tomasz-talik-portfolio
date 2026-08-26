# Experience VR — Spherical Layers Model

Status: **CURRENT / BINDING** for world-stable spherical volume allocation.

## Canonical world-space registry

| Layer | World-space range | Status | Runtime content |
| --- | ---: | --- | --- |
| `SHELLS` | `13–25 m` | IMPLEMENTED | Shell field and interaction |
| `SMALL_GLYPHS` | `30–45 m` | IMPLEMENTED | Small Glyph field and interaction |
| `RUNE_STONES` | `50–75 m` | IMPLEMENTED | five natural Rune Stone actors, scan/target and transport foundation |
| `STARS` | `85–130 m` | IMPLEMENTED | stars |
| `HIDDEN_GLYPHS` | `133.25–140.85 m` | RESERVED / NOT IMPLEMENTED | no current gameplay content |

These are explicit world-space ranges. They are not derived from `worldBaseRadius = 7.6 m`; that value remains a separate platform/locomotion contract. Each layer owns deterministic placement bounds, while its domain actor owns identity, interaction and state.

## Large Glyph exclusion

Large Glyph is not a spherical layer and is not registered under `VR_SPHERICAL_LAYER_IDS`. Its actor owns:

- `RING_INITIAL = 8.5 m`;
- `RING_ELEVATED = 8.5 m + 2.4 m elevation`;
- `RING_EXPANDED = 46 m`;
- `SPHERE_FAR = 80 m` — **IMPLEMENTED**.

After Tier 3, five Large Glyph slots use deterministic full-sphere directions, black/unlit presentation and very slow `0.01 rad/s` motion.

## Rune layer contract

`RUNE_STONES` contains exactly five natural physical actors (`earth`, `fire`, `wood`, `metal`, `water`). Ether has a descriptor but is not part of this natural collection or its early reveal. The actors begin hidden; at `2.10` a separate Scenario effect reveals them with the celestial world. Visibility does not grant targetability: availability and legal targets come from `tunedRuneFamilies`, hidden presentation blocks physical candidate legality, and installation readiness does not participate in scan, lock or transport.
