# Decision Log

Status: current binding decisions, organized by implementation status rather than patch chronology.

## Implemented and binding

### Repository and runtime ownership

1. `docs/current/` is canonical; superseded material belongs in `docs/legacy/` and is not default reading.
2. Classic 2D, Experience 3D and Experience VR are separate presentations over stable content IDs. `src/main.js` owns mode selection, capability gating and conditional imports.
3. `src/experienceVr.js` owns a separate WebXR renderer, scene, base camera, `playerRig`, lifecycle and animation loop. It does not import Experience 3D.
4. Runtime preparation precedes the direct session-entry gesture. `immersive-vr` requests `local-floor` with `local` fallback.
5. WebXR owns the tracked camera. Session alignment and locomotion transform `playerRig`; application code does not steer the camera.
6. The active session starts directly at `(0, 0, 5.8)` facing center. The repository's `createVrEntryTransition` module is not part of the active runtime.

### Current interaction and content loop

1. Five visible glyphs orbit continuously. A controller trigger hold on the current glyph target spawns one eligible card-bound crystal; an exhausted glyph remains visible but becomes non-interactive.
2. There are **18 logical cards** in branch counts `3 / 3 / 3 / 4 / 5` and **15 physical crystal GLBs**: three shared visual variants for each of five branches. Card order selects variants cyclically.
3. Each current crystal instance is bound at spawn to a concrete `page` and includes `cardId` and `crystalId`. Deterministic transforms derive from the page ID. This is the binding description of implementation, despite the different future contract below.
4. `AssetManager` is the sole source of runtime models. Crystal spawn clones preload results and performs no fetch.
5. Crystal handling is target-ray plus hierarchy parenting: squeeze pulls an available target to a hand socket. There is no physics, gravity, collision, velocity or throwing.
6. Insertion, Activate and Release are explicit stages. One socket holds one visible `inserted` or `active` crystal. Activate displays `insertedInstance.page`; Release alone removes it and frees the socket.
7. Because Activate uses the page already carried by the physical instance, pre-collected crystals can display a branch's content in insertion order rather than logical card order. This is an accepted description of a known limitation, not a desired gameplay rule.

### Progress, reset and persistence

1. `activatedPageIds` is the only progress registry. Activate records `insertedInstance.page.id`; the read-named APIs are compatibility aliases, not a separate read registry.
2. Session entry/end reset transient crystals, hits, holds, buttons, reliquary, portal, glyph presentation and rig transform. Reset preserves activation IDs in the already prepared page runtime.
3. Reload/navigation starts fresh. No persistent save, read UI, victory presentation or next level is implemented.
4. Smooth locomotion is implemented: right-stick tracked-head-relative horizontal movement and left-stick continuous yaw modify `playerRig` while preserving Y.

### Visual progress-floor contract

1. Five authored sector GLBs are the current visual-floor contract; one model corresponds to one branch and all earlier placeholders have been removed.
2. A stable `glyphId` selects the semantic sector and `order` selects its panel. Panel counts derive from branch card counts: Creative AI 3, Ethics 3, AI Guide 3, DIG Engine 4, and Haiku Cosmos 5.
3. Sector bases remain invisible (`opacity = 0`, `depthWrite = false`), while ornaments and panels remain visible.
4. Every sector instance owns independent cloned materials; geometry may remain shared.
5. Floor illumination survives XR session reset only in memory within the prepared runtime. Reload or navigation starts a new floor registry.

## Approved future gameplay direction — not implemented

The [Experience VR Gameplay Roadmap](../concept/EXPERIENCE_VR_GAMEPLAY_ROADMAP.md) is the approved product and architecture direction. It does not override the current runtime model until separate implementation tasks change code and tests.

1. The first approved implementation task is to replace page-bound activation semantics with branch-bound crystals: a physical crystal will carry branch identity and visual variant, while Activate will resolve the next unactivated page of that branch in logical order.
2. Later approved direction includes a single progression owner for 18 cards and five global tiers, global progress rings, shells and orb assembly, semantic hand tools, small glyphs, a controlled tilting-floor prototype, sector alignment, runes, final radar and completion presentation.
3. Durable persistence and a controlled full-game reset are later roadmap work. They are not inferred from the current reset-surviving in-memory Set.
4. Every roadmap stage requires its own implementation, automated validation where applicable and Meta Quest hardware gate. Documentation must not mark a planned capability as implemented before those gates are complete.

## Explicitly excluded from current claims

The current architecture makes no claim that the future progression controller, global rings, shells, orb, hand tools, gameplay tiers, floor tilting, runes, finale or persistence modules exist. The bounded five-sector visual floor does exist, but is not any of those future systems. Audio, physics, teleport, jump and snap turn are likewise outside the implemented Experience VR gameplay contract.
