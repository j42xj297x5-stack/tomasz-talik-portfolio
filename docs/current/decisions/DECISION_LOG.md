# Decision Log

Status: current binding decisions, organized by implementation status rather than patch chronology.

## Implemented and binding

### Repository and runtime ownership

1. `docs/current/` is canonical; superseded material belongs in `docs/legacy/` and is not default reading.
2. Classic 2D, Experience 3D and Experience VR are separate presentations. `src/main.js` owns mode selection, capability gating and conditional imports.
3. `src/experienceVr.js` owns an independent WebXR renderer, scene, base camera, `playerRig`, lifecycle and animation loop. Runtime preparation precedes the direct `immersive-vr` gesture; reference space is `local-floor` with `local` fallback.
4. WebXR owns the tracked camera. Session alignment and locomotion transform `playerRig`; the inactive `createVrEntryTransition` is not part of composition.

### Cards, crystals and acquisition

1. Five branches contain **18 logical cards** in counts `3 / 3 / 3 / 4 / 5`. Fifteen preloaded crystal GLBs provide three cyclic visual variants per branch.
2. A physical crystal is branch/tier-bound. It carries branch/glyph identity, tier, visual variant and transient state, but no persistent `page`, `pageId` or `cardId`.
3. Glyph hold spawns the next unrepresented tier of that branch at the glyph's captured world position, offset by default `0.30 m` inward toward the central object. Spawn is independent of viewer pose.
4. Acquisition is additive and independent of current global tier, so future-tier crystals may be stocked. Global tier gates their insertion/use, not their acquisition.
5. Crystal handling uses target rays and hierarchy parenting without physics, gravity, collision velocity or throwing.

### Reliquary, preview and commit

1. `VrProgressionController` is the single owner of committed progress. Tiers 1–3 require all five branches, tier 4 requires Metal + Water, and tier 5 requires Water.
2. Held proximity feedback classifies insertion as VALID or INVALID. VALID uses a green halo and permits insertion. INVALID uses a red halo; attempted insertion enters controlled `rejecting`, pushes the crystal outside the insert sphere and returns it to `available` without progress.
3. Activate resolves the page from branch + tier, stores only a transient preview and shows it in the portal. Activate does not commit progress or light the floor.
4. Release after Activate commits the preview through the controller, activates the matching floor panel, tests tier completion and may call idempotent `completeTier()`. Release without Activate returns the crystal to `available` without progress.
5. A committed crystal enters non-interactive `consuming`: the socket is freed immediately, the crystal shrinks for about `0.55 s`, branch-colored `THREE.Points` sparks play, and both are removed.

### Progress, reset and visual floor

1. Five authored sector GLBs provide 18 independently addressable panels selected by `glyphId + order`. Activated panels accumulate with an initial impulse and stable glow.
2. Five procedural global tier rings cover a full 360°, including tiers 4 and 5. Each raw candidate is the median radial centroid of the real panels for that order; candidates need not increase with semantic tier number. Runtime sorts them ascending, then enforces `minimumRingGap >= ringThickness * 2` to obtain five concentric radii. First completion pulses a ring and leaves a subtle glow; `completeTier()` is idempotent.
3. The controller owns logical progression; the floor owns only its visual projection registries. Successful Release is the boundary that updates both in that order.
4. Logical progress and visual floor state survive XR exit/re-entry only in the already prepared page runtime. Reload/navigation resets them. Durable persistence and a controlled full-game reset do not exist.
5. Smooth locomotion is right-stick tracked-head-relative horizontal movement plus left-stick continuous yaw on `playerRig`, preserving Y.
6. The five authored sectors and 18 named panels are critical floor inputs. Procedural rings are an optional visual layer: a failure isolated to their creation disposes partial ring resources and preserves the usable sector/panel floor instead of blocking VR readiness.

## Approved future gameplay direction — not implemented

The [Experience VR Gameplay Roadmap](../concept/EXPERIENCE_VR_GAMEPLAY_ROADMAP.md) retains the target product direction while marking the foundations above as complete. Still planned are progressive sector-background illumination and its soft gradient boundary, a central progression core, tier-1 world transition, shells and orb assembly, semantic hand tools, small glyphs, controlled floor tilting and local-plane locomotion, antenna/sector alignment, runes, final radar, finale, durable persistence and full-game reset.

Each future stage requires bounded implementation and validation; the roadmap does not make planned modules part of the current runtime.

## Explicitly excluded from current claims

The active runtime makes no claim that the planned systems listed above exist. Audio, physics, teleport, jump and snap turn are likewise outside the implemented Experience VR gameplay contract.
