# Experience VR — współśrodkowe sferyczne płaszcze objętościowe

## Status i definicja

**CURRENT / BINDING.** Płaszcz sferyczny jest objętością pomiędzy dwiema współśrodkowymi sferami, a nie orbitą, pierścieniem ani pasem równikowym. Wszystkie warstwy mają canonical center `(0, 0, 0)`, wspólny ze środkiem obrotu platformy. Dla środka obiektu zachodzi `innerRadius <= length(position) <= outerRadius`.

## Registry i zakresy

Jedynym bazowym promieniem world/platform jest jawne `worldBaseRadius = 7.6 m`. Ustawienia rozdzielają dwa niezależne pojęcia: dodatnią, skończoną `thickness` warstwy oraz nieujemny `gapAfter`, czyli pustą przestrzeń radialną przed następną warstwą. Domyślny gap wynosi `0.25R`; opcjonalny `gapAfterMultiplier` warstwy może go nadpisać. Gap nie należy do żadnej warstwy, nie ma Object3D, aktora, contentu ani Astro bandu. Resolver kumuluje `thickness + gapAfter`; pary promieni nie są zapisywane ręcznie.

| layer id | thickness | range przy R=7.6 | gap after | status |
| --- | ---: | ---: | ---: | --- |
| `SHELLS` | 7.6 m | 7.6–15.2 m | 1.9 m | IMPLEMENTED |
| `SMALL_GLYPHS` | 7.6 m | 17.1–24.7 m | 1.9 m | IMPLEMENTED |
| `RUNE_STONES` | 7.6 m | 26.6–34.2 m | 1.9 m | RESERVED / NOT IMPLEMENTED |
| `STARS` | 7.6 m | 36.1–43.7 m | 1.9 m | RESERVED / NOT IMPLEMENTED |
| `HIDDEN_GLYPHS` | 7.6 m | 45.6–53.2 m | 0 m | RESERVED / NOT IMPLEMENTED |

Reserved oznacza wyłącznie kontrakt przestrzenny. Nie powstają dla tych warstw runtime Object3D, content, count, renderer, interaction, band ani Scenario point.

## Deterministyczne sloty objętościowe

`createVrSphericalLayerActor` wyznacza kierunki na pełnym `4π` przez Fibonacci sphere: `goldenAngle = PI * (3 - sqrt(5))`, `y = 1 - 2(i + 0.5)/N`, a azymut przez `goldenAngle*i + stable phase`. Stable FNV-1a hash jawnego layer id daje fazę oraz stałą orientację pola. Nie występuje `Math.random()`.

Głębokość jest zdekorrelowana od polarnego indeksu przez low-discrepancy golden-ratio sequence z osobną stable phase. Promień ma rozkład objętościowy `cbrt(inner³ + u(outer³-inner³))`, więc sloty nie leżą na jednej powierzchni.

Dla visual bounds actor przyjmuje radial clearance równy promieniowi bounding sphere: efektywny zakres środka to `[inner + clearance, outer - clearance]`. Gdy nie ma dodatniego zakresu, inicjalizacja kończy się błędem zawierającym layer, clearance i thickness; asset nie jest skalowany ani przenoszony.

## Ownership i ruch

`Scenario → Runtime effect → ShellSystem / SmallGlyphSystem → SphericalLayerActor → physical field transform`. Domain actors nadal posiadają stany, audio, handoff, Furnace, placement i progression facts. Director i Scenario nie znają promieni, Fibonacci ani slotów.

Actor root należy bezpośrednio do `WorldStableRoot`. `VrTiltableFloorRoot` i passenger/player obracają się niezależnie wokół tego samego centrum. Nie ma horizon compensation. Opcjonalny ruch obraca quaternionem cały field jako rigid body, zachowując długość każdego wektora. Shell field używa kierunku `+1`, Small Glyph field `-1`; self rotation pozostaje właściwością obiektu.

Field-owned Shell i Small Glyph dostają stale przypisany slot. Materialization Small Glyph odbywa się w finalnym slocie. Return interpoluje do transformu canonical slotu odczytywanego w każdym frame, dlatego podąża za rigid field zamiast za martwym snapshotem. `HELD`, `PLACED`, `CAPTURE_READY`, transport i Furnace pozostają poza ownership aktora warstwy. Reset i hydration wracają do tej samej baseline orientation i tych samych slotów.

## Large Glyph spatial integration

Large Glyph nie należy do `VR_SPHERICAL_LAYER_IDS` ani do spherical layer registry. Jego actor-owned stage `RING_EXPANDED` ma promień `18.5 m` i świadomie przecina volume `SMALL_GLYPHS` (`17.1–24.7 m`). Ten overlap jest **ACCEPTED PRODUCT DECISION**: nie jest bugiem ani gapem do naprawienia i nie zmienia registry ani żadnego z powyższych ranges.
