# Experience VR — plan migracji Guidance Małpy i trwałej wiedzy Panelu Y

**Status:** **PLANNED / EXECUTION ROADMAP / NOT YET IMPLEMENTED**  
**Data:** 2026-08-24  
**Klasa dokumentu:** execution plan, migration record i working implementation contract dla bounded tasks G1–G6. Dokument nie jest runtime authority ani nowym canonical communication model.

> Canonical communication documents remain unchanged until the migration
> is implemented and the final documentation synchronization task is completed.

## 1. Granice statusu

- **CURRENT** oznacza wyłącznie zachowanie potwierdzone w aktualnym runtime.
- **TARGET** oznacza zatwierdzoną architekturę tej migracji, która nie jest jeszcze wdrożona.
- **FUTURE** oznacza elementy, których nie wolno implementować w G1–G5. P3+ pozostaje FUTURE, z wyjątkiem istniejących elementów runtime koniecznych do zachowania kompatybilności.

Planowane zachowania poniżej nie są roszczeniem o stanie CURRENT. Dopiero G5 potwierdzi zamknięty stan runtime, a G6 zsynchronizuje z nim kanon.

## 2. CURRENT — stan i problem runtime

### 2.1. Płaskie menu Małpy nie ma bezpiecznej pojemności

Aktualny root składa się kolejno z opcjonalnego `JAK MI IDZIE?`, wszystkich dostępnych knowledge topics oznaczonych `root: true` oraz `ZAMKNIJ`. Renderer układa te elementy pionowo bez paginacji i bez wydzielonego stałego obszaru nawigacji. Przy odpowiednio dużej liczbie topics `ZAMKNIJ` może znaleźć się poza panelem.

Screen `KNOWLEDGE` również układa wszystkie topics grupy pionowo od góry, podczas gdy `←` jest rysowane przy dolnej krawędzi. Lista może wejść w jego obszar. Istniejące History/Card mają już osobny dolny obszar nawigacji oraz paginację `‹` / `›`, ale kontrakt nie jest współdzielony przez root i Knowledge.

Zmniejszenie fontu, zwiększenie panelu ani ręczne usuwanie pojedynczych przycisków **nie są rozwiązaniem architektonicznym**: jedynie przesuwają próg przepełnienia.

### 2.2. Root topic jest jednocześnie folderem i pytaniem

Aktualny kontrakt `root: true` łączy cztery role. Ten sam topic:

- jest elementem root menu;
- uruchamia własne authored `blocks`;
- wybiera `groupId`;
- prowadzi do pozostałych topics tej grupy.

Nie istnieje odrębny semantyczny primitive nawigacyjny. Migracja musi rozdzielić **CATEGORY** od **TOPIC**.

### 2.3. `CONTEXTUAL` nie oznacza current objective

Aktualna widoczność części topics jest projektowana z monotonicznych capabilities. W szczególności `hasP2Knowledge` wynika z `CAN_SWITCH_ASTRO_BAND`. Po zdobyciu capability pozostaje ono prawdziwe, więc P2 help może nadal pozostawać w menu po rozwiązaniu problemu.

Należy rozdzielić dwie osie prawdy:

- **PLAYER KNOWS / CAN** — trwała wiedza, posiadanie i capability;
- **CURRENT GUIDANCE CONTEXT / CURRENT OBJECTIVE** — aktualny problem, dla którego pomoc ma sens teraz.

### 2.4. Małpa jest przeciążona trwałą wiedzą

CURRENT Małpa łączy bieżącą rozmowę, hint system, techniczną dokumentację narzędzi oraz historię wiedzy. Panel Y ma już `STEROWANIE`, `AKTUALNE ZADANIE` i dynamicznie dodawane `NARZĘDZIA`, lecz narzędzia są prezentowane na jednym długim detail screenie.

TARGET ownership:

- **MAŁPA** = aktualna rozmowa + kontekstowe podpowiedzi + jednorazowe pytania + `JAK MI IDZIE?`;
- **PANEL Y** = trwała pamięć praktyczna + sterowanie + aktualne zadanie + wiedza o posiadanych narzędziach.

## 3. TARGET — minimalny root menu Małpy

```text
JAK MI IDZIE?
CO TERAZ?
[opcjonalne chwilowe kategorie / pytania, jeśli dany beat ich wymaga]
ZAMKNIJ
```

Nie ustanawia się dodatkowej trwałej kategorii bez istniejącej potrzeby.

### `JAK MI IDZIE?`

- pozostaje permanentne;
- korzysta z istniejącej historii zdobytych kart i zachowuje obecny History/Card;
- nie należy do knowledge lifecycle.

### `CO TERAZ?`

- jest permanentną **CATEGORY**, która sama nie uruchamia wypowiedzi;
- ma dynamiczną zawartość ograniczoną do hintów aktualnego problemu/objective;
- po semantic completion stare topics znikają;
- następny objective podstawia nowy zestaw.

### `ZAMKNIJ`

Jest stałym control nawigacyjnym i musi być osiągalne niezależnie od liczby kategorii lub topics.

## 4. TARGET — wymagany model semantyczny

Ten plan nie ustala finalnego schema. Task implementacyjny może dobrać reprezentację, ale musi zachować poniższe właściwości i invariants.

### CATEGORY

- jest elementem nawigacyjnym;
- ma stabilne `id` i label;
- nie ma authored `blocks` i nie uruchamia odpowiedzi;
- nie otrzymuje statusu READ;
- otwiera listę aktywnych TOPICs.

### TOPIC

- jest konkretnym pytaniem gracza;
- ma stabilne `id` i authored `blocks`;
- może mieć lifecycle i należeć do CATEGORY;
- może być `ONCE` albo contextual-to-objective.

Invariants: CATEGORY nie może być interpretowana jako TOPIC; wykonanie TOPIC nie może oznaczać CATEGORY jako przeczytanej; aktywna lista jest projekcją bieżącej prawdy i session lifecycle, nie drugim właścicielem progresji.

## 5. TARGET — lifecycle Małpy i current guidance context

Większość pytań Małpy ma być efemeryczna. Po pełnym wysłuchaniu typowego pytania jednorazowego:

```text
NEW → READ/COMPLETED → znika z aktywnego menu
```

Anulowanie przed ukończeniem nie może udawać completion. Nie powstaje osobny history/archive UI rozmów.

Widoczność contextual help nie może wynikać wyłącznie z trwałego capability:

```text
GUIDANCE CONTEXT A → zestaw hintów A
semantic completion boundary
GUIDANCE CONTEXT B → zestaw hintów B
```

Po opuszczeniu A jego hinty znikają. Guidance nie powinno wprowadzać literalnych porównań `currentPointId === ...` rozsianych po actorach. Preferowana jest projekcja current state/objective z canonical runtime truth. Dokładny mechanizm projekcji zostanie ustalony w G2 po odczytaniu bieżących domain owners i Scenario capabilities; ten plan nie przesądza, czy będzie to osobny resolver, semantic context ID czy inna projekcja.

## 6. TARGET — Panel Y jako trwała pamięć narzędzi

```text
PANEL Y
├── STEROWANIE
├── AKTUALNE ZADANIE
└── NARZĘDZIA
    ├── ASTROLABIUM WIĘZI
    ├── KULA ASTERIONOWA
    └── ←
```

### Astrolabium Więzi

Detail screen zawiera krótki opis przeznaczenia, sterowanie podstawowe i tylko rzeczywiście dostępne funkcje. Po claim Astro może pokazać `A`, Chwyt, Spust i przejęcie Szpilą. Po P2, a dokładniej po właściwym istniejącym odblokowaniu, dopisuje `B` / zmianę pasma. Późniejsze funkcje pojawiają się wyłącznie po ich rzeczywistym odblokowaniu.

### Kula Asterionowa

Po claim detail screen zawiera krótki opis, `X` i obecne sterowanie orientacją. Funkcje sektorowe są FUTURE i mogą zostać dopisane dopiero po ich rzeczywistym odblokowaniu.

Panel Y pozostaje trwałą pamięcią: raz zdobyta informacja nie znika dlatego, że Małpa przestała oferować odpowiadający jej topic. Tool details pozostają capability/domain-truth-driven.

## 7. TARGET — bezpieczeństwo layoutu list

Kategorie nie rozwiązują same problemu pojemności. Każdy listowy screen Małpy musi respektować invariant:

```text
CONTENT AREA
----------------
FIXED NAVIGATION AREA
```

Navigation controls zależnie od ekranu to `←`, `‹`, `›` i `ZAMKNIJ`. Ich pozycja i hit area nie zależą od liczby topics. Elementy mieszczące się ponad pojemnością bounded CONTENT AREA są dostępne przez paginację. Nie należy używać scrolla wymagającego precyzyjnego VR ray drag. Wzorzec `‹` / `›` powinien, gdzie to zasadne, wykorzystać istniejące rozwiązanie History/Card.

`ZAMKNIJ` i `←` nigdy nie mogą zostać przesunięte, przykryte ani uzależnione od liczby tematów.

## 8. Poza zakresem / zachować bez zmian

G1–G5 nie mogą zmieniać ani wykorzystywać migracji do przeprojektowania:

- mandatory Monkey communication;
- attention arcs / checheszki;
- progression message sequencing;
- flow `3.30`;
- flow `4.50` / `4.60`;
- automatic BLOCK timing;
- kart i ich contentu;
- Scenario progression poza minimum koniecznym do projekcji current guidance context;
- gameplay mechanics;
- Furnace mechanics;
- Proto-Astro mechanics;
- implementacji P3+.

P3+ oraz nieodblokowane późniejsze funkcje są **FUTURE**. Ta migracja nie projektuje przyszłego gameplayu.

## 9. Execution roadmap — bounded IMPLEMENT tasks

Każdy etap jest osobnym bounded IMPLEMENT taskiem. Kolejny etap nie może przedstawiać rezultatu poprzednika jako CURRENT bez potwierdzenia w runtime.

### G1 — MONKEY LIST SAFETY + CATEGORY PRIMITIVE

**Cel:** przygotować bezpieczną hierarchiczną nawigację bez dużej migracji contentu.

**Zakres:**

- rozdzielić CATEGORY od TOPIC w kontrakcie UI/resolvera;
- ustanowić bounded content area i paginację list;
- zapewnić stale osiągalne `ZAMKNIJ` i `←`;
- zachować History/Card;
- przygotować `CO TERAZ?` jako category primitive;
- nie zmieniać znaczenia obecnych hintów poza minimum potrzebnym nowej strukturze.

G1 ma pozostać możliwie mechaniczny i nie zależy od rozstrzygnięcia OPEN QUESTIONS.

**Acceptance:** żadna liczba dostępnych topics nie może wypchnąć navigation controls poza panel.

### G2 — CURRENT GUIDANCE CONTEXT + TEMPORARY HINTS

**Cel:** pomoc Małpy odpowiada aktualnemu problemowi, a nie całej historii capabilities.

**Zakres:**

- ustanowić `CO TERAZ?` jako stałą CATEGORY;
- zbudować resolver aktualnego guidance context z canonical runtime truth;
- zmigrować istniejące bieżące P1/P2 hints tam, gdzie runtime już ma wystarczającą prawdę;
- zastępować kontekst po semantic completion i usuwać nieaktualne hints;
- ustawić typowe jednorazowe questions jako `ONCE`;
- nie tworzyć history/archive UI;
- nie dodawać P3 hints ani wymyślonego copy.

Task ma najpierw potwierdzić domain owners / Scenario capabilities i dopiero wtedy wybrać dokładny mechanizm projekcji.

**Acceptance:** po rozwiązaniu objective poprzednie `CO TERAZ?` topics nie pozostają aktywne.

### G3 — PANEL Y HIERARCHICAL TOOLS

**Cel:** przebudować `NARZĘDZIA` z jednego długiego ekranu na trwałą hierarchię.

**Zakres:** `PANEL Y → NARZĘDZIA → tool list → tool detail`; obsłużyć istniejące Astrolabium Więzi i Kulę Asterionową; rozwijać detail capability-driven; nie dodawać przyszłych funkcji bez istniejącego capability/domain truth.

**Acceptance:** Astro i Asterion mają własne detail screens, a `B` pojawia się dopiero po właściwym odblokowaniu.

### G4 — KNOWLEDGE OWNERSHIP MIGRATION

**Cel:** usunąć dublowanie trwałej wiedzy technicznej między Małpą i Y.

**Zakres:**

- przenieść techniczną pamięć Astrolabium i Asteriona do Y;
- usunąć trwałe HOW-TO ze zwykłego menu Małpy;
- pozostawić Małpie pytania narracyjne, aktualne i contextual;
- zachować jednorazowe wypowiedzi mające rolę dramaturgiczną;
- nie usuwać authored copy, dopóki nie ustalono miejsca przejścia każdej informacji.

**Acceptance:** Y jest jedynym trwałym miejscem praktycznego przypomnienia obsługi narzędzi.

### G5 — GUIDANCE CLEANUP + CURRENT RUNTIME AUDIT

**Cel:** po migracji potwierdzić spójność całego implemented Guidance runtime.

**Zakres audytu:** root menu; categories; pagination; topic lifecycle; current contextual help; History; mandatory communication interaction lock; Panel Y; tools; progressive controls `A` / `X` / `B`; direct activation / reconstruction interaction with Guidance; reset semantics.

Naprawiać wyłącznie wykazane pozostałości migracji. Nie rozszerzać taska na przyszłe akty.

**Acceptance:** wykazane pozostałości G1–G4 są zamknięte, zachowane kontrakty poza zakresem nadal działają, a audit opisuje faktyczny CURRENT runtime.

### G6 — FINAL CANONICAL DOCUMENTATION SYNCHRONIZATION

**Warunek wejścia:** dopiero po zakończeniu G1–G5.

**Cel:** pełna synchronizacja dokumentacji z faktycznie wdrożonym runtime.

**Zakres co najmniej:**

- `EXPERIENCE_VR_COMMUNICATION_MECHANICS.md`;
- `EXPERIENCE_VR_PLAYER_COMMUNICATION_COPY.md`;
- `EXPERIENCE_VR_NARRATIVE_PROGRESSION_BASELINE.md`;
- `VR_RUNTIME_MODEL.md` tam, gdzie opisuje Guidance contract;
- `EXPERIENCE_VR_HANDOFF.md`, jeśli opisuje te surfaces;
- `PROJECT_INDEX.md`;
- `DEPENDENCY_MAP.md`, jeśli ownership/dependency graph się zmienił;
- `DECISION_LOG.md` dla nowych wiążących decyzji.

G6 usuwa stare sprzeczne sekcje, zamiast wyłącznie dopisywać notatki. Dopiero po G6 ten migration audit może otrzymać status **COMPLETED**.

## 10. Zależności i kolejność

```text
G1 ──→ G2
 │
 └──→ G3

G2 + G3 ──→ G4 ──→ G5 ──→ G6
```

- G1 jest fundamentem bezpiecznego UI i semantic primitives.
- G2 zmienia semantykę chwilowej wiedzy Małpy.
- G3 buduje trwałe miejsce docelowe dla wiedzy narzędziowej i może ruszyć po G1 równolegle względem zależności logicznych G2.
- Dopiero ukończone G2 i G3 pozwalają G4 bezpiecznie usunąć trwałe technical topics z Małpy bez utraty informacji.
- G5 zamyka i audytuje runtime po migracji.
- G6 synchronizuje canon dopiero z działającym i zaudytowanym stanem.

## 11. FUTURE — nie implementować w G1–G5

- P3+ hints, gameplay, systems i tool functions;
- niezatwierdzone zestawy hintów i nowe copy;
- dodatkowe permanentne kategorie Małpy bez decyzji produktowej;
- archiwum rozmów Małpy;
- funkcje sektorowe Asteriona przed realnym odblokowaniem;
- ogólne przebudowy Scenario, Guidance lub gameplayu wykraczające poza migrację.

Istniejące elementy związane z późniejszą granicą mogą być zachowane tylko w zakresie kompatybilności; nie stanowi to zgody na rozwój P3+.

## 12. OPEN QUESTIONS

- Czy poza `JAK MI IDZIE?` i `CO TERAZ?` będzie potrzebna jeszcze jedna permanentna kategoria Małpy?
- Które narracyjne informacje o Astro/Asterionie pozostają jednorazową wypowiedzią Małpy, a które w całości przechodzą do Y?
- Jakie są dokładne current-objective hint sets dla etapów, które nie mają jeszcze zatwierdzonego copy?

Pytania te nie blokują G1. Nie wolno odpowiadać na nie przez domysł w G1–G5; właściwy bounded task musi otrzymać zatwierdzone rozstrzygnięcie albo pozostawić dany content poza zakresem.
