# Snapshot — Entry Shell and Conditional Experience 3D Boot

Status: accepted / implemented documentation snapshot.

Date: 2026-06-02.

## Summary

The portfolio now has an implemented lightweight, vanilla-JavaScript entry shell before the existing Three.js portfolio runtime. `src/main.js` owns the language-first and mode-selection flow, while `src/experience3d.js` owns the previous Three.js portfolio bootstrap. The current 3D scene starts only after the visitor chooses `Experience 3D` / `Doświadczenie 3D`.

Classic 2D is present only as an intentional placeholder screen with a back flow to mode selection. No finished Classic 2D portfolio runtime exists yet.

## Files changed by the implementation being documented

Runtime files changed by the implementation being documented:
- `src/main.js` — now owns the lightweight entry shell, entry state, language/mode selection, optional persistence, placeholder route, and conditional Experience 3D import.
- `src/experience3d.js` — now owns the previous direct Three.js portfolio bootstrap.
- `src/styles/main.css` — contains the entry shell styles while preserving runtime shell, loader, overlay, and panel styling.

Documentation files changed by this snapshot task:
- `docs/current/audits/snapshots/2026-06-02_18-18-09__snapshot__entry-shell-conditional-3d-boot.md`
- `docs/current/maps/PROJECT_INDEX.md`
- `docs/current/technical/FRONTEND_RUNTIME_MODEL.md`
- `docs/current/maps/DEPENDENCY_MAP.md`
- `docs/current/decisions/DECISION_LOG.md`

## Architecture before / after

### Before

- `src/main.js` was treated as the direct Three.js runtime bootstrap.
- Opening the portfolio immediately initialized the current 3D runtime path.
- Language-first entry and dual-mode routing existed only as documented direction.
- Classic 2D had no implemented branch point.

### After

- `src/main.js` is the first browser entry module and owns the lightweight entry shell.
- `src/experience3d.js` is the Experience 3D runtime bootstrap and contains the previously direct Three.js startup path.
- The browser still mounts through Vite and `index.html`, but the heavy 3D runtime is imported only after a visitor selects Experience 3D.
- The entry shell creates a stable branch point for future Classic 2D work without changing the existing 3D runtime behavior.

## Entry shell behavior

The implemented entry shell includes:
- language selection for `Polski` and `English`,
- language-specific mode labels:
  - Polish: `Klasyczne 2D` and `Doświadczenie 3D`,
  - English: `Classic 2D` and `Experience 3D`,
- simple frontend state for selected language, selected mode, and whether the runtime has started,
- optional `localStorage` persistence for the entry selection,
- keyboard-focusable, button-based language and mode choices,
- a back flow from mode selection to language selection,
- a Classic 2D placeholder screen with a back flow to mode selection,
- a launch/status screen before importing the Experience 3D runtime.

## Experience 3D boot behavior

Experience 3D boot is now conditional:
- the 3D runtime does not start during the initial language-selection screen,
- it does not start during the mode-selection screen,
- it does not start when the visitor opens the Classic 2D placeholder,
- it starts after the visitor clicks `Experience 3D` / `Doświadczenie 3D`,
- `src/main.js` then dynamically imports `src/experience3d.js`,
- `src/experience3d.js` constructs the same runtime shell/canvas, loader, renderer, scene, camera, overlay, input, diagnostics, and animation flow that previously belonged to the direct 3D bootstrap.

The implementation preserves the existing scene behavior, loader behavior, glyph behavior, panels, camera, debug tools, mobile input, deployment paths, Vite config, assets, and content.

## Classic 2D placeholder status

Classic 2D remains intentionally placeholder-only. It communicates that the lightweight, flat, retro-symbolic portfolio mode is planned, but it does not yet render the portfolio gates, panels, shared content records, or a finished 2D experience.

Future Classic 2D implementation should consume shared content records and stable gate IDs rather than duplicating portfolio content separately from Experience 3D.

## Validation / build notes

- The implementation was validated with `npm ci` followed by `npm run build`.
- The production build succeeded.
- The existing large 3D chunk warning remains known and unchanged; this snapshot does not treat that warning as a new regression.

## Non-goals / intentionally not changed

This snapshot documents the completed implementation only. It does not change:
- runtime code,
- CSS,
- assets,
- Vite configuration,
- package files,
- portfolio content/copy,
- scene behavior,
- loader behavior,
- glyph behavior,
- overlay/panel behavior,
- camera behavior,
- debug tooling,
- mobile input behavior,
- deployment/public-path rules.

## Risks / known limitations

- Classic 2D is only a placeholder, so visitors who choose it do not yet receive a finished portfolio experience.
- The implemented entry shell stores only simple entry selection state; final bilingual content state and shared content records are still future work.
- Runtime tasks must now inspect both `src/main.js` and `src/experience3d.js` because the entry orchestration and 3D bootstrap are split.
- The large 3D chunk warning remains a known build/performance concern from the existing runtime.
- The current entry copy is functional implementation copy, not final portfolio copy.

## Suggested next steps

1. Update the planned entry-flow documentation so it distinguishes implemented baseline behavior from future Classic 2D/content work.
2. Create shared PL/EN content records that can be consumed by both Classic 2D and Experience 3D.
3. Implement the finished Classic 2D path as a lightweight UI that avoids eager Three.js loading.
4. Add accessibility and reduced-motion verification for the entry shell and future Classic 2D path.
5. Revisit build chunk strategy only as a separate performance task, preserving current deployment/public-path rules.
