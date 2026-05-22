# Deployment Model

Likely target: GitHub Pages.

Planned path:
- Build with Vite (`npm run build`).
- Deploy static output (`dist/`) via GitHub Actions.
- Final workflow to be confirmed after first runnable MVP scene.

## Dependency policy note
- Three.js is currently vendored under `vendor/three` and is intentionally not installed from npm in this phase.
