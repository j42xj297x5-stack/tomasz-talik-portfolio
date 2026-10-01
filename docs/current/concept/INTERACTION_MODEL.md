# Interaction Model — Current Entry and Three Experiences

## Implemented entry loop

1. The lightweight entry shell opens before any presentation runtime.
2. The user selects `Polski` or `English`; the selection sets `document.documentElement.lang` and is persisted.
3. The localized mode screen exposes three distinct experiences: `Classic 2D`, `Experience 3D`, and `Orange Monkey VR` (the product-facing identity of the internal Experience VR runtime).
4. Classic 2D starts directly. Experience 3D is dynamically imported only after selection. Orange Monkey VR remains disabled while WebXR capability is checked and is enabled only in a secure context when `immersive-vr` is supported.
5. Each selected experience attracts attention through its own symbolic monkey-and-glyph language, exposes portfolio gates, and provides readable project/case-study content.

Principle: entry chooses language and experience; the selected experience attracts, the presentation explains, and the case study deepens. Lack of VR capability never blocks the other two experiences.

## Experience 3D loop

Experience 3D is the implemented atmospheric Three.js portfolio runtime.

1. Selection begins its loader and dynamically boots the runtime.
2. The central meditating monkey anchors five orbiting glyphs.
3. Hover provides a label/atmospheric response.
4. Selection opens the localized readable overlay for the matching portfolio gate.
5. Closing the panel returns to the glyph orbit.

## Classic 2D loop

Classic 2D is the implemented lightweight HTML/CSS/JavaScript experience, not a degraded fallback.

1. It starts without booting Three.js.
2. A front-facing monkey and five glyphs form the flat symbolic navigation.
3. A selected glyph opens localized shared portfolio content and case-study surfaces.
4. The user returns to the glyph circle or back to mode selection.

Its tone remains retro-mystic, calm, readable, non-comedic and non-meme-like.

## Orange Monkey VR / Experience VR

Orange Monkey VR is the portfolio-facing name; Experience VR is the internal/runtime name. After the capability-gated mode selection, its module prepares an independent WebXR scene and presents a separate `Enter VR` user gesture before requesting an immersive session. Its embodied interaction, Guidance, Scenario, Rune, Resonator and finale details remain owned by the dedicated Experience VR models.

## Shared interaction rules

- The three experiences use stable portfolio identities and localized content where their presentation requires it.
- Language and mode controls are ordinary readable buttons and remain usable without audio.
- Classic 2D and Experience 3D remain available independently of WebXR support.
- Reduced-motion and accessibility behavior belongs to each presentation owner; this concept model does not override their runtime contracts.
- `Experience` remains the canonical spelling in English labels.
