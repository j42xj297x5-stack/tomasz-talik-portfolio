# Experience VR Platform Energy VFX Model

Status: **KANON / PARTIALLY IMPLEMENTED (R3b + R3c + Asterion energy profiles and arc visual upgrade)**. Dokument opisuje wspólną warstwę proceduralnej energii platformy. `RUNE_BINDER_REVEAL`, `SECTOR_ACQUISITION` i `FLOOR_DRIVE` działają w runtime; `RUNE_INSTALL` pozostaje targetem. Liczby w settings są TUNING, nie kanonem architektury.

## Stan implementacji R3b

**IMPLEMENTED:** jeden shared pair-generic `PlatformEnergyVfxActor`, cienkie read-only projections, midpoint/fractal displacement z hierarchicznie malejącą amplitudą, longitudinal variable width, jasny wąski core i miękka additive halo w jednym ribbon shaderze, bounded per-bolt variation szerokości/jasności/lifetime/displacement, płytki 3D surface lift, bounded `0..N` jednopoziomowe branches oraz profile `RUNE_BINDER_REVEAL`, `SECTOR_ACQUISITION` i `FLOOR_DRIVE`. Branches zajmują zwykłe sloty tego samego bounded poola, nie rekurują i są fail-soft pomijane przy saturation. Reusable slot geometry/material powstają tylko przy construction; spawn nie alokuje nowych GPU resources ani nie przelicza bounding sphere. Binder feed zachowuje exact true presentation endpoint, a pierwszy i ostatni punkt main path pozostają exact.

**NOT IMPLEMENTED:** niezależne wielowarstwowe bolt shells (core + halo jest jednym shaderem), gwarantowany retry final pulse przy wyczerpanym poolu, `RUNE_INSTALL`, detent sparks, motion/detent audio, field/lensing i target response.

## Klasyfikacja ustaleń

- **KANON** — wiążąca granica architektury, ownership albo przepływ danych przyszłej implementacji.
- **FACT** — istniejący stan runtime, na którym model polega i którego VFX nie może zastąpić.
- **TUNING** — parametr prezentacyjny wymagający osobnej decyzji i testów; nie jest prawem architektonicznym.

## Ownership i granica systemu

**KANON / IMPLEMENTED FOUNDATION:** fizycznym ownerem prezentacji jest jeden pair-generic actor `PlatformEnergyVfxActor` w `src/xr/vfx/createVrPlatformEnergyVfxActor.js`.

**KANON:** dopuszczalny jest cienki `PlatformEnergyVfxProjection`. Wyłącznie odczytuje sector-complete, istniejące read-only stany instalacji Rune i Asterion gyro, normalizuje je do komend prezentacyjnych i przekazuje aktorowi. Projection ani actor nie zapisują gameplay truth, nie rozstrzygają readiness, nie instalują kamienia i nie sterują platformą. Przepływ jest jednokierunkowy:

```text
RuneStoneInstallationInteraction
        ↓ read-only transient state
PlatformEnergyVfxProjection
        ↓ presentation command
PlatformEnergyVfxActor
        ↓
sector-local procedural lightning
```

```text
AsterionGyroInteraction
        ↓ driveActive / angular speed / lock state
PlatformEnergyVfxProjection
        ↓ presentation command
PlatformEnergyVfxActor
        ↓
platform underfloor procedural lightning
```

**KANON:** nie istnieje strzałka zwrotna od VFX do ownerów gameplay. VFX jest odtwarzalną, resetowalną projekcją i nie jest właścicielem progresji, Rune tuning, installation readiness, transient Rune lifecycle, persistent installed truth, komendy ruchu ani modelu ruchu platformy.

## Istniejące źródła prawdy

- **FACT:** `RuneStoneInstallationInteraction` prowadzi transient capture właściwego `branchId`; Rune Stone przechodzi przez `SOCKET_CAPTURE`, a ukończony snap kończy się stanem `INSTALLED` i dopiero istniejąca transakcja commituję persistent installed truth. VFX obserwuje ten proces, nie tworzy równoległego lifecycle.
- **FACT:** aktywny capture udostępnia elapsed/duration przez istniejący transient record. Projection może z niego wyprowadzić read-only znormalizowany postęp prezentacyjny; nie utrwala go.
- **FACT:** `AsterionGyroInteraction` posiada `driveActive`, rzeczywistą prędkość kątową i stan, w tym `LOCKED`; zapisuje rzeczywistą quaternion `VrTiltableFloorRoot`. VFX jedynie projektuje te dane i nie integruje własnego modelu ruchu.
- **FACT:** `VrTiltableFloorRoot` jest wspólnym transform rootem platformy. Pięć sektorów zachowuje układ pięciu wycinków po 72°.
- **FACT / IMPLEMENTED:** live successful sector-completing page commit zwraca rzeczywiste readiness transitions. Niezależne VFX i audio projections konsumują tę samą immutable listę: VFX deduplikuje `HIDDEN → DOCKED` i rozpoczyna `RUNE_BINDER_REVEAL`, a audio równolegle rozpoczyna odpowiadający WORLD one-shot bez uzależnienia od sukcesu aktora VFX. Hydration nadal odtwarza settled `DOCKED`/`BOUND` bez replayu VFX lub audio. Audio ownership i mapping pozostają w [`VR_AUDIO_MODEL.md`](VR_AUDIO_MODEL.md), nie w `PlatformEnergyVfxActor`.

## Kontrakt przestrzenny

**KANON:** każdy sektor posiada logiczną, niewidzialną `sector energy wedge` pod swoją powierzchnią. Jest to sector-local objętość odpowiadająca wycinkowi 72°, używana wyłącznie do losowania punktów początku i końca łuków. Nie jest colliderem, triggerem ani źródłem gameplay truth.

**KANON:** efekty sektorowe są osadzane w lokalnym układzie właściwego sektora lub mountu pod `VrTiltableFloorRoot`, dzięki czemu dziedziczą pełną transformację platformy. Punkty między sąsiednimi sektorami są rozwiązywane z ich lokalnych stref i wspólnego platform-local frame. Magiczne globalne world offsety są zabronione.

**KANON:** łuki przebiegają przede wszystkim pod ażurową podłogą i mają być widoczne przez jej otwory. Nie przedstawiają piorunów spadających z nieba.

**TUNING:** radial range, pionowy offset pod powierzchnią, grubość wedge, marginesy i dokładny rozkład losowania pozostają nieustalone. Żadna wartość w metrach nie jest częścią tego kontraktu.

## Wspólny język proceduralny

**KANON / IMPLEMENTED:** aktywne profile korzystają z tego samego generatora i zasobów aktora: krótkich midpoint/fractal paths, longitudinal width envelope, bounded variation, płytkiego local-normal lift, opcjonalnych jednopoziomowych odnóg, camera-facing ribbon, `ShaderMaterial`, additive core + halo oraz krótkiego reveal/fade. Każda odnoga zaczyna się dokładnie w wewnętrznym punkcie main path, jest krótsza, cieńsza, ciemniejsza i nie tworzy branch-of-branch. Profile różnią się strength/spawn envelope, nie rendererem ani generatorem.

### Profil `RUNE_BINDER_REVEAL`

- **KANON:** źródłem zdarzenia jest ukończenie wszystkich paneli sektora (`sector complete`), nigdy Rune socket capture ani instalacja kamienia.
- **KANON:** wyładowania biegną przez niewidoczną sector-local część pod ażurową podłogą, energia dochodzi do rejonu Zwornika, Zwornik materializuje się, następuje finalny impuls, a efekt wygasa.
- **KANON:** profil prezentuje domenowy fakt ukończenia sektora i nie tworzy sector-complete, Zwornika ani installation readiness.
- **TUNING:** czas dojścia energii, reveal geometry, natężenie i envelope finalnego impulsu.

### Profil `RUNE_INSTALL`

- **KANON:** działa tylko dla `branchId`, którego istniejący stan to aktywny `SOCKET_CAPTURE`.
- **KANON:** krótkie łuki powstają wewnątrz właściwego `sector energy wedge`; część może łączyć rejon podłogi z lokalnym rejonem bridge/socket.
- **KANON:** przejście do `INSTALLED` uruchamia jeden krótki, mocniejszy finalny impuls, po którym efekt instalacyjny gaśnie.
- **KANON:** semantyka brzmi „obwód jest domykany”, nie „podłoga zostaje uszkodzona”.
- **TUNING:** zależność frequency/intensity od postępu capture, długość, udział połączeń do socketu i envelope finalnego impulsu.

### Profil `FLOOR_DRIVE`

- **KANON:** reaguje na rzeczywisty `driveActive`, rzeczywistą prędkość kątową i stan lock przekazane read-only z gyro.
- **KANON:** używa proceduralnych łuków wewnątrz sektorów; sporadyczne łuki mogą łączyć sąsiednie sektory.
- **KANON:** po ustabilizowaniu w `LOCKED` może wykonać jeden krótki impuls wygaszający. W spoczynku nie działa stała burza.
- **TUNING:** progi aktywacji, frequency curve, wpływ prędkości na częstotliwość/długość, udział łuków między sektorami oraz envelope impulsu `LOCKED`.

## Kontrakt lifecycle aktora

Dokładna sygnatura JavaScript pozostaje otwarta. Publiczna powierzchnia ma jednak zapewnić następujące semantyki:

| Operacja wysokiego poziomu | Semantyka i ownership |
| --- | --- |
| rozpoczęcie reveal Zwornika dla `branchId` | Obserwuje exactly-once sector-complete i uruchamia `RUNE_BINDER_REVEAL`; nie kończy sektora ani nie tworzy gameplay truth Zwornika. |
| rozpoczęcie installation VFX dla `branchId` | Aktywuje `RUNE_INSTALL` dla jednej istniejącej sesji capture; nie rozpoczyna capture i nie ocenia readiness. |
| aktualizacja postępu instalacji | Przyjmuje read-only, znormalizowaną projekcję istniejącego capture; steruje wyłącznie envelope VFX. |
| zakończenie instalacji | Kończy profil, emituje exactly-once finalny impuls dla obserwowanego przejścia do `INSTALLED`, potem wygasza zasoby profilu. Nie wykonuje gameplay commitu. |
| aktualizacja drive platformy | Przyjmuje `driveActive`, rzeczywistą angular speed i lock state; nie przyjmuje komendy sterującej i nie oblicza ruchu. |
| `update(deltaSeconds)` | Aktualizuje bounded symulację prezentacyjną, reveal/fade i pooled bolty w czasie klatki. |
| `reset()` | Czyści transient presentation state i aktywne impulsy bez zmiany jakiejkolwiek prawdy gameplay; aktor pozostaje zdatny do ponownego użycia. |
| `dispose()` | Idempotentnie odłącza owned presentation nodes i zwalnia należące do aktora materiały, geometrie oraz pule; późniejsze komendy są inert. |

**KANON:** projection odpowiada za deduplikację obserwowanych przejść na komendy prezentacyjne (w szczególności finalnego impulsu), a actor za fizyczną prezentację, pule i zasoby GPU. Ani jeden nie rekonstruuje persistent truth.

## Adaptacja Lightning-VFX

**FACT:** źródłem inspiracji/adaptacji jest [Lightning-VFX](https://github.com/SahilK-027/Lightning-VFX), autor Sahil K, licencja MIT (2026). Upstream jest demem Three.js, nie biblioteką o docelowym API projektu.

**KANON — adaptować tylko potrzebny rdzeń:** proceduralne generowanie ścieżki, midpoint/fractal displacement, opcjonalne branchowanie, wielowarstwowy bolt, camera-facing ribbon w shaderze, `ShaderMaterial`, additive blending, krótki reveal/fade oraz opcjonalnie bardzo oszczędne sparks albo lokalny flash geometrii.

**KANON — nie przenosić:** upstreamowej sceny, kamery, camera shake, screen flash/overlay, terrain/grid, ground cracks, debris, shockwave, auto storm, `lil-gui`, `vite-plugin-glsl` ani osobnej zależności npm `three`.

**KANON:** przyszła implementacja korzysta z istniejącego vendored Three.js projektu. Shader może być lokalnym modułem/stringiem zgodnym z istniejącym buildem; nie ustanawia się pluginu GLSL. Jeśli implementacja skopiuje lub zaadaptuje istotne fragmenty upstreamowego kodu, musi zachować wymagane przez MIT copyright i permission notice. Ten dokument nie kopiuje kodu ani pliku licencji.

## Meta Quest 3S — granica wydajności i komfortu

**KANON:** Meta Quest 3S jest urządzeniem docelowym i boundary dla projektu efektu:

- brak camera shake i screen-space flash;
- brak wymagania bloom lub postprocessingu;
- brak dynamicznej fizyki debris i ciężkiej osobnej sceny efektowej;
- bounded liczba jednoczesnych wyładowań;
- reuse/pooling zasobów GPU zamiast nieograniczonego tworzenia i usuwania;
- additive transparent materials z `depthWrite = false`;
- poprawne działanie camera-facing ribbon w stereoskopowym WebXR;
- hardware/perceptual QA na Quest 3S pozostaje osobną bramką, a nie twierdzeniem tego dokumentu.

**TUNING:** limit aktywnych boltów, liczba segmentów i branches, spawn rate, jasność, grubość, kolor, fade time, wszystkie krzywe intensywności oraz paleta. Dokument nie ustanawia semantycznych kolorów rodzin.

## Wyłączenia

**KANON:** model nie projektuje audio, Rezonatora, przyszłego sector control, Scenario ani Directora; nie zmienia Rune lifecycle, Asterion gyro, progresji ani dependency runtime. Implementacja systemu, wartości tuningowe i hardware/perceptual QA są osobnymi zadaniami.


Pole Rezonatora ma odrębny język prezentacyjny inspirowany soczewkowaniem grawitacyjnym — rozjaśnienie, powiększenie, zakrzywienie, caustic-like arcs i deformację obrazu — zamrożony w [`VR_ASTERION_RESONATOR_FIELD_MODEL.md`](VR_ASTERION_RESONATOR_FIELD_MODEL.md). Field lensing presentation może otrzymywać read-only wynik Resonator Field Domain, lecz nie należy do `PlatformEnergyVfxActor`; dokładna nazwa klasy/API i podział projection/actor pozostają otwarte. `PlatformEnergyVfxActor` nie wyprowadza descriptoru, nie interpretuje `α/β/γ` jako gameplay truth i nie posiada target response. Nie wolno łączyć platform energy VFX, field, lensing i motion w jeden megasystem.


## Asterion energy profiles — IMPLEMENTED

The one shared bounded ribbon pool and midpoint/fractal generator now serve three presentation-transient semantics: `RUNE_BINDER_REVEAL`, `SECTOR_ACQUISITION`, and `FLOOR_DRIVE`. Acquisition reads the existing 1.0 s progress and increases a conservative shallow sector-local arc rate and strength; leaving `ACQUIRING`, including transition to `LOCKED`, stops new acquisition spawns while existing bolts expire naturally.

A thin read-only Asterion projection resolves glyphs through Progress Floor and detects physical drive solely from same-frame changes in `currentAngleDegrees` (epsilon `1e-4°`) plus the moving glyph. Consequently stale `DRIVING` during trigger suppression produces no energy, while real `SETTLING` motion does. Drive bolts sample the full sector wedge; a bounded fraction feeds the authored `BRIDGE_STONE_CAPTURE`. Rune Bridge returns its defensive world position from inside the scaled/offset presentation subtree, and the actor converts it with `mount.worldToLocal`; the feed envelope is the union of sector bounds and explicit endpoints, so downward MotionRoot hinges and the true endpoint remain intact. Missing endpoints fail soft to surface bolts.

The visual upgrade is implemented across all three profiles: asymmetric longitudinal width, a near-white narrow core with a soft colored halo and edge falloff, subtle per-spawn width/brightness/lifetime/displacement variation, deterministic seeded pseudo-flicker, shallow 3D surface lift, and bounded `0..2` one-generation branches. Acquisition scales branch probability with strength and allows at most one branch, while drive and reveal can use the full bounded tuning. Branches consume ordinary slots in the same pool and are omitted at saturation; no geometry/material is allocated and no bounding sphere is recomputed per spawn. Main endpoints, including the true Binder endpoint, remain exact.

Still not implemented: independent multilayer bolt shells beyond the equivalent single-shader core + halo, `RUNE_INSTALL`, detent sparks, motion/detent audio, Field/lensing, target response, and Metal/Water motion. Hardware/perceptual QA has not been performed.
