# Entry Flow and Modes Model

## Purpose and scope

This document defines the planned entry shell that will sit before the portfolio experience starts. It documents a language-first, dual-mode direction for the portfolio while preserving the existing Three.js runtime as the current implemented experience.

Scope:
- planned first-screen language selection,
- planned second-screen mode selection,
- contract between `Classic 2D` and `Experience 3D`,
- shared content and future PL/EN direction,
- loading, accessibility, and performance rules for later implementation.

This is a documentation-only planning document. It does not implement UI, runtime boot changes, styles, assets, routing, framework changes, or final copy.

## Current status

Status: planned / documentation-only.

The active implemented runtime remains the current desktop/mobile Three.js portfolio based on the central monkey, orbiting glyphs, loader, scene atmosphere, and HTML overlay panels. The future entry shell must be added without removing, deprecating, or breaking that runtime.

## Entry flow diagram

```text
Visitor opens portfolio
        |
        v
[Entry shell loads first]
        |
        v
[Language selection]
  - Polski
  - English
        |
        | selected language is stored as entry state
        v
(short fade / dim / soft passage; planned only)
        |
        v
[Mode selection]
  PL: Klasyczne 2D       | EN: Classic 2D
  PL: Doświadczenie 3D   | EN: Experience 3D
        |
        +-------------------------------+
        |                               |
        v                               v
[Classic 2D boot]                [Experience 3D boot]
lightweight symbolic UI          current Three.js runtime starts
shared gate content              loader starts and assets load
flat monkey + glyph loop         current scene behavior continues
```

## Language selection contract

Initial version language options:
- `Polski`
- `English`

Rules:
- The language screen is the first visible screen in the planned entry shell.
- It uses two flag-style choices with clear text labels.
- The flag styling is symbolic navigation support, not a replacement for readable labels.
- After language selection, the entry flow moves to mode selection.
- The transition may be a short fade, dim, or soft passage, but this is only a planned visual direction and is not implemented here.
- Future implementation must make the choices keyboard-accessible, readable, and usable without relying on motion alone.

## Mode selection contract

Mode labels must follow the selected language:

| Language | Classic mode | 3D mode |
| --- | --- | --- |
| Polish | `Klasyczne 2D` | `Doświadczenie 3D` |
| English | `Classic 2D` | `Experience 3D` |

Rules:
- Use `Experience`, not `Expirience`.
- `Experience 3D` means the current existing Three.js runtime: the loader starts, assets load, and the scene behaves as it does now.
- `Classic 2D` means a future lightweight, flat, symbolic portfolio mode.
- Mode selection is a deliberate design choice, not an error/fallback prompt.

## Classic 2D experience model

`Classic 2D` is a first-class second experience. It is not a plain fallback, not a degraded copy, and not a simplified broken version of the 3D scene.

Design qualities:
- fast,
- readable,
- atmospheric,
- calm,
- focused,
- retro-symbolic.

Visual direction:
- retro mystic interface,
- inspired by old Atari/Commodore-era computer aesthetics,
- not comedic,
- not meme-like,
- not noisy,
- symbolic and readable rather than visually overloaded.

Relationship to the 3D version:
- a central meditating monkey is shown from the front,
- five glyphs orbit around the monkey on a flat circle,
- clicking a glyph subtly rotates or tilts the monkey and opens or slides out a readable panel,
- each glyph opens the same portfolio content as the matching 3D gate,
- the monkey remains an archetypal symbolic anchor, not a joke mascot.

## Experience 3D relationship to current runtime

`Experience 3D` preserves the current implemented Three.js runtime direction:
- central symbolic monkey,
- five orbiting glyph gates,
- hover/click interaction,
- loader and GLB asset loading,
- atmospheric scene behavior,
- HTML/CSS overlay panels for readable content,
- GitHub Pages-compatible public asset handling.

Future entry-shell implementation should route into this current runtime only after the visitor selects `Experience 3D`. Until that implementation exists, the existing runtime remains the active behavior.

## Shared content and i18n source-of-truth rules

The content model should evolve toward one shared source of truth for both modes.

Rules:
- Do not duplicate final text between `Classic 2D` and `Experience 3D`.
- Both modes should read from the same gate IDs and same content records.
- Future bilingual content should be represented as structured PL/EN content.
- Current draft status remains: final copy is not locked.
- User-facing labels may evolve before the final copy pass.
- Runtime IDs should not be renamed unless a separate migration task is created.

## Loading and performance rules

Planned loading contract:
- The entry shell loads before heavy 3D assets.
- The 3D runtime should not eagerly load before the user selects `Experience 3D`.
- `Classic 2D` should stay lightweight and avoid Three.js unless a future explicit decision changes that.
- The current Three.js runtime must remain intact.
- Current deployment, public path, and base-path rules remain unchanged.
- Future implementation must preserve GitHub Pages compatibility under the existing deployment model.

## Accessibility rules

Future implementation must:
- make language selection keyboard-accessible,
- make mode selection keyboard-accessible,
- provide readable labels for flag-style language choices,
- preserve sufficient contrast and readable text sizing,
- avoid motion-only state changes,
- respect reduced-motion preferences,
- keep `Classic 2D` as a conscious low-cost path for users/devices that do not need or cannot comfortably run the full 3D scene.

## Implementation phases

Suggested future phases:
1. Document and accept the entry-flow contract. *(This document.)*
2. Refactor content planning toward shared gate records with PL/EN fields while keeping current runtime IDs stable.
3. Add a lightweight entry shell before the heavy runtime path.
4. Store language state and mode state in a simple framework-free model.
5. Make `Experience 3D` boot conditional and preserve current runtime behavior after selection.
6. Build `Classic 2D` as a lightweight symbolic interface that consumes the shared content records.
7. Add accessibility, reduced-motion, keyboard, and performance verification passes.
8. Revisit final bilingual copy after the interaction rhythm is proven.

## Explicit non-goals

This document does not:
- implement the entry shell,
- implement language selection UI,
- implement mode selection UI,
- implement `Classic 2D`,
- modify the current Three.js runtime,
- modify `src` files,
- modify CSS,
- modify assets,
- change Vite configuration,
- change deployment or public-path rules,
- introduce React or another framework,
- rename runtime IDs,
- lock final English or Polish copy,
- remove or deprecate the current 3D experience.
