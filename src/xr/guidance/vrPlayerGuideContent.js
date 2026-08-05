const VR_PLAYER_GUIDE_CONTENT = Object.freeze({
  pl: Object.freeze({
    title: 'Panel gracza',
    items: Object.freeze([
      Object.freeze({ id: 'current-task', label: 'AKTUALNE ZADANIE', body: 'Kontynuuj eksplorację i aktywuj kolejne elementy świata.' }),
      Object.freeze({ id: 'controls', label: 'STEROWANIE', body: 'Prawy joystick: ruch. Lewy joystick: obrót poza panelem. Y: panel.' })
    ]),
    confirm: 'Lewy trigger: wybierz',
    close: 'Y: zamknij'
  }),
  en: Object.freeze({
    title: 'Player panel',
    items: Object.freeze([
      Object.freeze({ id: 'current-task', label: 'CURRENT TASK', body: 'Continue exploring and activate the next world elements.' }),
      Object.freeze({ id: 'controls', label: 'CONTROLS', body: 'Right joystick: move. Left joystick: turn outside the panel. Y: panel.' })
    ]),
    confirm: 'Left trigger: select',
    close: 'Y: close'
  })
});

export function resolveVrPlayerGuideContent(locale = 'en') {
  return VR_PLAYER_GUIDE_CONTENT[locale] ?? VR_PLAYER_GUIDE_CONTENT.en;
}

export { VR_PLAYER_GUIDE_CONTENT };
