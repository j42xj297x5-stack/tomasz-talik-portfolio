# Vendored GLTFLoader requirement (Three.js r184)

This repository vendors Three.js directly under `vendor/three` and **does not** install `three` from npm.

To enable monkey model loading, copy `GLTFLoader.js` from **Three.js r184** into:

`vendor/three/examples/jsm/loaders/GLTFLoader.js`

Important constraints:
- Loader revision must match vendored Three.js revision (`r184`).
- Do not mix Three.js revisions between core runtime and examples loaders.
- Runtime monkey model URL is `/glb/monkey.glb` (local file: `public/glb/monkey.glb`).
- If loader is missing or model fails, placeholder fallback must remain visible.
