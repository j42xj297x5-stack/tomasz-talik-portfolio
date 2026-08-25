# Experience VR — kanoniczny model aktu kamieni runicznych

## 1. Status i authority

- **Status:** **KANONICZNY MODEL TECHNICZNO-GAMEPLAYOWY / PARTIALLY IMPLEMENTED**.
- **Implemented through:** `RUNE A6`.
- **Queued before next gameplay milestone:** `RUNE UI-1 — Astro Furnace panel structure and readability normalization`.
- **Next milestone:** `RUNE A7 — RUNESTONES Astro band`.
- **Canonical runtime boundary:** `4.80`.
- Ten dokument jest jedynym kanonicznym źródłem prawdy całego Rune Stone Act: synchronizacji Astrolabium, Pieca, pięciu pair-specific par elementarnych, specjalnego kamienia Eter, mostów, transportu, instalacji i finalnego polowania Wody.
- Część kontraktów A1–A6 istnieje w runtime jako foundations/domain behavior bez rozszerzenia authored Scenario spine. Opis A7–A21 pozostaje targetem. Kod rozstrzyga faktyczny status implementacji, a authored progression nadal kończy się na stabilnej granicy `4.80`.
- Status implementacji rozstrzygają kod i [`VR_RUNTIME_MODEL.md`](VR_RUNTIME_MODEL.md). Identity Proto-Astro rozstrzyga [`VR_PROTO_ASTRO_MODEL.md`](VR_PROTO_ASTRO_MODEL.md), warstwy przestrzenne — [`VR_SPHERICAL_LAYERS_MODEL.md`](VR_SPHERICAL_LAYERS_MODEL.md), a authored progression — [`VR_SCENARIO_DIRECTOR_MODEL.md`](VR_SCENARIO_DIRECTOR_MODEL.md).

`KANON` oznacza kontrakt wiążący, `TUNING` wartość dobieraną w prototypie/Quest 3S, a `OPEN DESIGN DECISION` świadomie nierozstrzygnięty produktowy warunek.

## 2. Granica aktu i przestrzeń po Tier 3

### Stan zaimplementowany po `4.80`

- Pięć naturalnych Large Glyph zachowuje Proto-Astro tuning `K/T/S/L/R`.
- Istniejący transition przenosi je do `SPHERE_FAR = 80 m` i rozmieszcza deterministycznie po pełnej sferze, nie na pierścieniu.
- Bazowa prezentacja jest black/unlit, a ruch po sferze bardzo wolny (`0.01 rad/s`).
- Stary direct Large Glyph scan/target/pull jest po `4.80` odcięty.
- Large Glyph pozostaje osobnym `LargeGlyphActor`, poza spherical-layer registry.

### Docelowe wejście Rune Stone Act — jeszcze niewdrożone

- Rune Stones mają materializować się w **istniejącym** world-stable płaszczu `RUNE_STONES = 50–75 m`. Nie powstaje nowy promień ani drugi registry.
- Sama materializacja kamienia nie daje prawa pull.
- Untuned family nie jest valid Rune Stone targetem.
- Przyszłe targetowanie należy do pasma `RUNESTONES`.

## 3. Eligibility, synchronizacja i persistent truth

### 3.1. Eligibility bez drugiej listy

**IMPLEMENTED FOUNDATION:** rodzina może zostać wybrana do strojenia wyłącznie wtedy, gdy istniejący owner progresji sektorów potwierdza pełną sekwencję **wszystkich paneli tego sektora**. System kamieni odczytuje ten fakt; nie kopiuje progresji podłogi i nie utrzymuje `initialRuneStoneIds`.

W stanie po Tier 3 reguła daje dokładnie:

| Rodzina | Sektor | Eligibility po `4.80` |
| --- | --- | --- |
| ZIEMIA | Ethics | tak |
| OGIEŃ | Creative AI | tak |
| DREWNO | AI Guide | tak |
| METAL | DIG Engine | nie — sektor ma dalszy panel |
| WODA | Haiku Cosmos | nie — sektor ma dalsze panele |

Po Tier 3 Earth, Fire i Wood są naturalnie eligible, natomiast Metal i Water pozostają locked zgodnie z realnymi stronami swoich sektorów. Metal staje się normalnie eligible po ukończeniu całej sekwencji Metalu. **FUTURE:** po Tier 4 Water pozostaje `4/5`, więc nie spełnia normalnego kontraktu; wyłącznie finalna interwencja Eter może nadać ograniczony Water eligibility override opisany w sekcji 10. **Nie istnieje kanon „cztery kamienie odblokowują piąty” ani sztuczna kolejność `4 → 5`.**

### 3.2. RuneStoneProgressionController

`RuneStoneProgressionController` istnieje. Jego obecny i docelowy ownership jest rozdzielony następująco:

- **IMPLEMENTED:** `tunedRuneFamilies` — trwały fakt „Astrolabium jest zsynchronizowane z rodziną X”.
- **TARGET / NOT IMPLEMENTED:** `installedRuneFamilies` — trwały fakt ukończonej instalacji właściwego kamienia.
- **TARGET / NOT IMPLEMENTED:** trwały, ograniczony wyłącznie do finalnego flow Wody fakt zastępujący brakującą wiedzę piątego panelu Water (semantycznie `WATER_RUNE_KNOWLEDGE_OVERRIDE`; nazwa implementacyjna pozostaje otwarta).

Nie posiada kopii paneli sektorów. Eligibility czyta z ich istniejącego ownera. `ProtoAstroTuningController` nadal posiada wyłącznie naturalne family essences używane dla Large Glyph i **nie** posiada rune tuning ani installation truth.

Na podstawie istniejącego `tunedRuneFamilies` przyszłe Scenario może nadać Astrolabium pasmo `RUNESTONES`. Pasmo widzi wyłącznie kamienie rodzin w `tunedRuneFamilies`; rodzina eligible, lecz jeszcze nietuned, nie jest targetem.

## 4. Receptura Wu Xing

**IMPLEMENTED:** canonical resolver Wu Xing używa cyklu tworzenia. Pierwszy element relacji dostarcza **Small Glyph**, drugi **Shell**, a wynik stroi Rune Stone drugiego elementu. Asset identity nadal pochodzi z istniejących canonical resolverów Proto-Astro; nie istnieje równoległa tabela asset IDs.

| Small Glyph | Shell | Target tuned Rune Stone |
| --- | --- | --- |
| ZIEMIA | METAL | METAL |
| METAL | WODA | WODA |
| WODA | DREWNO | DREWNO |
| DREWNO | OGIEŃ | OGIEŃ |
| OGIEŃ | ZIEMIA | ZIEMIA |

Wybrana rodzina targetu musi być eligible, a para musi dokładnie rozwiązać się do tej rodziny. Nieprawidłowa para nie może rozpocząć procesu.

## 5. Astro Piec — ownership i dwuslotowy kontrakt

### 5.1. Dwa ownerstwa, bez przepisywania istniejących procesów

- istniejący single-content `createVrAstroFurnaceContentInteraction` pozostaje właścicielem dotychczasowych procesów Shell / Small Glyph i istniejącego `VR_FURNACE_CONTENT_ANCHOR`;
- istniejący `createVrAstroFurnaceRuneRecipeInteraction` jest osobnym ownerem dwóch typed slots i działa wyłącznie w `rune_tuning` mode;
- tylko jeden z tych ownerów może przyjmować content w danym trybie; `experienceVr.js` wyłącznie je komponuje.

### 5.2. Kontrakt helperów assetu

Komora zachowuje `VR_FURNACE_INSERT_VOLUME` jako wspólną strefę wkładania oraz `VR_FURNACE_CONTENT_ANCHOR` dla dotychczasowych procesów. Kontrakt A2 obejmuje dwa stabilne authored snap anchors dla rune recipe oraz authored volume produktów Pieca:

```text
RUNE_RECIPE_SMALL_GLYPH_SLOT
RUNE_RECIPE_SHELL_SLOT
VR_FURNACE_PRODUCT_VOLUME
```

Small Glyph może trafić wyłącznie do pierwszego slotu, Shell wyłącznie do drugiego. Przy otwartej komorze oba składniki mogą być osadzone jednocześnie, w dowolnej kolejności, bez pośredniego procesu i bez zamykania/otwierania Pieca pomiędzy nimi. Ten dokument nie modyfikuje GLB ani skryptów Blender; brak helperów wymaga osobnego zadania assetowego.

**IMPLEMENTED:** `VR_FURNACE_PRODUCT_VOLUME` nie należy do receptury runicznej i nie jest jej trzecim składnikiem. Jest authored geometry/bounds contract wewnątrz komory i obsługuje placement Kuli Asterionowej oraz Astro Przyciągacza. Jego własna techniczna geometria nie renderuje się, ale node pozostaje aktywnym parentem produktów, a bounds są dostępne runtime. Transform, geometria i bounds pochodzą z assetu. `VR_FURNACE_CONTENT_ANCHOR` pozostaje kontraktem wejścia dla istniejącego single-content flow i nie jest fallbackiem placementu produktów.

### 5.3. Warunki Activate i pojedynczy cycle

Rune tuning może rozpocząć się tylko, gdy jednocześnie:

- gracz wybrał konkretną eligible rodzinę kamienia;
- oba typed slots są zajęte;
- Small Glyph i Shell tworzą poprawną recepturę dla wybranej rodziny;
- komora jest zamknięta;
- Piec jest idle;
- gracz wykonuje zaakceptowane `Activate`.

Jeden poprawny komplet uruchamia **jeden** nowy semantyczny rune-tuning process kind i dokładnie jeden canonical cycle `18 s`, nie dwie kolejne obróbki po 18 sekund.

### 5.4. Prezentacja wszystkich procesów Pieca

**IMPLEMENTED:** podczas właściwego procesu — shell, Small Glyph, rune tuning lub device construction:

- komora nie wykonuje mechanicznego process-spin;
- dolna pokrywa nie wykonuje process-spin;
- fizyczny obrót komory/pokryw służy wyłącznie otwieraniu i zamykaniu;
- emisja komory i reakcja `fire_cell` mogą pozostać;
- wewnętrzne światło i cztery istniejące energy points nadal mogą orbitować;
- wewnętrzny process angle może pozostać zegarem/fazą światła, punktów i pulsów, ale nie jest aplikowany jako rotation komory ani pokrywy.

To zmiana prezentacyjna, nie zmiana czasu ani ownership progresji.

### 5.5. Audio i wynik

| Asset | Semantyka |
| --- | --- |
| `astro_piec_work_01.mp3` | istniejący proces Shell |
| `astro_piec_work_02.mp3` | istniejący proces Small Glyph |
| `astro_piec_work_03.mp3` | strojenie Astrolabium z pary Small Glyph + Shell |
| `astro_piec_work_create_01.mp3` | istniejąca produkcja urządzeń |

Nie powstaje czwarty work sound. `work_03` nie oznacza fizycznej obróbki kamienia: Rune Stone nigdy nie trafia do Pieca i pozostaje w świecie. Ukończony, poprawny cycle ekstrahuje i **konsumuje oba fizyczne składniki**: Small Glyph nie wraca do field, a Shell również zostaje zużyta. Wynikiem jest semantyczna **sylaba strojenia**, nie fizyczny item ani inventory object. `RuneStoneProgressionController` zapisuje ją jako trwały fakt nastrojenia właściwej rodziny w `tunedRuneFamilies`; po wdrożeniu `RUNESTONES` fakt ten da przyszłemu bandowi prawo targetowania tej rodziny.

To zużycie dotyczy wyłącznie rune recipe. Wcześniejszy `ProtoAstroTuningController` nadal obsługuje naturalne esencje Small Glyph, stroi nimi Large Glyph i zachowuje własny kontrakt powrotu fizycznego Small Glyph do field. Ownerów ani ich persistent truths nie wolno łączyć.

## 6. Dokładnie pięć pair-specific par

Jednostką konfiguracji jest konkretna `kamień + sektor + naczynie/socket + most`. Pięć kamieni może różnić się geometrią, loopem, pivotem, wysokością i safe envelope. Nie wolno zakładać jednej globalnej wysokości socketu ani magicznych offsetów.

Zalecany kontrakt GLB zachowuje istniejącą semantykę:

```text
RUNE_STONE_<TYPE>_ROOT

RUNE_VESSEL_<TYPE>_ROOT
├── RUNE_VESSEL_<TYPE>_MESH
├── RUNE_VESSEL_<TYPE>_SOCKET_POINT
└── RUNE_VESSEL_<TYPE>_SOCKET_ZONE
```

Runtime transformuje wyłącznie stabilny root kamienia. `SOCKET_POINT` jest pair-specific finalną transformacją; `SOCKET_ZONE` wybaczającą strefą przejęcia, nigdy finalnym transformem. Safe envelope uwzględnia maksymalny zakres pełnego baked loopa, nie tylko pierwszą klatkę. Format envelope, geometria zone, wysokość, easing i tolerancje pozostają `TUNING`.

Wewnętrzne animacje pozostają w GLB, działają w `FREE`, mogą działać podczas transportu/capture i nie zatrzymują się po instalacji.

## 7. RuneBridgeActor

Jedna pair-specific instancja `RuneBridgeActor` przypada na sektor/parę. Jest aktorem presentation/mechanics: nie zna Scenario pointów, nie posiada progresji, nie odblokowuje kamienia i wykonuje wyłącznie semantyczne komendy.

```text
HIDDEN → DOCKED → EXTENDING → EXTENDED → ORBITING
```

| Stan | Kontrakt |
| --- | --- |
| `HIDDEN` | przed synchronizacją rodziny most nie istnieje wizualnie |
| `DOCKED` | po synchronizacji materializuje się, zespolony z końcem właściwego sektora |
| `EXTENDING` | gdy poprawny tuned kamień zbliża się do właściwego miejsca instalacji, odjeżdża na zewnątrz wzdłuż radialnej osi sektora |
| `EXTENDED` | utrzymuje układ `platforma → kamień → most` i przestrzeń dla capture |
| `ORBITING` | po instalacji stale obraca się wokół osi `środek platformy → kamień → most` |

Jeśli podejście zostanie przerwane przed capture/installation, most wraca do `DOCKED`. Interpolacja mostu jest transient mechanics, nie Scenario point ani reconstruction truth. `installedRuneFamilies` wystarcza do odtworzenia settled prezentacji `ORBITING`.

## 8. Transport i instalacja

```text
FREE → LOCKED_BY_ASTRO → CARRIED_ORBIT → SOCKET_CAPTURE → INSTALLED
```

- `FREE`: kamień istnieje w deterministic slocie `RUNE_STONES 50–75 m`, odtwarza loop i spatial audio; target jest legalny tylko dla tuned family.
- `LOCKED_BY_ASTRO`: Astro ma prawidłowy lock; kamień nie teleportuje się do ręki ani gracza.
- `CARRIED_ORBIT`: aktywny pull prowadzi root po zewnętrznej stronie platformy z pair-specific safe envelope i lekkim orbit constraint.
- `SOCKET_CAPTURE`: poprawny stone/sector match wchodzi w `SOCKET_ZONE`; aktor wygasza pull i interpoluje do `SOCKET_POINT`.
- `INSTALLED`: dopiero ukończony snap commituje persistent installed fact; własny baked loop i spatial audio trwają dalej.

Zainstalowane kamienie mogą blokować kolejne przez lekkie pair-specific occupied arcs, bez rigid-body i animated mesh collision. Zachowanie po release poza capture oraz szczegóły blockerów pozostają tuningiem/otwartą decyzją i nie zmieniają pierwszej stabilnej granicy.

## 9. Spatial audio

Każdy kamień ma własny cichy spatial loop związany z rootem lub dedykowanym anchor: aktywny w `FREE`, poruszający się w `CARRIED_ORBIT` i pozostający przy `INSTALLED`. Three.js/Web Audio i fail-soft `VrAudioBridge` posiadają playback/dispose; Blender nie eksportuje aktywnego audio, a audio nie posiada progresji. Asset, gain, attenuation i zasięg są pair-specific `TUNING` na Quest 3S.

## 10. Późna progresja: antena, Eter i finalna Woda

### 10.1. Trzy pierwsze kamienie i antena

Po Tier 3 kompletne są Earth, Fire i Wood. Każda rodzina przechodzi pełny standardowy flow `rune recipe → syllable → RUNESTONES tuning → transport → installation`. Po instalacji wszystkich trzech platforma może uruchomić przyszły system anteny. Sterowanie sektorami i antenna actor są osobnym późniejszym subsystemem, a nie odpowiedzialnością kamieni ani wcześniejszych milestone'ów.

Antena odnajduje w `SPHERE_FAR` dwa istotne, już wcześniej zestrojone Large Glyph: Metal i Water. Dla każdego gracz wykonuje `find → lock → pull → Crystal → Reliquary`. Te dwa kryształy domykają Tier 4: Metal otrzymuje czwarty panel i pełny sektor, natomiast Water pozostaje świadomie niepełne `4/5`.

### 10.2. Czwarty kamień Metal i retreat Large Glyph

Pełny sektor Metal nadaje normalne prawo do receptury `Small Glyph Earth + Shell Metal → sylaba Metal`. Następnie Astrolabium targetuje Metal Rune Stone, a standardowy transport i capture kończą się instalacją. Platforma ma wtedy cztery standardowe kamienie: Earth, Fire, Wood i Metal.

`FOURTH_RUNE_INSTALLED` jest osobnym progiem dramaturgicznym: nadmiar technologii na platformie oddala glify; glify tego nie lubią. Large Glyph przechodzą do osobnego, późnego/finalnego spatial stage. Kanon nie nadaje temu stage'owi promienia i nie przypisuje arbitralnie reserved `HIDDEN_GLYPHS` range do `LargeGlyphActor`.

### 10.3. Zamierzony Water deadlock i specjalny Eter

Po Tier 4 Metal jest complete, a Water ma `4/5`. Normalny kontrakt wymaga kompletnego sektora, więc Water Rune Stone nie jest eligible. Zarazem finalnego piątego panelu Water nie da się zdobyć bez uzbrojenia platformy w Water Rune Stone. Jest to celowy finalny deadlock dramaturgiczny, nie błąd progresji.

Model zawiera dokładnie **pięć elementarnych par Rune Stone** — Earth, Fire, Wood, Metal, Water — oraz **jeden specjalny kamień ETER / VI**. Eter:

- nie jest szóstą naturalną `familyCode` ani szóstą standardową parą sektorową;
- nie ma własnego sektora, vessel/socketu ani miejsca w pięciu installed elemental slots;
- nie jest zwykłym targetem `RUNESTONES` i nie trafia do Pieca;
- pojawia się w finalnym kryzysie nad Małpą, która przechwytuje go jako osobny authored beat;
- reprezentuje brakującą ostatnią esencję/więź i nadaje wyłącznie finalne prawo eligibility dla Water, zastępując brakującą wiedzę piątego panelu, a nie samą recepturę.

Scenario authoruje kryzys i Ether intervention oraz daje semantic effect rozpoczęcia beatu. Ether/Monkey presentation actor wykonuje pojawienie i przechwycenie, ale nie posiada progresji. `RuneStoneProgressionController` posiada trwały Water override, `tunedRuneFamilies` i `installedRuneFamilies`. Director wyłącznie akceptuje semantic completion event; nie animuje Małpy ani kamienia. Guidance może jedynie komunikować beat, jeśli zostanie później zaprojektowana.

### 10.4. Piąty kamień Water i finalny timed hunt

Po Ether intervention Water jest wyjątkowo eligible mimo `4/5`, ale nadal wymaga normalnej receptury `Small Glyph Metal + Shell Water → sylaba Water → Astro tuned for Water Rune Stone`. Eter zastępuje wyłącznie brakującą wiedzę/progression eligibility. Water Rune Stone nadal przechodzi `target → transport → SOCKET_CAPTURE → INSTALLED`.

Po instalacji pięciu elementarnych Rune Stones platforma jest kompletna jako finalne narzędzie. Eter pozostaje elementem beatu Małpy i nie zajmuje szóstego slotu. Dopiero rzeczywiste rozpoczęcie `FINAL_WATER_HUNT` po pełnej instalacji Water uruchamia timer:

```text
FIVE_ELEMENTAL_RUNES_INSTALLED
→ FINAL_WATER_HUNT (180 s, TUNING)
→ finalny Large Glyph Water: find / pull
→ ostatni Water Crystal
→ Reliquary
→ ostatni panel Water
→ ukończenie doświadczenia
→ istniejący finał świata
```

Timer `180 s` jest startową wartością **TUNING** do hardware QA. Nie biegnie podczas Ether intervention, receptury, transportu Water Rune Stone, `SOCKET_CAPTURE` ani wcześniejszego dialogu. Jest transient mechaniką aktora/final-hunt ownera; Scenario potrzebuje wyłącznie semantycznych `START`, `SUCCESS` i ewentualnego przyszłego `TIMEOUT`. Odliczanie każdej sekundy nie jest Scenario pointem. **`FINAL_HUNT_TIMEOUT_BEHAVIOR = OPEN DESIGN DECISION`**: kanon nie zakłada game over, restartu ani automatycznego sukcesu.

## 11. Scenario, Director i reconstruction

Obowiązuje bez wyjątku:

```text
SPINE → SCENARIO → DIRECTOR → RuntimeExperience → ACTORS / DOMAIN OWNERS
```

- Scenario authoruje istotne beaty po `4.80`, capabilities, semantic events/effects i settled consequences.
- Director posiada `currentPointId` i legalność przejścia.
- RuntimeExperience wykonuje symbolic effects.
- Actors posiadają transient mechanics; domain owners persistent truth.
- `experienceVr.js` pozostaje composition rootem bez ukrytej maszyny progresji.

Nie tworzy się pointów dla interpolacji mostu, timera `18 s`, stanów slotu, targetingu, pull ani `SOCKET_CAPTURE`. Point powstaje tylko dla istotnego beatu lub stabilnej granicy praw/progresji. Target `entryEffects` rozpoczyna beat, a actor emituje semantic completion event.

Reconstruction składa wyłącznie settled `tunedRuneFamilies` i `installedRuneFamilies` (oraz inne już istniejące owner truths). Nie rekonstruuje pull, held objects, zawartości slotów, trwającego Furnace process, timera, bridge interpolation ani capture. Pierwsza stabilna granica aktu to **`FIRST_RUNE_INSTALLED`**.

Sterowanie/obracanie aktywnego sektora lub anteny po pierwszej instalacji wymaga późniejszego, osobnego aktora i osobnego projektu; nie należy do tego modelu.

## 12. Ownership matrix

| Owner | Posiada | Nie posiada |
| --- | --- | --- |
| owner progresji sektorów | kompletność paneli sektora | tuned/installed rune truth |
| `RuneStoneProgressionController` | obecnie `tunedRuneFamilies`; docelowo także `installedRuneFamilies` i Water-only override | kopia paneli, transient transport |
| existing Furnace ContentInteraction | istniejący single-content lifecycle | dwa rune slots |
| `RuneRecipeInteraction` | dwa typed slots i transient recipe content | persistent tuning, stare procesy |
| Rune Stone actor | lock/orbit/capture/audio/animation | authored progression |
| `RuneBridgeActor` | presentation/mechanics stanów mostu | pointy, unlock, persistent truth |
| sector-control / antenna subsystem | późniejsze sterowanie sektorami oraz find/lock odległych Large Glyph | rune truth, Large Glyph natural tuning |
| Ether/Monkey presentation actor | pojawienie i przechwycenie Eter | Water override i progression truth |
| final-hunt actor/owner | transient timer i mechanika finalnego polowania | authored progression i timeout policy |
| Scenario / Director / RuntimeExperience | authored meaning / legalność / wykonanie effects | domain truth i fizyczna mechanika |
| Blender / GLB | roots, pivots, authored helpers, baked loops | input, audio runtime, progresja |

## 13. Kolejność późniejszego wdrożenia

Każdy milestone jest osobnym bounded taskiem i kończy się przed rozpoczęciem następnego.

**CURRENT IMPLEMENTATION CHECKPOINT:** RUNE A6 complete → `RUNE UI-1` queued → next gameplay milestone RUNE A7.

### RUNE A1 — Furnace process presentation simplification
- **Status:** **IMPLEMENTED**
- **Cel:** usunąć process-spin komory i dolnej pokrywy ze wszystkich procesów.
- **Właściciel:** Furnace activation/presentation actor.
- **Wejście:** istniejący process angle, emission, `fire_cell`, światło i cztery energy points.
- **Rezultat:** obracają się tylko efekty wewnętrzne; komora/pokrywa obracają się wyłącznie przy open/close.
- **Nie implementuje:** zmian receptur, slotów ani czasu.
- **Kryterium zakończenia:** każdy process zachowuje emission/energy feedback bez process rotation obudowy.

### RUNE A2 — Furnace authored slot/volume contract
- **Status:** **IMPLEMENTED**
- **Cel:** dostarczyć dwa authored rune-recipe anchors oraz jeden authored product volume.
- **Właściciel:** Furnace GLB/asset contract.
- **Wejście:** istniejące `VR_FURNACE_INSERT_VOLUME` i `VR_FURNACE_CONTENT_ANCHOR`.
- **Rezultat:** stabilne `RUNE_RECIPE_SMALL_GLYPH_SLOT`, `RUNE_RECIPE_SHELL_SLOT` i `VR_FURNACE_PRODUCT_VOLUME` oraz runtime readiness `runeRecipeAnchorsReady` i `productVolumeReady`; shared insert volume pozostaje jeden, product volume nie należy do receptury runicznej, a produkty już korzystają z niego do placementu.
- **Nie implementuje:** gameplayu receptury.
- **Kryterium zakończenia:** GLB jednoznacznie eksponuje oba anchor IDs oraz product volume; jeśli ich brak, domyka je osobne zadanie Blender/GLB.

### RUNE A3 — RuneRecipeInteraction dual slots
- **Status:** **IMPLEMENTED**
- **Cel:** umożliwić jednoczesne osadzenie Small Glyph i Shell.
- **Właściciel:** nowy `RuneRecipeInteraction`.
- **Wejście:** A2, otwarta komora, typed held objects.
- **Rezultat:** dwa niezależne typed slots przy dowolnej kolejności wkładania.
- **Nie implementuje:** trwałego strojenia; nie zmienia starego ContentInteraction.
- **Kryterium zakończenia:** oba składniki pozostają jednocześnie osadzone i wrong type jest odrzucany.

Osobny `createVrAstroFurnaceRuneRecipeInteraction` utrzymuje dwa niezależne fizyczne typed slots (`SMALL_GLYPH` i `SHELL`), przyjmuje składniki w dowolnej kolejności i osadza je według transformów authored `RUNE_RECIPE_SMALL_GLYPH_SLOT` oraz `RUNE_RECIPE_SHELL_SLOT`. Historyczny zakres A3 nie walidował receptury, nie uruchamiał procesu i nie wykonywał commitu tuningu; production wiring do rzeczywistego `rune_tuning` mode dostarczyło A4.

### RUNE A4 — Rune recipe validation + Furnace panel selection
- **Status:** **IMPLEMENTED**
- **Cel:** wybrać konkretną eligible rodzinę i zwalidować Wu Xing pair.
- **Właściciel:** panel projection + recipe resolver; eligibility ownerem pozostaje progresja sektorów.
- **Wejście:** A3, canonical Proto-Astro resolver, sector completeness.
- **Rezultat:** tylko właściwa para dla wybranego targetu może zezwolić na Activate.
- **Nie implementuje:** procesu i commitu tuning truth.
- **Kryterium zakończenia:** nieeligible target i każda błędna para nie rozpoczynają procesu.

A4 dostarczyło sector-derived eligibility z realnych stron istniejącego ownera progresji, canonical resolver Wu Xing, transient wybór targetu w `RuneRecipeSelectionController`, walidację dwóch fizycznych slotów, semantyczny `rune_tuning` Furnace mode, kartę `MATRYCA EMANACJI` z occupancy/ready gate oraz production wiring A3. Brak jawnego kąta pozostawia option pivot bez nowego targetu. A5 później podłączyło Activate i process; canonical Scenario availability pozostaje targetem RUNE A10.

### RUNE A5 — Rune tuning process
- **Status:** **IMPLEMENTED**
- **Cel:** wykonać i commitować jedno strojenie rodziny.
- **Właściciel:** Furnace process actor + `RuneStoneProgressionController`.
- **Wejście:** A4 i oba fizyczne składniki poprawnej receptury.
- **Rezultat:** nowy process kind, jeden `18 s` cycle, `astro_piec_work_03.mp3`, konsumpcja obu składników i trwała semantyczna sylaba jako committed tuned family.
- **Nie implementuje:** fizycznego procesu kamienia ani instalacji.
- **Kryterium zakończenia:** dokładnie jeden poprawny cycle konsumuje Small Glyph i Shell oraz tworzy jeden idempotentny tuned fact bez fizycznego itemu „sylaba”.

Fizyczny Activate uruchamia jeden semantyczny proces `RUNE_TUNING` przez wspólny canonical driver i dokładnie jeden cycle `18 s`. Frozen transaction target nie zmienia się w trakcie cyklu. Proces używa `astro_piec_work_03.mp3`; dopiero successful COMPLETE konsumuje osadzone Small Glyph i Shell oraz atomowo kończy transakcję commitem naturalnej rodziny do `RuneStoneProgressionController.tunedRuneFamilies`. Wynikowa sylaba pozostaje derived semantic result canonical descriptoru `family + U`, bez fizycznego itemu ani inventory. Abort nie konsumuje składników i nie zapisuje tuned truth.

Poza A5 pozostają: integracja persistence/reconstruction ze Scenario, pasmo `RUNESTONES`, fizyczny Rune Stone field, materializacja i instalacja kamieni, bridge oraz Water override.

### RUNE A6 — Post-Tier-3 spatial transition
- **Status:** **IMPLEMENTED** dla istniejącego transition `SPHERE_FAR = 80 m`, deterministic full-sphere layout, black/unlit far presentation, very slow far movement i odcięcia starego direct Large Glyph scan/target/pull po `4.80`. Naturalne Proto-Astro tuning truth `K/T/S/L/R` pozostaje zachowane.
- **Cel:** post-Tier3 Large Glyph retreat presentation/access.
- **Właściciel:** `LargeGlyphActor` + Scenario capability gating dla utraty starego direct targetowania.
- **Wejście:** settled Tier 3 / `4.80`.
- **Rezultat:** existing `SPHERE_FAR = 80 m`, deterministic full-sphere, black/unlit, sphere angular speed `0.01 rad/s`, zachowane `K/T/S/L/R` oraz usunięte po `4.80` direct Large Glyph scan/target/pull.
- **Nie implementuje:** Rune Stone materialization, field `RUNE_STONES`, pasma `RUNESTONES`, anteny, późniejszego polowania na Large Glyph Metal/Water ani technology-overload retreat poza obecne `80 m`.
- **Kryterium zakończenia:** post-Tier3 presentation/access Large Glyph odpowiada rezultatowi bez przypisywania A6 prezentacji Rune Stones.

### RUNE UI-1 — Astro Furnace panel structure and readability normalization
- **Status:** **QUEUED / NOT IMPLEMENTED**
- **Cel:** przed rozpoczęciem A7 przebudować nawigację i warstwę prezentacyjną panelu Astro Pieca tak, aby istniejące oraz przyszłe strojenia używały jednego czytelnego języka UI.
- **Właściciel:** Furnace panel projection/presentation. Gameplay ownerzy, istniejące procesy i progression truth pozostają bez zmian.
- **Granica:** zadanie UI/presentation. Nie zmienia A1–A6, nie implementuje pasma `RUNESTONES`, materializacji kamieni, transportu, instalacji ani nowych Scenario pointów.

#### Nawigacja Pieca

Panel zachowuje trzy główne opcje.

- **Kula Asterionowa** — w tym zadaniu zachowuje istniejący flow i zachowanie.
- **Astrolabium Więzi** — staje się wejściem do podmenu:
  1. **Utwórz Astrolabium Więzi** — otwiera obecną planszę tworzenia Astrolabium, bez zmiany jej istniejącego gameplayu;
  2. **Strojenie Glifów** — otwiera istniejącą, już zaimplementowaną planszę strojenia glifów;
  3. **Strojenie Kamieni Runicznych** — nowa powierzchnia UI dla rune-tuning flow; samo pojawienie się tej pozycji nie implementuje A7 ani nowej mechaniki targetowania kamieni.
- Trzecia istniejąca główna opcja Pieca pozostaje poza zakresem tego zadania i nie jest przemianowywana ani przebudowywana.

#### Wspólny porządek rodzin w tabelach

Dla tabel skorup, Small Glyph oraz przyszłej tabeli Kamieni Runicznych obowiązuje jeden układ `3 × 2`:

```text
DREWNO | OGIEŃ | ZIEMIA
METAL  | WODA  | ETER
```

Jest to kontrakt kolejności **prezentacji UI**, a nie nowa definicja naturalnych rodzin progresji. Eter pozostaje specjalnym `VI` zgodnie z sekcją 10.3 i nie staje się szóstą naturalną `familyCode`, szóstą standardową parą ani szóstym installed slotem.

- Zachować obecne łacińskie oznaczenia rodzin (`Ki`, `Ti` itd.) jako pomocnicze podpisy czytelności.
- Usunąć z obecnej planszy strojenia wskazany dodatkowy, aktualnie nieaktywny element UI. Usunięcie nie może usuwać ani zastępować pola **Eter** w docelowej tabeli `3 × 2`.

#### Czytelność komórek

- Każda komórka wykorzystuje możliwie dużą część własnej bezpiecznej powierzchni na znak lub ikonę.
- Znaki rodzin, mimo wcześniejszego powiększenia, mogą zostać powiększone dalej do granicy czytelnego marginesu.
- Ikony Small Glyph wymagają wyraźnego powiększenia względem obecnej prezentacji.
- Nie pozostawiać pustej przestrzeni bez funkcji; margines ma jedynie chronić przed clippingiem i wzajemnym nachodzeniem elementów.
- Dokładna skala znaków, ikon i padding pozostają **TUNING** do oceny w VR.

#### Strojenie Kamieni Runicznych

- Komórki tabeli wyboru pokazują wyłącznie znaki rodzin.
- Nie pokazują fizycznych reprezentacji dużych Kamieni Runicznych, ponieważ gameplay operuje na pair-specific parach świata, a panel ma identyfikować rodzinę, nie zastępować obiektu świata miniaturą.

#### Normalizacja strefy ekstrakcji

Dolna strefa ekstrakcji w modułach **Kula Asterionowa** i **Astrolabium Więzi** ma używać wspólnego kontraktu ustawienia pasków:

- znormalizować ich geometrię i wzajemne wyrównanie;
- odsunąć je bardziej ku zewnętrznym krawędziom całego panelu, zachowując czytelny margines;
- dokładny offset pozostaje **TUNING**.

Dla modułu strojenia Kamieni Runicznych wizualizacja ekstrakcji pokazuje jednocześnie dwa konsumowane składniki:

- **Shell** i **Small Glyph** obok siebie;
- jako uproszczone, rotujące siatki/wireframe zgodne z językiem istniejących osobnych wizualizacji;
- z takim odstępem, aby nie nachodziły na siebie podczas pełnego obrotu.

#### Wizualizacje Kuli i Astrolabium

- W module tworzenia **Kuli Asterionowej** pełna wizualizacja Kuli ze skorupami przyklejonymi na powierzchni ma w fazie wizualizacji ekstrakcji całkowicie zaniknąć.
- Jej miejsce w centrum zajmuje uproszczona siatka krawędziowa / wireframe Kuli Asterionowej.
- Siatki krawędziowe Kuli Asterionowej i Astrolabium Więzi należy poprawić pod względem czytelności i jakości; obecne uproszczenia nie są poziomem docelowym.
- Pozostałe zachowanie i prezentacja istniejących modułów pozostają bez zmian.

- **Kryterium zakończenia:** przebudowany panel zachowuje istniejący gameplay Kuli i strojenia glifów, udostępnia jednoznaczną hierarchię Astrolabium, wszystkie wskazane tabele mają ten sam porządek `3 × 2`, znaki/ikony efektywnie wypełniają komórki, strefy ekstrakcji są wyrównane, a wizualizacje Kuli/Astrolabium oraz pary Shell + Small Glyph spełniają powyższy kontrakt bez zmiany progression truth.

### RUNE A7 — RUNESTONES Astro band
- **Status:** **TARGET / NOT IMPLEMENTED**
- **Cel:** udostępnić semantyczny band po pierwszym tuning.
- **Właściciel:** Astro band controller/projection.
- **Wejście:** co najmniej jedna tuned family.
- **Rezultat:** valid targets ograniczone do tuned families.
- **Nie implementuje:** instalacji.
- **Kryterium zakończenia:** eligible-but-untuned i locked families nie pojawiają się jako targets.

### RUNE A8 — RuneBridgeActor first pair
- **Status:** **TARGET / NOT IMPLEMENTED**
- **Cel:** pionowy slice jednego mostu.
- **Właściciel:** `RuneBridgeActor` pierwszej pary.
- **Wejście:** tuned fact i pair-specific radial axis/config.
- **Rezultat:** `HIDDEN → DOCKED → EXTENDING/EXTENDED → ORBITING`, z powrotem do `DOCKED` po przerwanym podejściu.
- **Nie implementuje:** generalizacji na pięć par ani progresji.
- **Kryterium zakończenia:** semantic commands deterministycznie sterują pełną prezentacją pierwszego mostu.

### RUNE A9 — First Rune Stone transport + installation
- **Status:** **TARGET / NOT IMPLEMENTED**
- **Cel:** zainstalować jedną zwalidowaną parę.
- **Właściciel:** Rune Stone transport actor + progression owner; bridge współpracuje przez komendy.
- **Wejście:** A7–A8, tuned family, pair-specific socket/safe envelope.
- **Rezultat:** `FREE → LOCKED_BY_ASTRO → CARRIED_ORBIT → SOCKET_CAPTURE → INSTALLED` i persistent installed fact.
- **Nie implementuje:** sterowania sektorem po instalacji.
- **Kryterium zakończenia:** ukończony capture jednej pary daje stable installed truth, loop/audio i bridge orbit.

### RUNE A10 — Scenario / Director integration
- **Status:** **TARGET / NOT IMPLEMENTED**
- **Cel:** zaauthorować beaty po `4.80` do stabilnej granicy.
- **Właściciel:** Scenario / Director / RuntimeExperience.
- **Wejście:** semantic events/effects i domain APIs A1–A9.
- **Rezultat:** target `entryEffects`, semantic completions i reconstruction settled tuned/installed truth.
- **Nie implementuje:** reconstruction pull, bridge interpolation, Furnace process, slot/held/capture state.
- **Kryterium zakończenia:** natural flow i canonical boundary kończą się na `FIRST_RUNE_INSTALLED` bez technicznych pointów.

### RUNE A11 — Generalizacja na trzy początkowe rodziny
- **Status:** **TARGET / NOT IMPLEMENTED**
- **Cel:** rozszerzyć działający slice na Earth / Fire / Wood.
- **Właściciel:** pair-configured actors i assety.
- **Wejście:** A10 oraz trzy eligible families z sector truth.
- **Rezultat:** trzy niezależne pair-specific konfiguracje.
- **Nie implementuje:** globalnych magicznych offsetów ani założenia wspólnej wysokości/socket envelope.
- **Kryterium zakończenia:** każda para działa z własnym socket height, safe envelope i config.

### RUNE A12 — Quest 3S hardware QA + tuning
- **Status:** **TARGET / NOT IMPLEMENTED**
- **Cel:** sprzętowo zatwierdzić cały pierwszy zestaw.
- **Właściciel:** hardware QA + właściciele subsystemów.
- **Wejście:** A1–A11.
- **Rezultat:** tuning dual-slot readability, `18 s`, black Large Glyph, kamieni `50–75 m`, transportu trzech kamieni, bridge clearance/motion/orbit, performance i audio.
- **Nie implementuje:** aktora sterowania sektorami/anteny.
- **Kryterium zakończenia:** trzy pary i Furnace spełniają kontrakt na Quest 3S z zapisanymi parametrami i defektami.

### RUNE A13 — Sector-control foundation po FIRST_RUNE_INSTALLED
- **Status:** **TARGET / NOT IMPLEMENTED**
- **Cel:** zbudować osobny fundament sterowania sektorami po pierwszej instalacji.
- **Właściciel:** przyszły sector-control subsystem/actor.
- **Wejście:** `FIRST_RUNE_INSTALLED` oraz semantyczne komendy platformy.
- **Rezultat:** jawna granica API dla późniejszej anteny bez przenoszenia progresji do aktora.
- **Nie implementuje:** antenna tracking frame, polowania Metal/Water ani kolejnych kamieni.
- **Kryterium zakończenia:** sektor może być sterowany przez osobnego ownera bez pointów dla interpolacji i bez zmiany rune truths.

### RUNE A14 — Three-rune antenna activation
- **Status:** **TARGET / NOT IMPLEMENTED**
- **Cel:** uruchomić antenę po trzech instalacjach.
- **Właściciel:** Scenario dla beatu; antenna actor dla presentation/mechanics; progression owner dostarcza installed truth.
- **Wejście:** zainstalowane Earth + Fire + Wood oraz A13.
- **Rezultat:** platforma otrzymuje prawo użycia anteny.
- **Nie implementuje:** samego hunt Metal/Water ani tracking-frame pointów.
- **Kryterium zakończenia:** semantic activation zachodzi dokładnie po komplecie trzech rodzin, a aktor nie posiada progresji.

### RUNE A15 — Metal + Water Large Glyph antenna hunt / Tier 4
- **Status:** **TARGET / NOT IMPLEMENTED**
- **Cel:** pozyskać dwa odległe kryształy i domknąć Tier 4.
- **Właściciel:** antenna/Large Glyph actors dla mechaniki; istniejący Crystal/Reliquary i sector progression owners dla commitów.
- **Wejście:** A14 oraz tuned natural Large Glyph Metal i Water w `SPHERE_FAR`.
- **Rezultat:** `find → lock → pull → Crystal → Reliquary` dla Metal i Water; Metal complete, Water `4/5`.
- **Nie implementuje:** ponownego natural tuning, Metal Rune recipe ani technicznych Scenario pointów dla pull/tracking.
- **Kryterium zakończenia:** Tier 4 jest complete, czwarty panel Metal świeci, pełny sektor Metal jest dostępny, a Water pozostaje `4/5`.

### RUNE A16 — Metal rune tuning + fourth installation
- **Status:** **TARGET / NOT IMPLEMENTED**
- **Cel:** przygotować i zainstalować czwarty standardowy Rune Stone.
- **Właściciel:** `RuneRecipeInteraction`, `RuneStoneProgressionController` i pair-specific Metal actors.
- **Wejście:** pełny sektor Metal i receptura Small Glyph Earth + Shell Metal.
- **Rezultat:** sylaba Metal, tuned Metal, transport i persistent Metal installed truth.
- **Nie implementuje:** Ether, Water override ani retreat presentation.
- **Kryterium zakończenia:** platforma ma installed Earth + Fire + Wood + Metal po ukończonym capture.

### RUNE A17 — Fourth-rune technology-overload / Large Glyph retreat
- **Status:** **TARGET / NOT IMPLEMENTED**
- **Cel:** zaauthorować dramaturgiczny próg oddalenia glifów.
- **Właściciel:** Scenario dla beatu; `LargeGlyphActor` dla spatial presentation.
- **Wejście:** `FOURTH_RUNE_INSTALLED`.
- **Rezultat:** Large Glyph przechodzą do jawnego późnego/finalnego spatial stage.
- **Nie implementuje:** arbitralnego promienia, `HIDDEN_GLYPHS` mapping ani Ether intervention.
- **Kryterium zakończenia:** retreat jest odrębnym semantic beatem, a konfiguracja nie zamraża niezatwierdzonego dystansu.

### RUNE A18 — Ether Stone + Monkey intervention + Water override
- **Status:** **TARGET / NOT IMPLEMENTED**
- **Cel:** rozwiązać zamierzony Water deadlock przez specjalny beat.
- **Właściciel:** Scenario, Ether/Monkey presentation actor i `RuneStoneProgressionController` zgodnie z rozdzielonym ownership.
- **Wejście:** Metal complete, Water `4/5`, A17 i finalny kryzys.
- **Rezultat:** Małpa przechwytuje Eter; controller zapisuje trwały, Water-only eligibility override.
- **Nie implementuje:** szóstego sektora/vessela, zwykłego RUNESTONES targetu Eter ani receptury Water.
- **Kryterium zakończenia:** semantic completion beatu nadaje wyłącznie prawo rozpoczęcia finalnej receptury Water.

### RUNE A19 — Water rune tuning + fifth installation
- **Status:** **TARGET / NOT IMPLEMENTED**
- **Cel:** wykonać normalną recepturę i instalację Water z wyjątkowym eligibility.
- **Właściciel:** rune recipe/progression owner oraz pair-specific Water actors.
- **Wejście:** A18, Small Glyph Metal + Shell Water.
- **Rezultat:** sylaba Water, tuned Water, transport, capture i pięć installed elemental families.
- **Nie implementuje:** zastąpienia receptury przez Eter ani uruchamiania timera przed instalacją.
- **Kryterium zakończenia:** Water jest installed, Eter nie zajmuje slotu, a platforma jest kompletnym finalnym narzędziem.

### RUNE A20 — Final Water timed hunt
- **Status:** **TARGET / NOT IMPLEMENTED**
- **Cel:** odnaleźć i ściągnąć ostatni Large Glyph Water w czasowym wyzwaniu.
- **Właściciel:** final-hunt owner/actor dla transient timer/mechanics; Scenario dla semantic start/success.
- **Wejście:** `FIVE_ELEMENTAL_RUNES_INSTALLED` i rzeczywisty start `FINAL_WATER_HUNT`.
- **Rezultat:** timer `180 s` (**TUNING**) oraz możliwość pozyskania ostatniego Water Crystal.
- **Nie implementuje:** czasu podczas wcześniejszych beatów ani rozstrzygnięcia timeoutu.
- **Kryterium zakończenia:** timer startuje dopiero z huntem, success jest semantic eventem, a `FINAL_HUNT_TIMEOUT_BEHAVIOR` pozostaje open.

### RUNE A21 — Last Crystal / Tier 5 / existing finale handoff
- **Status:** **TARGET / NOT IMPLEMENTED**
- **Cel:** domknąć ostatni panel i przekazać sterowanie do istniejącego finału świata.
- **Właściciel:** Crystal/Reliquary/sector progression owners oraz Scenario/Director dla semantic handoff.
- **Wejście:** sukces A20 i ostatni Water Crystal.
- **Rezultat:** Reliquary commit, Water `5/5`, Tier 5 complete, experience completion i istniejący finale handoff.
- **Nie implementuje:** nowego finału świata ani alternatywnej timeout policy.
- **Kryterium zakończenia:** ostatni panel Water jest committed dokładnie raz, po czym canonical flow przechodzi do istniejącego finału.

## 14. Zakazy i otwarte tuning decisions

Zakazane są: drugi registry/radius runiczny; hardcoded initial family list; gate `4 → 5`; rune truth w ProtoAstroTuningController; wkładanie kamienia do Pieca; dwa kolejne 18-sekundowe procesy; przepisywanie starego single-content ownera; process-spin komory/pokrywy; pointy dla Furnace timera, pull, bridge interpolation, antenna tracking frame, sekund timera lub socket capture; globalny socket height; teleport kamienia do ręki; drugi progression cursor w `experienceVr.js`; szósta platforma, szósty vessel lub VI/Eter jako szósta naturalna familyCode.

Otwarte/tuning pozostają pair-specific socket geometry, safe envelope, release behavior, occupied arcs, carry parameters, capture easing, bridge clearance/timing, spatial-audio assets/attenuation, liczbowy dystans late Large Glyph retreat oraz skutek timeoutu finalnego hunt. Nie wolno przypadkowo zamrażać ich jako globalnych wartości.

## 14. Powiązane dokumenty

- [`VR_PROTO_ASTRO_MODEL.md`](VR_PROTO_ASTRO_MODEL.md) — canonical identity resolver i granica natural essences vs rune truth.
- [`VR_SPHERICAL_LAYERS_MODEL.md`](VR_SPHERICAL_LAYERS_MODEL.md) — istniejący `RUNE_STONES 50–75 m`.
- [`VR_PROGRESS_FLOOR_MODEL.md`](VR_PROGRESS_FLOOR_MODEL.md) — owner kompletności paneli sektorów.
- [`VR_AUDIO_MODEL.md`](VR_AUDIO_MODEL.md) — work sounds i spatial audio boundary.
- [`VR_SCENARIO_POINT_AUTHORING_STANDARD.md`](VR_SCENARIO_POINT_AUTHORING_STANDARD.md) — obowiązkowy standard pointów po `4.80`.
