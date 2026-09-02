# Experience VR — kamienie runiczne, Rezonator Asterionowy i finał

## Status i reguła nadrzędna

Status: **CURRENT WORKING CANON / SPLIT IMPLEMENTATION STATUS**. Rune tuning/transport/install, Binder readiness/materialization, powered-sector acquisition/control, Resonator core/descriptor, discovery Guidance through first Resonator and Scenario join through `5.10` are **CURRENT / IMPLEMENTED** under their technical owners. Physical Resonator containment/resonance response and the current broad Large Glyph pull integration are **IMPLEMENTED** sandbox mechanics. Correct early/late reacquisition policy, late motion, the authored search beat after `5.10`, Metal/Water/Ether expansion and the finale continuation are **FUTURE / NOT IMPLEMENTED**.

Ten przebieg zastępuje wcześniejszą wersję, w której trzy sektory tworzyły pełną antenę przed etapem kamieni runicznych:

```text
kamienie runiczne
→ budzą funkcje sektorów
→ sektory tworzą Rezonator Asterionowy
→ Rezonator pozwala ponownie odnaleźć glify
```

Dokładne receptury strojenia pozostają kontraktem receptur i nie są definiowane tutaj. Runtime pozostaje źródłem prawdy o tym, co jest już zaimplementowane.

**Reguła sandboxu:** poniższa kolejność jest dramaturgią i ścieżką Guidance, nie fizycznym gate'em mechanik. Rune tuning, legalny pull, instalacja przy istniejącym Zworniku, sector control i powstanie Rezonatora wynikają z narzędzi oraz stanu świata i mogą zajść wcześniej. Scenario nadal ogranicza obowiązkowe beaty i pozyskanie kolejnych kryształów, a wiedzę ujawnia zgodnie z tym, co gracz już odkrył. Nie stosuje się gate'u `currentPoint >= X` dla tych mechanik.

## Granica implementacji

| Zakres | Status |
| --- | --- |
| Rune tuning/transport/install i persistent truth | CURRENT / IMPLEMENTED |
| Binder readiness/materialization | CURRENT / IMPLEMENTED |
| Powered-sector acquisition/control i Resonator core/descriptor | CURRENT / IMPLEMENTED |
| Rune/Binder/Sector/Resonator Guidance oraz `4.80 → 5.10` | CURRENT / IMPLEMENTED |
| Resonator containment/resonance response i Large Glyph reacquisition | CURRENT / IMPLEMENTED (sandbox mechanic) |
| Metal/Water, Water override, Ether, final Water hunt, dissolution/finale after `5.10` | FUTURE |

The physical target-response core is implemented runtime. Its corrected late-only pull policy, escaped-target motion, authored dramaturgical continuation after `5.10`, advanced wings and later finale remain binding design canon / FUTURE / NOT IMPLEMENTED.

## 1. Glify znikają

Po ukończeniu strojenia Astrolabium Więzi duże glify ponownie się oddalają. Tym razem nie są widoczne ani słyszalne, Astrolabium ich nie wykrywa i nie pozostaje nawet cień celu. Świat nie wystawia markera ani nowego obiektu; przez chwilę oferuje wyłącznie nocne niebo. Małpa może tylko zasygnalizować dostępność rozmowy łukami komunikacyjnymi.

### `progression.p3.glyphsGone` — **IMPLEMENTED** — `PROGRESSION_MESSAGE`

> No.  
> Tym razem naprawdę uciekły.  
> Nie widać ich. Nie słychać.

### `knowledge.p3.stonesLead` — **IMPLEMENTED**

**CO TERAZ?**

> Możemy patrzeć w niebo.  
> Albo sprawić, żeby to miejsce patrzyło dalej niż my.  
> Zostały jeszcze kamienie.

### `knowledge.p3.stones` — **IMPLEMENTED**

**KAMIENIE?**

> Są daleko.  
> Piec potrafi stroić rzeczy.  
> Astrolabium potrafi je sprowadzać.  
> Sprawdźmy, czy to wystarczy.

Małpa przedstawia hipotezę, nie gotowe rozwiązanie, i nie nazywa jeszcze żadnej anteny.

## 2. Strojenie kamieni i pierwsza nieudana próba

Piec otrzymuje funkcję strojenia Astrolabium pod rodzinę kamienia. Proces ma cięższy, niższy rezonans niż wcześniejsze operacje. Po zakończeniu Astrolabium rozpoznaje rodzinę, pokazuje właściwy znak i może obrać kamień za cel. Nie uruchamia to automatycznej wypowiedzi Małpy.

Przyciągnięcie kamienia bez istniejącego właściwego Zwornika jest legalnym stanem sandboxowym: cel dociera w pobliże platformy, pozostaje poza nią i czeka na miejsce związania. Nie jest to obowiązkowy Scenario point. Narzędzie nie może wyglądać na uszkodzone, a hint jest sytuacyjny i pomijalny, jeżeli gracz rozumie już stan.

### `hint.rune.noBinder.soft` — **IMPLEMENTED**

> Działa.  
> Tylko nie ma gdzie go przywiązać.

### `hint.rune.noBinder.medium` — **IMPLEMENTED**

> Spójrz na krawędzie sektorów.

## 3. Zworniki Runiczne

Struktury materializujące się wcześniej przy ukończonych częściach platformy noszą narracyjną nazwę **ZWORNIKI RUNICZNE**; asset techniczny może nadal nazywać się `bridge.glb`.

Każdy Zwornik materializuje się dokładnie z ukończenia wszystkich paneli swojego sektora, nie z instalacji kamienia. Po reveal pozostaje trwały; dlatego Zworniki EARTH, WOOD i FIRE mogą istnieć przed ukończeniem pełnego trzeciego kręgu. Instalacja później wiąże kamień w niezależnej finalnej kotwicy. Prezentacyjna skala i radialne odsunięcie geometrii Zwornika nie mogą przesuwać tej kotwicy. Spin Zwornika nie należy do przyszłego kanonu. Live reveal ma jednoznaczny rytm: `HIDDEN → ARRIVING → DOCKED`; w `t=0` Zwornik pojawia się 130 m dalej radialnie i wraz z `electricity_short_06` rozpoczyna lot, a po 4.0 s osiąga canonical dock, odtwarza family-specific `zwornik_*` i dopiero wtedy udostępnia instalację. Translację posiada wyłącznie `RuneBridgeActor`, nie Platform Energy VFX. Reconstruction już ukończonej gałęzi przywraca cichy, finalny `DOCKED` bez lotu i obu one-shotów.

### `knowledge.p3.binders` — **IMPLEMENTED**

**CO TO JEST?**

> Zworniki.  
> Pojawiały się, kiedy domykałeś te części platformy.  
> Wygląda na to, że nie były ozdobą.

Zainstalować można tylko kamień odpowiadający sektorowi z aktywnym Zwornikiem. Brak Zwornika nie unieważnia strojenia ani przyciągnięcia kamienia w pobliże platformy. Gra nie pokazuje listy: informacją jest widoczna geometria platformy.

## 4. Instalacja pierwszego kamienia

Po nastrojeniu, namierzeniu i przyciągnięciu kamienia do przestrzeni platformy instalacja zachodzi automatycznie:

```text
przyciągnięcie → przejęcie przez Zwornik → lot do pozycji
→ osadzenie → energia → stabilizacja
```

Gracz nie wkłada kamienia ręcznie do uchwytu. W finalnej fazie `DESCENT` family-specific `creating_01–05` zaczyna się prezentacyjnie na pierwszej klatce z `<= 1.0 s` do końca (albo przy starcie `DESCENT`, gdy cała faza jest krótsza). Nie jest to wcześniejszy commit: dopiero exact dock i udane operacje Actor/Bridge/progression ustanawiają `INSTALLED`/`BOUND`. Wtedy staje się legalny persistent spatial loop, emitowany z płaskiego sector-local anchoru 8.0 m od środka platformy, a nie z fizycznego rootu kamienia; jego audible range kończy się dokładnie przy 2.0 m.

### `progression.p3.firstRuneInstalled` — **IMPLEMENTED**

> O.  
> Sam wiedział, gdzie ma trafić.

## 5. Kula i lokalna kontrola sektora

Od fizycznego stworzenia Kuli Asterionowej grip może tworzyć szeroki, lekko łukowaty, wielobarwny strumień. Odpowiadają wyłącznie sektory **powered** przez zainstalowany kamień. Powered sector jest lockable nawet przy `LEVEL 0 / 0° / OFF`; **field-active** staje się dopiero po ustawieniu poziomu większego od zera. Strumień musi trafiać ten sam legalny, zasilony sektor nieprzerwanie przez pełne **1.0 s**; dopiero wtedy powstaje **SECTOR LOCK** i ruch dłoni może wpływać na sektor. Zmiana celu albo utrata legalnego trafienia przed upływem 1.0 s zeruje acquisition timer. Pierwsza valid klatka nowego `ACQUIRING` odtwarza `electricity_short_*` natychmiast jako kontakt elektryczny; dźwięk nie czeka na późniejsze `LOCKED`. Przed lockiem Kula nie steruje lokalnym sektorem, a po locku ruch jest interpretowany względem przejętego sektora, nie całej platformy.

### `progression.p3.firstSectorLock` — **IMPLEMENTED**

> Teraz odpowiada na Kulę.  
> Przytrzymaj chwyt nad sektorem.  
> Nie puszczaj od razu.

Po pierwszym locku:

> No.  
> Teraz ruszasz częścią świata.

## 6. Pierwszy Rezonator Asterionowy

Gdy trzy wymagane sektory są zasilone przez zainstalowane kamienie i mogą współpracować, fizyczny stan świata tworzy pierwszy układ poszukiwawczy: **REZONATOR ASTERIONOWY**. Nie powstaje on z wejścia w Scenario point i może istnieć przed tym beatem. Nie jest radarem ani klasyczną anteną; stroi przestrzeń i wykrywa odpowiedź legalnych odległych celów wspieranych przez właściwe domeny. Jeśli gracz utworzył go wcześniej, późniejsza dramaturgia uznaje ten fakt zamiast wymuszać ponowne odkrycie lub budowę.

### `progression.p3.resonator` — **IMPLEMENTED**

> No dobrze.  
> Trzy razem zaczynają słuchać.  
> Chyba zbudowaliśmy Rezonator Asterionowy.

### `knowledge.resonator.what`

**REZONATOR?**

> Radar mówiłby ci, gdzie coś jest.  
> To jest bardziej uparte.  
> Musisz zapytać przestrzeń we właściwym kierunku.

## 7. Sterowanie Rezonatorem

The first Resonator has a discrete `(α, β, γ)` core. Every channel uses `LEVEL 0 / 0° / OFF` and the one-direction positions `13° / 23° / 36°`. EARTH/`α` independently controls the LEFT aperture half-profile, WOOD/`β` the RIGHT half-profile, and FIRE/`γ` controls depth only: `NONE`, `NEAR 10–50 m`, `MID 50–90 m`, or `FAR 90–130 m` (`0 / 1 / 2 / 3`). Side-profile half-extents from the center axis are level 1 `23 m` lateral / `7 m` vertical, level 2 `13 / 13 m`, and level 3 `7 / 23 m`.

The core has 64 physical states and 27 fully active configurations. All 27 have equal target-detection authority; `α`, `β`, and `γ` define geometry only, with no family, scoring, revelation, or Large Glyph privilege for `111`, `222`, or `333`. The Resonator exists from three powered sectors even at `(0,0,0)`, where the field is OFF. Unequal active sides create intentionally asymmetric apertures, but any partial configuration containing a core LEVEL 0 performs no target acquisition.

Canonical field semantics are FORWARD, LATERAL, and VERTICAL; the current Three.js target maps them to platform-local `+Z`, `X`, and `Y`. The authored floor/sector layout aligns FIRE's outward radial axis and field FORWARD with canonical `entryDirection`, independently of Monkey head rotation and without rotating unrelated fixtures or the player passenger hierarchy. The visible field retains a rounded 16-corner cage, translucent deformable skin, brighter curved skeleton, and morphing; nominal aperture coordinates create the primary shape while bow remains secondary tuning. Binding details are defined by [`VR_ASTERION_RESONATOR_FIELD_MODEL.md`](../technical/VR_ASTERION_RESONATOR_FIELD_MODEL.md). Runtime implements this revised nominal shape through the dedicated Resonator Field Frame and current progress-floor FIRE/entryDirection alignment; skin morphing and bow remain presentation tuning.

Spust Kuli nadal orientuje całą platformę, zachowując istniejący ownership globalnego obrotu. Grip służy lokalnej kontroli wybranego zasilonego sektora. Tryby są wzajemnie wykluczające i nigdy nie sterują równocześnie. Jeżeli TRIGGER i GRIP są fizycznie aktywne jednocześnie, **TRIGGER ma bezwzględne pierwszeństwo**: działa klasyczna Kula i globalny owner orientacji platformy, a lokalna ścieżka sector-control pozostaje nieaktywna. Dopiero po zwolnieniu TRIGGER wejście GRIP może prowadzić acquisition i SECTOR LOCK. Interpolacja i mapowanie gestu pozostają otwarte; `0° / 13° / 23° / 36°` są CURRENT TARGET.

### `tool.asterion.resonator` — Panel Y / Kula Asterionowa

> Spust — orientacja całej platformy  
> Chwyt — połącz się z aktywnym sektorem  
> Przytrzymaj strumień — zablokuj sektor  
> Ruch dłoni — zmieniaj jego ustawienie

Panel Y przechowuje instrukcję; Małpa nie powtarza jej stale.

## 8. Late reacquisition — **FUTURE / NOT AUTHORED AFTER `5.10`**

Earlier Large Glyph attraction needs learned family knowledge, not Resonator. In the late fourth-crystal/escaped phase the family remains known, but physical pull additionally needs the target's transient `PULL_READY`. Resonator finds/stabilizes; Astrolabium still selects and pulls. The existing runtime's universal Large Glyph readiness gate is broader than this target and remains to be corrected without inventing a Scenario point.

Escaped targets move slightly faster angularly than their earlier slow character and independently oscillate in depth approximately `20–110 m`: `65 m + 45 m × sin(2πt/T + phase)`. The design aims for about `20 s` useful dwell in the shortest ordinary depth band; `T ≈ 135 s` is initial tuning. Thus one fixed FIRE band cannot hold a target forever.

## 9. Why the first Resonator becomes difficult

EARTH/WOOD/FIRE remains functional and all 27 fully active core configurations retain equal detection authority. Difficulty comes from angular motion, depth oscillation, and one FIRE depth band at a time. A skilled player can still acquire a target for the existing six-second mechanic, but retention is demanding. This motivates expansion rather than a fiction that the core is broken or underpowered.

## 10. METAL — advanced depth-bandwidth wing

METAL adds one controllable wing to the same field. FIRE selects the primary depth region/center; Metal broadens effective FORWARD depth coverage. Metal angle and tilt each use conceptual `0..3` levels. At balanced `M(2,2)`, the target is roughly 80% of the `10–130 m` domain; `20–115 m` is an initial illustration, not immutable geometry. Exact hinges, gestures, mapping for all 16 pairs, and interval boundaries remain tuning.

## 11. WATER — advanced frequency wing

WATER adds a second controllable wing to the same field, with conceptual angle and tilt `0..3`. It tunes resonance frequency/phase rather than another ordinary geometric dimension. Field hue communicates frequency. When Water frequency matches and the Water Large Glyph participates in the field, its movement slows toward the earlier pre-final character but never stops. Exact slowdown and transition remain tuning and belong to Large Glyph motion/presentation, not Target Acquisition.

## 12. Balanced full array and BLUE lock

The discoverable full-array solution is:

```text
EARTH = 2 / WOOD = 2 / FIRE = 2
METAL angle = 2 / tilt = 2
WATER angle = 2 / tilt = 2
= 222 / M(2,2) / W(2,2)
```

Symmetry communicates the solution: balanced geometry → stable broad field → correct BLUE frequency → Water synchronization. `2` is the balanced active midpoint. This is not a hidden numerical password, family scoring preset, or revival of special `111 / 222 / 333` authority.

## 13. Frequency color supersedes power-to-white

Field hue means resonance frequency/tuning state. BLUE is canonical Water synchronization. The former `RED → YELLOW → ORANGE → GREEN → BLUE → VIOLET → WHITE` increasing-power scale, mandatory white maximum, and final-white field requirement are **SUPERSEDED**. If field strength later needs presentation, brightness, emission, density, activity, audio, or another dimension remains open; this document does not invent it. Target-family sign/ring colors remain separate from global field-frequency hue.

## 14. Final Water hunt

At balanced `222 / M(2,2) / W(2,2)`, Metal provides a broad useful depth envelope, Water locks BLUE, and the Water target slows. The player recognizes structural balance rather than solving a password, keeps the moving target contained to obtain `PULL_READY`, and then uses already learned family knowledge plus Astrolabium for late physical reacquisition. Exact Scenario beats after `5.10`, copy, advanced controls, color interpolation, slowdown, and motion tuning remain **FUTURE / NOT IMPLEMENTED**.

## 15. Ostatnia karta

Ostatni kryształ ujawnia finalną treść portfolio. Nie jest to głos Małpy, lecz jedyny bezpośredni zwrot autora do odbiorcy.

> Ukończyłeś drogę.  
> Ten świat nie będzie ci już potrzebny.
>
> Dzięki za twój wysiłek.  
> I za to, że chciałeś zobaczyć, co robię.
>
> Do zobaczenia.  
> W realu… może. :)

Nie ma komunikatu „GRATULACJE”, `100%`, `THE END` ani przycisku „DALEJ”. Po chwili zaczyna się finał.

## 16. Finał — utrata więzi świata

Po krótkiej ciszy wszystkie systemy energii reagują jednocześnie:

- Zworniki emitują wyładowania, błyskawice i przeciążoną energię;
- kamienie tracą stabilizację, wzmacniają energię i wysyłają impulsy;
- elementy platformy tracą wspólną strukturę, obracają się, odsuwają, wchodzą na osobne trajektorie i w szeroki ruch wirowy.

Nie jest to eksplozja z jednego punktu, lecz wrażenie, że przestrzeń przestała utrzymywać rzeczy razem. Do ruchu kolejno dołączają sektory, kamienie, Piec, Naczynie, portal, pozostałe konstrukcje i drobne elementy świata. Każdy obiekt ma własną trajektorię. Kamera i głowa gracza pozostają nieruchome; to świat odlatuje.

## 17. Biel i zakończenie sesji

Wraz z rozpadem niebo rozświetla się zamiast pogrążać w pustce. Najpierw wzmacniają się gwiazdy i tło, potem spada kontrast, światła przybywa, a obiekty zmieniają się w sylwetki i znikają.

Na końcu pozostaje wyłącznie pełna biel: bez Małpy, panelu, platformy i innych obiektów. Po krótkiej chwili następuje **END XR SESSION**, a gracz wraca do zwykłego portfolio. W VR nie pojawia się dodatkowa plansza `THE END`.

## 18. Reguła dramaturgiczna ostatniego aktu

```text
początek: nie wiem co robić → pytam Małpę
środek:   rozumiem narzędzia → czasem pytam Małpę
koniec:   największy problem → sam składam poznane systemy w rozwiązanie
```

Dlatego podczas ostatniego poszukiwania Małpa prawie milczy. Jej zadanie zostało wykonane; gracz nie potrzebuje już przewodnika.
