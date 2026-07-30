# Experience VR Handoff

## Status dokumentu

- **Status:** canonical current-state handoff.
- **Synchronizacja:** 2026-07-29.
- **Kod źródłowy:** `HEAD` `70311548899c4eb3c08f34c865f14ab3d04de88e` na gałęzi roboczej odpowiadającej głównej gałęzi `porfolio`.
- Dokument zastępuje poprzedni handoff, który opisywał stan sprzed stałego portalu, smooth locomotion i kompletnego systemu 15 kryształów z relikwiarzem, activate oraz release.

Kod na `HEAD` jest źródłem prawdy. Ten dokument jest samowystarczalnym wejściem do dalszej pracy i opisuje bieżący system, nie historię PR-ów.

## Binding architecture

Experience VR jest osobnym, dynamicznie importowanym runtime'em WebXR. Nie uruchamia Experience 3D i nie importuje jego stanu. `src/experienceVr.js` posiada renderer, scenę, kamerę bazową, `playerRig`, kontrolery, lifecycle sesji oraz `renderer.setAnimationLoop`.

WebXR jest właścicielem pozy śledzonej kamery. Kod przemieszcza lub obraca `playerRig`, nigdy tracked camera. UI immersyjne pozostaje w Three.js; desktopowy HTML/CSS overlay nie jest współdzielony.

## Current runtime composition

Scena jest przygotowana przed sesją: `VrWorldRoot`, małpa/fallback, pięć glifów, światła, stały portal z canvasem, relikwiarz, dwa przyciski companion, `playerRig`, dwa kontrolery i moduły interakcji. Assety VR są preloadowane przed udostępnieniem przycisku wejścia.

Pięć glifów orbituje bez przerwy — przed aktywacją, podczas przejścia i po arrival. Efektywny promień wynosi `3.8 × 2 = 7.6`; spawn gracza to `(0, 0, 8.6)`.

## Runtime module ownership

- `experienceVr.js`: composition root, preload, przepływ sesji, kolejność klatki, reset i reuse.
- `experienceVrSettings.js`: defaulty, normalizacja i ładowanie `/data/experience-vr-settings.json`.
- `createVrControllers`: dwa target rays, grips i niewidoczne `holdSocket`.
- `createVrGlyphOrbit`, `createVrGlyphInteraction`, `createVrGlyphLights`: ciągły orbit, raycast glifów i light-only feedback.
- `createVrEntryTransition`: skompensowane przejście `playerRig` do pierścienia.
- `createVrPortalDisplay`: stały model portalu, Blenderowy surface oraz awaryjny socket.
- `createVrSpatialPlaque`: `CanvasTexture`, rysowanie strony i fallback plane; nazwa modułu jest historyczna, lecz nie oznacza aktywnej kamiennej tabliczki.
- `createVrLocomotion`: smooth move i smooth yaw `playerRig`.
- `experienceVrPages`: dane stron i stabilne powiązanie 15 assetów.
- `createVrCrystalCollection`: materializacja, raycast-pull, insertion, activation, release i runtime read-state.
- `createVrCrystalReliquary`: model, insertion zone, widoczna kotwica i rozmieszczenie companionów.
- `createVrReliquaryActivateButton` / `createVrReliquaryReleaseButton`: niezależny raycast, emisja, animacja i akcja każdego przycisku.

## Assets and preload contract

`AssetManager` jest jedynym źródłem modeli. Runtime klonuje już załadowane sceny i nie wykonuje fetchu podczas spawnu.

| Rola | Asset / kontrakt |
| --- | --- |
| Portal | `/glb/portal.glb`; mesh `PORTAL_CANVAS_SURFACE` |
| Relikwiarz | `/glb/portal_crystal_reliquary.glb`; `RELIQUARY_CRYSTAL_INSERT_ZONE`, `RELIQUARY_CRYSTAL_ANCHOR` |
| Activate | `/glb/portal_crystal_reliquary_button_activate.glb`; trigger i klip `Relic_Reliquary_ActivateButton_Press` |
| Release | `/glb/portal_crystal_reliquary_button_release.glb`; odpornie rozwiązywany authored trigger i klip `Relic_Reliquary_ReleaseButton_Press` |
| Strony | 15 modeli `crystal-*.glb`: po trzy dla każdego z pięciu stabilnych `glyphId` |

Preload obejmuje loader, małpę, glify, portal, relikwiarz, oba przyciski i wszystkie kryształy. Per-glyph plaque GLB nie należą do aktywnego podzbioru VR.

## Current player flow

1. Shell sprawdza secure context i wsparcie `immersive-vr`, a po wyborze VR dynamicznie importuje runtime.
2. Runtime przygotowuje scenę i preloaduje assety.
3. Drugi, bezpośredni gest na **Enter VR** wywołuje `requestSession('immersive-vr')`.
4. Gracz celuje target-rayem w glif będący w dynamicznej strefie `entryReady` i naciska trigger.
5. `createVrEntryTransition` przesuwa `playerRig`, kompensując początkowy fizyczny offset głowy X/Z. Y i orientacja pozostają bez zmian. Cel to `effectiveRingRadius × 0.76 = 5.776`, czyli około `5.8` od środka.
6. Po zakończeniu przejścia materializują się trzy kryształy aktywowanego glifu.
7. Gracz wskazuje kryształ, przyciąga go squeeze do dłoni i puszcza w insertion zone relikwiarza.
8. Activate przełącza `inserted → active` i dopiero wtedy pokazuje stronę na portalu.
9. Release po 1 s przełącza kryształ do `released`, usuwa go, zwalnia socket i resetuje oba przyciski. Można włożyć następny kryształ.

## Controls

- Trigger/select: aktywacja gotowego glifu oraz przyciski activate/release.
- Squeeze: rozpoczęcie pull-to-hand wskazanego kryształu; squeeze release anuluje pull albo puszcza held crystal.
- Prawy joystick: ruch przód/tył i strafe lewo/prawo.
- Lewy joystick: płynny obrót yaw.

Ruch korzysta z poziomego kierunku śledzonej głowy (pitch jest usuwany), transformuje `playerRig` i zachowuje jego Y. Nie ma collision, gravity, physics, teleport, jump ani snap turn.

## Portal and Blender-authored canvas

Portal istnieje od przygotowania sceny. Ma stałą kompozycję world-space względem małpy i skonfigurowanego spawnu, nie czyta pozy ani obrotu głowy i nie jest przesuwany lub ukrywany podczas arrival.

Geometria, UV, proporcje, transformacja, parent i skala `PORTAL_CANVAS_SURFACE` z Blendera są źródłem prawdy. `createVrSpatialPlaque` przypisuje `CanvasTexture` bezpośrednio do tego mesha, zachowując jego authored transform. Ręcznie tworzony plane z `portalCanvas.width`, `height` i `offset` jest wyłącznie ostrzeganym fallbackiem, gdy named mesh, geometria lub UV są nieprawidłowe. Aktywny flow nie ma osobnego canvasu nad małpą ani kamiennej tabliczki arrival.

## Crystal page model and materialization

`experienceVrPages` mapuje stabilne `glyphId` na tablice stron identyfikowane przez stabilne `page.id`. Bieżący model ma dokładnie trzy strony dla każdego z pięciu glifów, łącznie 15. Selektory treści pobierają zlokalizowany lead, detail lub fragment case study z rozwiązanego `portfolioNodes`, zamiast duplikować pełny content.

Po arrival tylko strony aktywowanego glifu są spawnione. Hash `page.id` determinuje skalę `0.22–0.28`, yaw, niewielkie pochylenia oraz nieregularną pozycję przed małpą. Bounds centrują model w X/Z, a jego najniższy punkt trafia na Y=0. Wrapper zaczyna niżej o `0.12`, ze skalą `0.18`; stagger `0.12 s`, smoothstep przez `0.55 s`, lekkie wynurzenie i mały yaw prowadzą do finalnej pozy. `materializing` nie uczestniczy w raycaście ani grab.

## Crystal targeting and pull-to-hand

Każdy kontroler emituje ray w lokalnej osi `-Z`. Crystal hit (`currentCrystalHit` i dystans) jest niezależny od glyph hit (`currentHit`). Raycast rozwiązuje potomków przez stabilną mapę object-to-instance i wybiera najbliższy kryształ w stanie `available`. Subtelny highlight skaluje wrapper do `1.04`, bez zmiany authored model scale.

`squeezestart` działa tylko dla wskazanego hitu nie dalej niż `1.8 m`. Kryształ jest przepinany do istniejącego `holdSocket` i przez smoothstep przez `0.25 s` przechodzi do dłoni. `squeezeend` w `pulling` przepina go do sceny, zachowuje aktualną world transform i wraca do `available`. Po ukończeniu pull stan to `held`. Nie ma nearest-hand/grip-space selection, fizyki, velocity ani throwing.

## Reliquary architecture and placement

Root `VrCrystalReliquary` jest placement rootem całego układu. `VrCrystalReliquaryModelRoot` podnosi o `heightOffset = 0.5` `VrCrystalReliquaryAuthoredRoot`, model, insertion zone, anchory i włożony kryształ. Sibling `VrCrystalReliquaryCompanionsRoot` nie dziedziczy tego podniesienia. Każdy button ma osobny placement root i osobny scale root.

Relikwiarz leży dokładnie na poziomej osi frontu portalu w stronę skonfigurowanego spawnu, bez lateral offset, `1.5 m` od portalu. Portal quaternion wyznacza poziomy front; kod odwraca go, gdy nie wskazuje spawnu.

Ukryty `RELIQUARY_CRYSTAL_INSERT_ZONE` zachowuje authored transform i wyznacza world-space sphere. `RELIQUARY_CRYSTAL_ANCHOR` jest `authoredCrystalAnchor`, czyli markerem z Blendera. Ponieważ może być potomkiem niewidocznego insertion zone, runtime kopiuje jego world transform do widocznego siblinga `VrReliquaryCrystalDisplayAnchor` (`runtimeCrystalAnchor`). Kompatybilny alias `crystalAnchor` wskazuje runtime anchor, nie authored marker. `isEffectivelyVisible()` sprawdza cały łańcuch rodziców; przy braku poprawnej lub efektywnie widocznej kotwicy tworzony jest widoczny `VrReliquaryCrystalFallbackAnchor`. Przy niepoprawnym insertion zone pozostaje również fallback do portalu.

Oba przyciski są `1 m` przed relikwiarzem, równoległe do portalu. Activate leży `0.5 m` po lewej, release `0.5 m` po prawej; środki dzieli `1 m`. Ich scale rooty mają `0.3`; nie skalują relikwiarza i nie dziedziczą `heightOffset`.

## Activate button

Osobny preloadowany GLB dostarcza render-transparentny (`opacity: 0`, `colorWrite: false`), lecz widoczny dla raycastera trigger. Każdy kontroler ma oddzielny hit. Hover i press są dozwolone tylko, gdy socket zawiera kryształ dokładnie w stanie `inserted`.

Materiały wizualne mają emisję `0` idle, `1` hover i `5` active/latched. Klip `Relic_Reliquary_ActivateButton_Press` działa jako `LoopOnce` z `clampWhenFinished`. Dopiero udany press wywołuje `activateInserted()`, ustawia `active` i aktualizuje canvas. Kryształ pozostaje widoczny.

## Release button

Osobny preloadowany GLB ma resolver authored triggera po nazwie, rolach, metadata i deklaracji button root. Niezależnie od wyniku runtime buduje jeden transparentny, raycastowalny proxy `VrReliquaryReleaseButtonHitArea` z `hitAreaScale = 2`; reset nie duplikuje proxy.

Release działa dla `inserted` i `active`. Emisja wynosi `0` idle, `1` hover, `5` podczas press/releasing. Kontrakt metadata assetu deklaruje klip `Relic_Reliquary_ReleaseButton_Press`; akcja runtime, jeśli resolver znajdzie dokładnie tak nazwany klip, używa `LoopOnce` i `clampWhenFinished`. Stan `releasing` blokuje następne kliknięcia. Po `releaseDelaySeconds = 1` wywołane jest `releaseInserted()`: tylko aktualny kryształ jest usuwany, socket jest zwalniany, release wraca do idle, a activate jest resetowany. Bieżący GLB eksportuje jednak jedyną animację jako `Animation`, podczas gdy release resolver — inaczej niż activate resolver — szuka tylko nazwy kontraktowej. W rezultacie funkcjonalny raycast/release działa, ale `action` jest `null` i animacja press nie jest odtwarzana na `HEAD`. To potwierdzona sprzeczność asset–runtime pozostawiona bez naprawy w tym zadaniu dokumentacyjnym; nie jest regresją raycastu, emisji ani samego release.

## Crystal state machine

```text
materializing → available → pulling → held → inserted → active → released
```

| Stan | Raycast / grab | Widoczność i własność | Portal / socket |
| --- | --- | --- | --- |
| `materializing` | nie / nie | widoczna animacja wrappera w scenie | socket wolny |
| `available` | tak / tak, przez wskazany ray i squeeze | widoczny w scenie | socket wolny |
| `pulling` | nie / już przypisany jednej dłoni | widoczny pod `holdSocket`; early release zachowuje world transform | socket wolny |
| `held` | nie / trzymany przez jedną dłoń | widoczny pod `holdSocket` | insertion możliwe tylko po puszczeniu w zone |
| `inserted` | nie / nie | widoczny na runtime/fallback anchor | socket zajęty; portal nadal pokazuje poprzedni/waiting content |
| `active` | nie / nie | widoczny na anchor | socket zajęty; portal pokazuje jego stronę |
| `released` | nie / nie | ukryty i odpięty | socket wolny; następny kryształ może być inserted |

Próba włożenia drugiego kryształu przy zajętym sockecie zwraca go do `available`. Insertion ani activation nigdy nie konsumują kryształu; usuwa go dopiero release.

## Portal page and runtime read state

Canvas początkowo pokazuje lokalizowaną instrukcję. Insertion nie zmienia strony; robi to dopiero activate. `readPageIds` jest `Set` wewnątrz jednej instancji `createVrCrystalCollection`; `hasReadPage(pageId)` i `getReadPageIds()` udostępniają odczyt.

Przy release **aktywnego** kryształu jego `page.id` jest dodawane do `readPageIds`. Release kryształu tylko `inserted` nie oznacza strony jako przeczytanej. `reset()` nie czyści Setu, więc read-state przeżywa reset przed wejściem, błąd startu, session end i kolejne sesje tak długo, jak istnieje przygotowany runtime strony. `dispose()` również wywołuje `reset()`, ale nie czyści Setu; po disposal instancja i jej API nie są jednak ponownie używane. Odświeżenie/nawigacja tworzy nowy runtime i pusty Set. Nie ma `localStorage`, UI read-state ani wizualnego oznaczenia kryształów.

## Frame update order

1. `glyphOrbit.update(delta)` i wyznaczenie dynamicznego `entryReady` (po aktywacji readiness jest blokowane, nie orbit).
2. Odświeżenie world matrices pierścienia.
3. Glyph raycast.
4. Crystal materialization/pull/raycast.
5. Activate-button update.
6. Release-button update.
7. Przypisanie glyph readiness i aktualizacja świateł.
8. Entry transition.
9. Locomotion.
10. Portal canvas animation.
11. Render.

## Session reset and disposal

Runtime jest przygotowany raz i ponownie używany. Reset jest wykonywany bezpośrednio przed request session, po `end` oraz po błędzie startu. Obejmuje entry transition, crystal collection i controller crystal hits, oba przyciski, relikwiarz, portal/canvas waiting state, locomotion, `playerRig` position/orientation, activated glyph, orbit, lights i glyph hits. Dzięki ponownemu użyciu nie powstają duplikaty modeli, listenerów, mixerów ani release hit area.

Sesja prosi o `local-floor`; jawny test reference space może przełączyć runtime na `local`. `pagehide` resetuje/disponuje oba przyciski, kolekcję i relikwiarz, usuwa listenery oraz runtime proxy. Bazowy renderer i pozostałe obiekty kończą życie wraz ze stroną.

## Current settings baseline

- ring: multiplier `2`, angular speed `0.14`, readiness `0.24`, hysteresis `0.04`;
- entry: `3 s`, smoothstep, `targetRadiusFactor = 0.76`;
- controllers: ray `3 m`;
- crystals: ray limit `1.8 m`, pull `0.25 s`, highlight `1.04`, materialization `0.55 s` / stagger `0.12 s`;
- locomotion: deadzone `0.18`, move `1.8`, turn `1.35`;
- reliquary: `1.5 m` from portal, `heightOffset = 0.5`;
- buttons: `1 m` forward, `±0.5 m` lateral, scale `0.3`;
- release: delay `1 s`, hit-area scale `2`.

## Automated validation

`npm run test:vr` obejmuje capability, settings/legacy normalization, orbit, lights, glyph raycast, compensated entry, authored canvas/fallback, portal placement, locomotion, deterministic strony/materializację/raycast-pull/stany/reset/read-state, relikwiarz i anchor visibility, integration/preload oraz oba przyciski. Są to testy kodu, nie hardware QA.

## Meta Quest 3S hardware status

### Potwierdzone sprzętowo wcześniej

Uruchamianie sesji, head tracking, skala sceny, dwa kontrolery i promienie, glyph raycast, aktywacja glifu, przejście do pierścienia, ciągły orbit, light feedback, raycastowe chwytanie kryształu, insertion do relikwiarza, widoczność po korekcie runtime anchora oraz funkcjonalny release usuwający kryształ i zwalniający socket.

### Wdrożone i automatycznie testowane, bez jednoznacznej akceptacji sprzętowej

Blenderowy canvas/fallback, finalne placementy, mapping stron i 15 preloadów, deterministyczna materializacja, niezależne hit states, limit/pull/cancel, pełny state machine, activation-gated page update, release delay/proxy/lock/reset, runtime read-state, smooth locomotion i reset/reuse lifecycle. Test przycisku release używa fixture z poprawnie nazwanym klipem; nie waliduje nazwy animacji w produkcyjnym GLB.

### Do ponownej walidacji na Quest

- finalna pozycja portalu i czytelność Blenderowego canvasu;
- mapping osi locomotion, prędkość oraz komfort smooth turn;
- `distanceFromPortal = 1.5` i `heightOffset = 0.5`;
- przyciski `1 m` przed relikwiarzem, `±0.5 m` od osi, wizualna skala `0.3`;
- release hit area oraz emisja i animacja release po korekcie assetu;
- wielokrotny cykl insert → activate → release → następny kryształ;
- reset po wyjściu i ponownym wejściu do VR.

## Known limitations

Brak trwałego zapisu i UI przeczytanych stron oraz oznaczenia przeczytanych kryształów. Brak physics, gravity, collision, throwing, velocity, teleport, jump, snap turn, VR audio, atmosfery, galaktyk i bridge construction.

## Active prohibitions

Nie łączyć runtime'ów VR i 3D; nie modyfikować chronionego `src/experience3d.js`; nie sterować tracked camera; nie zatrzymywać orbity; nie przywracać arrival plaque/per-glyph plaque preload ani osobnego canvasu; nie zastępować raycast-pull nearest-hand; nie skalować relikwiarza przez button wrappers; nie podpinać widocznego kryształu bezpośrednio pod ukryty insertion zone; nie traktować testów automatycznych jako hardware QA.

## Safe next implementation points

Następna praca może rozszerzać istniejące publiczne granice modułów: trwałość/UI read-state przez `hasReadPage()` i `getReadPageIds()`, tuning wyłącznie po Quest QA, albo dalszy content przez stabilne `glyphId`/`page.id` i preload manifest. Musi zachować oddzielny runtime, `playerRig` ownership, authored portal surface, AssetManager-only models, kompletny cykl relikwiarza i brak duplikacji lifecycle.
