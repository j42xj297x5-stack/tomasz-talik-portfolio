# Experience VR — finalny Glif Wody i kulminacja Rezonatora

## Status i zakres autorytetu

**Status: CURRENT / BINDING DESIGN TARGET / IMPLEMENTATION PENDING.**

Ten dokument jest wiążącym celem architektonicznym i narracyjnym dla końcowego polowania na Glif Wody. Rozdziela trzy klasy stwierdzeń:

- **FACT** — zachowanie potwierdzone w bieżącym runtime;
- **BINDING DESIGN TARGET** — zatwierdzone zachowanie do następnej implementacji, jeszcze nie runtime;
- **FUTURE** — kierunek poza bezpośrednim zakresem, dopóki ten dokument nie promuje go do celu.

Nie wolno interpretować celu jako istniejącej funkcji. Ten freeze nie zmienia runtime ani nie zastępuje technicznych właścicieli mechanik. W razie konfliktu jest nadrzędny dla kolejności i Guidance tej kulminacji; modele techniczne zachowują autorytet nad aktualną mechaniką.

## Already implemented facts

### FACT — finalny limit Glifu Wody

Dla `haiku-cosmos`, po ukończeniu Tier/Ring 4, gdy `waterSyncLock !== true`, runtime stosuje:

```text
maximumRingCount = 2
cycleAtCeiling = true
retainCompletedStagesOutside = true
```

Cel przechodzi `0 → 1 → 2 → reset/cycle`, lecz nie osiąga ring 3 ani `PULL_READY`. Gdy `waterSyncLock === true`, wraca normalne `maximumRingCount = 3`, bez cyklu na suficie i bez specjalnego zachowania retencji.

### FACT — obecna definicja Water Sync Lock

Field Actor wyprowadza `waterSyncLock` z pełnej konfiguracji:

```text
EARTH = 2   WOOD = 2   FIRE = 2
METAL ANGLE = 2   METAL TILT = 2
WATER ANGLE = 2   WATER TILT = 2
```

Kanoniczny skrót: **`222 / M22 / W22`**. Jest to zbalansowane rozwiązanie finałowej zagadki: **BALANCE / SYMMETRY / CENTER**, nie maksimum mocy. Level 3 nie jest rozwiązaniem.

### FACT — późny ruch i prezentacja Large Glyph

W `SPHERE_FAR` Large Glyphs zachowują ruch kątowy/orbitalny i dodatkowo oscylują radialnie, w przybliżeniu między `20–110 m`, z okresem około `135 s`. Utrzymanie celu jest przez to celowo trudniejsze. Przed `PULL_READY` fizyczna prezentacja dalekiego Glifu pozostaje ciemna/czarna.

### FACT — aktualne role Wody i Metalu

Woda ma dwa niezależne poziomy `0..3` służące strojeniu częstotliwości/prezentacji:

- ANGLE: `0` neutralny, `1` zielony, `2` niebieski, `3` fioletowy/purpurowy;
- TILT: `0` baseline, `1/2/3` coraz mocniejsza luminancja i halo.

Woda nie wybiera ani nie filtruje rodzin Glifów. Nie zmienia generic geometry, zasięgu, containment ani generic target-acquisition authority. Metal rozszerza istniejące pokrycie: wrist twist/ANGLE steruje LATERAL, a hand tilt/TILT steruje FORWARD/depth. Sam Metal nie usuwa finalnego dwuringowego limitu Wody.

## Problem obecnej progresji

Obecny runtime przechodzi zbyt szybko przez:

```text
Fourth Ring + fourth natural Rune installed
→ Ether intervention → Ether → Water installation
→ full Resonator → final Water hunt
```

Ujawnia brakujący składnik, zanim gracz osobiście doświadczy ograniczenia czterorunowego Rezonatora. Wiążąca dramaturgia brzmi:

```text
EXPERIENCE FAILURE FIRST → UNDERSTAND LIMIT → DISCOVER ETHER
→ COMPLETE WATER SECTOR → SOLVE BALANCE PUZZLE → FINAL WATER GLYPH
```

## Binding design target — fazy kulminacji

### Faza 1 — kontrolowana porażka Wody

Po ukończeniu Fourth Ring, instalacji Metalu i udostępnieniu czterorunowego Rezonatora Scenario nie może rozpoczynać wyjaśnienia Eteru wyłącznie dlatego, że istnieją obecne join prerequisites. Najpierw gracz dostaje próbę:

- PL objective: **`NAMIERZ GLIF WODY`**;
- EN semantic target: **`ACQUIRE THE WATER GLYPH`**.

Gracz może znaleźć i utrzymywać Haiku Cosmos. Istniejący cap daje ring 1, ring 2, a następnie uniemożliwia ring 3.

Kontrolowana porażka nie oznacza wyjścia celu z pola, decay, utraty containment ani upływu czasu. Oznacza dokładnie osiągnięcie intencjonalnego dwuringowego sufitu i cykl spowodowany aktywnym late-Water cap. Target Acquisition Domain ma wykryć ten fakt z własnej acquisition truth i wyemitować semantic signal, roboczo `FINAL_WATER_ACQUISITION_REJECTED`. Dokładna nazwa może zostać ustalona podczas implementacji. Guidance nie wnioskuje z obrazu; Scenario konsumuje wyłącznie semantic event.

### Faza 2 — interwencja Eteru dopiero po porażce

Dopiero po kontrolowanym odrzuceniu Małpa wyjaśnia, że Metal nie wystarcza, i wprowadza Eter. `progression.p4.etherIntervention` wymaga reworku tak, aby wynikał z doświadczenia gracza.

**PL master — APPROVED DESIGN COPY; EN editorial translation — IMPLEMENTATION PENDING:**

1. `Nie.`
2. `Odpowiada.\nAle nie pozwala się uchwycić.`
3. `Metal poszerzył twoje spojrzenie.\nWidocznie to nie wystarczy.`
4. `Została Woda.\nTylko jej sektor nie ma jak się domknąć.`
5. `Normalnie powiedziałbym, że utknęliśmy.`
6. `Na szczęście normalnie już dawno przestało tu działać.`
7. `Jest jeszcze jeden kamień.`
8. `Nie należy do tej piątki.`
9. `Eter.`
10. `Nie ma własnego miejsca pomiędzy nimi.\nMoże właśnie dlatego potrafi je połączyć.`
11. `Spróbujmy.`

Każdy numer jest osobnym blokiem/bąblem; `\n` pozostaje wymuszonym podziałem linii wewnątrz bloku.

### Faza 3 — Eter prowadzi do instalacji Wody

Zachować łańcuch:

```text
Water cannot complete → Ether becomes relevant → Ether tuning
→ Ether captured / Monkey interaction → Water installation path opens
→ Water Rune installed
```

Eter nie jest kolejnym collectible, lecz **CONNECTOR / BINDING PRINCIPLE**. Pięć naturalnych Run to zróżnicowane formy; Eter pozostaje poza tym zbiorem i pozwala im działać jako jeden instrument. Architektura może przywołać analogię hylomorfizmu — forma oraz to, co pozwala formom uczestniczyć w jednej materialnej całości — ale player-facing copy nie może stać się wykładem filozoficznym.

### Faza 4 — pełna zagadka Rezonatora

Po fizycznej instalacji Wody i pomyślnym ukończeniu istniejącej full-Resonator first-teacher communication rozpoczyna się prawdziwy final Water puzzle. Gracz ma pięć naturalnych Run, komplet kontrolek, ruchomy Haiku Cosmos i istniejący dwuringowy cap aż do synchronizacji.

Rozwiązanie to **`222 / M22 / W22`**. Należy komunikować środek, symetrię i równowagę, nigdy „maksymalną moc” ani „ustaw wszystko na maksimum”. Po uzyskaniu `waterSyncLock === true` istniejąca truth usuwa cap i pozwala osiągnąć ring 3 / `PULL_READY`.

Wiążące semantic stages, niezależne od przyszłych ID pointów:

1. spróbuj namierzyć Wodę przed interwencją Eteru;
2. ukończ ścieżkę Eteru i instalacji Wody;
3. zbalansuj/skonfiguruj Rezonator;
4. przyciągnij Glif Wody;
5. zdobądź ostatni kryształ.

## Binding design target — harmonic feedback

Przy `222 / M22 / W22` całe pole rozpoczyna powolny, spójny oddech/puls:

- read-only presentation wyprowadzona z istniejącej synchronization truth;
- nie tworzy nowej gameplay truth;
- łagodna i spójna w całym polu, wyraźnie inna od zwykłej luminancji Water;
- orientacyjny rytm oddechu `2–3 s`;
- bez flash/strobe i bez eksplozji power-up.

Znaczenie: **`THE RESONATOR IS BALANCED`**. Pulse jest **BINDING DESIGN TARGET / IMPLEMENTATION PENDING**. Sukcesu nie wolno wnioskować z widocznego pulsu; prezentacja zawsze podąża za domain truth.

## Binding design target — hint ladder 3 / 6 / 9 minut

Timer zaczyna się tylko raz, gdy Woda jest fizycznie zainstalowana, full-Resonator first-teacher communication zakończyła się sukcesem, a final Water objective pozostaje nierozwiązany. Nie działa podczas Eteru ani instalacji Wody. Due hint czeka, jeżeli mandatory Monkey channel jest zajęty. Ladder kończy się na zawsze co najmniej przy `waterSyncLock === true` lub silniejszym przyszłym semantic balanced-state truth.

Zwykłe eksperymenty nie resetują czasu: zmiana levelu/locku, odnalezienie Haiku, zdobycie jednego lub dwóch ringów i chwilowa utrata containment są oczekiwanymi próbami.

### Hint 1 — 3 minuty — poetycki/koncepcyjny

Nie ujawnia levelu 2, symetrii wprost ani ustawień. **PL master — APPROVED DESIGN COPY; EN — IMPLEMENTATION PENDING:**

1. `Glify nie lubią, kiedy patrzysz na nie przez zbyt wiele rzeczy.`
2. `Na początku wystarczyło, że patrzyłeś.\n\nPotem zbudowałeś Portal.\n\nSektory.\n\nPiec.\n\nAstrolabium.\n\nRezonator.`
3. `Im więcej miałeś sposobów, żeby je dosięgnąć,\n\ntym dalej uciekały.`
4. `Woda robi to najlepiej.\n\nZbliża się.\n\nOddala.\n\nNie chce zostać tam, gdzie ją znalazłeś.`
5. `Trochę jakby pokazywała ci, czym jest.`
6. `Ale teraz masz wszystkie części.\n\nI Eter.`
7. `On sam nie ma jednej formy.\n\nDlatego może łączyć pozostałe.`
8. `Nie próbuj tylko złapać Wody.\n\nDostrój do niej całe miejsce.`
9. `Obserwuj pole.\n\nOno też potrafi odpowiedzieć.`

### Hint 2 — 6 minut — balance/symmetry

Ujawnia klasę rozwiązania, nie liczbę. **PL master — APPROVED DESIGN COPY; EN — IMPLEMENTATION PENDING:**

1. `Chyba próbujesz znaleźć wiele odpowiedzi.`
2. `A może jest tylko jedna.`
3. `Nie stroisz pięciu osobnych sektorów.\n\nStroisz jeden Rezonator.`
4. `Niech odpowiedzą podobnie.`
5. `Szukaj środka.\n\nSymetrii.\n\nRównowagi.`
6. `Pomyśl o Wodzie.\n\nPrzyjmuje każdy kształt.\n\nAle sama zawsze szuka poziomu.`
7. `Nie patrz tylko na sektory.\n\nPatrz na pole.`

Po pomyślnym playback Małpa pozostaje pierwszym nauczycielem, a praktyczna pamięć staje się dostępna:

- Monkey → CO TERAZ? topic: `ZRÓWNOWAŻ REZONATOR`;
- body: `Nie szukaj różnych skrajnych ustawień.\nZestrój wszystkie sektory podobnie.\nSzukaj środka i obserwuj pole.`;
- Player Y → AKTUALNE ZADANIE secondary clue: `Zestrój sektory podobnie.\nSzukaj środka i symetrii.\nObserwuj reakcję pola.`

### Hint 3 — 9 minut — świadomy wybór

Najpierw attention cue, następnie:

`Chcesz dostać odpowiedź?\n\nCzy chcesz jeszcze znaleźć ją sam?`

Wybory: `JESZCZE SPRÓBUJĘ` oraz `POKAŻ MI`. Odpowiedź nigdy nie jest automatycznym dumpem.

#### `JESZCZE SPRÓBUJĘ`

Zatrzymać wszystkie przyszłe automatyczne eskalacje i nie powtarzać Hint 3. Monkey → CO TERAZ? udostępnia opcjonalne, persistent pytanie `CHCESZ POZNAĆ WŁAŚCIWE UŁOŻENIE REZONATORA?`. Gracz może eksperymentować bez limitu; dopiero późniejsze świadome wybranie tematu ujawnia odpowiedź.

#### `POKAŻ MI`

**PL master — APPROVED DESIGN COPY; EN — IMPLEMENTATION PENDING:**

1. `Dobrze.`
2. `Wszystkie sektory ustaw na poziom 2.`
3. `Ziemia, Drzewo i Ogień — 2.`
4. `Metal — oba ustawienia 2.`
5. `Woda — oba ustawienia 2.`
6. `Obserwuj pole.`
7. `Kiedy zacznie pulsować, spróbuj namierzyć Wodę ponownie.`

Po tym reveal ta sama praktyczna odpowiedź pozostaje persistent w Monkey → CO TERAZ? i Player Y → AKTUALNE ZADANIE. Dokładnej odpowiedzi nie wolno ujawnić przed świadomą zgodą w Hint 3.

## Player Y — wymagany copy refinement

W implementacji usunąć release-note wording typu `Barwa nie wybiera obecnie rodziny Glifu.`. Player-facing kierunek ma mówić pozytywnie:

- Water stroi hue/frequency oraz intensywność pola;
- Water stroi pole, zamiast zmieniać jego zasięg;
- ustawienia uczestniczą w strojeniu pełnego Rezonatora.

Preferowane zdanie: `Woda stroi pole, zamiast zmieniać jego zasięg.` To wymagany copy refinement, nie zmiana runtime w tym freeze.

## Ownership

| Owner | Odpowiedzialność | Nie rekonstruuje |
| --- | --- | --- |
| Scenario | położenie finału, semantic stages, failure → Ether → Water → final puzzle | acquisition/presentation truth |
| Target Acquisition Domain | ring stages, dwuringowy cap, semantic rejection signal | znaczenie narracyjne i obraz |
| Resonator Field Domain | Sector configuration i balanced synchronization truth | Guidance i pulse jako truth |
| Guidance | delayed ladder, Monkey first teacher, fallback publication po nauczaniu | acquisition z visuals |
| Player Y | persistent practical memory | first-teacher narration i gameplay truth |
| Field Presentation | read-only harmonic breathing | synchronization truth |
| Large Glyph Actor | fizyczny późny ruch | lock, hinty i pull eligibility |
| Astrolabium of Binding | final pull po istniejącej eligibility | rings, synchronization i Scenario |

Żaden owner nie może rekonstruować truth innego ownera z visuals.

## Implementation work required

- controlled Water-rejection semantic handoff do Scenario;
- zmieniona kolejność late Scenario;
- rework Ether first-teacher communication;
- lifecycle final Water puzzle;
- hint ladder `3 / 6 / 9` minut;
- deliberate answer choice Hint 3;
- persistent `CO TERAZ?` fallbacks;
- eskalacja clue w Player Y;
- harmonic balanced-field pulse;
- Water Player Y copy refinement.

Żaden z tych punktów nie jest ukończony przez ten dokument.

## Future poza bezpośrednim freeze

Dokładne point IDs, finalna nazwa rejection eventu, EN editorial copy oraz parametry wizualne poza charakterem i kadencją pulsu są decyzjami implementacyjnymi. Water-family filtering nie istnieje i nie jest promowane przez ten freeze. Ten dokument nie zmienia dalszej karty końcowej, rozpadu świata ani zakończenia sesji.
