import { VR_LARGE_GLYPH_ELEVATED_STAGE } from '../glyphs/createVrLargeGlyphActor.js';

export function createVrPostRingPresentation({ largeGlyphActor, shellSystem, settings, onCompleted = () => {} }) {
  if (!largeGlyphActor || !shellSystem) {
    throw new Error('Post-ring presentation requires largeGlyphActor and shellSystem.');
  }
  let shellStarted = false, glyphStarted = false, elapsed = 0, completed = false, disposed = false;

  function revealShellField() {
    if (disposed || shellStarted) return false;
    shellStarted = true;
    shellSystem.setPresentationVisible(true);
    shellSystem.setInteractionEnabled(false);
    return true;
  }
  function elevateMainGlyphs() {
    if (disposed || glyphStarted) return false;
    if (!largeGlyphActor.beginElevation()) return false;
    glyphStarted = true;
    return true;
  }
  function enableShellFieldInteraction() {
    if (disposed) return false;
    shellSystem.setPresentationVisible(true);
    shellSystem.setInteractionEnabled(true);
    return true;
  }
  function update(delta) {
    if (disposed || completed || (!shellStarted && !glyphStarted)) return;
    if (shellStarted) elapsed += Math.max(0, Number.isFinite(delta) ? delta : 0);
    if (shellStarted && glyphStarted && elapsed >= settings.shellRevealDuration
      && largeGlyphActor.getStage() === VR_LARGE_GLYPH_ELEVATED_STAGE) {
      completed = true;
      onCompleted();
    }
  }
  function reset() {
    if (disposed) return;
    shellStarted = false; glyphStarted = false; elapsed = 0; completed = false;
    shellSystem.setInteractionEnabled(false);
    shellSystem.setPresentationVisible(false);
  }
  function hydrateScenarioState(state) {
    if (state?.shellFieldVisible !== true || typeof state.shellInteractionEnabled !== 'boolean') {
      throw new Error('Unsupported post-ring Scenario state');
    }
    shellStarted = glyphStarted = completed = true;
    elapsed = settings.shellRevealDuration;
    shellSystem.setPresentationVisible(true);
    shellSystem.setInteractionEnabled(state.shellInteractionEnabled);
  }
  function dispose() { if (!disposed) { reset(); disposed = true; } }
  return { revealShellField, elevateMainGlyphs, enableShellFieldInteraction, update, reset, hydrateScenarioState, dispose,
    get completed() { return completed; } };
}
