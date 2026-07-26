export const EXPERIENCE_BACKGROUND_COLOR = '#05070b';

export function renderScenePasses(renderer, galaxyBackgroundScene, mainScene, camera) {
  // autoReset is disabled by the owner so renderer.info covers both passes.
  renderer.info.reset();
  renderer.clear(true, true, true);
  renderer.render(galaxyBackgroundScene, camera);
  renderer.clearDepth();
  renderer.render(mainScene, camera);
}
