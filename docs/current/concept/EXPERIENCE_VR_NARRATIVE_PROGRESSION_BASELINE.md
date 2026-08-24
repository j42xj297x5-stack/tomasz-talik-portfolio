# Experience VR — Narrative & Progression Baseline

**Status:** CURRENT / canonical. Technicznym źródłem Scenario pozostaje [`VR_SCENARIO_DIRECTOR_MODEL.md`](../technical/VR_SCENARIO_DIRECTOR_MODEL.md).

## Aktualna droga gracza

Intro prowadzi przez naukę panelu Y i kontakt z Małpą do pierwszego cyklu Glyph → Crystal → Reliquary i pierwszego kręgu. Po nim świat odsłania skorupy oraz Piec; gracz produkuje i odbiera Astrolabium Więzi, zbiera skorupy, buduje i odbiera Kulę Asterionową, kończy drugi krąg, a następnie stroi Astrolabium i buduje trzeci krąg.

```text
1.10 → … → 2.30 → … → 3.80 → 4.10 → … → 4.70 → 4.80
```

`4.80` jest aktualną stabilną granicą gameplayową i wejściem do zatwierdzonego, lecz niezaimplementowanego Rune Stone Act. Kanoniczny kontrakt tego aktu należy wyłącznie do [`VR_RUNE_STONES_MODEL.md`](../technical/VR_RUNE_STONES_MODEL.md); nie rozszerza on bieżącego kontraktu Guidance ani nie twierdzi, że runtime wyszedł poza `4.80`.

## Zatwierdzony akt po Tier 3 — NOT IMPLEMENTED

Po `4.80` pojawiają się Rune Stones w istniejącym płaszczu `50–75 m`, a wszystkie pięć już wcześniej zestrojonych Large Glyph przechodzi na pełną sferę `SPHERE_FAR = 80 m` z czarną, nieoświetlaną bazą i bardzo wolnym ruchem. Kamienie nie są od razu targetowalne: Astrolabium musi najpierw zsynchronizować rodzinę przez dwuskładnikową recepturę Wu Xing w Piecu. Poprawny cycle konsumuje Small Glyph i Shell, tworząc wyłącznie trwałą semantyczną sylabę strojenia u rune progression ownera.

Eligibility normalnie wynika z pełnego ukończenia sektora. Po Tier 3 daje to Earth / Ethics, Fire / Creative AI i Wood / AI Guide. Ich trzy instalacje uruchamiają osobny przyszły system anteny, który pozwala odnaleźć już tuned Large Glyph Metal i Water; oba kryształy kończą Tier 4, domykając Metal i pozostawiając Water `4/5`. Metal przechodzi normalną recepturę i czwartą instalację, po której technologiczny overload odsuwa Large Glyph do osobnego późnego spatial stage bez ustalonego promienia.

Water `4/5` tworzy zamierzony finalny deadlock. Specjalny szósty kamień Eter pojawia się nad Małpą i zostaje przez nią przechwycony; nie ma sektora, vessel/socketu ani szóstego elemental slotu. Beat nadaje jedynie Water eligibility override. Water nadal wymaga receptury Small Glyph Metal + Shell Water i pełnej piątej instalacji. Dopiero wtedy rozpoczyna się `FINAL_WATER_HUNT` z timerem `180 s` (**TUNING**), prowadzący przez ostatni Crystal i Reliquary do Water `5/5`, Tier 5 oraz istniejącego finału świata. Skutek timeoutu pozostaje otwartą decyzją.

## Prowadzenie gracza

**Monkey first teacher:** Małpa prowadzi obowiązkowe beaty progresji, sygnalizuje sytuacyjne hinty, jednorazowo uczy narzędzia po fizycznym claim, pokazuje bieżące `CO TERAZ?` i udostępnia historię kart. **Player Y persistent memory:** Y przechowuje praktyczne instrukcje Pieca, Astro i Asteriona oraz pokazuje `AKTUALNE ZADANIE`.

Nie istnieją dwa modele „co teraz”. Obie powierzchnie odczytują jeden bezstanowy CURRENT OBJECTIVE z `createVrCurrentObjectiveProjection`, oparty o canonical point i realny stan domeny. Dzięki temu normalny przebieg, hydration i direct activation prowadzą do tego samego celu.

## Nauczanie i pomoc sytuacyjna

Po claim Astro lub Asteriona Małpa po około 5 s zwraca uwagę, czeka na świadome kliknięcie i odtwarza jednorazowe pierwsze nauczanie. Nie przechodzi potem do ordinary menu; trwała instrukcja pozostaje w Y.

Jeżeli gracz przez około 180 s nie rozpocznie produkcji Astro, Małpa może zaoferować opcjonalną instrukcję Pieca. Jeżeli gotowe Astro pozostaje nieodebrane przez około 60 s, może zaoferować claim hint. Hint czeka na wolne ordinary menu i jest anulowany, jeśli przestaje być aktualny.

Mandatory, acquisition i optional komunikacja współdzielą jawny arbitration contract o priorytecie `MANDATORY > ACQUISITION > OPTIONAL`. Rozpoczęty playback nie jest przerywany.

## Interakcja

Oba narzędzia można odebrać Grabem po wskazaniu legalnym rayem dowolnej ręki; Astro trafia do prawego canonical slotu, Asterion do lewej ręki. Małpa pozostaje dostępna także z jednym lub oboma narzędziami wyposażonymi, bez unequip i bez zmiany hand mode.
