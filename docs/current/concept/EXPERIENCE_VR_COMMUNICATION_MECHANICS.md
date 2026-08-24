# Experience VR — mechanika komunikacji z graczem

**Status:** CURRENT / canonical po G6
**Zakres:** Guidance, Małpa, panel Y i komunikacja gracza

## Podział odpowiedzialności

**Monkey first teacher.** Małpa jest właścicielem mandatory progression communication, sytuacyjnego attention, jednorazowego nauczania po acquisition, bieżącego `CO TERAZ?` oraz historii odkrytych kart. Nie jest trwałym magazynem praktycznej wiedzy o narzędziach.

**Player Y persistent memory.** Panel Y przechowuje trwałą wiedzę praktyczną o Piecu, Astrolabium Więzi i Kuli Asterionowej oraz pokazuje `AKTUALNE ZADANIE`. Guidance projektuje prawdę Scenario i domain owners; nie posiada gameplayu ani completion progresji.

## Jeden CURRENT OBJECTIVE

Jedynym ownerem modelu bieżącego celu jest `createVrCurrentObjectiveProjection`. Ta sama instancja i ten sam wynik `{ id, body }` zasilają `Y → AKTUALNE ZADANIE` oraz `Małpa → CO TERAZ?`.

Projection jest bezstanowy: czyta canonical point i aktualny domain state, nie ma timerów, nie zapisuje completion i działa tak samo w normalnym runtime, po hydration oraz direct activation. Dynamiczne przypadki:

| Point | Projekcja |
| --- | --- |
| `2.30` | `PIERWSZY KRĄG — n/5` |
| `3.80` | `ZGROMADŹ SKORUPY — n/6` → `ZBUDUJ KULĘ ASTERIONOWĄ` → `KULA ASTERIONOWA — PRODUKCJA` → `ODBIERZ KULĘ ASTERIONOWĄ` |
| `4.10` | `DRUGI KRĄG — n/5` |
| `4.70` | `DOSTRÓJ ASTROLABIUM — n/5 · TRZECI KRĄG — n/5`; po pełnym strojeniu tylko `TRZECI KRĄG — n/5` |

`CO TERAZ?` istnieje wyłącznie, gdy projection zwraca objective, pokazuje dokładnie jeden objective i nigdy nie otwiera pustej kategorii.

## Acquisition — jednorazowe pierwsze nauczanie

Dla Astro i Asteriona obowiązuje ten sam lifecycle:

```text
claim → około 5 s → checheszki / attention → kliknięcie Małpy
→ bezpośredni one-shot playback → completion → zwykła Małpa wraca do idle
```

Acquisition nie jest ordinary Monkey knowledge i nie otwiera automatycznie zwykłego menu. Po completion praktyczna instrukcja pozostaje permanentnie w Y, a ordinary menu Małpy nie otrzymuje trwałego tematu „co to jest?”. Hydration stanu już zdobytego narzędzia nie odtwarza acquisition.

## Timed Tool Guidance

- Po około 180 s bez rozpoczęcia produkcji Astro opcjonalny Furnace guidance sygnalizuje uwagę checheszkami, czeka na kliknięcie i odtwarza instrukcję.
- Po około 60 s, gdy Astro jest `AVAILABLE` i nie zostało odebrane, analogicznie dostępny jest optional claim guidance.
- Pending/attention znika, jeśli problem przestał istnieć przed kliknięciem; nieaktualna instrukcja nie jest odtwarzana.
- Optional Tool Guidance nie przejmuje otwartego ordinary menu Małpy; pozostaje pending i czeka.

## Arbitration komunikacji Małpy

Dialogue, attention i playback mają jawnego ownera. Priorytet jest ścisły:

```text
MANDATORY > ACQUISITION > OPTIONAL
```

- istnieje tylko jeden aktywny dialogue lease;
- actor może aktualizować, zwolnić lub wyczyścić wyłącznie swój stan;
- wyższy priorytet może wywłaszczyć niższy wyłącznie w `WAITING`/`ATTENTION`;
- rozpoczęty `PLAYBACK` jest niepreemptowalny;
- wywłaszczona komunikacja pozostaje pending, jeśli nadal jest relevant;
- semantic cancellation usuwa nieaktualny pending/attention;
- reset całego subsystemu Małpy może globalnie wyczyścić ownera, attention i dialogue.

## Dostępność Małpy z narzędziami

Małpa jest niezależnym communication interaction ownerem, a nie zwykłym world-ray targetem. Można targetować Małpę i obsługiwać jej panel obiema rękami w `NORMAL`, z wyposażonym Astro, z wyposażonym Asterionem oraz z oboma narzędziami jednocześnie. Nie wymaga to unequip ani zmiany hand mode.

Monkey hit ma lokalny priorytet nad Astro interaction i Asterion gyro input. Po opuszczeniu targetu narzędzia działają normalnie; kontrakt nie odsłania globalnie tool rays.

## Panel Y

Hierarchia nawigacji:

```text
MAIN_MENU → SECTION_DETAIL
MAIN_MENU → TOOL_LIST → TOOL_DETAIL
```

`Y` zamyka panel w `MAIN_MENU`, wraca do `MAIN_MENU` z `SECTION_DETAIL` i `TOOL_LIST`, a z `TOOL_DETAIL` wraca do `TOOL_LIST`.

Lista trwałych narzędzi to `PIEC`, `ASTROLABIUM WIĘZI`, `KULA ASTERIONOWA`. Piec pojawia się od faktycznego reveal Pieca; sama widoczność wpisu nie przyznaje capability jego używania. Astro i Asterion są widoczne zgodnie z odpowiednią acquired/capability truth.

## Odbiór narzędzi

Oba narzędzia odbiera się przez Grab/squeeze. Legalny ray lewej albo prawej ręki może wskazać Astro lub Asteriona, a Grab inicjuje claim. Astro trafia finalnie do prawego canonical slotu/ręki, Asterion do lewej canonical ręki. Guidance nie uczy, którą ręką trzeba odebrać narzędzie; późniejsze używanie nadal zachowuje własny handedness.

## Ordinary menu i stabilny kontrakt UI

Root zawiera `JAK MI IDZIE?` oraz warunkowe `CO TERAZ?`. Historia pokazuje `Odkryte karty: 0.` albo `Odkryte karty: {count}. Wybierz znak.`. Nie ma trwałych tematów Astro/Asteriona, `JAK DOSTROIĆ ASTROLABIUM?`, `CO DALEJ?` ani dawnych kategorii kontekstowych.

Navigation jest oddzielona spacingiem, bez separatora. Przycisk back/close uwzględnia pełny label. Długie dynamiczne etykiety są bounded i mogą być multiline; hit region odpowiada visual region, a paginacja uwzględnia dynamiczną wysokość itemów.
