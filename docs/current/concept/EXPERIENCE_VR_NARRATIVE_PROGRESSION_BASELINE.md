# Experience VR — Narrative & Progression Baseline

**Status:** CURRENT / canonical. Technicznym źródłem Scenario pozostaje [`VR_SCENARIO_DIRECTOR_MODEL.md`](../technical/VR_SCENARIO_DIRECTOR_MODEL.md).

## Aktualna droga gracza

Intro prowadzi przez naukę panelu Y i kontakt z Małpą do pierwszego cyklu Glyph → Crystal → Reliquary i pierwszego kręgu. Po nim świat odsłania skorupy oraz Piec; gracz produkuje i odbiera Astrolabium Więzi, zbiera skorupy, buduje i odbiera Kulę Asterionową, kończy drugi krąg, a następnie stroi Astrolabium i buduje trzeci krąg.

```text
1.10 → … → 2.30 → … → 3.80 → 4.10 → … → 4.70 → 4.80
```

`4.80` jest aktualną stabilną granicą gameplayową i wejściem do zatwierdzonego, lecz niezaimplementowanego Rune Stone Act. Kanoniczny kontrakt tego aktu należy wyłącznie do [`VR_RUNE_STONES_MODEL.md`](../technical/VR_RUNE_STONES_MODEL.md); nie rozszerza on bieżącego kontraktu Guidance ani nie twierdzi, że runtime wyszedł poza `4.80`.

## Zatwierdzony akt po Tier 3 — NOT IMPLEMENTED

Po `4.80` pojawiają się Rune Stones w istniejącym płaszczu `50–75 m`, a Large Glyph przechodzą na pełną sferę `SPHERE_FAR = 80 m` z czarną, nieoświetlaną bazą i bardzo wolnym ruchem. Kamienie nie są od razu targetowalne: Astrolabium musi najpierw zsynchronizować rodzinę przez dwuskładnikową recepturę Wu Xing w Piecu.

Eligibility wynika wyłącznie z pełnego ukończenia sektora. Po Tier 3 daje to Earth / Ethics, Fire / Creative AI i Wood / AI Guide; Metal i Water czekają na własne dalsze panele. Nie obowiązuje dawny model „cztery kamienie, potem piąty”. Pierwsza stabilna granica późniejszego wdrożenia to `FIRST_RUNE_INSTALLED`; późniejsze sterowanie sektorem/anteną pozostaje osobnym projektem.

## Prowadzenie gracza

**Monkey first teacher:** Małpa prowadzi obowiązkowe beaty progresji, sygnalizuje sytuacyjne hinty, jednorazowo uczy narzędzia po fizycznym claim, pokazuje bieżące `CO TERAZ?` i udostępnia historię kart. **Player Y persistent memory:** Y przechowuje praktyczne instrukcje Pieca, Astro i Asteriona oraz pokazuje `AKTUALNE ZADANIE`.

Nie istnieją dwa modele „co teraz”. Obie powierzchnie odczytują jeden bezstanowy CURRENT OBJECTIVE z `createVrCurrentObjectiveProjection`, oparty o canonical point i realny stan domeny. Dzięki temu normalny przebieg, hydration i direct activation prowadzą do tego samego celu.

## Nauczanie i pomoc sytuacyjna

Po claim Astro lub Asteriona Małpa po około 5 s zwraca uwagę, czeka na świadome kliknięcie i odtwarza jednorazowe pierwsze nauczanie. Nie przechodzi potem do ordinary menu; trwała instrukcja pozostaje w Y.

Jeżeli gracz przez około 180 s nie rozpocznie produkcji Astro, Małpa może zaoferować opcjonalną instrukcję Pieca. Jeżeli gotowe Astro pozostaje nieodebrane przez około 60 s, może zaoferować claim hint. Hint czeka na wolne ordinary menu i jest anulowany, jeśli przestaje być aktualny.

Mandatory, acquisition i optional komunikacja współdzielą jawny arbitration contract o priorytecie `MANDATORY > ACQUISITION > OPTIONAL`. Rozpoczęty playback nie jest przerywany.

## Interakcja

Oba narzędzia można odebrać Grabem po wskazaniu legalnym rayem dowolnej ręki; Astro trafia do prawego canonical slotu, Asterion do lewej ręki. Małpa pozostaje dostępna także z jednym lub oboma narzędziami wyposażonymi, bez unequip i bez zmiany hand mode.
