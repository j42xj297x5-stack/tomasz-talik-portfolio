# Experience VR — współśrodkowe sferyczne płaszcze objętościowe

## Status i definicja

**CURRENT / BINDING.** Płaszcz sferyczny jest objętością pomiędzy dwiema współśrodkowymi sferami, a nie orbitą, pierścieniem ani pasem równikowym. Wszystkie warstwy mają canonical center `(0, 0, 0)`, wspólny ze środkiem obrotu platformy. Dla środka obiektu zachodzi `innerRadius <= length(position) <= outerRadius`.

## Registry i zakresy

Promień platformy pozostaje jawny jako `worldBaseRadius = 7.6 m`, a niezależny początek registry warstw to `sphericalLayers.innerRadius = 13 m`. Ustawienia rozdzielają dodatnią, skończoną `thickness` warstwy oraz nieujemny `gapAfter`, czyli pustą przestrzeń radialną przed następną warstwą. Opcjonalny `gapAfterMultiplier` warstwy wyznacza gap względem `innerRadius`. Gap nie należy do żadnej warstwy, nie ma Object3D, aktora, contentu ani Astro bandu. Resolver kumuluje `thickness + gapAfter`; pary promieni pozostają wynikiem istniejącego kontraktu registry.

| layer id | thickness | world-space range | gap after | status |
| --- | ---: | ---: | ---: | --- |
| `SHELLS` | 12 m | 13–25 m | 5 m | IMPLEMENTED |
| `SMALL_GLYPHS` | 15 m | 30–45 m | 5 m | IMPLEMENTED |
| `RUNE_STONES` | 25 m | 50–75 m | 10 m | RESERVED / NOT IMPLEMENTED |
| `STARS` | 45 m | 85–130 m | 3.25 m | RESERVED / NOT IMPLEMENTED |
| `HIDDEN_GLYPHS` | 7.6 m | 133.25–140.85 m | 0 m | RESERVED / NOT IMPLEMENTED |

Reserved oznacza wyłącznie kontrakt przestrzenny. Nie powstają dla tych warstw runtime Object3D, content, count, renderer, interaction, band ani Scenario point.

## Deterministyczne sloty objętościowe

`createVrSphericalLayerActor` wyznacza kierunki na pełnym `4π` przez Fibonacci sphere: `goldenAngle = PI * (3 - sqrt(5))`, `y = 1 - 2(i + 0.5)/N`, a azymut przez `goldenAngle*i + stable phase`. Stable FNV-1a hash jawnego layer id daje fazę oraz stałą orientację pola. Nie występuje `Math.random()`.

Głębokość jest zdekorrelowana od polarnego indeksu przez low-discrepancy golden-ratio sequence z osobną stable phase. Promień ma rozkład objętościowy `cbrt(inner³ + u(outer³-inner³))`, więc sloty nie leżą na jednej powierzchni.

Dla visual bounds actor przyjmuje radial clearance równy promieniowi bounding sphere: efektywny zakres środka to `[inner + clearance, outer - clearance]`. Każda instancja Shell lokalnie przesuwa swój visual o ujemny wyliczony `boundingCenter`, dlatego środek bounding sphere pokrywa się z originem wrappera i slotu, a clearance pozostaje samym `boundingRadius` względem tego samego originu. Gdy nie ma dodatniego zakresu, inicjalizacja kończy się błędem zawierającym layer, clearance i thickness; asset nie jest skalowany ani przenoszony.

## Ownership i ruch

`Scenario → Runtime effect → ShellSystem / SmallGlyphSystem → SphericalLayerActor → physical field transform`. Domain actors nadal posiadają stany, audio, handoff, Furnace, placement i progression facts. Director i Scenario nie znają promieni, Fibonacci ani slotów.

Actor root należy bezpośrednio do `WorldStableRoot`. `VrTiltableFloorRoot` i passenger/player obracają się niezależnie wokół tego samego centrum. Nie ma horizon compensation. Opcjonalny ruch obraca quaternionem cały field jako rigid body, zachowując długość każdego wektora. Deterministyczna oś pochodząca z layer id ma canonical orientation: pierwsza niezerowa składowa w kolejności `x`, `y`, `z` jest dodatnia. Dopiero względem tej stabilnie zorientowanej osi actor stosuje nieujemne `angularSpeed` oraz semantyczny znak `direction`. Shell field używa kierunku `+1`, Small Glyph field `-1`; self rotation pozostaje właściwością obiektu.

Field-owned Shell i Small Glyph dostają stale przypisany slot. Materialization Small Glyph odbywa się w finalnym slocie. Return interpoluje do transformu canonical slotu odczytywanego w każdym frame, dlatego podąża za rigid field zamiast za martwym snapshotem. `HELD`, `PLACED`, `CAPTURE_READY`, transport i Furnace pozostają poza ownership aktora warstwy. Reset i hydration wracają do tej samej baseline orientation i tych samych slotów.

## Large Glyph spatial integration

Large Glyph nie należy do `VR_SPHERICAL_LAYER_IDS` ani do spherical layer registry. Actor zachowuje pierścieniowe stadia `RING_INITIAL = 8.5 m` i `RING_EXPANDED = 46 m`. Po ukończeniu trzeciego kręgu istniejący event `TIER_COMPLETED` przełącza actor na `SPHERE_FAR = 80 m`: pięć stabilnych kierunków o dodatnich i ujemnych wysokościach daje deterministyczny, niewspółpłaszczyznowy układ pełnej sfery.
