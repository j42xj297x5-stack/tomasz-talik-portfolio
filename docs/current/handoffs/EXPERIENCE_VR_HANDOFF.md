# Experience VR Handoff

## Current gameplay baseline

The player enters directly inside the glyph circle at `(0, 0, 5.8)`, looking toward the center. Session startup compensates the tracked head X/Z offset by moving only `playerRig`. The old entry-glyph/transition flow is not active.

Smooth turn remains on the left joystick. Right-joystick movement is horizontal and relative to the current world-space tracked head direction, including physical head rotation combined with rig yaw; diagonal movement is speed-capped. Locomotion changes only `playerRig` and never writes the tracked camera pose.

A trigger hold on a currently targeted glyph lasts `0.5 s`. Holds belong to individual controllers, are advanced by frame delta, complete once per `selectstart`, and cancel on target loss, trigger release, disconnect or reset. Completion selects the first page by `order` that is not activated and has no live crystal, then calls the additive single-instance spawn path.

## Crystal and progress contract

All 18 unique card crystals can coexist. Repeated glyph holds advance through that branch; variants cycle `1, 2, 3`. Deterministic free spawn slots respect `minimumSpacing`. Both controllers can independently pull/hold one crystal, while the reliquary accepts only one `inserted`/`active` crystal. Dropping outside the socket returns a crystal to `available` without progress.

`activateInserted()` records the card immediately in `activatedPageIds`; release removes the active crystal but keeps progress. The registry is readable through `hasActivatedPage()` / `getActivatedPageIds()`, with legacy read aliases retained. A glyph stays visible and orbiting but becomes non-interactive and unlit once it has no unactivated, unspawned page. `isLevelComplete()` requires all 18 unique activations.

## Reset and validation notes

Session reset removes all crystal instances, clears controller hits and holds, restores player start/orientation and the portal waiting message, but preserves activation IDs for the lifetime of the prepared runtime. Consequently only unactivated cards can be generated after reset.

No victory presentation, additional level, physics, collision, throwing, new assets, new dependency, card copy change, glyph orbit change, portal/reliquary/button redesign, Classic 2D change or Experience 3D change belongs to this handoff.
