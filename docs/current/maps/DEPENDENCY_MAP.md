# Dependency Map

## High-level flow
Concept docs -> Technical model -> Runtime implementation -> Decision updates -> Future polish/model integration

## Detailed dependency graph
- `concept/CONCEPT_AND_ROADMAP.md`
  - informs `technical/ARCHITECTURE.md`
  - informs `concept/INTERACTION_MODEL.md`
  - informs `concept/VISUAL_DIRECTION.md`
- `technical/ARCHITECTURE.md`
  - informs runtime module boundaries in `src/scene`, `src/ui`, `src/content`
- `technical/FRONTEND_RUNTIME_MODEL.md`
  - defines current layered runtime and vendored Three.js bridge
- `technical/THREE_SCENE_MODEL.md`
  - maps scene responsibilities to concrete modules
- `technical/CONTENT_MODEL.md`
  - defines gate metadata used by orbit nodes and overlays

## Runtime status dependency
- Monkey model loading depends on the vendored GLTFLoader module path `vendor/three/examples/jsm/loaders/GLTFLoader.js` and asset path `/glb/monkey.glb`.
- Placeholder fallback remains a required runtime dependency when loader/asset resolution fails.
- MVP scene exists with placeholder center object and five interactive gates.
- Scene content depends on `src/content/portfolioNodes.js`.
- UI overlay/hover depends on node metadata and raycast picking.
- Next dependency step: visual refinement and replacement of placeholder center with a real GLB meditating monkey asset.
