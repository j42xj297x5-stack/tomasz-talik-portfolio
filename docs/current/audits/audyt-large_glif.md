Tak — po audycie obraz jest dość wyraźny: **Large Glyph należy wyciąć z obecnego układu `glyphRing + glyphOrbit + postRing + p2Radial` i zrobić z niego jeden fizyczny/spatial actor**. Obecny kod jest funkcjonalnie rozproszony, a najnowszy merge `bf92341f` dołożył jeszcze przyciąganie oparte na starym modelu `suspendNode/getCanonicalTransform/resumeNode`, więc dalsze dokładanie funkcji do `createVrGlyphOrbit()` tylko pogłębiłoby problem.

## 1. Co dziś naprawdę posiada Large Glyph

Dzisiaj nie ma jednego ownera. `experienceVr.js` sam:

* rozwiązuje content dużych glifów,
* tworzy je przez `createOrbitNodes`,
* nakłada skalę ×3,
* dodaje `glyphRing` do `WorldStableRoot`,
* tworzy `glyphOrbit`,
* wyprowadza z niego promienie innych systemów,
* przekazuje `nodes` do interakcji, świateł i Astrolabium.

Czyli composition root zna zdecydowanie za dużo.

Do tego przestrzeń Large Glyph jest podzielona:

* `createVrGlyphOrbit.js` — ciągła rotacja i promień;
* `createVrPostRingPresentation.js` — podniesienie glifów przez `glyphRing.position.y`;
* `createVrP2RadialPresentation.js` — późniejsze odsunięcie przez `glyphOrbit.setRadius()`;
* `createVrLargeGlyphAttractorInteraction.js` — chwilowe odebranie pojedynczego glifu orbicie.

To są cztery różne miejsca posiadające różne fragmenty jednego obiektu.

---

# 2. Największy problem starej orbity

`createVrGlyphOrbit()` nadal robi:

```text
phase += delta * speed
dla każdego glifu:
    angle = initialAngle + phase
    x = cos(angle) * radius
    z = sin(angle) * radius
    node.position = ...
```

Po ostatnim wdrożeniu dodatkowo dla każdego node zapisuje `vrCanonicalOrbitTransform`, nawet jeśli glif jest chwilowo suspended.

Przy pięciu obiektach to nie zabija performance, ale **jest złym modelem dla tego, co właśnie zdefiniowaliśmy**.

Docelowo powinno być:

```text
LargeGlyphActor
└── RotationRoot       ← jedyna ciągła rotacja
    ├── Slot_0 → glyph
    ├── Slot_1 → glyph
    ├── Slot_2 → glyph
    ├── Slot_3 → glyph
    └── Slot_4 → glyph
```

I podczas stabilnego gameplayu:

```text
RotationRoot.quaternion = rotation(phase)
```

Tyle.

Żadnych pięciu `sin/cos`.
Żadnego zapisywania pięciu pozycji.
Żadnej aktualizacji canonical transform każdego glifu.

To jest ten sam sensowny model rigid-field, który mamy w `SphericalLayerActor`: sloty są stałe lokalnie, a runtime obraca jeden nadrzędny `Group`.

---

# 3. Ważna pułapka: `7.6` nie może już oznaczać promienia Large Glyph

To jest najbardziej niebezpieczne sprzężenie.

Dziś:

```text
glyphOrbit.effectiveRadius
```

jest jednocześnie używany jako:

* promień Large Glyph,
* granica chodzenia gracza,
* bazowe `R` dla skorup,
* bazowe `R` dla wszystkich kolejnych płaszczy sferycznych.

Canonical spherical model również mówi obecnie:

```text
R = 7.6 m = effective radius istniejącego glyph ring
```

i od tego wyprowadza:

* Shells 7.6–15.2,
* Small Glyphs 17.1–24.7,
* Rune Stones 26.6–34.2,
* itd.

### Tego związku trzeba się pozbyć.

Po refaktorze:

```text
WORLD / PLATFORM BASE R = 7.6 m
```

pozostaje bez zmian.

Natomiast:

```text
LargeGlyphActor.initialRadius = 8.5 m
```

jest osobną wartością.

Czyli **nie zmieniamy `spatial.ringRadius` na 8.5**.

Bo wtedy przypadkiem przesunęlibyśmy skorupy, Small Glyphy i granicę gracza.

---

# 4. 8.5 m jest zresztą bardzo logiczne

`createOrbitNodes()` dopasowuje model Large Glyph do maksymalnego wymiaru około `0.6 m`. VR następnie ustawia skalę ×3.

Czyli maksymalny wymiar wizualny robi się około:

```text
0.6 × 3 = 1.8 m
```

połowa:

```text
~0.9 m
```

Granica gracza:

```text
7.6 m
```

Nowy promień:

```text
8.5 m
```

różnica:

```text
0.9 m
```

Czyli dokładnie mniej więcej połowa maksymalnego wymiaru glifu.

To bardzo sensownie odpowiada temu, co zauważyłeś w headsetcie: po ×3 centrum glifu nadal stało na granicy platformy, więc jego geometria wchodziła do środka.

---

# 5. Docelowy Large Glyph Actor

Proponuję:

```text
src/xr/glyphs/createVrLargeGlyphActor.js
```

Hierarchia:

```text
WorldStableRoot
└── VrLargeGlyphActor
    ├── RotationRoot
    │   ├── Slot_AI_GUIDE
    │   │   └── LargeGlyph
    │   ├── Slot_DIG
    │   │   └── LargeGlyph
    │   ├── Slot_HAIKU
    │   │   └── LargeGlyph
    │   ├── Slot_ETHICS
    │   │   └── LargeGlyph
    │   └── Slot_CREATIVE
    │       └── LargeGlyph
    │
    └── TransientRoot
```

`RotationRoot` obraca całą konstrukcję.

`TransientRoot` jest potrzebny do przyciągania: wybrany glif można chwilowo wyjąć ze swojego slotu bez wyrzucania go poza aktora.

To jest bardzo ładna granica ownership:

```text
LargeGlyphActor owns all Large Glyph objects always
```

nawet podczas Astrolabium pull.

---

# 6. Stany przestrzenne aktora

Z obecnej i przyszłej progresji wychodzą cztery naturalne canonical stages:

```text
RING_INITIAL
→ RING_ELEVATED
→ RING_EXPANDED
→ SPHERE_FAR
```

### `RING_INITIAL`

Pięć glifów:

* układ poziomy,
* równo co 72°,
* promień `8.5 m`,
* jedna wspólna prędkość obrotowa,
* skala ×3.

Tutaj nie ma już obecnego losowego/zygzakowatego Y.

Co istotne: obecny `createOrbitNodes()` ustawia każdemu glifowi inne Y:

```js
0.65 + sin(index * 1.2) * 0.25
```

czyli aktualna konstrukcja **w ogóle nie jest prawdziwym poziomym ringiem**.

Nowy actor to usuwa.

---

### `RING_ELEVATED`

To jest obecny beat `3.10`.

Dziś robi go:

```text
glyphRing.position.y += 2.4
```

przez `createVrPostRingPresentation`.

Po refaktorze:

```text
postRingPresentation
→ largeGlyphActor.beginElevation()
```

`postRingPresentation` przestaje posiadać transform Large Glyph.

Może nadal być **orchestrator'em** wspólnego beatu:

```text
reveal shells
+
request Large Glyph elevation
```

ale fizyczny ruch należy do LargeGlyphActor.

---

### `RING_EXPANDED`

Według Twojej nowej decyzji:

```text
8.5 m
+ około 10 m
= około 18.5 m
```

Tu mamy jeden ważny konflikt przestrzenny.

Canonical Small Glyph volume wynosi:

```text
17.1–24.7 m
```

więc `18.5 m` leży **wewnątrz Small Glyph field**.

Stary target `25.08 m` nie był przypadkowy — siedział w pustym gapie:

```text
Small Glyph outer = 24.7
Large Glyph = 25.08
Rune Stones begin = 26.6
```

Czyli mamy tutaj realną decyzję projektową:

**Wariant zgodny literalnie z nową wizją:**

```text
RING_EXPANDED = 18.5 m
```

Large Glyph i Small Glyph dzielą wtedy częściowo tę samą przestrzeń.

**Wariant zachowujący separację warstw:**

```text
RING_EXPANDED ≈ 25–26 m
```

ale ruch nie wynosi już +10 m.

Nie traktowałbym tego jako technicznego szczegółu — to jest wizualna decyzja przestrzenna.

---

### `SPHERE_FAR`

Tutaj ring przestaje być ringiem.

Pięć slotów przechodzi w pięć deterministycznych kierunków na pełnej sferze:

```text
4π distribution
```

Najprościej użyć Fibonacci sphere tak jak przy innych polach, ale tylko dla `N=5`.

Nie `Math.random()`.

Każdy glyph zachowuje swój slot/identity.

Potem obracamy nadal **ten sam `RotationRoot`**, więc cała pięcioelementowa sfera obraca się rigid-body z jedną prędkością.

---

# 7. Około 50 m — tutaj też znalazł się ciekawy konflikt

Jeżeli przez:

> „oddalić o jakieś 50 m”

rozumiemy:

```text
final radius ≈ 50 m
```

to trafiamy dokładnie w reserved:

```text
HIDDEN_GLYPHS = 45.6–53.2 m
```

czyli Large Glyph zajęłyby przyszłą warstwę Hidden Glyph.

Natomiast jeżeli rozumiemy to literalnie jako:

```text
18.5 + około 50
≈ 68.5 m
```

to jesteśmy już poza wszystkimi obecnie zarezerwowanymi warstwami.

I nadal mieścimy się w obecnym:

```js
camera.far = 100
```

więc rendering powinien mieć zapas.

**Architektonicznie wybrałbym około `68.5 m`, nie `50 m`.**

To dobrze pasuje do słów „oddalają się o 50 metrów”, a jednocześnie nie wchodzimy w future `HIDDEN_GLYPHS`.

---

# 8. Kiedy naprawdę aktualizujemy dzieci per frame

W stabilnych etapach:

```text
RING_INITIAL
RING_ELEVATED
RING_EXPANDED
SPHERE_FAR
```

ruch Large Glyph:

```text
1 quaternion RotationRoot / frame
```

i nic więcej spatialnie.

Per-child aktualizacja występuje tylko chwilowo:

### transition

np.:

```text
RING_INITIAL → RING_ELEVATED
```

przez 2.5 s pięć slotów interpoluje pozycje.

Po dojściu:

```text
STOP
```

sloty znów są nieruchome lokalnie.

### Astrolabium pull

aktualizowany jest jeden fizyczny glif.

### return

aktualizowany jest jeden fizyczny glif w drodze do poruszającego się slotu.

To jest dokładnie model, którego szukaliśmy.

---

# 9. Przyciąganie po refaktorze

Obecny nowy `createVrLargeGlyphAttractorInteraction` nie trzeba wyrzucać w całości.

Dobre rzeczy już są:

* `ORBIT / PULLING / CAPTURED / RETURNING`,
* family gate przez `canAttractLargeGlyph`,
* zielony scan cone,
* stand-off liczony z bounding sphere,
* Large Glyph audio,
* A-form preview.

Do wyrzucenia jest jego zależność od:

```text
glyphOrbit.suspendNode()
glyphOrbit.getCanonicalTransform()
glyphOrbit.resumeNode()
```

Nowy kontrakt:

```text
largeGlyphActor.beginTransient(node)
largeGlyphActor.getSlotWorldTransform(node)
largeGlyphActor.restoreToSlot(node)
```

W `beginTransient()` actor robi:

```text
TransientRoot.attach(node)
```

Slot pozostaje pusty i nadal obraca się wraz z całą sferą.

RETURN czyta:

```text
Slot.getWorldPosition()
Slot.getWorldQuaternion()
```

Po dojściu:

```text
Slot.attach(node)
node.position = 0
node.quaternion = authoredLocalQuaternion
```

Gotowe.

Nie potrzeba żadnego `suspended Set` wewnątrz starej orbity.

---

# 10. Co już z ostatniego wdrożenia Large Glyph zostawiamy

Merge #554 z właśnie wdrożonego poprzedniego promptu nie jest stracony. Zostają:

### Zostaje

* `LARGE_GLYPHS` w `VR_ATTRACTOR_BANDS`;
* dynamiczny cykl B;
* capabilities:

  * `CAN_SCAN_LARGE_GLYPHS`
  * `CAN_TARGET_LARGE_GLYPHS`
  * `CAN_PULL_LARGE_GLYPHS`;
* `ProtoAstroTuningController.canAttractLargeGlyph()`;
* rodzinny gate I ↔ A;
* Large Glyph A SVG w Panelu 1;
* green band;
* `largeGlyph` audio;
* capture clearance;
* większość state machine przyciągania.

### Do wymiany

* `createVrGlyphOrbit.js`;
* `suspendNode`;
* `vrCanonicalOrbitTransform`;
* `resumeNode`;
* `glyphOrbit.effectiveRadius` jako world-base;
* obecny `largeGlyphTargetRadius = glyphOrbit.effectiveRadius * 3.3`;
* bezpośrednie `glyphRing.position.y`;
* `createVrP2RadialPresentation` jako owner fizycznego ruchu.

---

# 11. Co powinno zniknąć z `experienceVr.js`

Dzisiaj znajduje się tam:

```text
resolvePortfolioNodes
createOrbitNodes
nodes.forEach(scale ×3)
worldStableRoot.add(glyphRing)
createVrGlyphOrbit(...)
largeGlyphTargetRadius(...)
largeGlyphMaxTargetDistance(...)
glyphRing.updateMatrixWorld(...)
glyphOrbit.update(...)
glyphRing.visible = ...
glyphOrbit.reset()
```

To jest za dużo.

Po migracji chcę tam mniej więcej tylko:

```text
const largeGlyphActor = createVrLargeGlyphActor({...})
```

oraz composition:

```text
glyphInteraction ← largeGlyphActor.nodes
glyphLights ← largeGlyphActor.nodes
largeGlyphAttractor ← largeGlyphActor
introFogReveal ← largeGlyphActor.object
```

i lifecycle:

```text
largeGlyphActor.update(delta)
largeGlyphActor.reset()
largeGlyphActor.dispose()
```

To jest właściwa rola `experienceVr.js`.

---

# 12. `createOrbitNodes.js` też wymaga decyzji

To jest współdzielony helper z Experience 3D i zawiera sporo rzeczy, których VR nie potrzebuje:

* własny radius `3.8`,
* sinusoidalny Y,
* hover animation runtime,
* legacy `createOrbitController`,
* własny spatial layout.

Nie powinien być spatial ownerem Large Glyph w VR.

Natomiast zawiera użyteczną rzecz:

```text
GLB → fitModelToNode → attach model → userData
```

Najczystsze rozwiązanie to wydzielić z niego **czystą fabrykę visual node**, której użyją:

```text
Experience3D createOrbitNodes
LargeGlyphActor
```

Bez współdzielenia spatial behavior.

Nie robiłbym drugiej kopii `fitModelToNode()` w VR.

---

# 13. Ordinary Glyph gameplay nie powinien wejść do aktora przestrzennego

`createVrGlyphInteraction` nadal posiada:

```text
ordinary ray
0.5 s hold
crystal creation
```

i może nadal dostawać:

```text
largeGlyphActor.nodes
```

Nie ma powodu przepisywać mechaniki kryształów tylko dlatego, że zmieniamy spatial owner.

Analogicznie `createVrGlyphLights` może pozostać osobnym presentation helperem operującym na node'ach.

Czyli:

```text
LargeGlyphActor
= physical nodes + spatial state + stage transitions

GlyphInteraction
= ordinary glyph gameplay

LargeGlyphAttractorInteraction
= Astro transport

GlyphLights
= light presentation
```

To jest zdrowy podział.

---

# 14. Scenario / hydration też trzeba uporządkować

Obecnie jedna prawda Large Glyph jest rozbita na dwa owner sections:

```text
postRing.mainGlyphsElevated = true
```

oraz:

```text
p2World.mainGlyphsRadial = true
```

Pierwsze hydratuje `PostRingPresentation`, drugie `P2RadialPresentation`.

Po stworzeniu aktora proponuję jedną prawdę:

```text
largeGlyphs: {
    stage: 'ELEVATED'
}
```

a później:

```text
largeGlyphs: {
    stage: 'EXPANDED'
}
```

future:

```text
largeGlyphs: {
    stage: 'SPHERE_FAR'
}
```

Wtedy:

```text
scenarioOwners.largeGlyphs = largeGlyphActor
```

i jeden `hydrateScenarioState()` odtwarza cały spatial state Large Glyph.

To bardzo dobrze pasuje do:

```text
Scenario mówi CO
Actor wie JAK
```

---

# 15. PostRing po refaktorze

`createVrPostRingPresentation` może zostać, ale traci ownership Large Glyph.

Dziś:

```text
PostRingPresentation
├ shell reveal
└ glyphRing.position.y
```

Po refaktorze:

```text
PostRingPresentation
├ shellSystem.setPresentationVisible()
└ largeGlyphActor.beginElevation()
```

Czyli jest tylko **koordynatorem dwóch actorów**, nie rusza geometrii.

To jest właściwe.

---

# 16. P2RadialPresentation prawdopodobnie przestaje być potrzebny

`createVrP2RadialPresentation.js` dziś istnieje wyłącznie po to, żeby przez 2.5 s wykonywać:

```text
glyphOrbit.setRadius(...)
```

Po nowym actorze:

```text
BEGIN_P2_RADIAL_PRESENTATION
→ largeGlyphActor.beginExpansion()
```

Actor sam emituje completion callback po dojściu do `EXPANDED`.

Ten moduł można najpewniej usunąć.

---

# 17. Intro ma tylko dwa zależności, które trzeba przepiąć

Intro nie zarządza geometrią Large Glyph.

Potrzebuje jedynie:

### Fog

`createVrIntroFogReveal` dostaje root do patchowania materiałów. Zamiast `glyphRing` dostanie:

```text
largeGlyphActor.object
```

### Visibility / hydration

`IntroSequence` obecnie robi:

```text
glyphRing.visible = ...
```

Może dostać aktor/root albo callback:

```text
largeGlyphActor.setVisible(...)
```

To są drobne seams.

---

# 18. Jeszcze jedno sprzężenie nazewnicze

Scenario nadal mówi:

```text
locomotion.boundary = 'GLYPH_RING'
```

a `spatial.ringRadius = 7.6`.

Jeżeli Large Glyph zaczyna mieć `8.5`, to `GLYPH_RING` przestaje być dosłownie ringiem Large Glyph.

Nie musimy od razu robić masowego rename, ale od tej chwili trzeba traktować:

```text
7.6
```

jako:

**inner world / player boundary / spherical-layer base R**

a nie Large Glyph radius.

To powinno zostać jasno zapisane w dokumentacji.

---

# 19. Dokumentacja już teraz ma rozjazd po ostatnim Codexie

Po merge #554:

* `VR_PROTO_ASTRO_MODEL` w jednym miejscu mówi Large Glyph **IMPLEMENTED**;
* niżej w `IMPLEMENTED VS APPROVED FUTURE` nadal mówi, że Large Glyph jest **NOT IMPLEMENTED**.
* `VR_SCENARIO_DIRECTOR_MODEL` opisuje capabilities Large Glyph jako obecne, ale sekcja `APPROVED / NOT IMPLEMENTED` nadal twierdzi, że real Large Glyph band jest future.

Czyli ostatnia synchronizacja Codexa jest wewnętrznie niespójna.

Przy przebudowie aktora trzeba to wyczyścić.

---

# Docelowy obraz

Chciałbym po tej migracji mieć:

```text
                    Scenario
                       │
                       ▼
                 RuntimeExperience
                       │
                       ▼
               LargeGlyphActor
                       │
        ┌──────────────┼──────────────┐
        │              │              │
   visual nodes    spatial stages   slot ownership
        │              │              │
        │       RING_INITIAL           │
        │       RING_ELEVATED          │
        │       RING_EXPANDED          │
        │       SPHERE_FAR             │
        │                             │
        ├─────────┐             ┌─────┘
        ▼         ▼             ▼
 GlyphInteraction Lights   LargeGlyphAttractor
```

I jeden spatial runtime:

```text
stable state:
    rotate RotationRoot

transition:
    interpolate five slot transforms

pull:
    animate one detached glyph

return:
    animate one glyph to moving Slot

stable:
    attach back
```

To jest architektura, na której spokojnie możemy budować dalsze akty.

### Najważniejsze rzeczy do ustalenia przed promptem implementacyjnym

Mamy tylko dwa realne parametry przestrzenne, które mają konsekwencje dla reszty świata:

* **`RING_EXPANDED = 18.5 m`** zgodnie z literalnym `+10 m` oznacza świadome wejście dużych glifów w Small Glyph volume `17.1–24.7`.
* Dla ostatniego etapu rekomenduję **około `68.5 m`**, czyli kolejne `+50 m`, a nie promień `50 m`, bo 50 m przecina reserved `HIDDEN_GLYPHS`.

Reszta układa się już bardzo czysto.
