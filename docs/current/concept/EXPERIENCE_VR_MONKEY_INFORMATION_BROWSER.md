# Experience VR — Monkey Information Browser

Status: **CURRENT / BINDING DESIGN TARGET / IMPLEMENTATION PENDING**

## Authority and scope

This document is the canonical presentation and navigation contract for the Orange Monkey information browser shared by `JAK MI IDZIE?` and `WIEDZA`. It organizes approved UI behavior only. It does not claim a runtime implementation and does not change portfolio/card progression truth, World Knowledge content, the 45-stage availability contract, `KIEDY:` triggers, lifecycle predicates, Scenario events or gameplay ownership.

The two sections remain distinct content domains and may retain different data owners. Their high-level visual browsing model is nevertheless the same:

```text
category overview → category detail → semantic stage selection → technical text-page navigation
```

The World Knowledge master remains authoritative for authored knowledge and stage structure. Its progression contract remains authoritative for the independent `LOCKED → AVAILABLE → READ` lifecycle and all 45 availability bindings. Existing portfolio/card owners remain authoritative for `JAK MI IDZIE?` progression.

## Shared browser model

Both sections use an icon-first category overview followed by the same compact detail-reader structure. The browser must keep five concepts separate:

1. **Category discovery** controls whether a category icon exists in the overview.
2. **Stage/star discovery** controls which authored stages are represented beside that icon and in its detail selector.
3. **Unread/read presentation** controls whether a visible star pulses.
4. **Semantic stage selection** chooses authored information content.
5. **Technical text pagination** divides one selected stage for readable display without creating progression state.

Presentation must not infer or manufacture domain truth. It projects state supplied by the relevant content/progression owner.

## Category discovery and overview

The first screen of either section contains only discovered category icons. It must not display a permanent category text-label list.

A category is undiscovered and entirely absent until at least its first stage becomes `AVAILABLE`. The overview must not reserve space, draw an empty tile or otherwise expose a placeholder for a future category. When its first stage becomes `AVAILABLE`, its icon appears.

Each visible icon may include a compact row representing only stages currently `AVAILABLE` or `READ`:

- one discovered stage produces one visible star;
- three discovered stages produce three visible stars;
- later `LOCKED` stages remain completely absent;
- no locked star is rendered as an empty, dimmed or disabled placeholder.

The overview must remain compact enough for many discovered categories to coexist on one Monkey panel page. The category icon establishes the subject before the player enters contextual text.

## Stage/star discovery and selector

One numbered authored content stage corresponds to exactly one star. World Knowledge categories consequently expose two, three or four stars over time according to their canonical authored structure; the browser must not normalize them to a fixed count.

Selecting a category icon opens its detail view. A narrow horizontal star selector exposes only stages that are `AVAILABLE` or `READ`. Selecting a star changes the currently displayed semantic stage. It does not navigate a technical text page and must not merge, split or otherwise alter the authored stage.

Category discovery and stage discovery are related but distinct: the first available stage reveals the category, while each later stage independently adds its own star when it becomes available.

## Unread and read presentation

An `AVAILABLE` but unread stage is visible and its star pulses. A `READ` stage remains visible but its star stops pulsing. This pulse is the external indication that new content exists inside the category, including from the overview; the browser must not add a separate badge or counter unless a future binding task requests one.

Merely discovering a category, seeing its icon, seeing or hovering a star, hovering the category, or entering the overview does not establish `READ`.

### Explanatory state example

```text
Category hidden
→ first stage AVAILABLE
→ icon appears + ★ pulses
→ stage READ
→ ★ remains but stops pulsing
→ next stage AVAILABLE
→ ★ remains stable + ★★ pulses
```

This sequence explains the presentation only. It creates no new runtime truth, availability predicate, event or ordering requirement.

## Category detail reader

The category detail view has four vertically ordered regions:

1. a compact category header;
2. a narrow horizontal stage/star selector;
3. a large content area;
4. a bottom navigation row.

The header and selector must consume as little vertical space as reasonably possible so that the content area receives most of the panel. The compact header provides category context; it does not restore a permanent text-label list to the overview.

## Semantic stages versus technical text pages

A semantic stage and a technical text page are different concepts:

- **semantic stage:** one authored information unit, represented by one star and carrying the relevant availability/read lifecycle;
- **technical text page:** one display-sized portion of that stage, introduced only to preserve legibility.

A long stage may occupy multiple technical pages. Moving between those pages must preserve the selected star and must never create another stage, star, availability state or progression state. Stage selection occurs only through the star selector; page navigation occurs only through the bottom row.

## Text pagination and readability

The content area must favor readable text over progressively shrinking typography. The intended presentation target is approximately four readable text lines per page where practical, while preserving meaningful authored paragraph and newline boundaries.

The reader must maintain an implementation-defined minimum readable VR font size. If the selected stage's text no longer fits above that minimum, pagination is mandatory. This contract intentionally does not freeze a pixel font size.

## Bottom navigation

The bottom row owns technical navigation only:

- previous text page;
- next text page;
- return to the category overview or parent menu.

Previous and next controls appear only when relevant to the selected stage and current page. They navigate pages inside that star; they never select a semantic stage or change its progression identity.

## READ commitment

`READ` is committed only through deliberate viewing inside the category detail reader:

- for a single-page stage, opening the stage and presenting its complete page is sufficient;
- for a multi-page stage, `READ` is committed only after the player reaches the final page through that stage's reader.

Category discovery, icon appearance, overview entry, hover, category selection alone, and partial traversal of a multi-page stage are insufficient. The progression owner remains responsible for the actual lifecycle state; this presentation contract defines only the reader interaction that may request the `READ` commitment.

## `JAK MI IDZIE?`

Existing card/progress information must migrate toward this shared icon-first browser. Its overview must not depend on unsorted text snippets without subject context. The category icon establishes the subject first; the selected star/stage then provides the corresponding contextual text.

This contract does not redesign, regroup or replace underlying portfolio/card progression truth.

## `WIEDZA`

World Knowledge uses the same browser pattern. Its category and stage visibility project the canonical 45-stage progression contract, including the authored two-, three- and four-stage category structures. This document does not redefine any `KIEDY:` trigger, availability binding, lifecycle rule or terminal knowledge boundary.

## Icon assets and color treatment

Existing Proto-Astro SVG assets remain suitable for natural object and family concepts. Additional prepared presentation assets under `public/svg/` may later represent tools and abstract concepts. The current black-background/white-foreground appearance of these assets is not a required final treatment: future rendering may tint or recolor them to match the Monkey panel or Player Y panel without changing their semantic identity.

This contract selects no specific asset and requires no SVG modification.

## Player Y boundary

This document does not define the final Player Y layout. Player Y must eventually inherit the same semantic categories and stages only after `READ`, according to the progression authority, but its denser physical panel may require category pagination or another compact navigation solution. That presentation decision remains explicitly pending and must not be inferred from the Monkey layout.

## Implementation boundary

Runtime implementation remains pending. A future implementation must route both Monkey information domains through this presentation contract while preserving their separate data owners and canonical progression truth. It must not:

- add locked category or star placeholders;
- collapse semantic stages to simplify layout;
- use text pages as progression stages;
- mark multi-page content read before its final page is reached;
- introduce a separate unread badge or counter without a new binding decision;
- invent final Player Y pagination or layout.
