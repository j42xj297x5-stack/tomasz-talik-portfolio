# Experience VR — kanoniczne teksty komunikacji

**Status:** CURRENT / canonical copy PL synchronized on 2026-09-11
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
>
> --- BLOCK ---
>
> Możemy patrzeć w niebo.
>
> --- BLOCK ---
>
> Albo sprawić, żeby to miejsce patrzyło dalej niż my.
>
> --- BLOCK ---
>
> Zostały jeszcze kamienie.
>
> --- BLOCK ---
>
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

The ten blocks form one uninterrupted attention-required progression communication after the existing delay. Successful completion marks the stone lead and practical Rune Stone direction taught/read; scheduling, attention and partial playback do not.

### `progression.p3.firstRuneInstalledWithAsterion` — WITH ASTERION
Variant is selected at actual playback start from current Asterion ownership.

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

### `progression.p3.firstRuneInstalledWithoutAsterion` — WITHOUT ASTERION
Variant is selected at actual playback start from current Asterion ownership.

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
> Tylko jeszcze nie masz czym jej poruszyć.
>
> --- BLOCK ---
>
> Potrzebujesz Kuli Asterionowej.
>
> --- BLOCK ---
>
> Zbuduj ją w Piecu.
>
> --- BLOCK ---
>
> Wtedy ten sektor zacznie odpowiadać na twoje ruchy.

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
Runtime: `AUTO_HINT → transient CO TERAZ? fallback`; shared issue slot: `first-crystal-pickup`.

> Najpierw go weź.

### `hint.crystal.grab.medium`
Runtime: `AUTO_HINT → transient CO TERAZ? fallback`; shared issue slot: `first-crystal-pickup`.

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
Runtime: `AUTO_HINT → transient CO TERAZ? fallback`; issue slot: `first-crystal-reliquary`.

> Co możemy z tym zrobić…
>
> --- BLOCK ---
>
> Może potrzebuje naczynia.

### `hint.reliquary.inserted`
Runtime: `AUTO_HINT → transient CO TERAZ? fallback`; shared issue slot: `reliquary-context`.

> Aktywuj Kryształ, odsłoń jego znaczenie.

### `hint.reliquary.active`
Runtime: `AUTO_HINT → transient CO TERAZ? fallback`; shared issue slot: `reliquary-context`.

> Można już go uwolnić. Spełnił swoją rolę.

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

### `hint.rune.noBinder.soft`
Runtime: `AUTO_HINT → transient CO TERAZ? fallback`; shared issue slot: `rune-no-binder`.

> Działa.
>
> --- BLOCK ---
>
> Tylko nie ma gdzie go przywiązać.

### `hint.rune.noBinder.medium`
Runtime: `AUTO_HINT → transient CO TERAZ? fallback`; shared issue slot: `rune-no-binder`.

> Spójrz na sektory.
> Ukończone posiadają zwornik.
>
> --- BLOCK ---
>
> On pozwoli Ci przywiązać kamień.

## Ordinary Monkey discovered-world knowledge

### `knowledge.p3.stonesLead` — `CO TERAZ?`
Question: `Zostały jeszcze kamienie.`

This copy remains catalogued as communication memory, but is not a required menu first-teaching gate after the post-Third-Ring progression speech completes.

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

Lifecycle: `READ` after successful completion of `progression.p3.glyphsGone`, persistently available as practical reference while its existing post-ring condition applies. The same completed-teaching state may expose Player Y `WIEDZA → KAMIENIE RUNICZNE`.

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

Lifecycle: the first live Keystone `ARRIVING → DOCKED` discovery exposes this topic as `NEW` only in Monkey. Successful deliberate playback of every block marks it read/taught, removes it from Monkey, and makes the same entry permanently available under Player Y `WIEDZA` for the remainder of the session. Physical discovery, selection, playback start and interrupted playback do not unlock the Player Y entry.

> Zworniki.
>
> --- BLOCK ---
>
> Pojawiały się, kiedy domykałeś te części platformy.
>
> --- BLOCK ---
>
> Wygląda na to, że nie są ozdobą.

### `knowledge.asterion.build` — `CO TERAZ?`
Question: `ZBUDUJ KULĘ ASTERIONOWĄ`

> Teraz zbieraj Skorupy.
> Potrzebujesz sześciu. Każdą przetwórz w Piecu.
> Gdy Piec przyjmie komplet, zbuduj Kulę Asterionową.

Available after physical Astrolabe ownership and before physical Asterion ownership. It is parallel to, rather than a replacement for, the ordinary Current Objective. Player Y `AKTUALNE ZADANIE` appends the same block as a secondary task during that interval.

### `knowledge.asterion.sphere` — `CO TO JEST?`
Question: `KULA ASTERIONOWA`

> To narzędzie do zmiany horyzontu.
> Nie przybliża tego, co jest daleko.
>
> --- BLOCK ---
>
> Zmienia to, skąd patrzysz.
> Dzięki temu dosięgniesz tego, czego wcześniej nie mogłeś.

Lifecycle: `NEW` after physical Astrolabe ownership, `READ` only after deliberate full playback, then persistently available.

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
>
> --- BLOCK ---
>
> Glify są dalej, niż możesz sięgnąć.
>
> --- BLOCK ---
>
> Czy odległość jest problemem?
>
> --- BLOCK ---
>
> Może nie trzeba przyciągać świata,
> tylko zmienić miejsce, z którego patrzysz.
>
> --- BLOCK ---
>
> Zmienić horyzont.
>
> --- BLOCK ---
>
> Piec może ci pomóc.
> Kula Asterionowa.
>
> --- BLOCK ---
>
> Nie przyciągnie glifów.
>
> --- BLOCK ---
>
> Pozwoli ci znów ich dotknąć.

The seven poetic blocks follow the unchanged Astrolabe control teaching in the same post-claim playback, without another attention gate.

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

This tool card and the `X` control reference are visible only after physical Asterion Sphere ownership (`EARNED`), not merely after equipment capability unlock.

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

This entry becomes available only after successful deliberate completion of Monkey `CO TO JEST? → ZWORNIKI`; physical Keystone discovery alone does not expose it. Monkey is the first teacher, and Player Y is persistent memory for the remainder of the session.

### SEKTOR
> Spust — orientacja całej platformy
> Chwyt — połącz się z aktywnym sektorem
> Przytrzymaj strumień — zablokuj sektor
> Ruch dłoni — zmieniaj jego ustawienie
