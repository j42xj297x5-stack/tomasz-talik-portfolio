# Glyph Hover Effects Model

## Active contract

All five Experience 3D glyphs use one shared, subtle hover response: a one-shot scale pulse with a neutral hover light. There are no special hover effects selected by glyph identity.

## Lifecycle

1. Fine-pointer entry onto a new glyph starts the visual `idle → playing → idle` response and the one-shot hover sound immediately, at full local gain and without fade-in.
2. While the pointer remains over the same glyph, pointer movement restarts neither response.
3. Leaving the glyph, canvas, or window clears hover/label state and fades the current hover sound out for exactly 0.5 seconds before stopping and disconnecting it; the visual one-shot still completes naturally.
4. Once the runtime returns to `idle`, a later pointer entry may start a new one-shot.
5. Hover state is stored per node, so a completed or departing node does not reset another node's lifecycle.

## Transition safety

When a plaque/camera transition begins, new hover triggers are blocked. The selected node leaves the common hover treatment and uses the separate neutral transition-light lifecycle. This prevents hover restarts while interaction is locked, orbit is paused, the plaque sequence runs, or the panel is open.

Click/opening and `clearInteractiveHover()` use the same audio fade-out. Direct movement to another glyph starts its sound immediately while the previous sound finishes its bounded fade. A request token prevents unlock or buffer loading from starting a sound after its hover has already ended.

## Exclusions

Tree growth, fire, sparks, and ember-sphere effects are outside the active runtime. They are not loaded, attached, triggered, or updated by the current Experience 3D hover path.

Hover audio is mouse/fine-pointer-only. Touch/coarse-pointer input, camera dragging, locked interaction, an open panel, Classic 2D, HTML controls, and programmatic glyph state changes do not start it.

## Guardrail

Keep hover informative and light: do not add per-glyph particles, auras, elemental effects, postprocessing, or unique motion without an explicit new interaction decision.
