# Experience VR — współśrodkowe sferyczne płaszcze objętościowe

## Status i definicja

**CURRENT / BINDING.** Płaszcz sferyczny jest objętością pomiędzy dwiema współśrodkowymi sferami, a nie orbitą, pierścieniem ani pasem równikowym. Wszystkie warstwy mają canonical center `(0, 0, 0)`, wspólny ze środkiem obrotu platformy. Dla środka obiektu zachodzi `innerRadius <= length(position) <= outerRadius`.

## Registry i zakresy

Jedynym bazowym promieniem jest effective radius istniejącego glyph ring (`R = 7.6 m`). Ustawienia przechowują osobną dodatnią, skończoną `thickness` każdej warstwy. Resolver kumuluje grubości; pary promieni nie są zapisywane ręcznie.

| layer id | thickness | range przy R=7.6 | status |
| --- | ---: | ---: | --- |
| `SHELLS` | 7.6 m | 7.6–15.2 m | IMPLEMENTED |
| `SMALL_GLYPHS` | 7.6 m | 15.2–22.8 m | IMPLEMENTED |
| `RUNE_STONES` | 7.6 m | 22.8–30.4 m | RESERVED / NOT IMPLEMENTED |
| `STARS` | 7.6 m | 30.4–38.0 m | RESERVED / NOT IMPLEMENTED |
| `HIDDEN_GLYPHS` | 7.6 m | 38.0–45.6 m | RESERVED / NOT IMPLEMENTED |

Reserved oznacza wyłącznie kontrakt przestrzenny. Nie powstają dla tych warstw runtime Object3D, content, count, renderer, interaction, band ani Scenario point.

## Deterministyczne sloty objętościowe

`createVrSphericalLayerActor` wyznacza kierunki na pełnym `4π` przez Fibonacci sphere: `goldenAngle = PI * (3 - sqrt(5))`, `y = 1 - 2(i + 0.5)/N`, a azymut przez `goldenAngle*i + stable phase`. Stable FNV-1a hash jawnego layer id daje fazę oraz stałą orientację pola. Nie występuje `Math.random()`.

Głębokość jest zdekorrelowana od polarnego indeksu przez low-discrepancy golden-ratio sequence z osobną stable phase. Promień ma rozkład objętościowy `cbrt(inner³ + u(outer³-inner³))`, więc sloty nie leżą na jednej powierzchni.

Dla visual bounds actor przyjmuje radial clearance równy promieniowi bounding sphere: efektywny zakres środka to `[inner + clearance, outer - clearance]`. Gdy nie ma dodatniego zakresu, inicjalizacja kończy się błędem zawierającym layer, clearance i thickness; asset nie jest skalowany ani przenoszony.

## Ownership i ruch

`Scenario → Runtime effect → ShellSystem / SmallGlyphSystem → SphericalLayerActor → physical field transform`. Domain actors nadal posiadają stany, audio, handoff, Furnace, placement i progression facts. Director i Scenario nie znają promieni, Fibonacci ani slotów.

Actor root należy bezpośrednio do `WorldStableRoot`. `VrTiltableFloorRoot` i passenger/player obracają się niezależnie wokół tego samego centrum. Nie ma horizon compensation. Opcjonalny ruch obraca quaternionem cały field jako rigid body, zachowując długość każdego wektora. Shell field używa kierunku `+1`, Small Glyph field `-1`; self rotation pozostaje właściwością obiektu.

Field-owned Shell i Small Glyph dostają stale przypisany slot. Materialization Small Glyph odbywa się w finalnym slocie. Return interpoluje do transformu canonical slotu odczytywanego w każdym frame, dlatego podąża za rigid field zamiast za martwym snapshotem. `HELD`, `PLACED`, `CAPTURE_READY`, transport i Furnace pozostają poza ownership aktora warstwy. Reset i hydration wracają do tej samej baseline orientation i tych samych slotów.

## Open spatial integration

**OPEN SPATIAL INTEGRATION:** obecny Large Glyph radius `3.3R = 25.08 m` przecina reserved Rune Stones layer `3R→4R = 22.8–30.4 m`. Konflikt wymaga osobnej decyzji przed implementacją Rune Stones. Ten fix nie przesuwa Large Glyph, nie zmienia warstwy Rune Stones i nie dodaje exclusion volume.
