# Frontend Runtime Model

Current runtime: Vite + Vanilla JavaScript modules + vendored Three.js.

Layers:
1. Scene layer (WebGL/Three.js) — scaffolded import path only, scene not implemented yet.
2. Interaction bridge (events/select state) — planned.
3. Overlay UI layer (HTML/CSS panels) — scaffolded shell only.
4. Content layer (editable text/data modules) — planned.

## Runtime scaffold status
- `index.html` mounts `src/main.js` via Vite module loading.
- `src/main.js` currently renders a placeholder app shell and confirms runtime startup in console.
- Three.js is imported from local vendor path: `vendor/three/three.module.js`.

## Deferred implementation
- Central 3D object, interactive nodes, hover labels, and overlay panels are intentionally deferred to the next MVP scene task.
