# Experience VR Runtime Model

Status: canonical description of the implemented runtime. Future gameplay is documented separately in the [approved concept roadmap](../concept/EXPERIENCE_VR_GAMEPLAY_ROADMAP.md).

## Runtime boundary, session start and reset

`src/experienceVr.js` is the composition root of an independent, dynamically imported WebXR runtime. It owns its renderer, scene, base camera, `playerRig`, two controllers and `renderer.setAnimationLoop`; it does not start Experience 3D. Runtime assets and modules are prepared before the direct **Enter VR** gesture requests `immersive-vr`. The requested reference space is `local-floor`, with `local` fallback.

Each session starts at configured rig position `(0, 0, 5.8)`, facing the world center. After the XR session is installed, the runtime reads the tracked head's world X/Z and offsets `playerRig` so the physical head reaches the configured start. WebXR owns the tracked camera: application code does not write its position or orientation. There is no active entry-glyph transition and `createVrEntryTransition` is not imported by the runtime.

Both controllers use one configured `2.3 m` maximum interaction range for the visible pointer, active-glyph raycasts and available-crystal targeting/grab. Trigger state never changes that range; reliquary buttons may impose a shorter action-specific maximum but cannot exceed it. Existing interaction raycasts report valid target distances each frame, and the visible pointer ends at the nearest reported hit or returns to `2.3 m` when none is reported. The pointer is a low-segment transparent mesh directed along local `-Z`: a variable-length, constant-`0.010 m`-diameter tube ends in a short tapered tip, with depth writes disabled.

Glyphs, crystals and currently available Activate/Release buttons report their existing hit distances to the controller every frame. The controller selects the nearest valid interactive hit and shortens only the visible pointer to that distance; with no valid target it restores the full `2.3 m`. Shortening changes neither shaft diameter nor the configured interaction range. There is no scene-wide raycast for pointer shortening: invisible helpers, fallback colliders and non-interactive scene elements neither report a valid distance nor shorten it.

Disconnect, session reset, session end, re-entry and disposal clear transient targeting state, reported hit distances and halo state. The pointer returns to its full length. Session entry and end also remove all live crystals, clear hand/socket ownership and controller hits, reset glyph holds/lights/orbit, buttons and reliquary, restore the portal waiting message, and return the rig to its configured position and orientation. The prepared runtime objects and listeners are reused where their lifecycle permits.

## Locomotion

The left joystick applies continuous yaw to `playerRig`. The right joystick translates `playerRig` horizontally using the current world-space XR viewer orientation. For an `ArrayCamera`, the first tracked eye supplies that orientation. Head pitch is removed, diagonal input is capped to unit length, and rig Y is preserved. Physical head rotation and smooth rig yaw therefore both affect movement without steering the tracked camera.

## Glyph interaction and crystal spawn

Each controller independently raycasts the moving glyphs. A completed glyph hold spawns the first tier of that branch which is not already represented by a committed card or a live, non-released crystal. Acquisition is independent of the current global tier, so several future crystals may be stored. Branch capacities are `3 / 3 / 3 / 4 / 5`.

An active glyph or available crystal currently hit inside the shared controller range receives a subtle pulsating silhouette halo. Visible halo means that the corresponding interaction is actually available; in particular, an available crystal showing it can be grabbed with squeeze. The effect reuses source geometry with `ShaderMaterial` and includes only effectively visible, renderable source meshes; hidden bases, invisible materials, technical hit areas, fallback colliders, helpers and halo meshes receive no halo. A transparent back-side shader determines silhouette thickness in screen/viewport space rather than by scaling the whole mesh. Its render hook supplies the current per-eye viewport during WebXR stereo rendering. The effect uses no postprocessing, bloom or `OutlinePass`. Losing the hit, changing interaction state and every reset remove the feedback; disposal removes the halo meshes, materials and render hooks.

Glyph raycasts use the real visible meshes of each model rather than a large spherical substitute. A hold starts only on such a hit and lasts `0.5 s` by default. During a hold, a target miss pauses accumulation for `holdLostGraceSeconds = 0.15`; reacquiring the same moving glyph continues the accumulated hold, while a longer miss, hitting another glyph, `selectend` or disconnect cancels it. The active glyph light sits about `1.0 m` from the glyph toward the ring center. This offset is radial only in the X/Z plane, so the glyph's world Y is retained.

The crystal materialization point is captured from the activated glyph's current world position when the hold completes, then offset by `0.30 m` toward the central world object. It preserves the resulting world-space height and is independent of the viewer pose. Once created, the crystal remains at that captured location rather than following the orbiting glyph.

## Crystal instances and visual assets

A physical instance carries only `crystalId`, `glyphId/branchId`, `tier`, `visualVariant`, `crystalAssetId` and transient interaction state. It has no persistent `page`, `pageId` or `cardId`. `visualVariant = ((tier - 1) % 3) + 1` selects one of three shared GLBs per branch, for exactly 15 preloaded crystal models.

Spawn remains additive. A deterministic nearest-free search applies small local offsets around the glyph-derived materialization point to enforce spacing. Reset removes all live instances but does not reset committed progression.

Available-crystal targeting respects the shared `2.3 m` maximum. Squeeze pulls the targeted crystal into the grip socket and interpolates the grip root quaternion to the configurable `holdRotationDegrees` correction (currently `{ x: 30, y: 0, z: 0 }`), without changing the GLB model's local rotations.

## Insertion, preview, Release and progression

`VrProgressionController` is the single owner of committed card progress. The current tier begins at 1. Tiers 1–3 require the corresponding card from all five branches, tier 4 requires Metal and Water, and tier 5 requires Water. A crystal may enter `inserted` only when its tier equals the current global tier, its branch contains that tier, and the corresponding page has not been committed. Rejected insertion returns it to `available`.

While a held crystal is within the configurable proximity radius around the authored insertion sphere, a separate translucent runtime sphere shows whether releasing it would be accepted: green for valid and red for invalid. The authored technical mesh remains hidden and remains the source of the capture sphere. Releasing an invalid crystal inside that sphere starts a non-interactive `rejecting` state; a deterministic eased interpolation pushes it beyond the sphere before restoring `available`, without occupying the socket or changing progression. Feedback is cleared on departure, insertion, completed rejection, transient reset, session exit/re-entry, and disposal.

Activate accepts `inserted`, resolves the page by `branchId + tier`, verifies branch sequence, stores that page only as transient `previewPage`, changes the crystal to `active`, and calls the portal preview callback. It does not commit progress or illuminate the floor.

Release accepts `inserted` or `active`. Releasing an `inserted` crystal without Activate returns it safely to `available` without progress. Releasing `active` commits its preview exactly once through the progression controller, calls `progressFloor.activatePage(page)`, and checks the committed page tier with `isTierComplete`. A completed tier activates its idempotent global floor ring while progression advances under the controller's existing rules. The socket is then released immediately while the crystal enters a non-interactive `consuming` state for the configured `0.55 s`: its root eases down to zero scale in place and a single lightweight `THREE.Points` effect (14 branch-colored points) rotates, expands slightly, and fades around it. Completion removes both the crystal and effect. Transient reset or disposal also removes and disposes an in-flight effect without reverting committed progress.

## Progress, reset and persistence

The progression controller exposes the current tier, insertion validation, branch/tier page resolution, commit, activated-page queries, and tier-completion queries. Its registry lives in the prepared page runtime, so committed cards survive XR exit/re-entry while transient crystals are reset. Reload or navigation creates a fresh controller. There is no `localStorage` or durable save.

The five-sector progress floor has 18 panels mapped by `glyphId + order` and receives pages only after Release commits them. Five independent full-circle threshold rings derive candidate radii from the local centers of panels at each order, then sort and gap-normalize those candidates into stable inward-to-outward tier radii. Non-monotonic authored centroids do not block runtime preparation; an isolated procedural-ring failure degrades to the functional sector and panel layer. A completed tier gives its ring a short neutral-white opacity impulse followed by a subtle persistent glow. Sector-background progression and other later visual layers remain absent.

The current readiness gate has been smoke-tested on Meta Quest 3S: asset preload completes, the Experience VR scene reaches ready state, **Enter VR** becomes enabled, and a working immersive session can be entered. This is not a claim of complete performance, readability, z-fighting, or full-game QA.

## Astro attractor hand tool

The prepared VR asset set includes one cached `/glb/astro_grabber.glb`. The runtime clones that cached scene once, validates its authored node and five 12-point fuel-path contracts, and mounts `VrAttractorAimRoot` directly below the right controller target-ray space. Its model-scale child preserves the GLB while centrally applying scale and the aim root maps the authored Three.js +Y axis onto target-ray -Z. Astro never generates its own ray: future interactions must use the controller world position and its local `(0, 0, -1)` transformed by the controller world quaternion. Runtime-controlled energy-cell (and optional glyph-panel) materials are instance-only clones; the five lightweight `THREE.Points` streams own and dispose only their generated geometry and materials.

Right-hand WebXR input is translated by a semantic input boundary: standard-gamepad button `4` produces an edge-triggered `toggleRightTool`, button `0` provides analog `primaryAction`, and button `1` provides `grabAction`. After global tier 1 is complete, `toggleRightTool` switches `NORMAL_HAND` and `ASTRO_ATTRACTOR`; before then it cannot equip the tool. Equipping Astro hides only the right controller's visible `2.3 m` pointer. Its invisible shell ray uses the controller origin and exactly controller-local `(0, 0, -1)` transformed by its world quaternion, with an independent range of `3R`, where `R` is the shell field inner radius.

## Tier 1 shell field and QA shortcut

Completing global tier 1 now reveals the first shell field. The prepared runtime preloads the six existing `shell-relic-*` GLBs once through `AssetManager` and clones each cached scene three times, producing 18 runtime shells with stable IDs. Their deterministic, delta-time-driven orbits use varied inclinations and orbital planes rather than one flat ring. The radial range is `[R, 2R]`, where `R` comes directly from `glyphOrbit.effectiveRadius`; its thickness therefore equals the complete current world radius.

Shell gameplay transitions through `orbiting → targeted → pulling → held`. The nearest valid visible shell mesh receives the existing `VrTargetHalo`; buttons, context interactions, glyphs and crystals gate this lower-priority target. Trigger pull accelerates toward a capture anchor `0.8 m` along controller-local `-Z` at `10 m/s²`, capped at `8.5 m/s`, and captures within `0.28 m`. Releasing during pulling or held performs a smooth `0.8 s` blend toward the continuously advancing deterministic orbit before normal orbit ownership resumes.

The primary five glyph-ring objects preserve authored orientation and have no ambient self rotation. Free orbital world artifacts may use subtle ambient self rotation; currently only shells implement it. Each shell deterministically tumbles about a precomputed normalized per-instance local axis at `0.10–0.22 rad/s`, preserving its authored initial rotation as the reset baseline.

The explicit `?p1` QA shortcut runs once while the page runtime is prepared. It commits the five order-1 pages through `progressionController.commitPage`, mirrors successful commits onto the progress floor, completes floor tier 1, and synchronizes the shell field. This represents the beginning of tier 2 / the world immediately after tier 1 without spawning crystals, replaying consume effects, or automating controller input.

The attractor visual controller supports `UNEQUIPPED`, `IDLE`, `TARGETING`, `PULLING`, and `CAPTURED`, although normal composition currently uses only the first two. Its pivots, energy shell, energy-cell emission, and fuel streams are deterministic and delta-time based. Session reset returns the hand to `NORMAL_HAND` and resets the existing tool instance; page teardown detaches it and disposes only runtime-owned effects and cloned materials.

## Explicitly absent from the current runtime

Sector-background progression and its soft boundary, a central progression core, later world transitions, assembly orb, small glyphs, floor tilting and local-plane locomotion, antenna, runes, final radar, completion sequence, durable save, full-game reset and the full capabilities system are not implemented. Shell insertion, sphere assembly and shell consumption are also absent. The current five-sector floor, its five global tier rings, the minimal card/tier controller, and the Tier-1 Astro shell targeting/pull/capture/return slice are the bounded implementations described above.
