export function createVrProgressionShortcut({ search, pages, progressionController, progressFloor,
  syncTierOneWorldState, log = console.info }) {
  let checked = false;
  return function applyVrProgressionShortcut() {
    if (checked) return false;
    checked = true;
    if (!new URLSearchParams(search).has('p1')) return false;
    let committed = 0;
    pages.filter((page) => page.order === 1).forEach((page) => {
      if (!progressionController.commitPage(page)) return;
      progressFloor.activatePage(page);
      committed += 1;
    });
    if (committed > 0 && progressionController.isTierComplete(1)) progressFloor.completeTier(1);
    syncTierOneWorldState();
    log('[experience-vr] QA shortcut ?p1 applied.');
    return true;
  };
}
