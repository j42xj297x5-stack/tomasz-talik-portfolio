# EXPERIENCE VR — MECHANIKA KOMUNIKACJI Z GRACZEM

**Status:** kanoniczna podstawa projektowania komunikacji  
**Zakres:** Małpa, panel Y, komunikaty progresji, hinty, pytania, wiedza o narzędziach  
**Powiązany katalog tekstów:** `EXPERIENCE_VR_PLAYER_COMMUNICATION_COPY.md`

---

## 1. Cel

Ten dokument określa:

- **kiedy** gracz otrzymuje komunikat;
- **gdzie** komunikat się pojawia;
- **jakiego typu** jest tekst;
- **czy wymaga reakcji gracza**;
- **czy zostaje zapamiętany**;
- **kto jest właścicielem warunku jego pojawienia się**.

Nie zawiera właściwego copy. Teksty znajdują się w:

`EXPERIENCE_VR_PLAYER_COMMUNICATION_COPY.md`

Główna zasada:

> **Nie klikamy „DALEJ”, żeby Małpa skończyła zdanie.**

Interakcja pojawia się tylko wtedy, gdy gracz:

- podejmuje decyzję;
- zadaje pytanie;
- wybiera temat;
- świadomie prosi o głębszą pomoc;
- przegląda zapamiętaną wiedzę.

---

## 2. Cztery powierzchnie komunikacji

### 2.1. ŚWIAT

Świat jest pierwszym nauczycielem.

Komunikuje przez:

- ruch;
- światło;
- halo;
- emisję;
- dźwięk;
- zmianę odległości;
- materializację;
- reakcję urządzeń;
- Proto-Astro;
- zmianę układu przestrzeni.

Świat nie używa tekstu, jeśli może czytelnie pokazać zależność.

---

### 2.2. MAŁPA — KOMUNIKAT

Krótka wypowiedź pojawiająca się nad Małpą.

Służy do:

- komentarza progresji;
- zwrócenia uwagi na zmianę świata;
- krótkiego kierunku;
- ustanowienia tonu sceny.

Reguły:

- maksymalnie **3–4 wiersze** w jednym panelu;
- bez przycisku `DALEJ`;
- nie dzielić jednego sensownego zdania na kilka ekranów;
- nie blokować gameplayu tylko dlatego, że tekst trwa;
- jeśli treść jest dłuższa, skrócić ją albo rozłożyć na **pytania gracza**, nie na kolejne `DALEJ`.

Typ:

`PROGRESSION_MESSAGE`

Przykład:

> Świat idzie do przodu. Ty też powinieneś.  
> Glify możesz przyciągnąć.  
> Najpierw jednak trzeba je dostroić.

---

### 2.3. MAŁPA — DIALOG / WIEDZA

Gracz sam klika Małpę i wybiera temat.

Służy do:

- wyjaśniania mechanik;
- tłumaczenia znaczenia świata;
- przypominania wiedzy;
- rozwijania hintów;
- odpowiadania na pytania „co to jest?” / „po co?” / „co dalej?”.

Nie jest automatycznym tutorialem.

Typy:

- `KNOWLEDGE_TOPIC`
- `HINT_SOFT`
- `HINT_MEDIUM`
- `HINT_DIRECT`
- `PLAYER_DECISION`

Menu jest generowane z wiedzy, którą gracz **ma już prawo znać**.

Nie pokazujemy przyszłych systemów jako wyszarzonych pozycji.

---

### 2.4. PANEL Y — PAMIĘĆ PRAKTYCZNA

Panel Y odpowiada na:

> **„Co mogę teraz zrobić i jak obsługiwać to, co już znam?”**

Docelowe sekcje:

1. `STEROWANIE`
2. `AKTUALNE ZADANIE`
3. `NARZĘDZIA`
4. później ewentualnie `POSTĘP`

Panel Y nie mówi głosem Małpy.

Język jest rzeczowy i instrukcyjny.

Typ:

`TOOL_REFERENCE`

Wiedza w Y pozostaje dostępna po odblokowaniu, aby gracz mógł do niej wrócić.

---

## 3. Klasy tekstów

### `PROGRESSION_MESSAGE`

Automatyczny komunikat po zmianie świata lub ważnym progu.

- miejsce: panel wypowiedzi Małpy;
- wejście gracza: nie;
- `DALEJ`: nigdy;
- trwała pamięć: nie musi;
- trigger: Scenario / Director przez symboliczny efekt.

---

### `PLAYER_DECISION`

Pytanie wymagające rzeczywistego wyboru.

- miejsce: panel wypowiedzi + panel odpowiedzi;
- wejście gracza: tak;
- przejście progresji może czekać na wybór;
- przykłady: `Idziesz?`, `Przekraczasz próg?`.

---

### `KNOWLEDGE_TOPIC`

Temat otwierany z menu Małpy.

- miejsce: panel dialogowy Małpy;
- wejście gracza: tak;
- nie zmienia progresji;
- może odblokować podtematy;
- może zostać dostępny przez resztę doświadczenia.

Przykłady:

- `Co to jest Astrolabium Więzi?`
- `A po co mi to?`
- `Co to jest Kula Asterionowa?`

---

### `HINT_SOFT`

Najmniejsza pomoc.

- daje kierunek;
- nie podaje pełnej procedury;
- preferowana pierwsza odpowiedź po utknięciu.

---

### `HINT_MEDIUM`

Pomoc mechaniczna.

- mówi, czego użyć albo z czym połączyć;
- nadal nie musi wskazywać dokładnego celu.

---

### `HINT_DIRECT`

Ostatni poziom pomocy.

- mówi dokładnie, co zrobić;
- może uruchomić podświetlenie / halo / demonstrację;
- używany dopiero po świadomej prośbie gracza.

---

### `TOOL_REFERENCE`

Praktyczna instrukcja w panelu Y.

- bez narracji;
- bez humoru;
- bez filozofii;
- tylko dostępne funkcje;
- rośnie razem z narzędziem.

---

### `WORLD_CUE`

Bez tekstu.

- światło;
- halo;
- dźwięk;
- reakcja geometrii;
- zmiana emisji;
- materializacja.

Jeśli `WORLD_CUE` wystarcza, nie dokładamy wypowiedzi Małpy.

---

## 4. Zasada odkrywania wiedzy

Wiedza ma własny moment odblokowania.

### Astrolabium Więzi

Temat staje się dostępny dopiero po **fizycznym odebraniu narzędzia**.

Od tego momentu:

- Małpa może odpowiadać, czym jest;
- panel Y może pokazać jego instrukcję;
- późniejsze odblokowania mogą dopisywać nowe funkcje, np. `B`.

### Kula Asterionowa

Temat staje się dostępny dopiero po **fizycznym odebraniu Kuli**.

Od tego momentu:

- Małpa może wyjaśniać jej sens;
- panel Y pokazuje bieżące sterowanie;
- późniejsze akty mogą dopisywać funkcje sektorowe.

### Następny cel może być nazwany

Nie pokazujemy przyszłych mechanik przypadkiem.

Możemy jednak nazwać następne narzędzie lub system, kiedy **jego zdobycie staje się aktualnym celem progresji**.

To nie jest spoiler. To jest aktualne zadanie.

---

## 5. Zasada eskalacji pomocy

Domyślna kolejność:

```text
ŚWIAT
→ gracz próbuje
→ Małpa sygnalizuje, że ma podpowiedź
→ gracz pyta
→ HINT_SOFT
→ gracz pyta ponownie
→ HINT_MEDIUM
→ gracz prosi o konkret
→ HINT_DIRECT / POKAŻ MI
```

System może wykrywać utknięcie, ale nie powinien automatycznie wygłaszać rozwiązania.

Dozwolone automatyczne zachowanie po utknięciu:

- łuki komunikacyjne;
- subtelne halo;
- wzrost emisji;
- sygnał audio.

Znaczenie:

> **„Jeśli chcesz, możesz zapytać.”**

---

## 6. Zasada długości

### Komunikat progresji

Maksymalnie 3–4 wiersze.

Jeśli tekst nie mieści się naturalnie:

- skrócić;
- usunąć wyjaśnienie mechaniczne;
- przenieść szczegół do `KNOWLEDGE_TOPIC`;
- przenieść sterowanie do `TOOL_REFERENCE`.

### Odpowiedź Małpy

Preferowane 1–4 krótkie zdania.

Jeśli temat ma kilka warstw:

```text
CO TO JEST?
→ krótka odpowiedź

A PO CO MI TO?
→ sens w progresji

JAK TEGO UŻYWAĆ?
→ konkret

CO DALEJ?
→ następny cel
```

Nie robimy z tego liniowego samouczka.

---

## 7. Zasada interakcji

### Nie wymaga kliknięcia

- komentarz;
- obserwacja;
- wiadomość progresji;
- wskazanie kierunku;
- sygnał o zmianie świata.

### Wymaga kliknięcia

- decyzja;
- pytanie gracza;
- wybór tematu;
- prośba o kolejną warstwę pomocy;
- przegląd kart / historii / narzędzi.

`DALEJ` nie jest standardowym elementem dialogu.

Może istnieć wyłącznie jako techniczna paginacja długiej treści referencyjnej, ale nie jako sposób prowadzenia normalnej rozmowy.

Preferowane przyciski paginacji:

`←` `‹` `›`

---

## 8. Właściciele

### Scenario

Określa:

- kiedy komunikat staje się należny;
- kiedy temat wiedzy zostaje odblokowany;
- kiedy zmiana świata wymaga komentarza;
- kiedy decyzja gracza ma znaczenie dla progresji.

Scenario nie renderuje tekstu.

---

### Director

Określa:

- gdzie jesteśmy;
- czy zdarzenie może przeprowadzić progresję dalej.

Director nie jest właścicielem copy.

---

### Guidance

Odpowiada za:

- wyświetlenie komunikatu;
- menu Małpy;
- dostępne tematy;
- panel Y;
- hinty;
- trwałą pamięć instrukcji UI.

Guidance nie jest właścicielem gameplayu.

---

### Aktorzy / runtime

Wykonują:

- pokazanie panelu;
- halo;
- łuki;
- animację;
- światło;
- dźwięk;
- reakcję obiektu.

Aktor nie decyduje sam, że gracz przeszedł do kolejnego aktu.

---

### Domain owners

Pozostają źródłem prawdy o:

- kartach;
- skorupach;
- narzędziach;
- Piecu;
- Kuli;
- sektorach;
- dalszych systemach.

Guidance tylko projektuje tę prawdę do komunikacji.

---

## 9. Schemat wpisu w katalogu tekstów

Każdy tekst powinien mieć minimum:

```text
ID:
TYP:
TRIGGER:
MIEJSCE:
WARUNEK ODBLOKOWANIA:
CZY BLOKUJE PROGRESJĘ:
CZY ZOSTAJE W PAMIĘCI:
TEKST:
POWIĄZANE TEMATY:
```

Opcjonalnie:

```text
POZIOM HINTU:
WORLD_CUE:
PANEL Y:
UWAGI:
```

ID powinno być stabilne i semantyczne, np.:

```text
progression.p2.smallGlyphsIntro
knowledge.astro.whatIsIt
knowledge.astro.why
knowledge.asterion.whatIsIt
hint.antenna.firstSector.soft
tool.astro.basic
tool.astro.bandSwitch
```

---

## 10. Reguła projektowania przyszłego tekstu

Przed napisaniem każdej nowej kwestii należy odpowiedzieć:

1. Czy świat może to pokazać bez tekstu?
2. Czy gracz musi to wiedzieć teraz?
3. Czy to komunikat, pytanie, hint czy instrukcja?
4. Czy gracz powinien sam poprosić o tę wiedzę?
5. Czy informacja ma zostać zapamiętana w panelu Y?
6. Czy tekst mieści się w 3–4 wierszach?
7. Czy kliknięcie zmienia decyzję gracza, czy tylko służy do przewijania zdania?

Jeżeli odpowiedź na punkt 7 brzmi „tylko przewija zdanie” — tekst należy przepisać.

---

## 11. Aktualny stan implementacji

**IMPLEMENTED:**

- wspólny actor automatycznych progression messages bez `DALEJ`, w tym post-ring i Furnace;
- dynamiczny resolver wiedzy Małpy dla Astro i Asteriona;
- capability-gated `knowledge.astro.bandSwitch`;
- dynamiczna projekcja Player Guide/Y: `AKTUALNE ZADANIE`, `NARZĘDZIA` i tool references;
- dopisywanie linii B dopiero po właściwym capability.

`progression.p2.smallGlyphsIntro` oraz `knowledge.p2.tuneGlyphs` są **APPROVED COPY / NOT YET ACTIVE**, ponieważ realny `LARGE_GLYPHS` targeting/pull nie istnieje. `knowledge.astro.bandSwitch` i `tool.astro.bandSwitch` są **IMPLEMENTED**. Wspólna klasyfikacja/eskalacja hintów oraz dalsza komunikacja późniejszych aktów pozostają **APPROVED / NOT IMPLEMENTED**.

## 12. Reguła końcowa

> **Świat pokazuje.**  
> **Małpa pomaga zrozumieć.**  
> **Y pomaga pamiętać.**  
> **Gracz decyduje, ile chce wiedzieć.**
