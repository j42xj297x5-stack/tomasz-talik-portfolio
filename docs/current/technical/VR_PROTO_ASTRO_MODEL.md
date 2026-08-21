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

To API jest gotowym seamem domenowym; rzeczywiste `LARGE_GLYPHS` targeting/pull jest **APPROVED / NOT IMPLEMENTED**.

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

**IMPLEMENTED:** `4.40` posiada prawa do Astro, shells, B switching, small-glyph scan/target/pull, Furnace, natural essence extraction oraz istniejącej kontroli Asteriona/platformy. `stateAt(4.20)` zawiera ukończony Tier 2; `stateAt(4.30)` dodatkowo `p2World.mainGlyphsRadial = true`; `stateAt(4.40)` dodatkowo `smallGlyphField.materialized = true`.

Obecne `stateAt(4.40)` nie deklaruje `protoAstroTuning.extractedFamilyCodes`. Direct activation materializuje canonical P2 world i uruchamia TuningController z pustym zestawem — to prawidłowy kontrakt. Hydrator zna owner section `protoAstroTuning` dla przyszłych authored states.

## 11. ASTRO BANDS

| Status | Bands |
| --- | --- |
| **IMPLEMENTED** | `SHELLS`, `SMALL_GLYPHS` |
| **APPROVED / NOT IMPLEMENTED** | `LARGE_GLYPHS`, `RUNESTONES` |

Semantic input `B` przełącza wyłącznie aktualnie dostępne bands; obecny HandModeController ma dokładnie dwa implemented bands. Nie ustalono finalnej kolejności cyklu po przyszłych unlockach. Identity bandu jest semantyczne, nie `RED/YELLOW/GREEN/BLUE/ULTRAVIOLET`. Dokładne kolory i symbole pozostają otwarte; przyszły kolor bandu ma być spójny między beam/scan cone i Panelem 2, ale nie wynika automatycznie z fuel family color.

## 12. FOUR-PANEL TARGET CONTRACT

Astrolabium fizycznie ma cztery authored panels.

| Panel | Approved target semantics | Status |
| --- | --- | --- |
| 1 | aktualny target; docelowo właściwy Proto-Astro SVG | istniejący panel system i shell glyph projection **IMPLEMENTED**; uniwersalna projekcja target classes nieukończona |
| 2 | current band: symbol + kolor zgodny z beam/scan cone | **APPROVED / NOT IMPLEMENTED** |
| 3 | dostępne targety current band, `2×3`, maks. 6 Proto-Astro SVG, filtrowane przez domain truth | **APPROVED / NOT IMPLEMENTED** |
| 4 | miernik odległości do current target | **APPROVED / NOT IMPLEMENTED** |

Rodzina symboli bandów i dokładne kolory nie są jeszcze zaprojektowane. Panel 3 dla przyszłego `LARGE_GLYPHS` ma pokazywać wyłącznie rodziny z pobraną esencją.

## 13. VI / ETER

**IMPLEMENTED:** VI jest pełnym small glyphem: jest widoczny, targetowalny, przyciągalny, możliwy do przejęcia i pozostawienia na platformie. Nie daje esencji i nie odblokowuje large glyph.

**RESERVED / NOT YET DESIGNED:** VI/Eter wraz z odpowiadającą rodziną poziomu 6 skorup dla końcowego etapu Haiku Cosmos. Recipe, placement i final flow nie są authored.

## 14. IMPLEMENTED VS APPROVED FUTURE

- **IMPLEMENTED:** identity/resolvers, field i transport, `SHELLS`/`SMALL_GLYPHS`, B, natural essence extraction, persistent family tuning truth i `canAttractLargeGlyph` API.
- **APPROVED / NOT IMPLEMENTED:** `LARGE_GLYPHS`, family-gated real large targeting/pull, `RUNESTONES`, pełna semantyka paneli 1–4 i placement VI.
- **RESERVED / NOT YET DESIGNED:** VI/Eter finale z level-6 shell family.

## 15. QA STATUS

Istniejące potwierdzenie `bootstrap READY` ma status **HARDWARE VALIDATED — Meta Quest 3S** wyłącznie w dotychczas potwierdzonym zakresie. `4.20`, `4.30`, `4.40`, field, B switching, pull/handoff i Furnace extraction nie uzyskują w tej synchronizacji hardware/perceptual PASS.
