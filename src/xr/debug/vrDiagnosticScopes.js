export const VR_DIAGNOSTIC_SCOPE = Object.freeze({
  RUNE_TUNING_COMPLETION: 'RUNE_TUNING_COMPLETION',
  INTRO_MONKEY_HOVER_PROGRESSION: 'INTRO_MONKEY_HOVER_PROGRESSION'
});

export const VR_DIAGNOSTIC_SCOPES = Object.freeze([
  Object.freeze({
    id: VR_DIAGNOSTIC_SCOPE.RUNE_TUNING_COMPLETION,
    labelPl: 'Freeze po zakończeniu strojenia Kamienia Runicznego',
    labelEn: 'Rune Stone tuning completion freeze',
    descriptionPl: 'Nagrywa przebieg finalizacji strojenia: pre-flight, zużycie składników, commit progresji i zakończenie transakcji.',
    descriptionEn: 'Records tuning finalization: pre-flight, ingredient consumption, progression commit, and transaction completion.'
  }),
  Object.freeze({
    id: VR_DIAGNOSTIC_SCOPE.INTRO_MONKEY_HOVER_PROGRESSION,
    labelPl: 'Intro — zatrzymanie po „Wskaż mnie”',
    labelEn: 'Intro — stall after “Point at me”',
    descriptionPl: 'Nagrywa przejście od zakończenia komunikatu „Wskaż mnie” przez hover Małpy, dispatch MONKEY_HOVERED i wejście do WAIT_TRIGGER.',
    descriptionEn: 'Records the transition from completion of “Point at me” through Monkey hover, MONKEY_HOVERED dispatch, and entry into WAIT_TRIGGER.'
  })
]);
