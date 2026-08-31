# Experience VR — kanoniczny model Rezonatora Asterionowego

## 1. Status i authority

Status: **CURRENT TARGET / PARTIALLY IMPLEMENTED**.

Runtime R2A implements powered-sector acquisition and transient `SECTOR LOCK`; R2B implements controller-driven EARTH/WOOD/FIRE motion and committed `0/1/2/3` detents. R4 implements the event-driven Resonator Field Actor: derived `resonatorExists`, immutable runtime `α/β/γ` descriptor, POWERED/FIELD-ACTIVE and partial/full/symmetric/asymmetric coarse-field semantics with bounded read-only queries and exactly-on-change subscriptions.

Target selection/scoring and response, field/lensing presentation, grip beam, field audio and METAL/WATER contribution remain not implemented.

Ten dokument jest nadrzędnym aktualnym technicznym modelem Rezonatora Asterionowego. Zamraża granice sandboxu, Scenario, Guidance, Zworników Runicznych, lokalnego sterowania sektorami i odpowiedzi Rezonatora. Wyspecjalizowany [`VR_ASTERION_RESONATOR_FIELD_MODEL.md`](VR_ASTERION_RESONATOR_FIELD_MODEL.md) jest jego podporządkowanym CURRENT sub-modelem pola; nie stanowi alternatywnego kanonu. Dokumenty nie definiują finalnego API ani nazw nowych aktorów sector-control.

Model koncepcyjny przebiegu pozostaje w [`EXPERIENCE_VR_RUNES_RESONATOR_FINALE.md`](../concept/EXPERIENCE_VR_RUNES_RESONATOR_FINALE.md). Model Rune Stones posiada tuning, transport, instalację i persistent Rune truth. Model progress floor posiada panel/sector completeness i globalny transform platformy. Ten dokument posiada techniczny kontrakt współpracy zasilonych sektorów i Rezonatora.

## 2. Reguła nadrzędna: sandbox nie jest bramką Scenario

Fizyczna mechanika jest legalna, gdy gracz ma wymagane narzędzie, właściwy obiekt świata istnieje i spełnione są domenowe warunki mechaniki. Brak wcześniejszego objaśnienia dramaturgicznego nie blokuje działania.

Nie wolno uzależniać Rune tuning, Rune pull, Rune installation, sector control ani powstania Rezonatora od prawa w rodzaju `currentPoint >= X`.

Scenario posiada:

- dramaturgię i obowiązkowe beaty progresji;
- kolejność ujawnianej wiedzy;
- Guidance, hinty i treść Panelu Y;
- ograniczenia pozyskania kolejnych kryształów.

Scenario nie posiada fizycznej dostępności wymienionych mechanik. Domain owners posiadają ich truth i legalność, a Scenario może obserwować już osiągnięty rezultat i odpowiednio pominąć albo zmienić późniejszy beat.

## 3. Sandboxowa progresja i wiedza

Gracz może przed planowanym beatem stroić dostępne rodziny, przyciągać legalne obiekty, zbierać dostępne skorupy, instalować Rune Stones przy istniejących właściwych Zwornikach, sterować aktywnymi sektorami i utworzyć Rezonator.

Nie daje to prawa do ominięcia kanonicznej progresji kryształów. Pozyskanie kolejnego kryształu pozostaje ograniczone właściwym etapem progresji, niezależnie od wcześniejszej sprawności gracza w sandboxie.

Panel Y i Guidance ujawniają wiedzę według Scenario oraz wiedzy już zdobytej przez gracza. Fizyczna dostępność nie publikuje automatycznie instrukcji. Jeżeli obserwowalny stan dowodzi, że gracz sam odkrył mechanikę, odpowiadający jej hint nie jest obowiązkowy i nie może wymuszać ponownego odkrycia.

## 4. Zwornik Runiczny

**Zwornik Runiczny** jest nazwą narracyjną. Techniczny asset może pozostać `bridge.glb`, a istniejące nazwy runtime mogą pozostać historycznym szczegółem implementacji.

Źródłem materializacji Zwornika jest ukończenie wszystkich paneli odpowiadającego sektora:

```text
sector complete → runtime HIDDEN → DOCKED → trwały Zwornik Runiczny
future presentation observes transition → RUNE_BINDER_REVEAL
```

Zwornik nie materializuje się podczas instalowania kamienia. EARTH, WOOD i FIRE mogą dlatego istnieć przed ukończeniem pełnego trzeciego kręgu. Po reveal pozostaje trwałym elementem sektora i miejscem późniejszego związania właściwego Rune Stone.

Obrót lub spin Zwornika nie należy do target canon. Historyczne `ORBITING` zostało usunięte; settled installed state to `BOUND`. Live successful page commit synchronizuje readiness i materializuje Zwornik w `DOCKED`, gdzie pozostaje niezależnie od późniejszej instalacji.

### Niezależność prezentacji i kotwicy

Transformacja prezentacyjna geometrii Zwornika i finalna kotwica instalacji Rune Stone są niezależne. Skala, radialne odsunięcie albo inna korekta prezentacji Zwornika nie może przesuwać kanonicznego finalnego miejsca osadzenia kamienia.

**IMPLEMENTED CURRENT TUNING, nie prawo architektoniczne:** osobny presentation root skaluje geometrię Zwornika `2.0×` i odsuwa ją o `+1.0 m` po canonical sector-local `+Z`. Finalna lokalizacja kamienia pozostaje dokładnie w dotychczasowym InstallationAnchor poza presentation hierarchy. Parenting pod Rune Installation Frame / Sector MotionRoot zachowuje automatyczne dziedziczenie R2B motion.

## 5. Rune Stone bez istniejącego Zwornika

Nastrojenie i przyciągnięcie Rune Stone bez właściwego istniejącego Zwornika jest legalnym stanem sandboxowym. Kamień może dotrzeć w pobliże platformy, lecz nie jest instalowany i pozostaje poza platformą do czasu powstania miejsca związania.

Stan może uruchomić sytuacyjny hint Małpy, znaczeniowo na przykład „Działa. Tylko nie ma gdzie go przywiązać.” Nie jest obowiązkowym Scenario pointem, gałęzią progresji ani błędem narzędzia.

## 6. Kula Asterionowa i lokalne sterowanie sektorem

Od fizycznego stworzenia Kuli Asterionowej jej grip może emitować sektorowy strumień sterujący. Sektor bez zainstalowanego Rune Stone nie odpowiada. Zainstalowany właściwy kamień zasila sektor i umożliwia lokalne przejęcie/lock.

Input jest wzajemnie wykluczający:

- **TRIGGER** — istniejące sterowanie globalną orientacją całej platformy;
- **GRIP** — sektorowy strumień i lokalne sterowanie jednym legalnym sektorem;
- oba tryby nie mogą działać równocześnie; jeżeli oba wejścia są fizycznie aktywne, **TRIGGER ma bezwzględne pierwszeństwo**: działa klasyczna Kula i globalny owner orientacji platformy, a lokalna ścieżka sector-control nie steruje sektorem. Dopiero nieaktywny TRIGGER pozwala GRIP rozpocząć acquisition/lock.

GRIP nie przejmuje sektora natychmiast. Sektorowy strumień musi trafiać ten sam legalny, zasilony sektor nieprzerwanie przez pełne **1.0 s**; dopiero wtedy powstaje **SECTOR LOCK** i ruch kontrolera może sterować lokalnym sektorem. Zmiana celu albo utrata legalnego trafienia przed upływem 1.0 s zeruje acquisition timer. Przed lockiem Kula nie steruje lokalnym sektorem; po locku przyszły sector-control mode interpretuje ruch względem przejętego sektora, nie całej platformy.

Ten kontrakt nie zmienia istniejącego ownership globalnego obrotu platformy. Semantyczne osie, poziomy i CURRENT TARGET pozycji rdzenia pola zamraża sub-model pola; interpolacja i algorytm mapowania ruchu pozostają otwarte.

## 7. Powstanie Rezonatora Asterionowego

Pierwszy Rezonator powstaje z fizycznego stanu świata, nie z wejścia w Scenario point. Gdy trzy wymagane sektory są zasilone przez zainstalowane Rune Stones i mogą współpracować, istnieje **Rezonator Asterionowy**.

```text
3 wymagane współpracujące sektory
+ właściwe installed Rune Stones
→ Rezonator Asterionowy istnieje
```

Może to nastąpić przed późnym aktem fabularnym. Jeżeli już istnieje, późniejszy Scenario/Monkey uznaje rezultat i nie zmusza do ponownego budowania lub „odkrywania”. Jeżeli nie istnieje, późniejsza dramaturgia i Guidance mogą poprowadzić do dokładnie tego samego fizycznego rezultatu.

Rezonator nie jest klasyczną anteną ani radarem. EARTH ustawia lewe downward-folding side wing (`α`), WOOD lustrzane prawe (`β`), a FIRE centralnym downward pitch wybiera głębokość (`γ`). Boczne skrzydła obracają się wokół przeciwnych zewnętrznych radialnych krawędzi 72° wedge (`±36°` od sector-local `+Z`), przechodzących przez canonical platform origin. Ich MotionRoot zachowuje pozycję `(0,0,0)`: nieruchoma outer radial edge pozostaje w flat plane, a inner radial edge skierowana ku FIRE schodzi w dół. FIRE nadal obraca się wokół wewnętrznej radialnej krawędzi. Każdy kanał ma `LEVEL 0 / 0° / OFF` oraz trzy aktywne CURRENT TARGET positions: `13° / 23° / 36°`; nie istnieją pozycje ujemne ani signed detent model.

Trzy installed Rune Stones czynią sektory **powered**, lockable i zdolne utworzyć Rezonator, lecz **field-active** wymaga też lokalnego poziomu większego od `0`. Rezonator może istnieć przy `α = β = γ = 0`, gdy coarse field pozostaje OFF. Fizyczny rdzeń ma 64 stany; 27 oznacza pełne aktywne konfiguracje, a 9 — główne aktywne konfiguracje symetryczne. Legalne są asymetria i częściowe stany jednego aktywnego skrzydła. Szczegółowy kontrakt znajduje się w sub-modelu pola.

Rezonator wyprowadza analityczny descriptor ze stanu sektorów i nie wymaga literalnego przecięcia brył. `α` i `β` są poziomami intensywności przeciwstawnych skrzydeł, nie znakami przeciwnych krzywizn. Nie dziedziczy historycznych detentów ani dawnego podziału DOF; modelu historycznego nie wolno reaktywować jako precedensu.

## 8. Odpowiedź na legalne odległe cele

Rezonator jest projektowany jako system odpowiedzi na legalne odległe cele wspierane przez odpowiednie domeny. Nie jest hardkodowany wyłącznie do glifów. Pierwszą praktyczną odpowiedzią może być glif, skorupa albo inny legalny target wspierany przez domain ownera.

Scenario może nadawać odkryciu znaczenie, ograniczać prawo pozyskania kryształu i prowadzić gracza, ale nie posiada samej fizycznej odpowiedzi pola. Field descriptor może opisywać lewe/prawe skrzydło, symetrię, depth band, opcjonalną moc i deformację; wspierana domena targetu może na tej podstawie różnicować siłę, stabilność i zniekształcenie odpowiedzi. Exact scoring, target selection i API pozostają otwarte.

METAL i WATER są późniejszą warstwą advanced tuning / amplification. Oba docelowo oferują rotację skrzydłową i pochył zgodne z filozofią `0° = OFF`, a potem jednokierunkowe target detenty `13° / 23° / 36°`. Sprzężenie osi, kombinacje, scoring, mapping gestu i role w descriptorze pozostają otwarte.

## 9. Ownership i zależności

| Owner | Posiada | Nie posiada |
| --- | --- | --- |
| sector progression owner | panel/sector completeness | Rune tuning, installed truth, Scenario knowledge |
| Rune domain | tuning, legalny target/pull, installed Rune truth i installation legality | dramaturgia, hinty, lokalny ruch sektorów |
| Zwornik / sector presentation | trwałą prezentację Zwornika po sector complete i niezależną geometrię prezentacyjną | finalną kotwicę kamienia jako efekt transformacji geometrii, progression truth |
| sector-control domain | lokalne przejęcie/lock powered sektora, jego ustawienie i bounded motion commands | field descriptor, target response, globalny obrót platformy, Scenario truth |
| istniejący owner Kuli/platform drive | globalną orientację platformy pod TRIGGER | lokalny sector control pod GRIP |
| Resonator Field Domain / actor | read-only konfigurację sektorów, field descriptor i fizyczną odpowiedź pola | fizyczny MotionRoot, energia platformy, znaczenie narracyjne, Guidance, crystal progression |
| Scenario / Guidance / Panel Y | dramaturgię, obowiązkowe beaty, ujawnianą wiedzę, hinty i crystal-acquisition gates | fizyczne gate'y Rune/sector/Rezonator oparte na `currentPoint` |
| `PlatformEnergyVfxActor` | profile proceduralnej energii platformy/Zworników | gameplay truth, field descriptor, interpretację `α/β/γ`, target response i field lensing |

Field lensing presentation może otrzymywać read-only wynik Field Domain, lecz nie należy do `PlatformEnergyVfxActor`; dokładna nazwa klasy/API i podział projection/actor pozostają otwarte. Nie wolno scalać sector control, field, platform energy VFX i lensing w jeden megasystem.

## 10. Granice przyszłej implementacji

Przyszła implementacja ma wyprowadzać dostępność z narzędzi, obiektów i domenowych warunków, a Scenario jedynie obserwować oraz interpretować wynik. Musi zachować reconstruction/hydration osiągniętego fizycznego stanu bez replayu dramaturgii.

Poza zakresem i nadal niezamrożone są: konkretne API, nazwy aktorów, algorytmy ruchu i interpolacja, mapowanie gestu, target selection/scoring, shadery, parametry VFX/audio i nowe Scenario point IDs. Semantyczne osie, poziomy i target detenty rdzenia, descriptor i język wizualny są CURRENT w sub-modelu pola.
# R2B implementation boundary

R2A powered-sector acquisition, one-second transient SECTOR LOCK and trigger-priority arbitration are implemented. R2B now owns runtime-local EARTH/WOOD/FIRE levels `0/1/2/3`, continuous constant-speed motor positions, physical `0°/13°/23°/36°` detents, a short detent hold, and smooth release-to-last-committed settle. EARTH/WOOD are a mirror pair rotating about the actual outer radial wedge edges through origin; only their MotionRoot quaternion changes, while FIRE preserves its bounds-derived inner radial hinge and downward pitch. The whole MotionRoot subtree—including target anchor, energy mount, Rune Installation Frame, Zwornik and installed Rune—remains one rigid chain. Held directional intent continues across successive detents without a new GRIP press. Trigger priority freezes user-driven local motion and forces a hand-reference rebase when local control returns. `DETENT_COMMITTED.direction` remains semantic: `UP` increases the level and `DOWN` decreases it, independent of spatial downward motion.

The bounded read-only level/angle snapshot and exactly-once semantic `DETENT_COMMITTED` subscription seam are implemented. Spark VFX, grip-beam presentation, detent/motion audio, Target selection/scoring and response, field/lensing presentation, grip beam, field audio and METAL/WATER motion or field contribution are not implemented. R4's Field Actor and immutable analytic descriptor runtime are implemented from installed Rune truth and R2B committed levels; transient angles do not contribute.

## R2A acquisition presentation — IMPLEMENTED

`AsterionSectorAcquisitionPresentation` is a presentation-only reader of the existing acquisition owner. Acquisition geometry is limited to one invisible flat target surface per sector, derived from its authored reference BASE and parented above MotionRoot, so local tilt never moves the button. The acquisition owner remains sole gameplay authority and applies powered Rune truth after this geometric query; the beam neither performs targeting nor changes candidate, lock, powered, dwell, R2B, Scenario or Field state. `ACQUIRING` uses `candidateGlyphId` and acquisition progress, while `LOCKED` uses `lockedGlyphId`; `IDLE`, target loss and reset clear all feedback.

The reusable additive WebXR ribbon starts along the live Sphere-to-target direction, is narrow at the Sphere and wider at the sector, follows a quadratic arc based on the tiltable platform's current world normal, and mixes an energetic white core with a restrained spectral hue. Its endpoint is the canonical panel-3 bounds-center anchor, not the ray hit point. Acquisition glow grows and pulses with the existing one-second dwell; LOCKED retains a settled glow. Reset/dispose clear the beam and sector glow, and dispose releases only owned presentation resources.

Still **NOT IMPLEMENTED**: acquisition lightning/sparks, `FLOOR_DRIVE` lightning, drive/detent audio, `RUNE_INSTALL` VFX/audio, field/lensing presentation and target response.


## Platform energy extension — IMPLEMENTED

A presentation-only projection now adds existing-progress `SECTOR_ACQUISITION` lightning and actual-angle-change `FLOOR_DRIVE` lightning without changing acquisition, R2B, Field, or progression truth. Acquisition stops at `LOCKED`; stationary `DRIVING`/`DETENT_HOLD` produces no drive energy, while physically changing `SETTLING` angles do. The single shared bounded pool emits sector surface bolts and fail-soft Binder feeds to the authored `BRIDGE_STONE_CAPTURE` inside the scaled, radially offset bridge presentation subtree. World-to-sector-local conversion preserves the true endpoint through the same downward MotionRoot hinge inheritance. `RUNE_INSTALL`, detent sparks, motion/detent audio, branch/multilayer bolts, Field/lensing, target response, and Metal/Water motion remain not implemented. Hardware QA remains outstanding.
