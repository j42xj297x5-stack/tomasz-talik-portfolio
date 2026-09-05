# Experience VR Runtime Operations

Status: **CURRENT / IMPLEMENTED — 2026-09-05**. This is the operational authority for browser/headset execution and local diagnostic recording. Detailed ownership belongs to [`VR_RUNTIME_MODEL.md`](../technical/VR_RUNTIME_MODEL.md); build, Vite base, GitHub Pages and public assets belong to [`DEPLOYMENT_MODEL.md`](../technical/DEPLOYMENT_MODEL.md).

## Normal launch

Experience VR has one ordinary production WebXR startup architecture. A normal URL, without a debug query parameter, enters the same runtime on both validated manual execution paths:

1. **Standalone:** Quest Browser → immersive WebXR → ordinary Experience VR runtime.
2. **PCVR development / hardware QA:** Chromium-based desktop browser → Virtual Desktop / VDXR → Quest headset → ordinary Experience VR runtime.

These are validated manual execution paths, not universal support claims for every browser, GPU, Virtual Desktop release or headset. Virtual Desktop / VDXR is an external execution environment, not an application dependency. No special URL flag is required for either path. Both use the permanent production lifecycle that requests the immersive session before creating WebGL2 and `THREE.WebGLRenderer`; the technical model owns its exact lifecycle.

## Chromium hardware acceleration

For the validated Chromium + Virtual Desktop / VDXR path, browser WebGL must use hardware acceleration and a physical GPU rather than Microsoft Basic Render Driver.

```text
hardware acceleration disabled
→ WebGL uses Microsoft Basic Render Driver
→ actual context is not XR-compatible
→ XR compatibility transition loses the WebGL context
→ immersive startup fails

hardware acceleration enabled
→ WebGL uses the physical NVIDIA GPU
→ WebXR compatibility/session bootstrap succeeds
→ Experience VR enters and remains immersive through Virtual Desktop
```

The NVIDIA device is observed hardware evidence, not a required model. No speculative Chromium flags or browser hacks form part of this contract.

## Opt-in diagnostic recording

`?debug` is the **CURRENT / IMPLEMENTED** public entry to the recorder workflow. It does not enable or alter production WebXR bootstrap. In `src/main.js`, after VR capability validation and before `await import('./experienceVr.js')`, the application opens `createVrDebugPreloadGate(...)`:

```text
?debug → choose Experience VR → pre-runtime diagnostic gate
→ recording toggle → diagnostic-scope selection
→ store ephemeral launch config → import experienceVr.js
→ activate only selected diagnostic sidecars
```

Recording defaults **OFF**. If it remains off, no scope is recorded, transport remains inactive and normal runtime proceeds. When switched on, at least one scope must be selected. This is deliberate opt-in observability for difficult runtime-only failures, not normal gameplay behavior.

## Scope architecture

The **CURRENT / IMPLEMENTED** registry is `src/xr/debug/vrDiagnosticScopes.js`. Its first implemented and successfully used scope is `RUNE_TUNING_COMPLETION`, player/developer-facing as **„Freeze po zakończeniu strojenia Kamienia Runicznego”**.

That bounded sidecar records Rune tuning finalization evidence around begin, pre-flight, ingredient identity/consumption boundaries, progression commit, transaction stages, completion, abort/failure and related global errors while recording is active. The framework is not Rune-specific and does not capture all gameplay events.

```text
new difficult runtime problem → define a bounded diagnostic scope
→ expose it in the registry → compose its sidecar only when selected
→ emit structured evidence → keep normal runtime unaffected when disabled
```

Additional scopes are **EXTENSIBLE / FUTURE SCOPE**. Sidecars own no Scenario, Director, gameplay or runtime truth and remain read-only and fail-soft.

## Local Vite flight recorder

For the Rune scope, `src/xr/debug/createVrDevDiagnosticTransport.js` sends records to `dev/viteVrRuneDiagnosticPlugin.js`:

```text
diagnostic capture → structured record → development-only HTTP POST
→ base-aware Vite endpoint __vr-debug/rune → serialized append
→ .debug/vr-rune-completion.jsonl
```

The endpoint resolves under the configured Vite base. The output is **JSONL / newline-delimited JSON**, not one monolithic JSON document: each appended line is one structured record. The server adds `serverTimestamp`, `remoteAddress` and `userAgent`; its write queue serializes appends. `.debug/` is ignored by Git.

Run the ordinary local server (`npm run dev`), enter Experience VR with `?debug`, enable recording and select `RUNE_TUNING_COMPLETION`; then inspect `.debug/vr-rune-completion.jsonl` in the repository root.

The client transport is a no-op outside `import.meta.env.DEV`, while the plugin uses `apply: 'serve'`. GitHub Pages and production builds therefore expose no local write endpoint; these files are not production telemetry, no remote analytics service exists, and gameplay does not depend on delivery succeeding.

The Rune capture also retains a bounded local browser journal and recovery/export evidence. This is secondary support; the primary durable local-development path is Vite transport to `.debug/vr-rune-completion.jsonl`.
