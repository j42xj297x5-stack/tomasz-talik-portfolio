# Glyph Hover Effects Model (Working Canon)

## 1. Cel dokumentu
Ten dokument ustala roboczy kanon dla kolejnych etapów visual polish efektów hover dla 5 glifów orbitujących wokół centralnej małpy.

Zakres dokumentu jest wyłącznie koncepcyjno-systemowy:
- kontrakt lifecycle efektów runtime dla hovera,
- bez zmian geometrii sceny,
- bez zmian shaderów,
- bez zmian interakcji bazowych (hover/click/raycast).

## 2. Aktualny stan i kontekst
Aktualny baseline projektu obejmuje:
- central monkey GLB,
- 5 orbit glyph GLBs,
- ustalone mapowanie glifów do node’ów portfolio,
- działający baseline hover/click/raycast,
- rozpoczęty polish hover lighting.

Ten dokument porządkuje i kanonizuje finalne decyzje dot. symboliki i języka ruchu hover-only, zgodnie z aktualnym wyglądem glifów.

## 3. Mapping glifów do node’ów (ustalone, bez zmian)
- `glyph_1` = AI Guide
- `glyph_2` = Creative AI
- `glyph_3` = Ethics / Life Protection
- `glyph_4` = DIG Engine
- `glyph_5` = Haiku Cosmos

## 4. Ostateczne przypisanie żywiołów
Na podstawie bieżącego wyglądu glifów i ich aktualnego przypisania do node’ów:
- Glif 1 (AI Guide) → **Drewno**
- Glif 2 (Creative AI) → **Ogień**
- Glif 3 (Ethics / Life Protection) → **Ziemia**
- Glif 4 (DIG Engine) → **Metal**
- Glif 5 (Haiku Cosmos) → **Woda** (wariant kosmicznego nurtu / wiru)

## 5. Szczegółowy opis 5 glifów

### 5.1 Glif 1 — AI Guide / AI Transformation
- **Żywioł:** Drewno
- **Uzasadnienie wizualne:** zielono-żółta pionowa świetlna żyła / pęd / łodyga / korzeń / nerw rośliny.
- **Sens symboliczny:** AI Guide nie „zalewa” użytkownika wiedzą; wspiera organiczny wzrost i wejście w AI krok po kroku.
- **Kierunek ruchu efektu:** wzrost ku górze + lekkie rozchodzenie się wszerz.
- **Typ efektu hover:** cienkie świetlne pędy / włókna / gałązki wyrastające z glifu, częściowo oplatające kamień i lekko się rozgałęziające.
- **Kolorystyka:** zielono-żółta, limonkowa, subtelnie złotawa.
- **Charakter:** organiczny, spokojny, wzrostowy, nieagresywny.

### 5.2 Glif 2 — Creative AI
- **Żywioł:** Ogień
- **Uzasadnienie wizualne:** pomarańczowo-ognisty glif przypominający płomień.
- **Sens symboliczny:** iskra twórcza, zapłon pomysłu, transformacja idei w artefakt.
- **Kierunek ruchu efektu:** ku górze.
- **Typ efektu hover:** cienkie języki ognia / świetlne płomyki / lekkie iskry unoszące się ku górze.
- **Kolorystyka:** pomarańcz, bursztyn, złoto, ciepła czerwień.
- **Charakter:** żywy, twórczy, ciepły, wyraźny, ale elegancki.

### 5.3 Glif 3 — Ethics / Life Protection / AI Dharma
- **Żywioł:** Ziemia
- **Uzasadnienie wizualne:** jasny surowy kamień / bryła ochronna bardziej niż znak roślinny czy płynny.
- **Sens symboliczny:** fundament, odpowiedzialność, ciężar, ochrona życia, spokojna siła.
- **Kierunek ruchu efektu:** od dołu ku środkowi / osadzanie / skupianie.
- **Typ efektu hover:** pył mineralny, cięższe świetlne włókna, subtelne żyły / pęknięcia światła, efekt „kamień się budzi”.
- **Kolorystyka:** biel, jasny beż, ochra, kamienne złoto, lekko pyłowe tony.
- **Charakter:** spokojny, cięższy, stabilny, ochronny, fundamentowy.

### 5.4 Glif 4 — DIG Engine
- **Żywioł:** Metal
- **Uzasadnienie wizualne:** koncentryczne, techniczne, sygnałowe formy (rezonator / radar / struktura danych).
- **Sens symboliczny:** precyzja, narzędzie, integracja danych, porządkowanie, rezonans, workflow.
- **Kierunek ruchu efektu:** orbitalny / obwodowy / sygnałowy.
- **Typ efektu hover:** cienkie obręcze, geometryczne łuki, impuls przebiegający po liniach, efekt strojenia / rezonansu.
- **Kolorystyka:** biel, srebro, stalowy błękit, chłodny neon.
- **Charakter:** precyzyjny, uporządkowany, techniczny, rytmiczny.

### 5.5 Glif 5 — Haiku Cosmos
- **Żywioł:** Woda (kosmiczny nurt / wir)
- **Uzasadnienie wizualne:** niebieski, falowy, koncentryczny, wirujący charakter (portal / wir / fala / kosmiczny nurt).
- **Sens symboliczny:** interaktywny świat ruchu, sekwencji, orbit, przepływów energii i kosmicznej dynamiki.
- **Kierunek ruchu efektu:** opływanie / spiralny wir / krążenie.
- **Typ efektu hover:** błękitne nici wodne / świetlne strumienie / spiralne włókna tworzące mini wir wokół glifu.
- **Kolorystyka:** błękit, cyjan, chłodna biel, lekki turkus.
- **Charakter:** płynny, kosmiczny, wirujący, medytacyjny, portalowy.

## 6. Wspólne zasady systemu hover effects
Aby zachować spójny system zamiast 5 przypadkowych efektów:

1. Efekty pojawiają się tylko po hoverze na danym glifie.
2. Efekty nie działają stale na wszystkich glifach równocześnie.
3. Bieżąca obecność kursora steruje wyłącznie etykietą hover i kursorem. Wejście na glif jest osobnym triggerem jednorazowej animacji per node:
   - trigger występuje tylko przy zmianie trafionego glifu, nie przy kolejnych `pointermove` nad tym samym targetem;
   - rozpoczęty efekt kończy własny lifecycle po opuszczeniu glifu i nie jest restartowany ani kolejkowany przez ponowne wejście w trakcie odtwarzania;
   - po zakończeniu ponowne wejście może uruchomić nowy przebieg;
   - glify mogą odtwarzać swoje przebiegi równolegle.
4. Każdy glif zachowuje wspólny rdzeń efektu:
   - punktowe światło,
   - łagodny wzrost i powrót skali,
   - lokalna aura / nici / cząstki aktywowane przez trigger.
5. Zmieniają się wyłącznie:
   - kolor,
   - kierunek ruchu,
   - charakter nici / cząstek,
   - rytm,
   - symboliczna „fizyka” żywiołu.
6. Efekty mają być subtelne, eleganckie i atmosferyczne.
7. Celem nie jest spektakl; celem jest czytelne ożywienie symboliki glifu.

## 7. Język ruchu 5 żywiołów
Żywioły w tym projekcie są używane jako **język ruchu efektów**, a nie sztywna doktryna.

- **Drewno** = wzrost
- **Ogień** = unoszenie / zapłon
- **Ziemia** = osadzanie / ciężar / skupienie
- **Metal** = rezonans / struktura / sygnał
- **Woda** = przepływ / wir / opływanie

## 8. Kolejność wdrażania
Sugerowana kolejność implementacji efektów:

1. Glif 1 — AI Guide / Drewno
2. Glif 2 — Creative AI / Ogień
3. Glif 3 — Ethics / Ziemia
4. Glif 4 — DIG Engine / Metal
5. Glif 5 — Haiku Cosmos / Woda

Uzasadnienie:
- wdrażanie od najbardziej intuicyjnych i czytelnych efektów do bardziej specyficznych,
- każdy kolejny efekt rozwija system bez rozbijania spójności.

## 9. Zasady ochronne / czego unikać
Należy unikać:
- agresywnych lightning VFX,
- przesadnego chaosu,
- efektu „choinki”,
- zbyt gamingowego spamowania efektami,
- ciężkiego overkillu postprocessingu na tym etapie.

## 10. Status dokumentu i rola working canon
Status: **aktywny dokument kierujący dalszymi wdrożeniami visual polish hover effects**.

`GLYPH_HOVER_EFFECTS_MODEL.md` jest punktem odniesienia dla kolejnych implementacji, review i decyzji dotyczących efektów hover pięciu glifów.


## 11. Checkpoint implementacyjny — Glif 1 (`glyph_1-tree`) [2026-05-22]
- Dla glifu 1 baseline runtime jest oparty o rzeczywisty asset `glyph_1-tree.glb` (z fallbackiem do `glyph_1.glb`), a wcześniejszy kierunek proceduralny/bez bryły jest uznany za zastąpiony.
- Efekt działa wyłącznie jako emanacja wizualna przypisana do node `AI Guide`; nie zastępuje interaktywnego glyph node jako targetu hover/click/raycast.
- Reveal/wzrost realizowany jest wizualnie (mask/shader) od podstawy ku górze, z zielonym emissive glow i orbitującym point light po pełnym reveal.
- Mouse off/hover cleanup resetuje tylko kursor i etykietę; nie przerywa aktywnego reveal. Po pełnym reveal drzewo samo wygasa do stanu gotowego na następny trigger.
- Szczegóły parametrów i lifecycle opisuje snapshot: `docs/current/audits/snapshots/2026-05-22_18-18-33__snapshot__glyph-1-tree-effect-baseline.md`.
