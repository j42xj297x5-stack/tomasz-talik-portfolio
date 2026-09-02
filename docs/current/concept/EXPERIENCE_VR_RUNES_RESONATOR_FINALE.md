# Experience VR — kamienie runiczne, Rezonator Asterionowy i finał

## Status i reguła nadrzędna

Status: **CURRENT WORKING CANON / SPLIT IMPLEMENTATION STATUS**. Rune tuning/transport/install, Binder readiness/materialization, powered-sector acquisition/control, Resonator core/descriptor, discovery Guidance through first Resonator and Scenario join through `5.10` are **CURRENT / IMPLEMENTED** under their technical owners. Physical Resonator containment/resonance response, glyph reacquisition, Metal/Water/Ether expansion and the finale continuation are **FUTURE**.

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
| Resonator containment/resonance response i glyph reacquisition | FUTURE |
| Metal/Water, Water override, Ether, final Water hunt, dissolution/finale after `5.10` | FUTURE |

Sections describing target response and later finale are design canon, not implementation claims.

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

Canonical field semantics are FORWARD, LATERAL, and VERTICAL; the current Three.js target maps them to platform-local `+Z`, `X`, and `Y`. The authored floor/sector layout aligns FIRE's outward radial axis and field FORWARD with canonical `entryDirection`, independently of Monkey head rotation and without rotating unrelated fixtures or the player passenger hierarchy. The visible field retains a rounded 16-corner cage, translucent deformable skin, brighter curved skeleton, and morphing; nominal aperture coordinates create the primary shape while bow remains secondary tuning. Binding details are defined by [`VR_ASTERION_RESONATOR_FIELD_MODEL.md`](../technical/VR_ASTERION_RESONATOR_FIELD_MODEL.md). Runtime still uses the superseded origin-based `S0–S3` shape, fixture parent, and unaligned sector layout, so the revised geometry is CURRENT DESIGN TARGET rather than implemented runtime.

Spust Kuli nadal orientuje całą platformę, zachowując istniejący ownership globalnego obrotu. Grip służy lokalnej kontroli wybranego zasilonego sektora. Tryby są wzajemnie wykluczające i nigdy nie sterują równocześnie. Jeżeli TRIGGER i GRIP są fizycznie aktywne jednocześnie, **TRIGGER ma bezwzględne pierwszeństwo**: działa klasyczna Kula i globalny owner orientacji platformy, a lokalna ścieżka sector-control pozostaje nieaktywna. Dopiero po zwolnieniu TRIGGER wejście GRIP może prowadzić acquisition i SECTOR LOCK. Interpolacja i mapowanie gestu pozostają otwarte; `0° / 13° / 23° / 36°` są CURRENT TARGET.

### `tool.asterion.resonator` — Panel Y / Kula Asterionowa

> Spust — orientacja całej platformy  
> Chwyt — połącz się z aktywnym sektorem  
> Przytrzymaj strumień — zablokuj sektor  
> Ruch dłoni — zmieniaj jego ustawienie

Panel Y przechowuje instrukcję; Małpa nie powtarza jej stale.

## 8. Pierwsze poszukiwanie i pierwszy odzyskany glif

A supported target is detected only while its canonical anchor is contained by the nominal field of any fully active configuration. This generic mechanism is not hardcoded to glyphs, and presentation-only field deformation cannot affect containment.

On first detection the family-colored Proto-Astro sign appears, faces the player's current head, and retains approximately constant apparent size across depth. Continuous containment adds one thin target-centered ring every `2.0 s`; at `2 / 4 / 6 s` the target has one/two/three rings. Exactly three rings mean `PULL_READY`, and the rings pulse slowly. Only then may Astrolabium Więzi target and pull it; attraction remains Astrolabium-owned.

Outside the field, fractional acquisition is discarded and one completed ring decays every `20 s`. Three rings remain ready until the `3 → 2` transition. Re-entry resets the current decay interval and resumes from retained rings (`0 / 2 / 4 / 6 s` required from three/two/one/zero). The sign remains through ring decay and for another `60 s` after ring 0; this sign-only state is not ready and requires the full `6 s`. It then returns to undiscovered presentation. Exact sizing, ring geometry, pulse and fade curves remain tuning. Scenario gives discovery meaning but owns none of this physical truth.
### `progression.resonator.search`

> Teraz szukaj.  
> Jeśli przestrzeń odpowie — zobaczysz znak.

Następnie Małpa milczy. Gracz ustawia sektory, obraca platformę, znajduje właściwą odpowiedź, stabilizuje target Astrolabium i przyciąga glif. Po pozyskaniu kryształu nie ma komentarza: gracz sam rozwiązał problem.

## 9. Za mały zasięg i czwarty kamień

Drugiego glifu pierwszy Rezonator nie potrafi ujawnić. Jest sprawny, lecz za słaby. Dopiero po dłuższej bezskutecznej pracy Małpa udostępnia pomoc.

### `hint.resonator.notEnoughPower.soft`

> Rezonator działa.  
> Tylko chyba już nie sięga wystarczająco daleko.

### `knowledge.resonator.morePower`

**POTRZEBUJEMY WIĘCEJ MOCY?**

> Potrzebujemy ostatnich kamieni.  
> Jeden możesz już osadzić.  
> Z drugim mamy problem.

Wcześniej zdobyty kryształ lub postęp gałęzi odblokowuje kolejny Zwornik. Gracz stroi, sprowadza i instaluje czwarty kamień. Czwarty sektor dołącza do pola, ale nadal nie zapewnia wystarczającego zasięgu.

## 10. Blokada Wody

Kamień Wody istnieje, można go nastroić, namierzyć i przyciągnąć. Blokuje go platforma: sektor Wody wymaga ostatniego kryształu Haiku Cosmos, którego nie można odnaleźć bez mocniejszego Rezonatora.

### `knowledge.runes.waterBlocked`

**DLACZEGO WODA NIE WCHODZI?**

> Platforma jej nie przyjmuje.  
> Chce kryształu Haiku Cosmos.  
> Którego właśnie próbujemy znaleźć.

*pauza*

> Bardzo eleganckie.

## 11. Eter — Kamień Więzi

Szóstym kamieniem jest widziany wcześniej **ETER — KAMIEŃ WIĘZI**. Nie stanowi kolejnego żywiołu sektorowego; wiąże cały układ.

### `knowledge.runes.ether`

**I CO TERAZ?**

> Jest jeszcze Eter.  
> Kamień Więzi.  
> Już go widziałeś.

Kolejna odpowiedź tego samego tematu:

> Jeśli go sprowadzisz, mogę na chwilę nagiąć zasadę Wody.

Ponieważ obejście jest czasowe, gracz musi otrzymać instrukcję przed rozpoczęciem okna.

### `progression.runes.etherPreparation`

> Najpierw nastrój Wodę.  
> Potem sprowadź Eter.  
> Kiedy Eter zwiąże układ — nie zatrzymuj się.  
> To będzie tylko chwila.

Opcjonalne pytanie **DLACZEGO TYLKO CHWILA?**:

> Bo na tyle mi pozwolono.

Gracz najpierw przygotowuje strojenie Wody, następnie sprowadza Eter. Eter wiąże układ i czasowo uchyla blokadę sektora, po czym gracz natychmiast sprowadza Wodę. Zwornik przyjmuje ją mimo braku finalnego kryształu. To jedyny moment Experience, w którym Małpa świadomie nagina regułę świata: nie działa za gracza, tylko otwiera możliwość.

## 12. Pełny układ sześciu kamieni

Dopiero po związaniu wszystkich sześciu kamieni ustawienie platformy zaczyna sterować kolorem mocy. Wcześniej pole pozostaje zielone. Skala rosnącej mocy to:

```text
CZERWONY → ŻÓŁTY → POMARAŃCZOWY → ZIELONY
→ NIEBIESKI → FIOLETOWY → BIAŁY
```

Biel oznacza maksimum. METAL i WATER są późniejszą warstwą advanced tuning / amplification istniejącego pola, nie osobnym polem. Oba docelowo mają rotację skrzydłową i pochył zgodne z filozofią `0° = OFF`, a następnie trzech poziomów tylko w jednym kierunku z target detentami `13° / 23° / 36°`. Sprzężenie osi, kombinacje poziomów, mapping gestu i dokładne role w descriptorze pozostają otwarte.

### `progression.resonator.fullArray`

> Teraz dopiero stroisz całość.  
> Nie szukaj konkretnego kąta.  
> Szukaj najsilniejszego pola.  
> Będziesz wiedział.

### `knowledge.resonator.powerColor`

**SKĄD MAM WIEDZIEĆ?**

> Patrz na pole.  
> Im bliżej bieli, tym większa moc.

## 13. Strojenie końcowe

Konfiguracje mogą osłabiać, zawężać lub rozpraszać rezonans i obniżać kolor skali albo wzmacniać układ, przesuwać pole ku fioletowi i bieli oraz zwiększać zasięg. Nie istnieje tekstowy wskaźnik procentowy.

Osiągnięcie bieli musi być natychmiast rozpoznawalne przez pełną białą emisję, charakterystyczny rezonans audio, reakcję wszystkich kamieni i zsynchronizowane wyładowania Zworników.

## 14. Ostatnie poszukiwanie i glif

Przy białym polu gracz łączy wszystkie poznane działania: globalnie obraca platformę, lokalnie ustawia sektory, obserwuje pole, rozpoznaje znak, utrzymuje lock, korzysta z Astrolabium, przyciąga glif, używa Szpili i pozyskuje kryształ. Odpowiada znak Haiku Cosmos; Małpa tego nie komentuje.

Ostatni glif jest bardzo daleko i porusza się wolno. Rezonator utrzymuje go widocznym tylko przy dostatecznie silnym polu. Gracz zachowuje orientację układu, namierza i przyciąga glif, a następnie po raz ostatni domyka znaną pętlę pozyskaniem kryształu.

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
