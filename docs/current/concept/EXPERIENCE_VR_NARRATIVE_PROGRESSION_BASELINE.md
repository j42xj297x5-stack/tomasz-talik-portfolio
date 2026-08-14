# Experience VR — Narrative & Progression Baseline

Status: canonical entrypoint synchronized after the M1.20 progression and hardware-QA corrections for the next narrative and gameplay-progression design stage. Runtime detail remains in [`VR_RUNTIME_MODEL.md`](../technical/VR_RUNTIME_MODEL.md).

## Cel dokumentu

Ten dokument opisuje **stan wejściowy** potwierdzony przez HEAD: co jest **IMPLEMENTED**, które istniejące elementy są **HARDWARE VALIDATED**, a co pozostaje **FUTURE / DO DECYZJI**. Nie jest gotową narracją i nie ustanawia dialogów, lore, questów ani osobowości Małpy.

## Co gracz już potrafi

1. Wejść do osobnego runtime’u WebXR, poruszać się po platformie, obracać widok i używać ograniczonych do `2.3 m` promieni dłoni.
2. Utrzymywać promień na dużych glifach, tworzyć kryształy, przenosić je i aktywować/oddawać w relikwiarzu, aby odkrywać karty i domykać progi.
3. Po ukończeniu Tier 1 wyposażyć prawą dłonią Astro Przyciągacz, skanować, przyciągać i przekazywać skorupy do wolnej dłoni, a odłożone skorupy ponownie chwytać zwykłym promieniem.
4. Skonfigurować Astro Piec w tryb Kuli Asteriona, otwierać komorę, wkładać sześć unikalnych skorup i wykonywać osobne 18-sekundowe procesy.
5. Po `6/6` uruchomić `UTWÓRZ`, odebrać gotową Kulę realnym trafieniem lewego promienia i squeeze, a następnie wyposażać ją przyciskiem X.
6. Kulą ustawiać docelową orientację platformy; ciężki driver prowadzi platformę do zaakceptowanego celu. Kula i Astro Przyciągacz mogą być wyposażone równocześnie.
7. Otworzyć panelem Y skróconą pomoc gracza oraz korzystać z istniejącego interfejsu Małpy do podglądu postępu i odkrytych kart.

## Kanoniczny kierunek progresji po Tier 1

```text
5/5 pierwszego ringu
→ pełna pierwsza podłoga
→ nowy etap
→ Piec
→ Piec produkuje Astro
→ gracz fizycznie odbiera Astro
→ dopiero potem aktywują się skorupy
→ sześć unikalnych skorup trafia do Pieca
→ Piec buduje Kulę Asterionową
→ gracz fizycznie odbiera Kulę
```

To jest wiążący **TARGET**, ale pełny przebieg nie jest jeszcze zaimplementowany jako `3.x`. Stare zachowanie „Tier 1 → natychmiastowy automatyczny Astro unlock” nie jest kanonem docelowej progresji; istniejącej mechaniki nie należy opisywać jako zatwierdzonego przejścia narracyjnego. Fizyczne odbiory Astro i Kuli są obowiązkowymi gate’ami, a skorupy nie mogą aktywować się przed odbiorem Astro.

## Zaimplementowane intro P0 i obowiązujące copy

Obecne doświadczenie gracza zaczyna się od kalibracji XR, radialnego odsłonięcia Małpy, pięciu glifów i kamienia, ciszy oraz trzech komunikatów orientacyjnych. Gracz otwiera Y, odwiedza sterowanie, zamyka panel, wskazuje Małpę i naciska trigger. Po zaproszeniu podąża za Małpą, podejmuje decyzję na progu i fizycznie wchodzi do kręgu. Po osadzeniu Małpy rozpoczyna się `GLYPH_FREE_EXPLORE`.

Gracz ma `60 s` swobodnej eksploracji. Pierwszy kryształ przed upływem czasu rozstrzyga discovery i zwraca uwagę Małpy. Bez sukcesu po `60 s` attention prowadzi do obowiązującej podpowiedzi:

- `Pięć znaków.`
- `Nie pytaj jeszcze, co znaczą.`
- `Dotknij jednego Szpilą.`

Pierwszy kryształ również po tej podpowiedzi rozstrzyga discovery. Małpa zwraca attention i mówi: `O, wydaje mi się, że można tego użyć.` Następnie trzysekundowe odsłonięcie udostępnia portal, canvas oczekiwania, relikwiarz oraz przyciski Activate i Release. Obowiązujące polskie copy portalu brzmi: `Osadź kryształ w naczyniu.`

To jest zaimplementowany kanon P0. Szczegóły fog shadera, promieni, warunków przejść, transformów i visibility należą wyłącznie do [VR Runtime Model](../technical/VR_RUNTIME_MODEL.md).
## Małpa — dostępne kanały komunikacji

### Komunikat inicjowany przez system/Małpę

- trzy animowane łuki attention z jednorazowym sygnałem audio;
- krótki panel wiadomości ustawianej przez runtime;
- osobny panel dialogowy, który może zostać otwarty programowo;
- `CARD_COMMITTED` nie uruchamia automatycznie attention; usunięto `CUE_MONKEY_AFTER_CARD_COMMIT`;
- contextual hint nadal może uruchamiać attention.

### Wybór użytkownika

- gracz trafia Małpę rzeczywistym zwykłym promieniem, aby otworzyć/zamknąć panel; pierwszy bezpośredni press kasuje pending attention również przy `dialogueOverride`;
- gracz trafia opcje panelu i zatwierdza je triggerem;
- obecna implementacja oferuje pytanie o postęp (gdy istnieje przynajmniej jedna karta) oraz zamknięcie. Mechanizm obsługuje interaktywny wybór, ale nie dostarcza drzewa fabularnego.

### Podgląd postępu/historii

- pytanie o postęp otwiera stronicowaną historię kart pochodzącą wyłącznie z `VrProgressionController`;
- można wybrać wyłącznie już odkrytą kartę, przeczytać jej istniejący zlokalizowany tekst, zmieniać strony i wrócić do historii/menu;
- nowo odkryte karty pulsują jako transient `unread` do pierwszego otwarcia. To stan UI bieżącego runtime’u, bez trwałego zapisu.

## Stan gracza po obecnym końcu progresji

Po zdobyciu Kuli gracz ma ukończony materiałowy stan Pieca `6/6`, stan produkcji `EARNED`, dostęp do obu niezależnych narzędzi dłoni oraz sterowania orientacją platformy. Zachowuje odkryte dotąd karty, aktywne panele/ringi podłogi, historię Małpy i dostęp do Pieca. Ambient ma wdrożone sekwencje progów oraz podpróg po ukończeniu skorup i zbudowaniu Kuli. Nie istnieje trwały save ani zaimplementowana progresja po Kuli. Docelowy mechaniczno-assetowy kontrakt pięciu par P4 ustanawia [VR Rune Stones Model](../technical/VR_RUNE_STONES_MODEL.md); narracyjne przejścia i pełny przebieg post-Sphere pozostają niezaprojektowane.

Zakres `UTWÓRZ`, mechaniki konstrukcji, panelowej transformacji i fizycznej materializacji jest **HARDWARE VALIDATED** na Meta Quest 3S. Poprawione pozycjonowanie produkowanej Kuli przez `VR_FURNACE_CONTENT_ANCHOR` jest **IMPLEMENTED**, lecz nadal **HARDWARE VALIDATION PENDING**; wcześniejszy wynik za panelem dotyczył stanu sprzed poprawki. Ciągłość konturu pozostaje **KNOWN QA ISSUE**.

## Następna przestrzeń projektowa

Poniższe obszary są **NIEZAPROJEKTOWANE / DO DECYZJI** i ten dokument ich nie rozstrzyga:

- narracja wejścia wykraczająca poza zaimplementowane intro P0;
- komunikaty Małpy pomiędzy etapami;
- pomoc przy utknięciu;
- dramaturgia odkrywania urządzeń;
- narracyjne przejścia i pełny authored przebieg progresji po Kuli Asteriona (mechaniczno-assetowy model kamieni P4 jest już zdefiniowany osobno);
- radar / sector targeting;
- małe glify;
- kolejne poziomy Przyciągacza;
- runy / Emanation Matrix;
- dalsze zdolności Astro.

## Twarde granice produktu

- Narracja może odczytywać progresję, lecz nie może przyznawać kart, materiałów, produkcji ani wyposażenia z pominięciem właścicieli runtime.
- Fizyczne handoffy i claim pozostają gameplayem wymagającym właściwego stanu, dłoni i realnego trafienia.
- Ten dokument rozstrzyga aktualne doświadczenie, prowadzenie i copy; techniczne ownerstwo oraz state machines rozstrzyga wyłącznie [VR Runtime Model](../technical/VR_RUNTIME_MODEL.md).
- Kod rozstrzyga **IMPLEMENTED**. Tylko jawne potwierdzenie Wizjonera na hardware może podnieść poprawiony element do **HARDWARE VALIDATED**.
