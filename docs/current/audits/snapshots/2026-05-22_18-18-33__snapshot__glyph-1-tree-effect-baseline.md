# Snapshot — Glyph 1 Tree Effect Baseline

## 1. EXECUTIVE SUMMARY
- Checkpoint dotyczy **pierwszego glifu (AI Guide / WOOD)** i stabilizacji efektu `glyph_1-tree` jako zaakceptowanego baseline runtime.
- Poprzedni efekt proceduralny / bez bryły został zastąpiony przez efekt oparty o rzeczywisty asset GLB drzewa.
- Efekt zawiera reveal/wzrost od podstawy, zielony emissive glow oraz orbitujące point light podtrzymywane podczas hover/active.
- Mouse off i pointer cleanup są traktowane jako warunek akceptacji i działają w modelu runtime bez zmiany targetów raycast.

## 2. STATUS CHECKPOINTU
- **Status:** accepted baseline (documentation snapshot).
- **Scope:** dokumentacja techniczna + mapy/indeksy, bez zmian runtime/kodu efektu.
- **Date:** 2026-05-22.

## 3. LISTA KLUCZOWYCH DECYZJI
1. Glif 1 używa realnego assetu `glyph_1-tree.glb` jako efektu wizualnego hover.
2. Efekt drzewa zastępuje poprzedni efekt proceduralny / bez bryły.
3. Wzrost realizowany jest jako organiczny reveal (mask/shader), a nie runtime boolean/CSG.
4. Dominująca kolorystyka efektu glifu 1 to zielony / neonowo-organiczny (żółty kierunek odrzucony).
5. Po pełnym reveal przy `active/hover=true` point light nie gaśnie, tylko przechodzi w orbitę.
6. Mouse off zawsze czyści hover/cursor i pozwala na kolejne wejście bez blokady.
7. Efektowe meshe/helpery/lighty nie są targetami raycast/click.

## 4. AKTUALNY MODEL EFEKTU
- Runtime używa modelu `/glb/glyph_1-tree.glb` z fallbackiem `/glb/glyph_1.glb`.
- Drzewo jest ładowane jako dodatkowa grupa wizualna przypisana do node `ai-guide`.
- Reveal progres (`revealProgress`) dąży do `revealTarget` (1 na hover enter, 0 na hover leave).
- W trakcie wejścia efekt przechodzi fazy: `revealing` -> `activeOrbit`.
- W trakcie wyjścia faza przechodzi przez `fadingOut` -> `inactive`.

## 5. LIFECYCLE HOVER / MOUSE OFF
- **Hover enter:**
  - kursor przechodzi na `pointer`,
  - `revealTarget = 1`,
  - reveal narasta od podstawy,
  - emissive i point light wzmacniają się.
- **Hover active:**
  - drzewo pozostaje widoczne,
  - post-reveal glow jest podtrzymany,
  - point light orbituje wokół glifu.
- **Hover leave / mouse off:**
  - kursor wraca do `default`,
  - `revealTarget = 0`,
  - reveal, glow i point light schodzą do zera,
  - efekt nie zostaje interaktywnym obiektem,
  - ponowny hover uruchamia efekt od nowa.
- **Pointer leave canvas:**
  - stan hover/cursor powinien zostać wyczyszczony przez istniejący flow interakcji.

## 6. ASSETY I RAYCAST
- **Primary asset:** `/glb/glyph_1-tree.glb`.
- **Fallback asset (tree effect):** `/glb/glyph_1.glb`.
- **Interaktywność/raycast:**
  - interaktywny target pozostaje na właściwym glyph node (orbitalny node/sfera-kolider),
  - `glyph_1-tree`, reveal-mask warstwa shaderowa, helpery glow i point light nie mogą być targetami raycast/click,
  - bezpieczeństwo interakcji opiera się na niezmienionym modelu raycast node’ów.

## 7. PARAMETRY EFEKTU
Aktualne parametry runtime (stan checkpointu):
- `treeScale`: `1.24`
- `treeYOffset`: `0.02`
- `revealDurationIn` / `activationDuration`: `9.6s`
- `revealDurationOut` / `fadeOutDuration`: `0.7s`
- `revealSoftness`: `0.24`
- `revealRadius`: `0.06 -> 1.42` (min/max)
- `emissiveColor` (base -> active gradient): `#0f1e0e -> (#1d7f1d .. #55ff22)`
- `pointLightColor`: `#55ff22`
- `pointLightIntensity`: `1.0` (clamp do `1.25`)
- `orbitSpeed`: `0.96`
- `orbitRadius`: wyliczany runtime z offsetu światła (nie hardcoded per-glif)
- `orbitHeightOffset`: wyliczany runtime z offsetu światła
- `pulseIntensity`: `0.09`
- `postRevealGlowIntensity`: `0.22`
- `postRevealPulseIntensity`: `0.04`
- `orbitBobbingAmplitude`: `0.04`
- `orbitBobbingSpeed`: `0.95`

Notatki porównawcze (checkpoint):
- Rozświetlanie bryły jest spowolnione ~3x względem poprzedniego szybszego wariantu.
- Orbita point light została przyspieszona ~2x względem pierwszej wolniejszej wersji orbitowania.
- Promień orbity traktowany jako stabilny baseline (bez zmian bez osobnej decyzji).

## 8. MANUAL QA
Manualny test akceptacyjny:
1. Uruchomić lokalny runtime.
2. Najazd na pierwszy glif:
   - cursor: `pointer`,
   - start drzewa,
   - reveal od podstawy,
   - wolno narastający zielony glow.
3. Po pełnym reveal:
   - drzewo aktywne,
   - point light orbituje,
   - światło nie gaśnie przy hover=true.
4. Mouse off:
   - cursor: `default`,
   - drzewo/glow/light wygasają,
   - brak samoczynnego restartu.
5. Ponowny hover:
   - restart od początku,
   - brak blokady hover,
   - brak „zawieszonej rączki” poza glifem.
6. Powtórzyć cykl hover on/off wielokrotnie.
7. Sprawdzić pozostałe glify pod kątem regresji.
8. Sprawdzić konsolę: brak błędów GLB/shader/material/raycast.

## 9. RYZYKA / UWAGI
- Reveal jest efektem wizualnym shader-mask, nie fizycznym wzrostem geometrii; dokumentacja musi to utrzymywać jawnie.
- `orbitRadius` i `orbitHeightOffset` są pochodnymi pozycji światła; ręczne zmiany pozycji startowej wpłyną na trajektorię.
- Dalszy polish innych glifów nie może naruszyć zasady: tylko glyph node jest targetem interakcji.

## 10. NASTĘPNE KROKI
1. Traktować ten snapshot jako baseline review dla glifu 1.
2. Przy wdrożeniach glifów 2–5 utrzymać analogiczny standard dokumentacji lifecycle i raycast safety.
3. Każdą zmianę kolorystyki/radiusu/orbit-speed względem baseline logować jako osobną decyzję.
