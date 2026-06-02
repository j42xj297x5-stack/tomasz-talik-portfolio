# Entry Flow and Modes Model

Status: implemented baseline for entry shell and conditional Experience 3D boot; Classic 2D remains placeholder/future work.

## Purpose and scope

This document describes the implemented entry shell baseline and the remaining future direction for Classic 2D and shared PL/EN content. The portfolio now starts with a lightweight language-first, dual-mode entry shell before the current Three.js runtime can boot.

Scope:
- implemented first-screen language selection,
- implemented second-screen mode selection,
- implemented conditional boot into `Experience 3D`,
- current placeholder-only `Classic 2D` branch,
- contract between `Classic 2D` and `Experience 3D`,
- shared content and future PL/EN direction,
- loading, accessibility, and performance rules for current behavior and later refinement.

This remains a documentation-only contract update. It does not change UI, runtime boot logic, styles, assets, routing, framework usage, or final copy.

## Current status

Status: implemented baseline / partial mode completion.

Implemented now:
- Entry shell is implemented in `src/main.js`.
- Language selection is implemented.
- Mode selection is implemented.
- `Experience 3D` conditional boot is implemented.
- The current Experience 3D runtime bootstrap is owned by `src/experience3d.js`.

Still not implemented:
- `Classic 2D` is currently a placeholder-only branch.
- A full Classic 2D portfolio experience is not implemented yet.
- Shared PL/EN content records and a final bilingual content source-of-truth remain future work.

The active implemented 3D runtime remains the current desktop/mobile Three.js portfolio based on the central monkey, orbiting glyphs, loader, scene atmosphere, and HTML overlay panels. The entry shell must continue to preserve that runtime after `Experience 3D` selection.

## Entry flow diagram

```text
Visitor opens portfolio
        |
        v
[Entry shell loads first — implemented in src/main.js]
        |
        v
[Language selection — implemented]
  - Polski
  - English
        |
        | selected language is stored as entry state
        v
(short fade / dim / soft passage; future visual refinement)
        |
        v
[Mode selection — implemented]
  PL: Klasyczne 2D       | EN: Classic 2D
  PL: Doświadczenie 3D   | EN: Experience 3D
        |
        +----------------------------------------------+
        |                                              |
        v                                              v
[Classic 2D placeholder]                       [Experience 3D conditional boot]
placeholder-only branch now                    implemented dynamic boot via src/experience3d.js
future full lightweight symbolic UI            current Three.js loader/assets/runtime start
future shared gate content                      current scene behavior continues
future flat monkey + glyph loop                 current 3D behavior is preserved
```

## Language selection contract

Implemented language options:
- `Polski`
- `English`

Implemented behavior:
- The language screen is the first visible screen in the entry shell.
- It uses two readable language choices with symbolic flag-style support.
- The flag styling is navigation support, not a replacement for readable labels.
- After language selection, the entry flow moves to mode selection.
- Language is stored as entry state for the mode-selection labels.

Future refinements:
- The transition between language and mode selection may be refined as a short fade, dim, or soft passage.
- Accessibility polish should verify keyboard behavior, focus order, labels, contrast, readable text sizing, reduced-motion behavior, and usability without relying on motion alone.

## Mode selection contract

Mode labels must follow the selected language:

| Language | Classic mode | 3D mode |
| --- | --- | --- |
| Polish | `Klasyczne 2D` | `Doświadczenie 3D` |
| English | `Classic 2D` | `Experience 3D` |

Implemented behavior:
- Use `Experience`, not `Expirience`.
- Mode selection is a deliberate design choice, not an error/fallback prompt.
- Selecting `Experience 3D` / `Doświadczenie 3D` starts the current Three.js runtime conditionally through `src/experience3d.js`.
- Selecting `Classic 2D` / `Klasyczne 2D` currently opens a placeholder-only branch.

Future refinements:
- `Classic 2D` should become a finished lightweight, flat, symbolic portfolio mode.
- Mode selection should receive continued accessibility and reduced-motion verification as the visual treatment is refined.

## Classic 2D experience model

Current status: `Classic 2D` is placeholder-only. It is a stable branch point for future work, not a finished 2D portfolio runtime.

Future `Classic 2D` direction: it should become a first-class second experience. It should not be a plain fallback, degraded copy, or simplified broken version of the 3D scene.

Design qualities:
- fast,
- readable,
- atmospheric,
- calm,
- focused,
- retro-symbolic.

Future visual direction:
- retro mystic interface,
- inspired by old Atari/Commodore-era computer aesthetics,
- not comedic,
- not meme-like,
- not noisy,
- symbolic and readable rather than visually overloaded.

Future relationship to the 3D version:
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

Implemented boot model:
- `src/main.js` owns the lightweight language/mode entry shell.
- `src/main.js` starts `Experience 3D` only after the visitor selects `Experience 3D` / `Doświadczenie 3D`.
- `src/experience3d.js` owns the current Experience 3D runtime bootstrap.
- The current 3D runtime behavior is preserved after conditional boot.

## Shared content and i18n source-of-truth rules

The content model should evolve toward one shared source of truth for both modes.

Rules:
- Do not duplicate final text between `Classic 2D` and `Experience 3D`.
- Both modes should read from the same gate IDs and same content records.
- Future bilingual content should be represented as structured PL/EN content.
- Current draft status remains: final copy is not locked.
- User-facing labels may evolve before the final copy pass.
- Runtime IDs should not be renamed unless a separate migration task is created.

Current status: shared PL/EN content records remain future work.

## Loading and performance rules

Implemented loading baseline:
- The entry shell loads before heavy 3D assets.
- The 3D runtime does not eagerly load before the user selects `Experience 3D` / `Doświadczenie 3D`.
- The current Classic 2D placeholder branch does not start the 3D runtime.
- The current Three.js runtime remains intact and starts from `src/experience3d.js` after selection.
- Current deployment, public path, and base-path rules remain unchanged.

Known and future work:
- The existing large 3D chunk warning remains known and unchanged.
- Further loader staging and chunk optimization are future performance work.
- Future Classic 2D implementation should stay lightweight and avoid Three.js unless a future explicit decision changes that.
- Future implementation must preserve GitHub Pages compatibility under the existing deployment model.

## Accessibility rules

Future implementation and polish must:
- keep language selection keyboard-accessible,
- keep mode selection keyboard-accessible,
- provide readable labels for flag-style language choices,
- preserve sufficient contrast and readable text sizing,
- avoid motion-only state changes,
- respect reduced-motion preferences,
- keep `Classic 2D` as a conscious low-cost path for users/devices that do not need or cannot comfortably run the full 3D scene.

## Implementation phases

Progress:
1. Done — Document and accept the entry-flow contract.
2. Done — Add a lightweight entry shell before the heavy runtime path.
3. Done — Store language state and mode state in a simple framework-free model.
4. Done — Make `Experience 3D` boot conditional and preserve current runtime behavior after selection.

Future phases:
5. Build `Classic 2D` as a lightweight symbolic interface that consumes shared content records.
6. Refactor content planning toward shared gate records with PL/EN fields while keeping current runtime IDs stable.
7. Add accessibility, reduced-motion, keyboard, and performance verification passes.
8. Revisit loader/chunk strategy as a separate performance task.
9. Revisit final bilingual copy after the interaction rhythm is proven.

## Explicit non-goals

This document update does not:
- modify runtime code,
- modify `src` files,
- modify CSS,
- modify assets,
- change Vite configuration,
- change package files,
- change deployment or public-path rules,
- introduce React or another framework,
- rename runtime IDs,
- lock final English or Polish copy,
- remove or deprecate the current 3D experience,
- implement the full `Classic 2D` experience,
- implement shared PL/EN content records.
