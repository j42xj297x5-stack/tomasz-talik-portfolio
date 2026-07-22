# Glyph Hover Effects Model

## Active contract

All five Experience 3D glyphs use one shared, subtle hover response: a one-shot scale pulse with a neutral hover light. There are no special hover effects selected by glyph identity.

## Lifecycle

1. Pointer entry onto a new glyph starts `idle → playing → idle`.
2. While `playing`, pointer movement over the same glyph does not restart the one-shot.
3. `pointerleave` clears hover/label state, but the running one-shot completes naturally.
4. Once the runtime returns to `idle`, a later pointer entry may start a new one-shot.
5. Hover state is stored per node, so a completed or departing node does not reset another node's lifecycle.

## Transition safety

When a plaque/camera transition begins, new hover triggers are blocked. The selected node leaves the common hover treatment and uses the separate neutral transition-light lifecycle. This prevents hover restarts while interaction is locked, orbit is paused, the plaque sequence runs, or the panel is open.

## Exclusions

Tree growth, fire, sparks, and ember-sphere effects are outside the active runtime. They are not loaded, attached, triggered, or updated by the current Experience 3D hover path.

## Guardrail

Keep hover informative and light: do not add per-glyph particles, auras, elemental effects, postprocessing, or unique motion without an explicit new interaction decision.
