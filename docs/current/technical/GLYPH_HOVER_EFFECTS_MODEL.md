# Glyph Hover Effects Model

## Active contract

All five Experience 3D glyphs use one shared, subtle hover response: a one-shot scale pulse with a neutral hover light. There are no special hover effects selected by glyph identity.

## Lifecycle

1. Fine-pointer entry onto a new glyph starts the visual `idle → playing → idle` response. If no hover-audio lifecycle is pending, active, or fading, it also starts the one-shot source immediately at local gain 0; an equal-power curve raises it to full local gain over exactly 0.5 seconds.
2. While the pointer remains over the same stable `userData.id`, pointer movement restarts neither response. A glyph-to-null raycast waits 100 ms before clearing; reacquiring that ID cancels the pending exit without restarting audio.
3. A sustained raycast miss fades after that grace window. Canvas/window leave, drag, click, and interaction locking bypass it and clear immediately. The current hover sound fades from its held gain to exactly 0 over 1 second, remains connected and silent for another 0.5 seconds, then stops and disconnects; the visual one-shot still completes naturally.
4. The audio lifecycle remains occupied through its final 0.5 seconds of silence and ends only at source cleanup. Start attempts during any occupied phase are ignored, never queued or replayed; only a fresh pointer entry after cleanup may start a new one-shot.
5. Hover state is stored per node, so a completed or departing node does not reset another node's lifecycle.

## Transition safety

When a plaque/camera transition begins, new hover triggers are blocked. The selected node leaves the common hover treatment and uses the separate neutral transition-light lifecycle. This prevents hover restarts while interaction is locked, orbit is paused, the plaque sequence runs, or the panel is open.

Click/opening and `clearInteractiveHover()` use the same non-blocking audio fade-out schedule. Direct movement to another glyph updates the visual hover normally but does not interrupt, replace, or restart the occupied audio lifecycle. An explicit pending-start state prevents rapid calls during unlock or loading from creating multiple sources. Repeated stops and cleanup are idempotent, and natural endings can clean up only once. The preloaded runtime buffer also fades the final up-to-one-second portion of every channel to exact zero and appends 0.5 seconds of silence, preventing a non-zero natural endpoint. A request token prevents unlock or buffer loading from starting a sound after its hover has already ended. Like every effect, hover audio receives the fixed −3 dB effects-bus trim while remaining subordinate to master, mute, and the Effects control; the intro's separate +5 dB trim is outside this lifecycle.

## Exclusions

Tree growth, fire, sparks, and ember-sphere effects are outside the active runtime. They are not loaded, attached, triggered, or updated by the current Experience 3D hover path.

Hover audio is mouse/fine-pointer-only. Touch/coarse-pointer input, camera dragging, locked interaction, an open panel, Classic 2D, HTML controls, and programmatic glyph state changes do not start it.

## Guardrail

Keep hover informative and light: do not add per-glyph particles, auras, elemental effects, postprocessing, or unique motion without an explicit new interaction decision.
