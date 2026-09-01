# Experience VR — kanoniczne teksty komunikacji

**Status:** CURRENT / canonical copy PL synchronized on 2026-09-01  
**Mechanika:** [`EXPERIENCE_VR_COMMUNICATION_MECHANICS.md`](EXPERIENCE_VR_COMMUNICATION_MECHANICS.md)

Runtime Monkey copy is authored as `blocks[]`. Each quotation below preserves one block as one bubble. `--- BLOCK ---` occurs only between separate array elements; a line break without that separator is an authored `\n` inside the same block.

## Progression — implemented early and Rune/Resonator entries

### `progression.threshold.crossed`
> No.
> Teraz jest łatwiej.

### `progression.crystal.firstCreated`
> Odpowiedział.

### `progression.card.first`
> Jedna.

### `progression.p2.smallGlyphsIntro`
> Znowu.
>
> --- BLOCK ---
>
> Świat odsunął to, czego szukasz.
>
> --- BLOCK ---
>
> Świat lubi odsuwać rzeczy.
> Ty nie musisz za nimi biegać.
>
> --- BLOCK ---
>
> Czasem wystarczy dostroić to, co już masz.
>
> --- BLOCK ---
>
> Astrolabium ma pasma.
> B zmienia to, czego słucha.
>
> --- BLOCK ---
>
> Widzisz te małe glify?
>
> --- BLOCK ---
>
> Małe rzeczy czasem prowadzą dalej niż duże.
>
> --- BLOCK ---
>
> Piec pomoże ci dostroić Astrolabium.
>
> --- BLOCK ---
>
> Wtedy duże glify znów będą mogły odpowiedzieć.
>
> --- BLOCK ---
>
> I kolejne karty także.

### `progression.p3.glyphsGone`
> No.
>
> --- BLOCK ---
>
> Tym razem naprawdę uciekły.
>
> --- BLOCK ---
>
> Nie widać ich. Nie słychać.

### `progression.p3.firstRuneInstalled`
> O.
>
> --- BLOCK ---
>
> Sam wiedział, gdzie ma trafić.
>
> --- BLOCK ---
>
> Teraz możesz kontrolować jedną część.
> Żeby znaleźć glify, potrzebujesz trzech.
>
> --- BLOCK ---
>
> Teraz odpowiada na Kulę.
>
> --- BLOCK ---
>
> Przytrzymaj chwyt nad sektorem.
> Nie puszczaj od razu.
>
> --- BLOCK ---
>
> Gdy już go przywiążesz, możesz nim sterować.
> Jak całą platformą.
>
> --- BLOCK ---
>
> No prawie...

### `progression.p3.firstSectorLock`
> No.
>
> --- BLOCK ---
>
> Teraz ruszasz częścią świata.

### `progression.p3.resonator`
> No dobrze.
>
> --- BLOCK ---
>
> Trzy razem zaczynają słuchać.
>
> --- BLOCK ---
>
> Chyba zbudowałeś Rezonator Asterionowy.
>
> --- BLOCK ---
>
> Radar mówiłby ci, gdzie coś jest.
>
> --- BLOCK ---
>
> To jest bardziej uparte.
>
> --- BLOCK ---
>
> Musisz zapytać przestrzeń we właściwym kierunku.
>
> --- BLOCK ---
>
> A teraz zapytaj świat.
> Może ci odpowie.

## Timed / situational hints

### `hint.crystal.whatNow.soft`
> Najpierw go weź.

### `hint.crystal.grab.medium`
> Chwyt.

### `hint.glyphs.how.soft`
> Wskaż znak.
> Spust. Przytrzymaj aż otrzymasz kryształ

### `hint.glyphs.how.strong`
> Dotknij glif Szpilą.
>
> --- BLOCK ---
>
> Przytrzymaj spust.
>
> --- BLOCK ---
>
> Wydobądź kryształ.

### `hint.reliquary.firstCrystal`
> Co możemy z tym zrobić…
>
> --- BLOCK ---
>
> Może potrzebuje naczynia.

### `hint.protoAstro.tuning`
> Małe glify są związane z dużymi.
>
> --- BLOCK ---
>
> Astrolabium potrafi przyciągnąć duże.
>
> --- BLOCK ---
>
> Gdy wie czego szukać.

### `hint.rune.noBinder.soft`
> Działa.
>
> --- BLOCK ---
>
> Tylko nie ma gdzie go przywiązać.

### `hint.rune.noBinder.medium`
> Spójrz na sektory.
> Ukończone posiadają zwornik.
>
> --- BLOCK ---
>
> On pozwoli Ci przywiązać kamień.

## Ordinary Monkey discovered-world knowledge

### `knowledge.p3.stonesLead` — `CO TERAZ?`
Question: `Zostały jeszcze kamienie.`

> Możemy patrzeć w niebo.
>
> --- BLOCK ---
>
> Albo sprawić, żeby to miejsce patrzyło dalej niż my.
>
> --- BLOCK ---
>
> Zostały jeszcze kamienie.

### `knowledge.p3.stones` — `CO TERAZ?`
Question: `KAMIENIE`

> Są daleko.
>
> --- BLOCK ---
>
> Piec potrafi stroić rzeczy.
>
> --- BLOCK ---
>
> Astrolabium potrafi je sprowadzać.
>
> --- BLOCK ---
>
> Sprawdźmy, czy to wystarczy.

### `knowledge.p3.binders` — `CO TO JEST?`
Question: `ZWORNIKI`

> Zworniki.
>
> --- BLOCK ---
>
> Pojawiały się, kiedy domykałeś te części platformy.
>
> --- BLOCK ---
>
> Wygląda na to, że nie są ozdobą.

## Acquisition — one-shot teaching

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
> Szpila i chwyt drugiej ręki pozwalają przejąć obiekt.

### Asterion
> To narzędzie do zmiany horyzontu.
> Nie przybliża tego, co jest daleko.
>
> --- BLOCK ---
>
> Zmienia to, skąd patrzysz.
> Dzięki temu dosięgniesz tego, czego wcześniej nie mogłeś.

## CURRENT OBJECTIVE — exact dynamic strings

- `2.30`: `UKOŃCZ PIERWSZY KRĄG — n/5`
- `3.80`: `ZGROMADŹ SKORUPY — n/6` or `ZBUDUJ KULĘ ASTERIONOWĄ` or `KULA ASTERIONOWA — PRODUKCJA` or `ODBIERZ KULĘ ASTERIONOWĄ`
- `4.10`: `UKOŃCZ DRUGI KRĄG — n/5`
- `4.70`, incomplete tuning: `DOSTRÓJ ASTROLABIUM — n/5 · UKOŃCZ TRZECI KRĄG — n/5`
- `4.70`, full tuning: `UKOŃCZ TRZECI KRĄG — n/5`
- `4.80`, no Resonator: `PRZYGOTUJ REZONATOR — STROJENIE n/3 · INSTALACJA n/3`
- `4.80`, Resonator exists, and `5.10`: no objective.

## Player Y — exact persistent tool copy

### PIEC
> Otwórz panel informacyjny Pieca i wybierz odpowiedni moduł lub operację.

> Otwórz komorę, gdy wkładasz lub odbierasz obiekt.
> Środkowy przycisk uruchamia proces dopiero, gdy Piec jest poprawnie przygotowany.
> Jeśli Piec odpycha wkładany obiekt, najpierw sprawdź wybraną operację.

### ASTROLABIUM WIĘZI
> To narzędzie do rzeczy, które są daleko,
> a chciałbyś, żeby były bliżej.

> A — wyposaż / schowaj
> Chwyt — namierzanie
> Spust — przyciąganie
> Szpila + chwyt drugiej ręki — przejęcie obiektu
> B — zmień pasmo celu

### KULA ASTERIONOWA
> To narzędzie do zmiany horyzontu.
> Nie przybliża tego, co jest daleko.
> Zmienia to, skąd patrzysz.
> Dzięki temu dosięgniesz tego, czego wcześniej nie mogłeś.

> X — wyposaż / schowaj
> Spust — zmieniaj orientację platformy
> Chwyt - przywiąż sektor i zmień jego położenie

## Player Y — exact WIEDZA copy

### SKORUPY
> Małe elementy tego świata

### KAMIENIE RUNICZNE
> Są daleko.
> Piec potrafi stroić rzeczy.
> Astrolabium potrafi je sprowadzać.
> Sprawdźmy, czy to wystarczy.

### ZWORNIKI
> Zworniki.
> Pojawiały się, kiedy domykałeś te części platformy.
> Wygląda na to, że nie są ozdobą.

### SEKTOR
> Spust — orientacja całej platformy
> Chwyt — połącz się z aktywnym sektorem
> Przytrzymaj strumień — zablokuj sektor
> Ruch dłoni — zmieniaj jego ustawienie
