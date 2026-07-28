export function createAudioControl({ audioManager, getLanguage = () => document.documentElement.lang }) {
  const root = document.createElement('aside');
  root.className = 'audio-control';
  root.dataset.audioControl = '';
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'audio-control__toggle';
  button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4zm12.5 3a4 4 0 0 0-2-3.46v6.92A4 4 0 0 0 16.5 12zm-2-7.1v2.07a6 6 0 0 1 0 10.06v2.07a8 8 0 0 0 0-14.2z"/></svg>';
  const slider = document.createElement('input');
  slider.type = 'range'; slider.min = '0'; slider.max = '100'; slider.step = '1';
  root.append(button, slider);
  document.body.append(root);

  const sync = (state) => {
    const pl = getLanguage() === 'pl';
    const muted = state.muted || state.master === 0;
    const label = muted ? (pl ? 'Włącz dźwięk' : 'Turn sound on') : (pl ? 'Wycisz dźwięk' : 'Mute sound');
    button.setAttribute('aria-pressed', String(muted));
    button.setAttribute('aria-label', label); button.title = label;
    button.classList.toggle('is-muted', muted);
    slider.value = String(Math.round(state.master * 100));
    slider.setAttribute('aria-label', pl ? 'Głośność główna' : 'Master volume');
    slider.title = `${slider.value}%`;
  };
  const unsubscribe = audioManager.subscribe(sync);
  slider.addEventListener('input', () => audioManager.setMasterVolume(Number(slider.value) / 100));
  button.addEventListener('click', async () => {
    const wasMuted = audioManager.getState().muted || audioManager.getState().master === 0;
    if (wasMuted) { audioManager.toggleMuted(); await audioManager.playEffect('click'); }
    else { void audioManager.playEffect('click'); audioManager.toggleMuted(); }
  });
  return { destroy() { unsubscribe(); root.remove(); }, refresh: () => sync(audioManager.getState()) };
}
