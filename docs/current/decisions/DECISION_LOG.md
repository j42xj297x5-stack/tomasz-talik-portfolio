# Decision Log

Status: current binding decisions organized by implementation status, not patch chronology.

## Implemented and binding

### Runtime, progress and floor

1. Classic 2D, Experience 3D and Experience VR are separate presentations. `src/experienceVr.js` owns the independent WebXR scene, rig, lifecycle and loop; WebXR owns the tracked camera.
2. Smooth locomotion is tracked-head-relative right-stick translation plus left-stick continuous rig yaw. Ordinary controller rays have a maximum range of `2.3 m` and shorten only to reported real interaction hits.
3. Five branches contain 18 cards in counts `3 / 3 / 3 / 4 / 5`. Physical crystals are branch+tier instances without persistent page/card identity; acquisition is additive and insertion is current-tier gated.
4. Activate previews. Release after Activate commits through the sole logical owner of the portfolio domain, `VrProgressionController`, projects to the floor and consumes the crystal. Invalid insertion returns without progress.
5. The floor contains five authored sectors, 18 panels and five optional procedural tier rings. Committed progress survives XR re-entry only in the prepared runtime. Durable persistence does not exist.

### Tier-1 Astro and shells

1. Tier 1 unlocks Astro and activates an 18-shell field made from six assets cloned three times. `?p1` remains a QA shortcut for this state.
2. Semantic right input maps A/button 4 to edge-triggered `toggleRightTool`, squeeze/button 1 to `grabAction`, and trigger/button 0 to `primaryAction`. Controller construction is valid before handedness is known; left/right resolves after WebXR `connected`.
3. `createVrHandModeController` owns the right-hand mode and Astro equipped/visibility state. `NORMAL_HAND` means Astro hidden/right ordinary ray visible. `ASTRO_ATTRACTOR` means Astro visible/right ordinary ray hidden.
4. With Astro equipped, squeeze above `0.1` activates one local-`-Z`, `3R`, `2.5°` scan cone. Selection is an analytic cone-volume test of cached shell bounding spheres, not a ray fan.
5. Trigger above `0.1` while scanning pulls at `10 m/s²`, capped at `8.5 m/s`, toward `worldPosition(PIVOT_RING_MASTER) + worldDirection(controller local -Z) * 1.3 m`; readiness radius is `0.28 m`.
6. Shell state is `orbiting → targeted → pulling → capture_ready → held → placed`, with technical `returning`. Pre-takeover cancellation returns over `0.8 s`; the shell is excluded from Astro targeting until orbit is restored.
7. `capture_ready` takeover requires a real left ordinary-ray hit within `2.3 m`, halo/reporting and left squeeze. Left release places the shell under `VrWorldRoot`; distance from the hand alone never performs takeover.
8. Placed shells remain excluded from Astro but support repeated ordinary-ray grab/place with either free hand; the right hand requires `NORMAL_HAND`. Shell priority over crystals exists only on a real shell hit.
9. Shells own cloned materials while retaining authored texture maps. Pull emission is spatial `0→1`, `capture_ready` is `1`, held/placed pulse `1→2→1` over `1.4 s`, and deterministic tumble is `0.10–0.22 rad/s`.

### Astro Furnace and Asterion material progression

1. The Astro Furnace is a material progression transformer/store, not a machine that generates removable physical essence output.
2. `VrAstroFurnaceProgressionController` exclusively owns committed furnace material progression, separate from `VrProgressionController`'s portfolio-card/tier/floor domain. There is no central global progression store.
3. Asterion Sphere (Sfera Asterionowa) requires exactly one of each `shell-relic-1` through `shell-relic-6`; these are six unique asset types, not any six instances.
4. An unknown or already committed shell type is invalid, cannot be taken over by furnace content interaction and cannot be consumed.
5. A valid inserted shell remains the same physical instance at `VR_FURNACE_CONTENT_ANCHOR` and is ordinary-ray retrievable after reopening until the process begins. Insertion and closing do not commit.
6. Progress commits only after physical visual absorption reaches `CONSUMED` **and** the activation process reaches `COMPLETE`. Neither condition alone is sufficient.
7. XR session interruption/reset before COMPLETE never commits pending content; transient content is cleared.
8. Authored open/close motion owns `PIVOT_FURNACE_CHAMBER_Z`. Continuous runtime processing rotation owns `PIVOT_FURNACE_PROCESS_SPIN` and must not be applied to the authored chamber pivot.
9. The lid does not spin during processing.
10. `AstroFurnace_ButtonActivate_Lock` remains physically pressed through COMPLETE and releases only when the next opening begins.
11. The CanvasTexture panel is a read-only projection of furnace progression, process and transient content state; it is not a state owner.
12. The panel Asterion is a deterministic reconstruction of the six real, audited shell patches: every `shellAssetId` has one fixed `±X / ±Y / ±Z` assignment. Runtime consumes exported patch data and does not perform PCA or GLB analysis.
13. Material progression remains the exclusive property of `VrAstroFurnaceProgressionController`; panel miniatures, pending assembly and the full-sphere ghost never own or infer progression from a counter.
14. `complete=true` at `6/6` means the exact six-shell material set and its panel hologram are complete. It does not construct or materialize the physical Asterion Sphere.
15. Physical construction/materialization of the Asterion Sphere is the next separate system, including its future `UTWÓRZ` action and left-hand equipment.

## Approved future gameplay direction — not implemented

1. **A remains the choice `NORMAL_HAND ↔ ASTRO_ATTRACTOR`.**
2. **B will select only Astro bands already unlocked by progression. B is currently not implemented.**
3. Planned bands are:
   - **RED** — local utility elements, primarily crystals and later floor controls;
   - **YELLOW** — shells;
   - **GREEN** — small glyphs;
   - **BLUE** — rune stones;
   - **ULTRAVIOLET** — final/distant glyphs.
4. RED does not mean a global scene raycast. It excludes the monkey, portal, reliquary, buttons, Astro Furnace and decoration.
5. After Tier 1 the planned unlocked bands are RED + YELLOW. Progression unlocks later bands.
6. After furnace material progression reaches `6/6`, a future construction sequence may form the left-hand sphere/spatial gyroscope for floor control. Physical construction and the finished sphere do not exist yet; the material counter, absorption and consumption already do.
7. After sphere construction, small glyphs are planned to take over further progression.
8. After Tier 1, ordinary `2.3 m` range must become insufficient for further glyphs. The target spatial separation is about `3 m`; platform motion versus glyph-ring displacement remains deliberately unresolved.
9. Progressive sector backgrounds, central core, floor tilting/local-plane locomotion, antenna, runes, final radar/finale, audio, durable persistence and full-game reset remain future systems.

## Explicit current exclusions

No approved future item above is an active runtime claim. Physics, teleport, jump and snap turn are also outside the current Experience VR contract.
