# Three Scene Model

Current scene responsibilities:
- Renderer + animation loop managed from `src/main.js`.
- Scene bootstrap in `src/scene/createScene.js` with dark background and fog.
- Soft lighting setup in `src/scene/lights.js`.
- Temporary central symbolic placeholder in `src/scene/centralObject.js`.
- Five interactive orbit nodes in `src/scene/orbitNodes.js`.
- Lightweight atmospheric particles in `src/scene/particles.js`.
- Raycast picking in `src/scene/raycaster.js`.
- Calm camera idle drift in `src/scene/cameraRig.js`.

Current status note:
- Central object is explicitly temporary and only represents the future meditating monkey model.
- Node interactions use HTML overlay and hover label for readability instead of in-scene text.
- Next scene step is visual refinement + eventual GLB monkey integration.
