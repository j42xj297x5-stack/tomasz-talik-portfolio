const VR_PLAYER_GUIDE_CONTENT = Object.freeze({
  pl: Object.freeze({
    title: 'Panel gracza',
    items: Object.freeze([
      Object.freeze({ id: 'current-task', label: 'AKTUALNE ZADANIE', body: 'Kontynuuj eksplorację i aktywuj kolejne elementy świata.' }),
      Object.freeze({ id: 'controls', label: 'STEROWANIE', body: 'Mapa podstawowych wejść kontrolerów.' })
    ]),
    controls: Object.freeze([
      'Prawy drążek — ruch',
      'Lewy drążek — obrót',
      'Spust — wybór / użycie',
      'Chwyt — złap przedmiot',
      'Y — panel gracza'
    ]),
    panelHint: 'Lewy drążek — wybór · X — zatwierdź · Y — zamknij',
    controllersFallback: 'Schemat kontrolerów niedostępny.'
  }),
  en: Object.freeze({
    title: 'Player panel',
    items: Object.freeze([
      Object.freeze({ id: 'current-task', label: 'CURRENT TASK', body: 'Continue exploring and activate the next world elements.' }),
      Object.freeze({ id: 'controls', label: 'CONTROLS', body: 'Basic controller input map.' })
    ]),
    controls: Object.freeze([
      'Right stick — move',
      'Left stick — turn',
      'Trigger — select / use',
      'Grip — grab an object',
      'Y — player panel'
    ]),
    panelHint: 'Left stick — select · X — confirm · Y — close',
    controllersFallback: 'Controller diagram unavailable.'
  })
});

export function resolveVrPlayerGuideContent(locale = 'en') {
  return VR_PLAYER_GUIDE_CONTENT[locale] ?? VR_PLAYER_GUIDE_CONTENT.en;
}

export { VR_PLAYER_GUIDE_CONTENT };
