# EXPERIENCE VR — KANONICZNE TEKSTY KOMUNIKACJI

**Status:** kanoniczny katalog copy PL  
**Mechanika:** `EXPERIENCE_VR_COMMUNICATION_MECHANICS.md`  
**Zakres:** teksty obecne i zatwierdzone kierunkowo dla kolejnych etapów Experience VR

---

## 1. Zasady użycia

Każdy wpis posiada typ zgodny z:

`EXPERIENCE_VR_COMMUNICATION_MECHANICS.md`

Nie wolno:

- dzielić tych tekstów na pojedyncze linie wymagające `DALEJ`;
- zmieniać typu tekstu bez decyzji projektowej;
- pokazywać tematu przed jego warunkiem odblokowania;
- przenosić instrukcji sterowania z panelu Y do obowiązkowego monologu Małpy.

Wersja angielska pozostaje osobnym zadaniem lokalizacyjnym. Ten dokument ustala copy polskie.

---

# 2. P0 — wejście

## `progression.intro.firstPresence`

**TYP:** `PROGRESSION_MESSAGE`  
**TRIGGER:** reveal Małpy  
**MIEJSCE:** panel wypowiedzi Małpy  
**WARUNEK ODBLOKOWANIA:** wejście do intro  
**CZY BLOKUJE PROGRESJĘ:** nie przez kliknięcie; timing należy do sekwencji  
**CZY ZOSTAJE W PAMIĘCI:** nie

**TEKST:**

> Dobrze.  
> Masz ręce.  
> To już więcej, niż ma większość problemów.

---

## `progression.intro.worldListens`

**TYP:** `PROGRESSION_MESSAGE`  
**TRIGGER:** onboarding podstawowej interakcji  
**MIEJSCE:** Małpa  
**CZY BLOKUJE PROGRESJĘ:** sam tekst nie; progresję kończy rzeczywista interakcja

**TEKST:**

> Najpierw sprawdźmy, czy świat cię słucha.

---

## `progression.intro.pointAtMonkey`

**TYP:** `PROGRESSION_MESSAGE`

**TEKST:**

> Wskaż mnie.

---

## `progression.intro.triggerMonkey`

**TYP:** `PROGRESSION_MESSAGE`

**TEKST:**

> Teraz spust.

---

## `progression.intro.pointerLearned`

**TYP:** `PROGRESSION_MESSAGE`

**TEKST:**

> Widzisz?  
> Już nauczyłeś świat, gdzie patrzysz.

---

# 3. P0 — zaproszenie

## `decision.intro.go`

**TYP:** `PLAYER_DECISION`  
**MIEJSCE:** Małpa + panel odpowiedzi  
**CZY BLOKUJE PROGRESJĘ:** tak

**PYTANIE:**

> Idziesz?

**OPCJE:**

- `IDĘ`
- `DOKĄD?`
- `NIE`

---

## `knowledge.intro.where`

**TYP:** `KNOWLEDGE_TOPIC`

**TRIGGER:** gracz wybiera `DOKĄD?`

**TEKST:**

> Gdybym ci powiedział, poszedłbyś do odpowiedzi.  
> A ja pytam, czy pójdziesz za mną.

---

## `decision.intro.no`

**TYP:** `PLAYER_DECISION`

**TEKST:**

> Dobrze.  
> Nie każda droga musi być twoja.

---

## `progression.intro.follow`

**TYP:** `PROGRESSION_MESSAGE`

**TEKST:**

> To chodź.

---

# 4. P0 — próg

## `decision.threshold.enter`

**TYP:** `PLAYER_DECISION`  
**CZY BLOKUJE PROGRESJĘ:** tak

**TEKST:**

> Dalej jest próg.  
> Możesz go nie przekraczać.  
> Jeśli przekroczysz — wrócisz dopiero wtedy, kiedy droga się skończy.  
> Wchodzisz?

**OPCJE:**

- `PRZEKRACZAM PRÓG`
- `CO JEST PO DRUGIEJ STRONIE?`
- `WRACAM`

---

## `knowledge.threshold.otherSide`

**TYP:** `KNOWLEDGE_TOPIC`

**TEKST:**

> Po tej stronie pytasz.  
> Po tamtej będziesz sprawdzał.

---

## `decision.threshold.return`

**TYP:** `PLAYER_DECISION`

**TEKST:**

> Mądra decyzja. Albo tchórzliwa.  
> Czasem to ta sama decyzja.  
> Dopiero później wiadomo.

---

## `progression.threshold.crossed`

**TYP:** `PROGRESSION_MESSAGE`

**TEKST:**

> No.  
> Teraz jest łatwiej.

---

## `knowledge.threshold.easier`

**TYP:** `KNOWLEDGE_TOPIC`

**TEKST:**

> Nie musisz już wybierać, czy wejść.

---

# 5. P1 — pierwsze glify i kryształ

## `progression.glyphs.firstInstruction`

**TYP:** `PROGRESSION_MESSAGE`

**TEKST:**

> Pięć znaków.  
> Nie pytaj jeszcze, co znaczą.  
> Dotknij jednego Szpilą.

---

## `hint.glyphs.how.soft`

**TYP:** `HINT_SOFT`

**TEKST:**

> Wskaż znak.  
> Spust.

---

## `progression.crystal.firstCreated`

**TYP:** `PROGRESSION_MESSAGE`

**TEKST:**

> Odpowiedział.

---

## `hint.crystal.whatNow.soft`

**TYP:** `HINT_SOFT`

**TEKST:**

> Najpierw go weź.

---

## `hint.crystal.grab.medium`

**TYP:** `HINT_MEDIUM`

**TEKST:**

> Chwyt.

---

# 6. P1 — Naczynie

## `progression.reliquary.idea`

**TYP:** `PROGRESSION_MESSAGE`

**TRIGGER:** pierwszy kryształ przyniesiony do Małpy

**TEKST:**

> Co możemy z tym zrobić…  
> Hmm.  
> Może potrzebuje naczynia.

---

## `hint.reliquary.activate.soft`

**TYP:** `HINT_SOFT`

**TEKST:**

> Niektóre rzeczy trzeba obudzić.

---

## `hint.reliquary.activate.medium`

**TYP:** `HINT_MEDIUM`

**WORLD_CUE:** halo / światło przy `Activate`

**TEKST:**

> Uruchomić?  
> Zobacz. Może coś się stanie.

---

## `progression.card.first`

**TYP:** `PROGRESSION_MESSAGE`

**TEKST:**

> Jedna.

---

# 7. P1 complete — przejście do Astrolabium

## `progression.postRing.changedWorld`

**TYP:** `PROGRESSION_MESSAGE`  
**TRIGGER:** zakończenie prezentacji pierwszego ringu / wejście w nową fazę  
**MIEJSCE:** Małpa  
**CZY BLOKUJE PROGRESJĘ:** nie przez przycisk

**TEKST:**

> No i świat przestał być uprzejmy.  
> To, czego potrzebujesz, jest teraz poza zasięgiem.  
> Na szczęście nie na długo.

**UWAGA:** cały komunikat jest jednym beatem. Bez `DALEJ` między zdaniami.

---

## `progression.furnace.look`

**TYP:** `PROGRESSION_MESSAGE`

**TEKST:**

> Spójrz na Piec.  
> Tam coś na ciebie czeka.

**UWAGA:** jeden komunikat. Bez `DALEJ`.

---

# 8. Astrolabium Więzi

## `knowledge.astro.whatIsIt`

**TYP:** `KNOWLEDGE_TOPIC`  
**TRIGGER:** temat dostępny po fizycznym odebraniu Astrolabium  
**MIEJSCE:** menu Małpy  
**WARUNEK ODBLOKOWANIA:** Astro `EARNED` / fizyczny claim  
**CZY BLOKUJE PROGRESJĘ:** nie  
**CZY ZOSTAJE W PAMIĘCI:** tak — temat Małpy + panel Y

**PYTANIE W MENU:**

> CO TO JEST ASTROLABIUM WIĘZI?

**TEKST:**

> To narzędzie do rzeczy, które są daleko,  
> a chciałbyś, żeby były bliżej.  
> Chwytem namierzasz. Spustem przyciągasz.  
> Jeśli chcesz coś zachować — użyj Szpili i chwyć.

**POWIĄZANE TEMATY:**

- `A PO CO MI TO?`
- `CO DALEJ?`

---

## `knowledge.astro.why`

**TYP:** `KNOWLEDGE_TOPIC`

**PYTANIE:**

> A PO CO MI TO?

**TEKST:**

> Żebyś mógł sięgnąć trochę dalej.  
> Glify niestety trochę ci uciekły.  
> Tak już to zaprojektowano.

---

## `knowledge.astro.next`

**TYP:** `KNOWLEDGE_TOPIC`

**PYTANIE:**

> CO DALEJ?

**TEKST:**

> Potrzebujesz Kuli Asterionowej.  
> Piec potrafi ją zbudować.  
> Zgromadź skorupy.

---

## `tool.astro.basic`

**TYP:** `TOOL_REFERENCE`  
**MIEJSCE:** `Y → NARZĘDZIA → ASTROLABIUM WIĘZI`  
**WARUNEK ODBLOKOWANIA:** fizyczny claim Astrolabium  
**CZY ZOSTAJE W PAMIĘCI:** tak

**TEKST:**

> A — wyposaż / schowaj  
> Chwyt — namierzanie  
> Spust — przyciąganie  
> Szpila + chwyt — przejęcie obiektu

---

# 9. Kula Asterionowa

## `knowledge.asterion.whatIsIt`

**TYP:** `KNOWLEDGE_TOPIC`  
**TRIGGER:** temat dostępny po fizycznym odebraniu Kuli  
**MIEJSCE:** menu Małpy  
**WARUNEK ODBLOKOWANIA:** Kula `EARNED` / fizyczny claim  
**CZY BLOKUJE PROGRESJĘ:** nie  
**CZY ZOSTAJE W PAMIĘCI:** tak

**PYTANIE W MENU:**

> CO TO JEST KULA ASTERIONOWA?

**TEKST:**

> To narzędzie do zmiany horyzontu.  
> Nie przybliża tego, co jest daleko.  
> Zmienia to, skąd patrzysz.  
> Dzięki temu dosięgniesz tego, czego wcześniej nie mogłeś.

---

## `tool.asterion.basic`

**TYP:** `TOOL_REFERENCE`  
**MIEJSCE:** `Y → NARZĘDZIA → KULA ASTERIONOWA`  
**WARUNEK ODBLOKOWANIA:** fizyczny claim Kuli

**TEKST:**

> X — wyposaż / schowaj  
> Spust — zmieniaj orientację platformy

**UWAGA:** późniejsze funkcje Kuli dopisujemy dopiero po ich odblokowaniu.

---

# 10. P2 — druga seria kryształów / małe glify

## `progression.p2.smallGlyphsIntro`

**STATUS:** **APPROVED COPY / NOT YET ACTIVE** — real `LARGE_GLYPHS` targeting/pull nie jest zaimplementowany.

**TYP:** `PROGRESSION_MESSAGE`  
**TRIGGER:** druga seria kryształów ukończona; duże glify oddalają się; małe glify stają się aktualną mechaniką  
**MIEJSCE:** Małpa  
**CZY BLOKUJE PROGRESJĘ:** nie przez kliknięcie

**TEKST:**

> Świat idzie do przodu. Ty też powinieneś.  
> Glify możesz przyciągnąć.  
> Najpierw jednak trzeba je dostroić.

---

## `knowledge.p2.tuneGlyphs`

**STATUS:** **APPROVED COPY / NOT YET ACTIVE** — nie uruchamiać przed realnym `LARGE_GLYPHS` targeting/pull.

**TYP:** `KNOWLEDGE_TOPIC`

**PYTANIE:**

> JAK DOSTROIĆ GLIFY?

**TEKST:**

> Małe glify są sprzężone z dużymi.  
> Pomogą Astrolabium je rozpoznać.  
> Przycisk B zmienia to, czego narzędzie szuka.

---

## `knowledge.astro.bandSwitch`

**STATUS:** **IMPLEMENTED** po capability przełączania bandu.

**TYP:** `KNOWLEDGE_TOPIC`

**PYTANIE:**

> CO ROBI B?

**TEKST:**

> Narzędzia zmieniają się razem ze światem.  
> B przełącza pasmo Astrolabium.

---

## `tool.astro.bandSwitch`

**STATUS:** **IMPLEMENTED**; projekcja Y dopisuje linię po właściwym capability.

**TYP:** `TOOL_REFERENCE`  
**MIEJSCE:** `Y → NARZĘDZIA → ASTROLABIUM WIĘZI`  
**WARUNEK ODBLOKOWANIA:** P2 / pierwsze nowe pasmo

**DOPISZ DO INSTRUKCJI:**

> B — zmień pasmo celu

---

# 11. P3 — trzecia seria kryształów / gwiazdy

## `progression.p3.starsIntro`

**TYP:** `PROGRESSION_MESSAGE`  
**TRIGGER:** ukończenie trzeciej serii; glify odchodzą bardzo daleko; pojawia się pole gwiazd  
**MIEJSCE:** Małpa

**TEKST:**

> Rozświetlasz to miejsce.  
> Ale glify lubią być w cieniu.  
> Możesz ich poszukać.  
> Najpierw jednak przygotuj kolejne narzędzie.

---

## `progression.p3.furnaceNewFunction`

**TYP:** `PROGRESSION_MESSAGE`  
**TRIGGER:** bezpośrednio po poprzednim beatcie albo jako drugi krótki komunikat po przerwie  
**MIEJSCE:** Małpa

**TEKST:**

> Piec chyba ma nową funkcję.  
> Jeśli się nie mylę.

---

# 12. P3 — pierwszy aktywny sektor

## `progression.p3.firstSector`

**TYP:** `PROGRESSION_MESSAGE`  
**TRIGGER:** pierwsza poprawna kombinacja skorupy i małego glifu aktywuje sektor  
**MIEJSCE:** Małpa

**TEKST:**

> Teraz możesz kontrolować jedną część.  
> Żeby znaleźć glify, potrzebujesz trzech.

---

## `tool.asterion.sectors`

**TYP:** `TOOL_REFERENCE`  
**MIEJSCE:** `Y → NARZĘDZIA → KULA ASTERIONOWA`  
**WARUNEK ODBLOKOWANIA:** pierwszy aktywny sektor

**TEKST:**

> Chwyt — sterowanie aktywnym sektorem  
> Spust — orientacja całej platformy

**UWAGA:** dokładne nazwy wejść należy zsynchronizować z finalnym kontraktem implementacji sektora.

---

# 13. P3 — gotowa antena

## `progression.p3.antennaReady`

**TYP:** `PROGRESSION_MESSAGE`  
**TRIGGER:** trzy wymagane sektory tworzą gotową antenę  
**MIEJSCE:** Małpa  
**CZY BLOKUJE PROGRESJĘ:** nie

**TEKST:**

> A teraz zapytaj świat.  
> Może ci odpowie.

**WORLD_CUE:**

Od tego momentu prowadzenie przejmuje radar / reakcja świata. Nie dodajemy automatycznego wykładu Małpy.

---

# 14. Wzorzec menu Małpy

Menu nie musi pokazywać wszystkich tematów jednocześnie.

Przykładowy stan po zdobyciu Astrolabium:

```text
JAK MI IDZIE?
CO TO JEST ASTROLABIUM WIĘZI?
ZAMKNIJ
```

Po zdobyciu Kuli:

```text
JAK MI IDZIE?
NARZĘDZIA >
ZAMKNIJ
```

`NARZĘDZIA >`:

```text
ASTROLABIUM WIĘZI
KULA ASTERIONOWA
←
```

Po wejściu w Astrolabium:

```text
CO TO JEST?
A PO CO MI TO?
CO DALEJ?
←
```

Później mogą dochodzić:

```text
JAK DOSTROIĆ GLIFY?
CO ROBI B?
```

Nie pokazujemy tematów przyszłych przed odblokowaniem.

---

# 15. Wzorzec panelu Y

### Początek

```text
STEROWANIE
AKTUALNE ZADANIE
```

### Po Astrolabium

```text
STEROWANIE
AKTUALNE ZADANIE
NARZĘDZIA
```

`NARZĘDZIA`:

```text
ASTROLABIUM WIĘZI
```

### Po Kuli

```text
NARZĘDZIA
├── ASTROLABIUM WIĘZI
└── KULA ASTERIONOWA
```

### P2

Astrolabium otrzymuje dodatkową linijkę o `B`.

### P3 / pierwszy sektor

Kula otrzymuje dodatkową sekcję sterowania sektorami.

Panel rośnie wraz z wiedzą gracza.

---

# 16. Teksty wymagające przebudowy w obecnym runtime

Obecne:

```text
No i świat przestał być uprzejmy.
DALEJ
To, czego potrzebujesz, jest teraz poza zasięgiem.
DALEJ
Na szczęście nie na długo.
DALEJ
```

Docelowo:

```text
No i świat przestał być uprzejmy.
To, czego potrzebujesz, jest teraz poza zasięgiem.
Na szczęście nie na długo.
```

Jeden `PROGRESSION_MESSAGE`. Bez przycisku.

Obecne:

```text
Spójrz na Piec.
DALEJ
Tam coś na ciebie czeka.
DALEJ
```

Docelowo:

```text
Spójrz na Piec.
Tam coś na ciebie czeka.
```

Jeden `PROGRESSION_MESSAGE`. Bez przycisku.

---

# 17. Teksty jeszcze nieustalone

Ten dokument nie ustanawia copy dla:

- pełnych receptur P2;
- pełnych receptur P3;
- wszystkich hintów małych glifów;
- radaru i locka;
- kamieni runicznych;
- ostatniego glifu;
- finału poza już istniejącym kierunkiem;
- dokładnych komunikatów błędu;
- wersji angielskiej.

Nowe teksty należy dopisywać zgodnie z mechaniką z pierwszego dokumentu, a nie jako luźne stringi przy aktorach.

---

# 18. Reguła końcowa

> **Komunikat progresji mówi tylko tyle, ile gracz musi teraz usłyszeć.**  
> **Reszta czeka, aż sam zapyta.**
