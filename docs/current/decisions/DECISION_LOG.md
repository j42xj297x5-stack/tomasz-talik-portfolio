# Decision Log

## 2026-05-22 — Initial repository documentation baseline

1. `docs/current` is the active source of truth.
2. `docs/legacy` stores superseded documentation.
3. First MVP should prefer Vanilla Three.js + Vite.
4. React/React Three Fiber is out of scope for first prototype unless explicitly requested later.
5. Use HTML/CSS overlays for readable text panels.
6. Use Three.js for scene, camera, lights, particles, central object, and interactive nodes.
7. Final portfolio copy is intentionally undecided.
8. Final project/portfolio name is intentionally undecided.
9. Meditating monkey is a symbolic central object, not a meme mascot.
10. GitHub Pages is the likely deployment target; exact workflow can be finalized later.

## 2026-05-22 — Vite scaffold initialization and vendored Three.js policy

1. Added Vite-compatible frontend scaffold (`index.html`, `src/main.js`, `src/styles/main.css`) with Vanilla JavaScript modules.
2. Created `package.json` with `dev`, `build`, and `preview` scripts for Vite.
3. Three.js remains vendored under `vendor/three`; npm package `three` is intentionally not installed.
4. Runtime currently imports Three.js from `vendor/three/three.module.js` as the MVP-safe path.
5. Portfolio scene implementation remains intentionally deferred; next step is first MVP Three.js scene modules.
