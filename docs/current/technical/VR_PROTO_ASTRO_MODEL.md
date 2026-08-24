# Experience VR — Proto-Astro Model

## 1. STATUS / AUTHORITY

Status: **CURRENT / BINDING** dla identity, tuningu, Astro bands i styku small glyph ↔ Furnace. Bieżący kod rozstrzyga stan implementacji. Model runtime pozostaje w [`VR_RUNTIME_MODEL.md`](VR_RUNTIME_MODEL.md), a authored prawa i beaty w [`VR_SCENARIO_DIRECTOR_MODEL.md`](VR_SCENARIO_DIRECTOR_MODEL.md).

## 2. OWNERSHIP

| Owner | Kontrakt |
| --- | --- |
| `protoAstroRegistry` | jedyny słownik języka Proto-Astro |
| `resolveVrSmallGlyphProtoAstro` | adapter runtime small-glyph identity → język |
| `resolveVrPageProtoAstro` | adapter page/large-glyph identity → język; dokument nie tworzy drugiego mappingu |
| `createVrProtoAstroTuningController` | **jedyny owner** pobranych naturalnych family essences |
| `createVrSmallGlyphSystem` | authored field geometry i canonical field transforms |
| `createVrSmallGlyphAttractorInteraction` | transient transport interaction |
| `createVrAstroFurnaceContentInteraction` | jeden physical chamber/content owner dla `SHELL` i `SMALL_GLYPH` |
| przyszły `RuneRecipeInteraction` | osobny, rune-mode-only owner dwóch typed slots; nie zastępuje istniejącego content ownera |
| przyszły `RuneStoneProgressionController` | jedyny owner tuned/installed rune families; czyta eligibility z progresji sektorów |
| Scenario | capabilities i authored world beats |
| `HandModeController` | transient wybrane Astro band |
| Attractor tool / panels | presentation i projection |

Nie istnieje centralny global gameplay store.

## 3. PROTO-ASTRO LANGUAGE

Registry rozróżnia `familyCode`, `familyId`, formę i glyph code. Naturalne rodziny to `K/T/S/L/R`; `V` zachowuje maszynowe `familyId: astro`. Produktowe „Eter” nie jest nowym `familyId`.

## 4. SMALL GLYPH IDENTITY

| Asset | Glyph | Family | Znaczenie |
| --- | --- | --- | --- |
| `small-glyph-relic-1` | SI | S / water | Haiku Cosmos |
| `small-glyph-relic-2` | KI | K / earth | Ethics / Life Protection |
| `small-glyph-relic-3` | TI | T / metal | DIG Engine / spotify-digger |
| `small-glyph-relic-4` | RI | R / fire | Creative AI |
| `small-glyph-relic-5` | LI | L / tree | AI Guide |
| `small-glyph-relic-6` | VI | V / astro | produktowo: Eter |

Asset number nie jest gameplay family poza canonical resolverem.

## 5. LARGE GLYPH IDENTITY

**IMPLEMENTED:** `resolveVrPageProtoAstro` jest wyłącznym adapterem page/large-glyph identity do registry. Kanoniczne naturalne formy A to `KA`, `TA`, `SA`, `LA`, `RA`. Nie utrzymujemy równoległej tabeli page IDs.

## 6. I ↔ A COMPATIBILITY

**IMPLEMENTED invariant:** small form `I` stroi large form `A` wtedy i tylko wtedy, gdy oba mają identyczny naturalny `familyCode`: `KI↔KA`, `TI↔TA`, `SI↔SA`, `LI↔LA`, `RI↔RA`. `VI` nie jest P2 tunable.

## 7. TUNING CONTROLLER

**IMPLEMENTED:** persistent runtime-domain truth `extractedFamilyCodes` należy wyłącznie do `ProtoAstroTuningController` i może zawierać tylko `K/T/S/L/R`, nigdy `V`. Jedną rodzinę można commitować raz. `canAttractLargeGlyph(largeGlyphIdentity)` zwraca `true` dla zgodnej naturalnej formy A po pobraniu jej esencji.

Panel Astro Pieca rozdziela jednorazowy lifecycle `production → EARNED` od trwałej funkcji strojenia. Po `EARNED` karta Astrolabium prowadzi do panelu `STROJENIE ASTROLABIUM`, którego obszar `MAŁE GLIFY` przedstawia sześć family cards z canonical SVG i wygenerowanym offline wireframe rzeczywistych GLB. Pod kartami dynamiczny monitor extraction obraca projekcję 3D topologii aktualnie włożonego Small Glyph; podczas właściwej fazy `EXTRACTION` kontur zanika według istniejącego Furnace `extractionProgress`. Dla `K/T/S/L/R` panel projektuje istniejący stan extraction z TuningControllera oraz bieżący stan procesu z content ownera; nie kopiuje żadnego z tych stanów. `VI` ma pełną identity, SVG i geometry preview, lecz pozostaje nieaktywny względem extraction, którego gameplay nie jest authored.

**IMPLEMENTED:** rzeczywisty band `LARGE_GLYPHS` używa tego API jako jedynego family gate dla targetingu i pull.

## 8. SMALL GLYPH FIELD + TRANSPORT

**IMPLEMENTED:** sześć wariantów × dwie instancje = 12 obiektów; deterministic spatial distribution, world-stable field, presentation materialization oraz hydration do stabilnego `MATERIALIZED`.

```text
FIELD → TARGETING → PULLING → CAPTURE_READY → HELD → PLACED → HELD
```

Right Astro: chwyt skanuje/namierza, spust przyciąga. Left ordinary ray/Szpila + left squeeze przekazuje obiekt do `holdSocket`. Świadomy release tworzy world-stable `PLACED`, który lewituje względem zapamiętanego transformu i może zostać ponownie przejęty Szpilą. Anulowany pull, capability loss, transfer do Furnace oraz reset nie tworzą `PLACED`; przywracają canonical field zgodnie z kontraktem.

## 9. FURNACE ESSENCE EXTRACTION

**IMPLEMENTED:** jeden chamber/content owner obsługuje dwa content kinds:

- `floor_gyroscope_sphere` + `SHELL` → Asterion shell extraction;
- `astro_attractor` + naturalny `SMALL_GLYPH` → `SMALL_GLYPH_ESSENCE_EXTRACTION`.

Naturalne `K/T/S/L/R` jest valid tylko przed pobraniem danej rodziny. `VI` jest invalid input w P2. Po completion family code trafia do TuningController, a ta sama fizyczna instancja wraca do field. Nie powstaje inventory i asset nie jest persistent consumed. Druga instancja rodziny pozostaje fizycznie dostępna, lecz ponowna ekstrakcja rodziny jest odrzucana.

## 10. SCENARIO / CAPABILITIES / HYDRATION

**IMPLEMENTED:** `4.40` posiada prawa do Astro, shells, B switching, small- i large-glyph scan/target/pull, Furnace, natural essence extraction oraz istniejącej kontroli Asteriona/platformy. `stateAt(4.20)` zawiera ukończony Tier 2 i `largeGlyphs.stage = RING_ELEVATED`; `stateAt(4.30)` dodatkowo `largeGlyphs.stage = RING_EXPANDED`; `stateAt(4.40)` dodatkowo `smallGlyphField.materialized = true`.

Obecne `stateAt(4.40)` nie deklaruje `protoAstroTuning.extractedFamilyCodes`. Direct activation materializuje canonical P2 world i uruchamia TuningController z pustym zestawem — to prawidłowy kontrakt. Hydrator zna owner section `protoAstroTuning` dla przyszłych authored states.

## 11. ASTRO BANDS

| Status | Bands |
| --- | --- |
| **IMPLEMENTED** | `SHELLS`, `SMALL_GLYPHS`, family-gated `LARGE_GLYPHS` |
| **APPROVED / NOT IMPLEMENTED** | `RUNESTONES` |

Semantic input `B` cyklicznie przełącza aktualnie dostępne bands. `LARGE_GLYPHS` dołącza po prawie Scenario i pierwszej naturalnej esencji; wcześniej cykl zachowuje dwa bandy. Nie ustalono finalnej kolejności cyklu po przyszłych unlockach. Identity bandu jest semantyczne, nie `RED/YELLOW/GREEN/BLUE/ULTRAVIOLET`. Dokładne kolory i symbole pozostają otwarte; przyszły kolor bandu ma być spójny między beam/scan cone i Panelem 2, ale nie wynika automatycznie z fuel family color.

Przyszły `RUNESTONES` dołącza dopiero po pierwszym rune-tuning commicie i widzi wyłącznie rodziny zapisane jako tuned przez osobnego rune progression ownera. Kompletność sektora daje eligibility do strojenia, ale sama nie daje targetu. Receptura, dwa sloty Pieca, transport i instalacja należą do [`VR_RUNE_STONES_MODEL.md`](VR_RUNE_STONES_MODEL.md).

## 12. FOUR-PANEL TARGET CONTRACT

Astrolabium fizycznie ma cztery authored panels.

| Panel | Approved target semantics | Status |
| --- | --- | --- |
| 1 | aktualny target: Shell → O SVG; Small Glyph → I SVG; Large Glyph → A SVG | wspólny panel system i canonical Proto-Astro projection **IMPLEMENTED** |
| 2 | current band: symbol + kolor zgodny z beam/scan cone | **APPROVED / NOT IMPLEMENTED** |
| 3 | dostępne targety current band, `2×3`, maks. 6 Proto-Astro SVG, filtrowane przez domain truth | **APPROVED / NOT IMPLEMENTED** |
| 4 | miernik odległości do current target | **APPROVED / NOT IMPLEMENTED** |

Rodzina symboli bandów i dokładne kolory nie są jeszcze zaprojektowane. Przyszły Panel 3 dla bandu `LARGE_GLYPHS` ma pokazywać wyłącznie rodziny z pobraną esencją.

## 13. VI / ETER

**IMPLEMENTED:** VI jest pełnym small glyphem: jest widoczny, targetowalny, przyciągalny, możliwy do przejęcia i pozostawienia na platformie. Nie daje esencji i nie odblokowuje large glyph.

**APPROVED / NOT IMPLEMENTED:** VI/Eter jest specjalnym Rune Stone finalnego kryzysu nad Małpą, a nie naturalną rodziną ani szóstą parą sektorową. Nie ma standardowego vessel/socketu, nie jest targetem `RUNESTONES` i nie trafia do Pieca. Jego authored intervention nadaje u `RuneStoneProgressionController` wyłącznie Water eligibility override; normalna receptura Water nadal wymaga Small Glyph Metal + Shell Water.

## 14. IMPLEMENTED VS APPROVED FUTURE

- **IMPLEMENTED:** identity/resolvers, field i transport, `SHELLS`/`SMALL_GLYPHS`/`LARGE_GLYPHS`, B, natural essence extraction, persistent family tuning truth, `canAttractLargeGlyph`, family-gated real Large Glyph targeting oraz actor-owned transient pull/return. Panel 1 projektuje canonical Large Glyph target.
- **APPROVED / NOT IMPLEMENTED:** `RUNESTONES`, Panele 2–4 i placement VI. Spatial stage Large Glyph `SPHERE_FAR` jest **IMPLEMENTED** i nie implementuje przyszłego gameplayu Runic Stones.
- **APPROVED / NOT IMPLEMENTED:** specjalny VI/Eter finale, Water-only knowledge override, piąty Water Rune i finalny timed Water hunt; bez level-6 sector family.

## 15. QA STATUS

**HARDWARE VALIDATED — Meta Quest 3S:** Wizjoner potwierdził wyłącznie zmigrowany Large Glyph flow M1–M7A. Nie rozszerza to walidacji na Small Glyph Furnace extraction, całe P2, Panele 2–4, wszystkie audio paths ani przyszłe features.


## Spherical field ownership

Natural Small Glyph `FIELD` positions belong to the world-stable `SMALL_GLYPHS` spherical volume described in [`VR_SPHERICAL_LAYERS_MODEL.md`](VR_SPHERICAL_LAYERS_MODEL.md), not to per-object tilted orbits. Materialization and recovery use the same deterministic moving slots; pull, handoff, placement and Furnace remain owned by the existing domain actors.

## Current P2 completion contract (4.40–4.80)

The implemented canonical boundary is `4.80`. Point `4.40` owns a dedicated observation window; `4.50` exposes Monkey attention only; `4.60` plays the mandatory P2 message; `4.70` grants the existing B, Small Glyph, Furnace essence, family-gated Large Glyph, crystal, Reliquary and order-3 card rights; five order-3 cards complete into stable point `4.80`.

Mandatory Monkey communication uses one guidance contract: attention arcs never start copy; pointing and triggering Monkey consumes the trigger for the mandatory beat; ordinary menu, history and knowledge stay hidden through attention and playback; the menu returns only after the final automatic block. This contract is active for the post-ring message at `3.30` and P2 at `4.50–4.60`.

Stable reconstruction at `4.80` contains completed Tier 3, all page IDs/orders through 3, progress-floor completion through Tier 3, consumed crystal Tier 3, and Proto-Astro natural essences `K/T/S/L/R`. It reconstructs no transient pulls, held objects, timers or panels. P3 and later mechanics are not implemented.

## Future Rune Stone Act boundary — approved, not implemented

Po `4.80` istniejący `ProtoAstroTuningController` nadal posiada wyłącznie naturalne essences `K/T/S/L/R` dla pięciu już zestrojonych Large Glyph. Nie wolno rozszerzać go o trwałe rune tuning/installation facts. Rune recipe konsumuje oba fizyczne składniki i rozwiązuje asset identity przez canonical Proto-Astro resolvery, ale zapisuje semantyczną sylabę jako `tunedRuneFamilies` oraz instalacje u osobnego przyszłego domain ownera; nie tworzy fizycznego itemu „sylaba”. Po Tier 3 sector-completeness daje dokładnie Earth / Fire / Wood jako eligible; późny Water-only override jest jedynym finalnym wyjątkiem i nie tworzy drugiej hardcoded listy rodzin.
