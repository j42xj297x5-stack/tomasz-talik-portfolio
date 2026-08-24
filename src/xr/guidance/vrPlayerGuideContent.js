const VR_PLAYER_GUIDE_CONTENT = Object.freeze({
  pl: Object.freeze({
    title: 'Panel gracza',
    items: Object.freeze([
      Object.freeze({ id: 'controls', label: 'STEROWANIE', body: 'Mapa podstawowych wejść kontrolerów.' }),
      Object.freeze({ id: 'current-task', label: 'AKTUALNE ZADANIE', body: 'Dokonaj wyboru.' })
    ]),
    tools: Object.freeze({
      astro: Object.freeze({
        label: 'ASTROLABIUM WIĘZI',
        description: 'To narzędzie do rzeczy, które są daleko,\na chciałbyś, żeby były bliżej.',
        controls: 'A — wyposaż / schowaj\nChwyt — namierzanie\nSpust — przyciąganie\nSzpila + chwyt — przejęcie obiektu',
        bandSwitchControl: 'B — zmień pasmo celu'
      }),
      asterion: Object.freeze({
        label: 'KULA ASTERIONOWA',
        description: 'To narzędzie do zmiany horyzontu.\nNie przybliża tego, co jest daleko.\nZmienia to, skąd patrzysz.\nDzięki temu dosięgniesz tego, czego wcześniej nie mogłeś.',
        controls: 'X — wyposaż / schowaj\nSpust — zmieniaj orientację platformy'
      })
    }),
    menuHint: 'Lewy drążek — wybór · X — otwórz · Y — zamknij',
    detailHint: 'Lewy drążek — wybór · X — otwórz · Y — wróć',
    controllersFallback: 'Schemat kontrolerów niedostępny.'
  }),
  en: Object.freeze({
    title: 'Player panel',
    items: Object.freeze([
      Object.freeze({ id: 'controls', label: 'CONTROLS', body: 'Basic controller input map.' }),
      Object.freeze({ id: 'current-task', label: 'CURRENT TASK', body: 'Make a choice.' })
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
