# Experience VR Handoff

## Current state

Experience VR is an independent, dynamically imported WebXR runtime. A session starts directly at `(0, 0, 5.8)` facing center; tracked-head X/Z compensation moves only `playerRig`. WebXR owns the tracked camera. Left-stick yaw and right-stick tracked-head-relative horizontal movement also modify only the rig. The repository's entry-transition module is not active.

A `0.5 s` trigger hold on a targeted moving glyph spawns the first ordered page that is neither activated nor already represented by a live crystal. Branches contain `3 / 3 / 3 / 4 / 5` cards: **18 logical cards total**. Their visuals reuse **15 GLBs total**, exactly three variants per branch; cards 4 and 5 cycle back through those variants.

## Current crystal contract and limitation

Every spawned physical instance is currently created for a concrete page and contains `page`, `cardId` and `crystalId`. Instances materialize additively with deterministic spacing; both hands can hold different available crystals. One reliquary socket accepts one crystal through `available → pulling → held → inserted`. Activate changes it to `active`, records `insertedInstance.page.id` in `activatedPageIds` and displays that same `insertedInstance.page`. Release removes an inserted/active instance and frees the socket without undoing activation.

This page-bound contract has a confirmed ordering limitation: if a player collects several crystals before using them, inserting them in a different physical order can display branch content in that insertion order rather than sequential card order. Activate does not currently choose the next page of the branch.

## Reset and progress lifetime

Session entry/end removes all live crystals, clears hand/socket ownership, hits and holds, resets the portal/buttons/reliquary/glyph presentation, and restores the rig. The activation Set survives those resets while the prepared page runtime remains alive, so activated pages cannot respawn on XR re-entry. Reload or navigation creates a fresh registry. The read-named APIs alias activation, and there is no durable save, separate read state, progress UI, full-game reset, victory sequence or next level.

The runtime now includes a visually complete progress floor made from five authored sectors: Creative AI / FIRE (`floor_creative.glb`, three panels), Ethics / EARTH (`floor_ethic.glb`, three panels), AI Guide / WOOD (`floor_ai_guide.glb`, three panels), DIG Engine / METAL (`floor_dig_engine.glb`, four panels), and Haiku Cosmos / WATER (`floor_haiku_cosmos.glb`, five panels). The unshifted sectors share the world origin and rotate every 72 degrees; DIG Engine occupies the `spotify-digger` rotation-zero slot. No placeholder remains. Sector bases are invisible, while ornaments and progression panels remain visible.

Page activation maps the `page.glyphId + page.order` pair to one panel in that page's own sector. The full mappings cover FIRE 01–03, EARTH 01–03, WOOD 01–03, METAL 01–04 and WATER 01–05. Illumination accumulates independently and survives XR session exit/re-entry only within the prepared page runtime. There is still no central `VrProgressionController`, persistent highlight storage, or floor tilting.

## Approved direction not yet implemented

The [gameplay roadmap](../concept/EXPERIENCE_VR_GAMEPLAY_ROADMAP.md) is approved direction only. Branch-bound crystals with Activate-time sequential resolution, `VrProgressionController`, final five-branch floor mapping and global rings, tiers, shells, orb, semantic hand tools, small glyphs, tilting floor, sector puzzles, runes, final radar, completion flow and persistent saves are absent from the runtime.

The nearest approved implementation is a **separate task** that fixes sequential card resolution during Activate by moving content choice from the physical crystal's page to the next unactivated page of its branch. No part of that fix is included in this documentation-only handoff.
