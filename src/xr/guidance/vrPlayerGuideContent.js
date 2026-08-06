const VR_PLAYER_GUIDE_CONTENT = Object.freeze({
  pl: Object.freeze({
    title: 'Panel gracza',
    items: Object.freeze([
      Object.freeze({ id: 'controls', label: 'STEROWANIE', body: 'Mapa podstawowych wejść kontrolerów.' }),
      Object.freeze({ id: 'current-task', label: 'AKTUALNE ZADANIE', body: 'Kontynuuj eksplorację i aktywuj kolejne elementy świata.' })
    ]),
    menuHint: 'Lewy drążek — wybór · X — otwórz · Y — zamknij',
    detailHint: 'Lewy drążek — wybór · X — otwórz · Y — wróć',
    controllersFallback: 'Schemat kontrolerów niedostępny.'
  }),
  en: Object.freeze({
    title: 'Player panel',
    items: Object.freeze([
      Object.freeze({ id: 'controls', label: 'CONTROLS', body: 'Basic controller input map.' }),
      Object.freeze({ id: 'current-task', label: 'CURRENT TASK', body: 'Continue exploring and activate the next world elements.' })
    ]),
    menuHint: 'Left stick — select · X — open · Y — close',
    detailHint: 'Left stick — select · X — open · Y — back',
    controllersFallback: 'Controller diagram unavailable.'
  })
});

export function resolveVrPlayerGuideContent(locale = 'en') {
  return VR_PLAYER_GUIDE_CONTENT[locale] ?? VR_PLAYER_GUIDE_CONTENT.en;
}

export { VR_PLAYER_GUIDE_CONTENT };
