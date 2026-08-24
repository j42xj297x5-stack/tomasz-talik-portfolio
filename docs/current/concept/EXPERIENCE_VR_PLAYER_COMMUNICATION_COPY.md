# Experience VR — kanoniczne teksty komunikacji

**Status:** CURRENT / canonical copy PL po G6
**Mechanika:** [`EXPERIENCE_VR_COMMUNICATION_MECHANICS.md`](EXPERIENCE_VR_COMMUNICATION_MECHANICS.md)

## Ownership copy

| Klasa | Powierzchnia i trwałość | Źródło |
| --- | --- | --- |
| A. PROGRESSION / MANDATORY COPY | Małpa; obowiązkowe beaty | `VR_MONKEY_COMMUNICATION_COPY_PL.progression`, `decisions` i tutorial |
| B. TIMED / SITUATIONAL HINT COPY | Małpa; ephemeral, tylko gdy relevant | `VR_MONKEY_COMMUNICATION_COPY_PL.hints` |
| C. ACQUISITION COPY | Małpa; one-shot first teaching po claim | `VR_MONKEY_COMMUNICATION_COPY_PL.acquisition` |
| D. CURRENT OBJECTIVE COPY | wspólny projection; Y + Małpa | `createVrCurrentObjectiveProjection` |
| E. PERSISTENT TOOL KNOWLEDGE | wyłącznie panel Y | `vrPlayerGuideContent.js` |

Te klasy mogą opisywać ten sam przedmiot w różnych momentach i celach, ale nie są konkurującymi trwałymi źródłami prawdy. Małpa nie ma persistent tool knowledge.

## A. Progression / mandatory

Aktywne mandatory copy jest przechowywane jako authored blocks w `vrMonkeyCommunicationCopy.js`. Blok jest jednostką autorską; jawne nowe linie są zachowane, nie ma `DALEJ`, a progression completion następuje dopiero po pełnym playback i finalnym gap. Ten katalog nie tworzy kopii objective ani instrukcji Y.

## B. Timed / situational hints

### `hint.furnace.astroStart`

> Otwórz panel informacyjny Pieca.
>
> --- BLOCK ---
>
> Wybierz moduł Astrolabium Więzi.
>
> --- BLOCK ---
>
> Zamknij komorę i użyj środkowego przycisku, gdy Piec jest poprawnie przygotowany.
>
> --- BLOCK ---
>
> Jeśli Piec odpycha obiekt, najpierw sprawdź wybraną operację.

### `hint.furnace.astroAvailable`

> Otwórz komorę i wyciągnij swoje narzędzie.
>
> --- BLOCK ---
>
> Złap je.

Pierwszy hint staje się należny po około 180 s bez rozpoczęcia produkcji Astro; drugi po około 60 s nieodebranego stanu `AVAILABLE`. Oba wymagają attention → click → playback, czekają na zamknięcie ordinary menu i są anulowane przed kliknięciem, gdy przestają być relevant.

## C. Acquisition — one-shot first teaching

### Astro

> To narzędzie do rzeczy, które są daleko,
> a chciałbyś, żeby były bliżej.
>
> --- BLOCK ---
>
> Chwyt służy do namierzania.
>
> --- BLOCK ---
>
> Spust przyciąga namierzony obiekt.
>
> --- BLOCK ---
>
> Szpila i chwyt pozwalają przejąć obiekt.

### Asterion

> To narzędzie do zmiany horyzontu.
> Nie przybliża tego, co jest daleko.
>
> --- BLOCK ---
>
> Zmienia to, skąd patrzysz.
> Dzięki temu dosięgniesz tego, czego wcześniej nie mogłeś.

Każda sekwencja występuje tylko po fizycznym claim: około 5 s → attention → kliknięcie Małpy → bezpośredni playback → completion. Nie otwiera ordinary menu i nie zostawia w nim trwałego pytania.

## D. CURRENT OBJECTIVE — wspólny Y + Małpa

Copy powstaje wyłącznie w `createVrCurrentObjectiveProjection`; dokument nie utrzymuje drugiej niezależnej mapy. Dynamiczne teksty CURRENT:

- `PIERWSZY KRĄG — n/5`;
- `ZGROMADŹ SKORUPY — n/6`;
- `ZBUDUJ KULĘ ASTERIONOWĄ`;
- `KULA ASTERIONOWA — PRODUKCJA`;
- `ODBIERZ KULĘ ASTERIONOWĄ`;
- `DRUGI KRĄG — n/5`;
- `DOSTRÓJ ASTROLABIUM — n/5 · TRZECI KRĄG — n/5`;
- `TRZECI KRĄG — n/5`.

Y przedstawia wynik jako `AKTUALNE ZADANIE`, a Małpa jako pojedynczy temat pod `CO TERAZ?`.

## E. Persistent tool knowledge — panel Y

Poniższe teksty są dokładną zawartością CURRENT `vrPlayerGuideContent.js`.

### PIEC

**Opis:**

> Otwórz panel informacyjny Pieca i wybierz odpowiedni moduł lub operację.

**Sterowanie:**

> Otwórz komorę, gdy wkładasz lub odbierasz obiekt.
> Środkowy przycisk uruchamia proces dopiero, gdy Piec jest poprawnie przygotowany.
> Jeśli Piec odpycha wkładany obiekt, najpierw sprawdź wybraną operację.

### ASTROLABIUM WIĘZI

**Opis:**

> To narzędzie do rzeczy, które są daleko,
> a chciałbyś, żeby były bliżej.

**Sterowanie:**

> A — wyposaż / schowaj
> Chwyt — namierzanie
> Spust — przyciąganie
> Szpila + chwyt — przejęcie obiektu

Po uzyskaniu capability zmiany pasma:

> B — zmień pasmo celu

### KULA ASTERIONOWA

**Opis:**

> To narzędzie do zmiany horyzontu.
> Nie przybliża tego, co jest daleko.
> Zmienia to, skąd patrzysz.
> Dzięki temu dosięgniesz tego, czego wcześniej nie mogłeś.

**Sterowanie:**

> X — wyposaż / schowaj
> Spust — zmieniaj orientację platformy

## Ordinary Monkey copy

Root zawiera `JAK MI IDZIE?` i, tylko gdy objective istnieje, `CO TERAZ?`. Historia używa dokładnie:

- `Odkryte karty: 0.`;
- `Odkryte karty: {count}. Wybierz znak.`.

Ordinary menu nie posiada persistent `co to jest?` dla Astro/Asteriona, strojenia Astrolabium, `CO DALEJ?` ani dawnych contextual topics.
