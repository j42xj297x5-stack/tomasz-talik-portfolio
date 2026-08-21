export function createVrPostRingPresentation({ glyphRing, shellSystem, settings, onCompleted = () => {} }) {
  if (!glyphRing || !shellSystem) throw new Error('Post-ring presentation requires glyphRing and shellSystem.');
  const baseGlyphY = glyphRing.position.y;
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
    elapsed += Math.max(0, Number.isFinite(delta) ? delta : 0);
    if (glyphStarted) {
      const progress = Math.min(1, elapsed / settings.glyphElevationDuration);
      const eased = progress * progress * (3 - 2 * progress);
      glyphRing.position.y = baseGlyphY + settings.glyphVerticalOffset * eased;
    }
    if (shellStarted && glyphStarted && elapsed >= Math.max(settings.shellRevealDuration, settings.glyphElevationDuration)) {
      completed = true;
      onCompleted();
    }
  }
  function reset() {
    if (disposed) return;
    shellStarted = false; glyphStarted = false; elapsed = 0; completed = false;
    glyphRing.position.y = baseGlyphY;
    shellSystem.setInteractionEnabled(false);
    shellSystem.setPresentationVisible(false);
  }
  function hydrateScenarioState(state) {
    if (state?.shellFieldVisible !== true || typeof state.shellInteractionEnabled !== 'boolean'
      || state.mainGlyphsElevated !== true) throw new Error('Unsupported post-ring Scenario state');
    shellStarted = glyphStarted = completed = true;
    elapsed = Math.max(settings.shellRevealDuration, settings.glyphElevationDuration);
    shellSystem.setPresentationVisible(true);
    shellSystem.setInteractionEnabled(state.shellInteractionEnabled);
    glyphRing.position.y = baseGlyphY + settings.glyphVerticalOffset;
  }
  function dispose() { if (!disposed) { reset(); disposed = true; } }
  return { revealShellField, elevateMainGlyphs, enableShellFieldInteraction, update, reset, hydrateScenarioState, dispose,
    get completed() { return completed; }, get glyphOffset() { return glyphRing.position.y - baseGlyphY; } };
}
