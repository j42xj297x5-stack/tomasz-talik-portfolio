# Interaction Model (Planned Entry + Dual Modes)

Planned expanded core loop:
1. User enters the lightweight entry shell.
2. User chooses language: `Polski` or `English`.
3. User chooses mode: `Classic 2D` / `Experience 3D` in English, or `Klasyczne 2D` / `Doświadczenie 3D` in Polish.
4. The selected experience attracts attention through its symbolic monkey-and-glyph loop.
5. User explores portfolio gates.
6. Panel explains the selected gate in readable HTML/UI space.
7. Case study deepens and confirms value.
8. User returns to the experience loop and explores the next gate.

Principle: entry chooses language and mode, experience attracts, panel explains, case study deepens.

## Experience 3D loop

This is the current implemented Three.js portfolio runtime.

Loop:
1. Loader starts after the future `Experience 3D` selection.
2. Current 3D assets load.
3. Central meditating monkey anchors the scene.
4. Five glyphs orbit around the monkey.
5. Hover reveals a label or atmospheric visual response.
6. Click opens the readable overlay panel for the matching portfolio gate.
7. User closes or leaves the panel and returns to the 3D glyph orbit.

The current Three.js runtime, scene atmosphere, glyph gates, hover/click overlay behavior, and deployment-safe asset model remain intact.

## Classic 2D loop

This is a planned lightweight, flat, symbolic second experience. It is not a degraded fallback and not a broken copy of the 3D scene.

Loop:
1. `Classic 2D` starts without booting the heavy Three.js scene.
2. A front-facing meditating monkey becomes the flat symbolic anchor.
3. Five glyphs orbit around the monkey on a flat circle.
4. Clicking a glyph subtly rotates or tilts the monkey.
5. A readable panel opens or slides out.
6. The panel reads from the same portfolio gate content as the matching 3D gate.
7. User returns to the flat glyph circle and explores the next gate.

The visual tone should be retro mystic and atmospheric, inspired by old Atari/Commodore-era interfaces, but calm, readable, non-comedic, non-meme-like, and not noisy. The monkey remains an archetypal symbolic anchor rather than a joke mascot.

## Shared interaction rules

- Both modes should use the same gate IDs and content records.
- Language and mode choices must be readable and keyboard-accessible in future implementation.
- Reduced motion should be respected.
- `Experience` must be spelled correctly in English mode labels.
- Final bilingual copy remains draft until a separate copy-locking pass.
