# AUDYT MAPOWANIA WIEDZY ŚWIATA → RUNTIME

Data audytu: 2026-10-01  
Repozytorium: `j42xj297x5-stack/tomasz-talik-portfolio`  
Gałąź: `work`  
Tryb: **AUDIT / bez zmian w kodzie**

## Cel

Zmapować wszystkie wpisy `KIEDY:` z pliku roboczego:

`WIEDZA_O_ŚWIECIE_V1-tranlated.md`

na istniejące, autorytatywne stany i zdarzenia runtime Orange Monkey VR, tak aby późniejsza implementacja systemu `WIEDZA` nie tworzyła równoległej progresji i nie opierała się na zgadywaniu numerów scenariusza.

Aktualna decyzja Wizjonera jest nadrzędna wobec wcześniejszego dokumentu progresji: liczba kart/gwiazdek wynika z faktycznego podziału treści. Kategorie mają **2, 3 albo 4 etapy**. Każda podsekcja `XX.YY` jest jednym etapem wiedzy.

Łącznie źródło zawiera **45 etapów**.

## Wynik ogólny

Mapowanie jest wykonalne bez przebudowy domeny gry.

Prawie wszystkie momenty `KIEDY` mają już trwały runtime truth lub dają się jednoznacznie wyprowadzić z istniejących ownerów:

- ringi → `progressionController.isTierComplete(tier)`;
- skorupy → `furnaceProgressionController`;
- małe glify → `protoAstroTuningController`;
- odczyty Portalu → committed strony `progressionController`;
- Astrolabium → `astroAttractorProductionController`;
- Kula Asterionowa → `asterionProductionController`;
- tuning i instalacja Run → `runeStoneProgressionController`;
- Zworniki → `runeBridgeActor`;
- Rezonator → `asterionResonatorFieldActor`;
- Ether → istniejące truth `etherRuneTuned` i `waterInstallationReadinessOverride`.

Nie należy dodawać niezależnych liczników wiedzy dla gameplayu. Model wiedzy powinien **czytać istniejący domain truth**, a własne dane przechowywać wyłącznie dla lifecycle wiedzy (`AVAILABLE`, `READ`) oraz dla historycznych triggerów, których nie da się później odtworzyć z aktualnego stanu.

## Ważna rozbieżność dokumentacyjna

`docs/current/concept/EXPERIENCE_VR_WORLD_KNOWLEDGE_PROGRESSION.md` nadal zawiera wcześniejszy invariant „dokładnie trzy gwiazdki” oraz wcześniejsze progi Rune Stones oparte na instalacji.

Najnowsza jawna decyzja i aktualny plik `WIEDZA_O_ŚWIECIE_V1-tranlated.md` zmieniają ten model:

- liczba etapów jest zgodna z liczbą podsekcji: 2 / 3 / 4;
- Rune Stones odsłaniają treść po **tuningach 1 / 3 / 5 / 6**, nie po instalacjach 2 / 4 / 5;
- wszystkie `KIEDY:` z pliku źródłowego są wiążącym targetem do kolejnej synchronizacji dokumentacji.

Przed implementacją runtime ten dokument progresji powinien zostać zsynchronizowany. Nie jest to luka w kodzie.

## Legenda mapowania

- **DIRECT** — istnieje stabilny, monotoniczny stan domenowy odpowiadający triggerowi.
- **DERIVED** — trigger jest prostym, jednoznacznym wyliczeniem z trwałych stanów domenowych.
- **LATCH** — warunek może później zniknąć; pierwsze spełnienie musi zostać zapamiętane przez model wiedzy.
- **SEMANTIC_ALIAS** — tekst używa pojęcia, którego runtime nie posiada literalnie; wskazany jest istniejący kanoniczny odpowiednik.

## Pełna mapa 45 etapów

| ID | Karta / fragment | KIEDY (źródło) | Runtime truth / predicate | Właściciel | Typ | Uwagi |
|---|---|---|---|---|---|---|
| 01.1 | Pięć Przemian — Natura przemian | 1. ring ukończony | progressionController.isTierComplete(1) === true | src/xr/progression/createVrProgressionController.js :: isTierComplete(1) | DIRECT | Trwały, rekonstrukcyjny truth; live event: FIRST_RING_COMPLETED. |
| 01.2 | Pięć Przemian — Cykl | 2. ring ukończony | progressionController.isTierComplete(2) === true | createVrProgressionController.js :: isTierComplete(2) | DIRECT | Live event: TIER_COMPLETED { tier: 2 }. |
| 01.3 | Pięć Przemian — Równowaga | 3. ring ukończony | progressionController.isTierComplete(3) === true | createVrProgressionController.js :: isTierComplete(3) | DIRECT | Live event: TIER_COMPLETED { tier: 3 }. |
| 02.1 | Proto Astro — Rodziny | 1. ring ukończony | progressionController.isTierComplete(1) === true | createVrProgressionController.js | DIRECT | Wspólny trigger z 01.1. |
| 02.2 | Proto Astro — Formy | 2. ring ukończony | progressionController.isTierComplete(2) === true | createVrProgressionController.js | DIRECT | Wspólny trigger z 01.2. |
| 02.3 | Proto Astro — Wyjątek V | 4. ring ukończony | progressionController.isTierComplete(4) === true | createVrProgressionController.js | DIRECT | Live event: TIER_COMPLETED { tier: 4 }. |
| 03.1 | Skorupy — Odłamki | 2 skorupy przetworzone w Piecu | furnaceProgressionController.getAbsorbedShellIds().length >= 2 | src/xr/furnace/createVrAstroFurnaceProgressionController.js | DERIVED | Źródłem prawdy jest commitAbsorbedShell(), nie samo włożenie/uruchomienie Pieca. |
| 03.2 | Skorupy — Rozpoznanie | 4 skorupy przetworzone w Piecu | getAbsorbedShellIds().length >= 4 | createVrAstroFurnaceProgressionController.js | DERIVED | Duplikaty są odrzucane przez Set/canAbsorbShell(). |
| 03.3 | Skorupy — Zmiana horyzontu | 6 skorup przetworzonych w Piecu | getAsterionSphereProgress().complete === true | createVrAstroFurnaceProgressionController.js | DIRECT | Równoważne absorbedShells.size === 6. |
| 04.1 | Małe Glify — Bliżej źródła | 2 małe glify przetworzone w Piecu | protoAstroTuningController.getExtractedFamilyCodes().length >= 2 | src/xr/protoAstro/createVrProtoAstroTuningController.js | DERIVED | Commit następuje przez commitExtractedSmallGlyph() dopiero po pełnej ekstrakcji. |
| 04.2 | Małe Glify — Widzieć to, co już istnieje | 4 małe glify przetworzone w Piecu | getExtractedFamilyCodes().length >= 4 | createVrProtoAstroTuningController.js | DERIVED | Naturalne family codes są utrzymywane jako unikalne. |
| 04.3 | Małe Glify — Wzorzec | 5 małych glifów przetworzonych w Piecu | getExtractedFamilyCodes().length >= 5 | createVrProtoAstroTuningController.js | DERIVED | Dotyczy pięciu naturalnych rodzin; VI nie jest w tej sekwencji. |
| 05.1 | Duże Glify — Początek | 2. ring ukończony | progressionController.isTierComplete(2) === true | createVrProgressionController.js | DIRECT | 05.1 i 05.2 stają się AVAILABLE równocześnie. |
| 05.2 | Duże Glify — Ruch | 2. ring ukończony | progressionController.isTierComplete(2) === true | createVrProgressionController.js | DIRECT | Celowo wspólny trigger. |
| 05.3 | Duże Glify — Fundament | 3. ring ukończony | progressionController.isTierComplete(3) === true | createVrProgressionController.js | DIRECT |  |
| 05.4 | Duże Glify — Reguła świata | 4. ring ukończony | progressionController.isTierComplete(4) === true | createVrProgressionController.js | DIRECT |  |
| 06.1 | Kryształy — Odczyt | 1. kryształ odczytany w Portalu | liczba committed stron Tier 1 >= 1 | createVrProgressionController.js + src/content/experienceVrPages.js | DERIVED | Liczyć CARD_COMMITTED / activatedPageIds dla page.order===1. Nie liczyć CRYSTAL_ACTIVATED (to tylko preview). |
| 06.2 | Kryształy — Bez szkody | 3. kryształ odczytany w Portalu | liczba committed stron Tier 1 >= 3 | createVrProgressionController.js + experienceVrPages.js | DERIVED | Rekonstrukcja z getActivatedPageIds(), nie z lokalnego licznika sesji. |
| 06.3 | Kryształy — Bliskość | 5. kryształ odczytany w Portalu | liczba committed stron Tier 1 >= 5 | createVrProgressionController.js + experienceVrPages.js | DERIVED | Piąty commit Tier 1 domyka 1. ring. |
| 07.1 | Portal i Relikwiarz — Tłumacz | 2. kryształ odczytany w Portalu | liczba committed stron Tier 1 >= 2 | createVrProgressionController.js + createVrCrystalCollection.js | DERIVED | commitPage() następuje przy release aktywnego kryształu po odczycie. |
| 07.2 | Portal i Relikwiarz — Interpretacja | 4. kryształ odczytany w Portalu | liczba committed stron Tier 1 >= 4 | createVrProgressionController.js + createVrCrystalCollection.js | DERIVED |  |
| 07.3 | Portal i Relikwiarz — Przekład | 5. kryształ odczytany w Portalu | liczba committed stron Tier 1 >= 5 | createVrProgressionController.js + createVrCrystalCollection.js | DERIVED | Wspólny próg z 06.3. |
| 08.1 | Piec — Transformacja | Astrolabium Więzi utworzone i wyjęte z Pieca | astroAttractorProductionController.isEarned() === true | src/xr/tools/createVrAstroAttractorProductionController.js | DIRECT | Stan EARNED jest ustawiany po zakończeniu claim/handoff; live event ASTRO_ATTRACTOR_CLAIMED. |
| 08.2 | Piec — Dziedzictwo badaczy | Kula Asterionowa ukończona i wyjęta z Pieca | asterionProductionController.getState() === 'EARNED' | src/xr/asterion/createVrAsterionProductionController.js | DIRECT | Live event ASTERION_CLAIMED; stan EARNED jest trwały/reconstructable. |
| 08.3 | Piec — Rozszerzenie poznania | 1. mały glif przetworzony w Piecu | protoAstroTuningController.getExtractedFamilyCodes().length >= 1 | createVrProtoAstroTuningController.js | DERIVED | Najwcześniejszy committed Small Glyph essence extraction. |
| 09.1 | Astrolabium Więzi — Kierunek | Astrolabium utworzone i wyjęte z Pieca | astroAttractorProductionController.isEarned() === true | createVrAstroAttractorProductionController.js | DIRECT | Wspólny trigger z 08.1. |
| 09.2 | Astrolabium Więzi — Kierownica | ukończone zbieranie skorup | furnaceProgressionController.getAsterionSphereProgress().complete === true | createVrAstroFurnaceProgressionController.js | DIRECT | Czyli komplet 6 przetworzonych skorup. |
| 09.3 | Astrolabium Więzi — Strojenie uwagi | 2. ring ukończony | progressionController.isTierComplete(2) === true | createVrProgressionController.js | DIRECT |  |
| 10.1 | Kamienie Runiczne — Relacja | 1. kamień runiczny zestrojony w Piecu | totalTunedRuneCount >= 1 | src/xr/runes/createVrRuneStoneProgressionController.js | DERIVED | total = getTunedFamilyCodes().length + Number(isEtherRuneTuned()). |
| 10.2 | Kamienie Runiczne — Cykl tworzenia | 3. kamień runiczny zestrojony | totalTunedRuneCount >= 3 | createVrRuneStoneProgressionController.js | DERIVED | Liczyć tuning, nie instalację. |
| 10.3 | Kamienie Runiczne — Wiele perspektyw | 5. kamień runiczny zestrojony | totalTunedRuneCount >= 5 | createVrRuneStoneProgressionController.js | DERIVED | W aktualnym finale piątym zestrojonym może być Ether; model nie powinien hardkodować kolejności. |
| 10.4 | Kamienie Runiczne — Słoń | 6. kamień runiczny zestrojony | totalTunedRuneCount >= 6 | createVrRuneStoneProgressionController.js | DERIVED | Maksimum = 5 naturalnych + Ether. |
| 11.1 | Sektory Platformy — Zgromadzona wiedza | 2. ring ukończony | progressionController.isTierComplete(2) === true | createVrProgressionController.js | DIRECT |  |
| 11.2 | Sektory Platformy — Podstawa | 3. ring ukończony | progressionController.isTierComplete(3) === true | createVrProgressionController.js | DIRECT |  |
| 12.1 | Zwornik — Pieczęć | 1. zwornik zainstalowany | pierwszy Rune Bridge kończy ARRIVING -> DOCKED | src/xr/runes/createVrRuneBridgeActor.js :: ARRIVAL_COMPLETED | LATCH/DERIVED | Najbardziej literalny hook. Do rekonstrukcji traktować DOCKED/EXTENDING/EXTENDED/BOUND jako 'zwornik już przybył'. |
| 12.2 | Zwornik — Tytuł | 3. zwornik zainstalowany | liczba mostów/zworników po zakończonym arrival >= 3 | createVrRuneBridgeActor.js | DERIVED | Nie liczyć samego HIDDEN->ARRIVING jako zakończonej instalacji. |
| 13.1 | Kula Asterionowa — Perspektywa | Kula odebrana z Pieca | asterionProductionController.getState() === 'EARNED' | createVrAsterionProductionController.js | DIRECT |  |
| 13.2 | Kula Asterionowa — Gdzie patrzeć | pierwsze uruchomienie Rezonatora: 3 sektory poza 0 | pierwsze przejście asterionResonatorFieldActor.descriptor.fullActiveCore === true | src/xr/asterion/createVrAsterionResonatorFieldActor.js | LATCH | Używać fullActiveCore, NIE fieldActive. fieldActive staje się true już przy jednym aktywnym kanale. |
| 14.1 | Rezonator Asterionowy — Głębokie poszukiwanie | pierwsze uruchomienie Rezonatora: 3 sektory poza 0 | pierwsze przejście fullActiveCore === true | createVrAsterionResonatorFieldActor.js | LATCH | Wspólny trigger z 13.2; musi zostać zapamiętany, bo sektory mogą później wrócić do 0. |
| 14.2 | Rezonator Asterionowy — Pole świadomości | 4. ring ukończony | progressionController.isTierComplete(4) === true | createVrProgressionController.js | DIRECT |  |
| 14.3 | Rezonator Asterionowy — Pełny układ | „instalacja” kamienia runicznego Eteru | runeStoneProgressionController.hasWaterInstallationReadinessOverride() === true | createVrEtherMonkeyCaptureInteraction.js + createVrRuneStoneProgressionController.js | SEMANTIC_ALIAS | Runtime nie instaluje Ether Rune w sektorze. Specjalny odpowiednik domknięcia to Monkey capture -> commitWaterInstallationReadinessOverride() -> ETHER_MONKEY_CAPTURED. |
| 14.4 | Rezonator Asterionowy — Równowaga | kamień runiczny Wody zainstalowany | runeStoneProgressionController.isFamilyInstalled('S') === true | createVrRuneStoneProgressionController.js / createVrRuneStoneInstallationInteraction.js | DIRECT | Live semantic event FIVE_ELEMENTAL_RUNES_INSTALLED, ale bezpieczniejszy jest bezpośredni truth rodziny S. |
| 15.1 | Eter — Nie jest szóstym żywiołem | Skorupa Eteru przetworzona w Piecu | furnaceProgressionController.hasAbsorbedShell('shell-relic-6') === true | createVrAstroFurnaceProgressionController.js + vrAttractorShellGlyphs.js | DIRECT | shell-relic-6 -> shell_06 -> VO (Ether). |
| 15.2 | Eter — Pomost | kamień runiczny Eteru zestrojony | runeStoneProgressionController.isEtherRuneTuned() === true | createVrRuneStoneProgressionController.js | DIRECT | Live event ETHER_RUNE_TUNED. |
| 15.3 | Eter — Połączenie wiedzy | Małpa przejęła kamień Eteru | runeStoneProgressionController.hasWaterInstallationReadinessOverride() === true | createVrEtherMonkeyCaptureInteraction.js + createVrProgressionSemanticHandoff.js | DIRECT | Commit następuje po completeMonkeyCapture(); live event ETHER_MONKEY_CAPTURED. |

## Szczegóły właścicieli i hooków

### 1. Ukończenie ringów

Najlepszym source of truth jest:

`src/xr/progression/createVrProgressionController.js`

API:

- `isTierComplete(1..5)`
- `getActivatedPageIds()`
- `isBranchComplete(branchId)`

`createVrProgressionSemanticHandoff.js` dostarcza wygodne live events:

- `FIRST_RING_COMPLETED`
- `TIER_COMPLETED { tier }`

ale model wiedzy powinien móc również **odtworzyć AVAILABLE po rekonstrukcji** z `isTierComplete()`, zamiast polegać wyłącznie na zdarzeniu, które wydarzyło się wcześniej.

### 2. Portal i liczba przeczytanych kryształów

`src/xr/createVrCrystalCollection.js` rozróżnia:

- `CRYSTAL_ACTIVATED` / `onPreview` — karta jest tylko pokazana;
- `commitPage()` + `onCommit` — odczyt został zatwierdzony.

Dla `06.*` i `07.*` należy liczyć wyłącznie **committed Tier-1 pages**.

Rekomendowany rekonstrukcyjny selector:

1. pobierz `progressionController.getActivatedPageIds()`;
2. rozwiąż ID przez `experienceVrPages`;
3. policz tylko strony z `page.order === 1`.

Nie używać prostego globalnego `activatedPageIds.length`, ponieważ po pierwszym ringu liczba obejmuje również kolejne tiery.

### 3. Skorupy

`createVrAstroFurnaceProgressionController.js` utrzymuje `absorbedShells` jako `Set`.

Commit następuje dopiero w `createVrAstroFurnaceContentInteraction.js` po zakończeniu procesu:

`progressionController.commitAbsorbedShell(pendingShellAssetId)`

To jest właściwy moment semantyczny dla „przetworzona w Piecu”.

Ether Shell jest jednoznaczna:

`shell-relic-6` → `shell_06` → `VO`.

### 4. Małe Glify

`createVrProtoAstroTuningController.js` posiada:

- `commitExtractedSmallGlyph()`;
- `getExtractedFamilyCodes()`;
- `hasFamilyEssence()`.

Commit następuje dopiero po zakończeniu `SMALL_GLYPH_ESSENCE_EXTRACTION`.

To eliminuje potrzebę osobnego licznika wiedzy.

### 5. Astrolabium Więzi

`createVrAstroAttractorProductionController.js` rozróżnia:

`READY → BUILDING → AVAILABLE → CLAIMING → EARNED`

Dla tekstu „utworzone i wyciągnięte z Pieca” właściwy jest **EARNED**, a nie `AVAILABLE`.

Live hook: `onClaimed()` / `ASTRO_ATTRACTOR_CLAIMED`.

### 6. Kula Asterionowa

`createVrAsterionProductionController.js` kończy przejęcie Kuli stanem:

`EARNED`

To jest właściwy trigger dla „odebrana / wyciągnięta z Pieca”.

### 7. Kamienie Runiczne — tuning

`createVrRuneStoneProgressionController.js` rozdziela:

- `tunedRuneFamilies` — pięć naturalnych rodzin;
- `etherRuneTuned` — Ether osobno;
- `installedRuneFamilies` — instalacja naturalnych Run.

Ponieważ źródło `10.*` mówi o **zestrojeniu**, właściwy licznik to:

`totalTunedRuneCount = getTunedFamilyCodes().length + Number(isEtherRuneTuned())`

Progi: `1 / 3 / 5 / 6`.

Nie używać `installedRuneFamilies` dla tych kart.

### 8. Zworniki

Runtime materializuje Zwornik/bridge poprzez `createVrRuneBridgeActor.js`.

Cykl:

`HIDDEN → ARRIVING → DOCKED → EXTENDING → EXTENDED → BOUND`

Najbardziej literalne znaczenie „zwornik zainstalowany” to ukończenie przybycia:

event `ARRIVAL_COMPLETED`, stan `DOCKED`.

Po późniejszym użyciu Zwornik może przejść do `EXTENDING / EXTENDED / BOUND`, dlatego przy rekonstrukcji za „już zainstalowany” należy uznać każdy stan:

`DOCKED | EXTENDING | EXTENDED | BOUND`.

Samo `ARRIVING` nie powinno jeszcze odblokowywać karty.

### 9. Pierwsze uruchomienie Rezonatora

To najważniejszy detal audytu.

`createVrAsterionResonatorFieldActor.js` udostępnia:

- `fieldActive` — true już, gdy działa **co najmniej jeden** z trzech podstawowych kanałów;
- `fullActiveCore` — true dopiero, gdy Earth + Wood + Fire są zasilone i **wszystkie trzy sektory mają poziom > 0**;
- `activeChannelCount`.

Źródło mówi:

> 3 sektory w pozycji innej niż 0 — pole rezonatora widoczne i działające

Dlatego dla `13.2` i `14.1` właściwym warunkiem jest:

`fullActiveCore === true`

a nie `fieldActive`.

Jest to warunek historyczny: gracz może później wrócić sektorami do zera. Model wiedzy musi zatem zapamiętać pierwsze przejście `false → true` jako trwałe `AVAILABLE`.

### 10. Ether Rune

Runtime nie posiada naturalnej „instalacji” Ether Rune.

Ether ma osobną ścieżkę:

1. `commitEtherRuneTuned()` → `etherRuneTuned = true`;
2. fizyczne przejęcie przez Małpę;
3. `commitWaterInstallationReadinessOverride()` → `waterInstallationReadinessOverride = true`;
4. semantyczny event `ETHER_MONKEY_CAPTURED`.

Dlatego wpis `14.3 — po instalacji kamienia runicznego Eteru` nie ma literalnego odpowiednika technicznego.

Najbliższy i logicznie domknięty runtime moment to **Ether Monkey capture**, czyli:

`hasWaterInstallationReadinessOverride() === true`.

To samo zdarzenie jest jawnie użyte w `15.3`.

Jeżeli słowo „instalacja” w 14.3 oznacza funkcjonalne włączenie Eteru do układu, powyższe mapowanie jest kompletne. Nie należy tworzyć sztucznego `ETHER_INSTALLED`.

### 11. Water Rune

Naturalna Woda ma family code:

`S`

Najbezpieczniejszy truth:

`runeStoneProgressionController.isFamilyInstalled('S') === true`

`FIVE_ELEMENTAL_RUNES_INSTALLED` jest poprawnym eventem w obecnym finale, ponieważ Water jest ostatnią naturalną Runą, ale model wiedzy nie musi zakładać kolejności — bezpośredni family truth jest mocniejszy.

## Granica końcowa

Wymaganie: wszystkie etapy wiedzy muszą być co najmniej `AVAILABLE` zanim rozpocznie się finalne wydobycie Kryształu Wody.

Aktualny Scenario ma bezpieczną granicę wcześniej:

- `5.60` — pięć naturalnych Run zainstalowanych / pełny Rezonator;
- po komunikacji pełnego Rezonatora:
- `5.70` — **Final Water Glyph hunt ready**;
- `5.80` — final portfolio complete / start pożegnania Małpy.

Przy mapowaniu z tego audytu **ostatnim nowym triggerem jest instalacja Water Rune (`14.4`)**, czyli jeszcze przed wejściem w pełny finalny hunt.

Rekomendowany invariant integracyjny:

> przed wejściem do `5.70` wszystkie 45 etapów, których warunki domenowe zostały spełnione w ukończonej ścieżce, muszą być co najmniej `AVAILABLE`.

`5.70` powinno być tylko kontrolnym safety boundary, nie źródłem odblokowania kart.

## Rekomendowana architektura późniejszej implementacji

Nie rozbudowywać istniejącego `createVrMonkeyKnowledgeResolver` o całą encyklopedię świata. Obecny resolver ma inne zadanie: bieżące guidance, transient hints, „co teraz?” i istniejące tematy komunikacyjne.

Dodać osobny owner, np.:

`createVrWorldKnowledgeModel.js`

Jego wejścia powinny być wyłącznie read-only accessors do istniejących ownerów:

- `progressionController`;
- `furnaceProgressionController`;
- `protoAstroTuningController`;
- `astroAttractorProductionController`;
- `asterionProductionController`;
- `runeStoneProgressionController`;
- `runeBridgeActor`;
- `asterionResonatorFieldActor`;
- `experienceVrPages`.

Model powinien posiadać:

1. statyczny katalog 45 etapów i ich PL/EN treści;
2. predicate `isAvailable()` dla stanów odtwarzalnych;
3. trwały latch dla triggerów historycznych (`fullActiveCore` first-hit);
4. osobny stan `READ`;
5. monotoniczność: `LOCKED → AVAILABLE → READ`, bez cofania;
6. możliwość rekonstrukcji AVAILABLE z domain truth po debug checkpoint/hydration.

Nie powinien posiadać własnych kopii:

- current tier;
- absorbed shell count;
- extracted glyph count;
- tuned/installed Rune count;
- bridge readiness;
- resonator descriptor.

## Ryzyka przed implementacją

1. **Dokument progression jest nieaktualny względem najnowszej decyzji.**  
   Najpierw SYNC/DOCS: 2/3/4 etapów zamiast zawsze 3 oraz nowe `KIEDY`.

2. **13.2 / 14.1 muszą być latched.**  
   Odczyt samego bieżącego `fullActiveCore` po fakcie nie powie, że Rezonator był wcześniej uruchomiony.

3. **14.3 ma nazwę niezgodną z domeną techniczną.**  
   Nie istnieje `ETHER_INSTALLED`; użyć `ETHER_MONKEY_CAPTURED` / readiness override, bez tworzenia nowej domenowej semantyki.

4. **Portal musi liczyć COMMITTED, nie preview.**  
   `CRYSTAL_ACTIVATED` jest za wcześnie.

5. **Zwornik powinien odblokować się po zakończeniu arrival, nie po samym readiness.**

6. **Knowledge availability musi być monotoniczna.**  
   Zmiana sektora, chwilowe wyłączenie pola lub zmiana prezentacji nie może ponownie zablokować przeczytanej/odblokowanej wiedzy.

## Ocena gotowości

**GOTOWE DO IMPLEMENTACJI PO JEDNYM KROKU SYNC DOKUMENTACJI.**

Kod posiada wystarczające, istniejące źródła prawdy dla wszystkich 45 etapów.

Nie ma potrzeby:
- tworzyć nowych gameplayowych liczników;
- dodawać nowych Scenario pointów;
- przepisywać domeny Furnace / Proto Astro / Rune / Resonator;
- uzależniać wiedzy od numerów Scenario poza końcowym safety boundary.

Najmniejsza sensowna kolejność dalszej pracy:

1. zsynchronizować canonical world-knowledge/progression docs z aktualnym plikiem `WIEDZA_O_ŚWIECIE_V1-tranlated.md`;
2. zaimplementować sam `WorldKnowledgeModel` i mapping 45 triggerów bez UI;
3. dopiero potem podłączyć menu Małpy;
4. na końcu Player Y.
