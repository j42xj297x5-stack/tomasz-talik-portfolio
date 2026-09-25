# Experience VR — Spherical Layers Model

Status: **CURRENT**. This model owns world-stable concentric allocation ranges; it does not own Large Glyph gameplay stages.

## Canonical world-space registry

| Layer | Range | Current use |
| --- | ---: | --- |
| `SHELLS` | `13–25 m` | implemented Shell field |
| `SMALL_GLYPHS` | `30–45 m` | implemented Small Glyph field |
| `RUNE_STONES` | `50–75 m` | implemented natural and Ether Rune placement |
| `STARS` | `85–130 m` | implemented celestial field |

Ranges are world-space and independent of the platform's `worldBaseRadius`. The registry resolves deterministic non-overlap and gives each consuming actor its bounded range.

## Hidden Glyph decision

A dedicated `HIDDEN_GLYPHS` world/spherical gameplay layer is intentionally not used in the final product and will not be implemented. The retained configuration/resolver reservation is not an implementation target and owns no content. Large Glyphs instead remain under their actor: at the late `SPHERE_FAR` stage they use black, light-insensitive materials and are nearly invisible until acquisition reaches `PULL_READY`, which restores the target's authored materials. That presentation is the intended hidden-glyph behavior.

## Large Glyph exclusion

Large Glyph stages (`RING_INITIAL`, `RING_ELEVATED`, `RING_EXPANDED`, `SPHERE_FAR`) are actor-owned semantic positions, not entries in this registry. Their late angular/radial motion and material changes must not be modeled as spherical-layer allocation.

## Rune layer contract

Rune actors receive the `RUNE_STONES` range for deterministic world-stable placement. Transport, carried orbit, installation and Ether capture can leave that allocation; their domain actors then own the live transform. The layer never owns Rune progression or reconstruction truth.
