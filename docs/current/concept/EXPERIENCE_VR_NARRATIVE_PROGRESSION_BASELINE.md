# Experience VR — Narrative & Progression Baseline

**Status:** CURRENT / canonical. Technicznym źródłem Scenario pozostaje [`VR_SCENARIO_DIRECTOR_MODEL.md`](../technical/VR_SCENARIO_DIRECTOR_MODEL.md).

## Aktualna droga gracza

Intro prowadzi przez naukę panelu Y i kontakt z Małpą do pierwszego cyklu Glyph → Crystal → Reliquary i pierwszego kręgu. Po nim świat odsłania skorupy oraz Piec; gracz produkuje i odbiera Astrolabium Więzi, zbiera skorupy, buduje i odbiera Kulę Asterionową, kończy drugi krąg, a następnie stroi Astrolabium i buduje trzeci krąg.

```text
1.10 → … → 2.30 → … → 3.80 → 4.10 → … → 4.70 → 4.80
```

`4.80` jest aktualną stabilną granicą gameplayową; dalsze akty nie należą do bieżącego kontraktu Guidance.

## Prowadzenie gracza

**Monkey first teacher:** Małpa prowadzi obowiązkowe beaty progresji, sygnalizuje sytuacyjne hinty, jednorazowo uczy narzędzia po fizycznym claim, pokazuje bieżące `CO TERAZ?` i udostępnia historię kart. **Player Y persistent memory:** Y przechowuje praktyczne instrukcje Pieca, Astro i Asteriona oraz pokazuje `AKTUALNE ZADANIE`.

Nie istnieją dwa modele „co teraz”. Obie powierzchnie odczytują jeden bezstanowy CURRENT OBJECTIVE z `createVrCurrentObjectiveProjection`, oparty o canonical point i realny stan domeny. Dzięki temu normalny przebieg, hydration i direct activation prowadzą do tego samego celu.

## Nauczanie i pomoc sytuacyjna

Po claim Astro lub Asteriona Małpa po około 5 s zwraca uwagę, czeka na świadome kliknięcie i odtwarza jednorazowe pierwsze nauczanie. Nie przechodzi potem do ordinary menu; trwała instrukcja pozostaje w Y.

Jeżeli gracz przez około 180 s nie rozpocznie produkcji Astro, Małpa może zaoferować opcjonalną instrukcję Pieca. Jeżeli gotowe Astro pozostaje nieodebrane przez około 60 s, może zaoferować claim hint. Hint czeka na wolne ordinary menu i jest anulowany, jeśli przestaje być aktualny.

Mandatory, acquisition i optional komunikacja współdzielą jawny arbitration contract o priorytecie `MANDATORY > ACQUISITION > OPTIONAL`. Rozpoczęty playback nie jest przerywany.

## Interakcja

Oba narzędzia można odebrać Grabem po wskazaniu legalnym rayem dowolnej ręki; Astro trafia do prawego canonical slotu, Asterion do lewej ręki. Małpa pozostaje dostępna także z jednym lub oboma narzędziami wyposażonymi, bez unequip i bez zmiany hand mode.
