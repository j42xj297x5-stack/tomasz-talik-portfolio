export const VR_DIAGNOSTIC_SCOPE = Object.freeze({
  RUNE_TUNING_COMPLETION: 'RUNE_TUNING_COMPLETION'
});

export const VR_DIAGNOSTIC_SCOPES = Object.freeze([
  Object.freeze({
    id: VR_DIAGNOSTIC_SCOPE.RUNE_TUNING_COMPLETION,
    labelPl: 'Freeze po zakończeniu strojenia Kamienia Runicznego',
    labelEn: 'Rune Stone tuning completion freeze',
    descriptionPl: 'Nagrywa przebieg finalizacji strojenia: pre-flight, zużycie składników, commit progresji i zakończenie transakcji.',
    descriptionEn: 'Records tuning finalization: pre-flight, ingredient consumption, progression commit, and transaction completion.'
  })
]);
