# Experience VR — Narrative & Progression Baseline

Status: canonical entrypoint synchronized with HEAD on 2026-08-10 for the next narrative and gameplay-progression design stage. Runtime detail remains in [`VR_RUNTIME_MODEL.md`](../technical/VR_RUNTIME_MODEL.md).

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

## Aktualna progresja gameplayowa

```text
wejście → duże glify → kryształy → relikwiarz / odkryte karty
→ komplet Tier 1 → Astro Przyciągacz + pole 18 skorup
→ przejęcie sześciu typów skorup → Astro Piec / absorpcja 6/6
→ UTWÓRZ / konstrukcja Kuli → AVAILABLE → odebranie → EARNED
→ Kula Asteriona i sterowanie orientacją platformy
```

To jest kolejność mechaniczna, nie fabularna. Runtime nie definiuje jeszcze narracyjnych przejść pomiędzy tymi etapami.

## Zaimplementowane intro P0

HEAD zawiera już ograniczoną, autorską sekwencję wejścia P0; nie wolno jej cofać do wcześniejszego modelu ani opisywać całego wejścia jako niezaprojektowanego. Po kalibracji XR następują radialne odsłonięcie mgły i cisza, onboarding panelu Y/sekcji sterowania, wskazanie Małpy i trigger, zaproszenie, `FOLLOWING`, wybór na progu, fizyczne wejście gracza do kręgu, `MONKEY_SETTLING`, a następnie `GLYPH_FREE_EXPLORE` z opóźnioną podpowiedzią attention przy braku sukcesu.

Jest to obecna mechanika i copy P0, nie kompletna narracja całego doświadczenia. Ruch wykorzystuje istniejący `monkeyMotionRoot`, wraca do kanonicznego transformu nadanego przez obecny layout i nie redefiniuje `ANCHOR_MONKEY`.

## Małpa — dostępne kanały komunikacji

### Komunikat inicjowany przez system/Małpę

- trzy animowane łuki attention z jednorazowym sygnałem audio;
- krótki panel wiadomości ustawianej przez runtime;
- osobny panel dialogowy, który może zostać otwarty programowo;
- po commicie karty runtime zgłasza attention. Kanał istnieje, ale nie ma zaprojektowanej sekwencji narracyjnej.

### Wybór użytkownika

- gracz trafia Małpę rzeczywistym zwykłym promieniem, aby otworzyć/zamknąć panel;
- gracz trafia opcje panelu i zatwierdza je triggerem;
- obecna implementacja oferuje pytanie o postęp (gdy istnieje przynajmniej jedna karta) oraz zamknięcie. Mechanizm obsługuje interaktywny wybór, ale nie dostarcza drzewa fabularnego.

### Podgląd postępu/historii

- pytanie o postęp otwiera stronicowaną historię kart pochodzącą wyłącznie z `VrProgressionController`;
- można wybrać wyłącznie już odkrytą kartę, przeczytać jej istniejący zlokalizowany tekst, zmieniać strony i wrócić do historii/menu;
- nowo odkryte karty pulsują jako transient `unread` do pierwszego otwarcia. To stan UI bieżącego runtime’u, bez trwałego zapisu.

## Stan gracza po obecnym końcu progresji

Po zdobyciu Kuli gracz ma ukończony materiałowy stan Pieca `6/6`, stan produkcji `EARNED`, dostęp do obu niezależnych narzędzi dłoni oraz sterowania orientacją platformy. Zachowuje odkryte dotąd karty, aktywne panele/ringi podłogi, historię Małpy i dostęp do Pieca. Ambient ma wdrożone sekwencje progów oraz podpróg po ukończeniu skorup i zbudowaniu Kuli. Nie istnieje trwały save ani zaprojektowana progresja po Kuli.

Zakres `UTWÓRZ`, mechaniki konstrukcji, panelowej transformacji i fizycznej materializacji jest **HARDWARE VALIDATED** na Meta Quest 3S. Poprawione pozycjonowanie produkowanej Kuli przez `VR_FURNACE_CONTENT_ANCHOR` jest **IMPLEMENTED**, lecz nadal **HARDWARE VALIDATION PENDING**; wcześniejszy wynik za panelem dotyczył stanu sprzed poprawki. Ciągłość konturu pozostaje **KNOWN QA ISSUE**.

## Następna przestrzeń projektowa

Poniższe obszary są **NIEZAPROJEKTOWANE / DO DECYZJI** i ten dokument ich nie rozstrzyga:

- narracja wejścia wykraczająca poza zaimplementowane intro P0;
- komunikaty Małpy pomiędzy etapami;
- pomoc przy utknięciu;
- dramaturgia odkrywania urządzeń;
- progresja po Kuli Asteriona;
- radar / sector targeting;
- małe glify;
- kolejne poziomy Przyciągacza;
- runy / Emanation Matrix;
- dalsze zdolności Astro.

## Twarde granice

- `ANCHOR_MONKEY` pozostaje istniejącą kotwicą scene/layout, a `monkeyMotionRoot` właścicielem ruchu intro. Przygotowane punkty wewnątrz assetów — postaciowy `MONKEY_ANCHOR` oraz kamienne `MONKEY_STONE_ROOT` / `MONKEY_SEAT_ANCHOR` — należą do innego poziomu semantycznego i nie mogą zastępować kotwicy layoutu.
- Osobne assety `monkey.glb` i `monkey_stone.glb` oraz ich zatwierdzony kontrakt kotwic przygotowują następny etap osadzenia Małpy na kamieniu bez magicznych offsetów. Runtime nie integruje jeszcze kamienia, nie preloaduje go, nie parentuje assetów i nie rozstrzyga algorytmu dopasowania. W HEAD kamień eksportuje oba punkty; eksport Małpy nadal nie pokazuje zadeklarowanego `MONKEY_ANCHOR`, więc ten konflikt artefaktu musi zostać wyjaśniony przed integracją, bez obchodzenia go zmianą `ANCHOR_MONKEY`.

- `VrProgressionController` jest jedynym właścicielem odkrytych kart i ukończenia tierów; narracja może ten stan odczytać, ale nie może go zastępować ani commitować bokiem.
- `VrAstroFurnaceProgressionController` jest właścicielem sześciu slotów materiałowych; produkcja Kuli ma odrębny stan `LOCKED → READY → BUILDING → AVAILABLE → EARNED`.
- `createVrHandModeController` jest właścicielem equip/unequip obu dłoni, a gyro jest właścicielem PREVIEW/COMMAND/CURRENT. Narracja nie może omijać ich bramek.
- Fizyczne handoffy i claim wymagają rzeczywistego trafienia ograniczonym promieniem oraz właściwej dłoni/stanu; przyszłe komunikaty nie mogą przyznawać przedmiotów zamiast gameplayu.
- `VR_FURNACE_CONTENT_ANCHOR` i wspólny helper placementu są kanoniczną bazą zawartości i produktów Pieca. Procesy skorupy i konstrukcji korzystają ze wspólnego 18-sekundowego drivera; narracja nie steruje jego zegarem ani commitem.
- Kod rozstrzyga **IMPLEMENTED**. Tylko potwierdzenie Wizjonera na hardware może podnieść nowy lub poprawiony element do **HARDWARE VALIDATED**.
