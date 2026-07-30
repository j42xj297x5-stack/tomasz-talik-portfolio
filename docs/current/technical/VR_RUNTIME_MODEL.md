# Experience VR Runtime Model

## Runtime boundary and session start

Experience VR is an independent, dynamically imported WebXR runtime owned by `src/experienceVr.js`. It requests `local-floor` (with `local` fallback), owns its renderer, `playerRig`, camera, controllers and modules, and never starts Experience 3D. The configured start is `(0, 0, 5.8)`, facing the world center. After WebXR starts, the runtime measures the tracked head X/Z and moves only `playerRig` so the physical head reaches that point; it never writes the tracked camera pose. There is no entry-glyph selection, `activatedEntryGlyph`, or `createVrEntryTransition` in the active runtime.

## Glyph hold and exhaustion

Each controller independently raycasts the moving glyph meshes. `selectstart` captures the currently hit, non-exhausted glyph; `update(delta)` accumulates `glyphInteraction.holdDurationSeconds` (public/default `0.5 s`). Losing the hit, `selectend`, controller disconnect or reset cancels the hold. Crossing the threshold calls `onGlyphHoldComplete({ node, controllerIndex, handedness })` once, and another completion requires a new `selectstart`.

On completion the runtime sorts `getExperienceVrPages(glyphId)` by `order` and selects the first page that is neither activated nor represented by a live crystal. One crystal is spawned. A glyph is interactable while such a page exists. Once none exists it remains visible and orbiting, but has no targeting/hold feedback and cannot generate. Branch counts remain 3 / 3 / 3 / 4 / 5.

## Crystals and materialization

`createVrCrystalCollection.spawnOne(page, viewerFrame)` adds rather than replaces an instance. Every live card is unique and owns a wrapper, cloned model, `cardId`, `crystalId` and state. It spawns on the floor in front of the current head direction using the established scale, tilt, yaw and emergence animation. A deterministic nearest-free slot search enforces `minimumSpacing`, so repeated spawns do not coincide. Visual assets cycle by `((order - 1) % 3) + 1`, producing `1, 2, 3, 1, 2…`; only the existing 15 branch/variant GLBs are used.

Up to all 18 crystals may coexist in `materializing`, `available`, `pulling` or `held`. Controller ownership is independent, so both hands may carry different crystals. There is no physics, collision, gravity or throwing. Only one instance may be `inserted` or `active` because the reliquary has one socket. Releasing a held crystal outside a free socket leaves it `available` and does not activate its page.

## Activation and completion

A successful `activateInserted()` immediately changes the inserted instance to `active`, records its page once in `activatedPageIds`, and updates the portal canvas. `hasActivatedPage(id)` and copy-returning `getActivatedPageIds()` expose progress; `hasReadPage()` and `getReadPageIds()` remain compatibility aliases. `releaseInserted()` removes only the socket crystal and never reverses activation or removes other crystals.

`isLevelComplete()` is true only when the activation registry contains all 18 unique pages. No victory screen, ending animation, next level or persistent storage is part of this contract.

## State and reset

The instance flow is `materializing → available → pulling → held → inserted → active → released`; a failed/early release returns to `available`. Reset removes every instance, releases both hands/socket, cancels glyph holds, clears glyph and crystal controller hits, restores the rig to `(0, 0, 5.8)` facing center, and restores the portal waiting message. The activation registry deliberately survives resets within the prepared runtime: unactivated pages can spawn again, activated pages cannot.

## Preserved world contracts

Glyph placement/orbit, portal, reliquary, activate/release buttons, locomotion, content and Classic 2D/Experience 3D remain unchanged. The portal has one visible card surface, and the reliquary continues to use its authored insertion zone and runtime-visible anchor.
