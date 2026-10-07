# Experience VR — Current Objectives

**Status:** CURRENT / IMPLEMENTED

This document is the single exact authority for the implemented ordinary Current Objective presentation, Scenario binding, identifiers, titles and explanatory PL/EN copy. The runtime implements this contract through one read-only projection of Scenario and domain truth.

## Runtime model

```js
{
  id,
  title,
  blocks
}
```

- `id` is the stable semantic objective identifier. A conditional variant has its own identifier.
- `title` is the compact task name, localized to the active language.
- `blocks` is the localized ordered array of short explanatory copy telling the player what to do. Every catalog entry below currently has one block; implementations must preserve the array contract rather than flattening it into `title`.
- The objective is a read-only projection of Scenario and existing domain truth. It does not own progression.

## Surface contract

The same semantic objective is projected differently on each surface:

### Monkey / `CO TERAZ?`

- The list entry shows `title`.
- Selecting the entry plays/shows `blocks` in order.

### Astrolabe of Binding objective display

- Show `title` only.
- Never show objective `blocks`.

### Player Y / `AKTUALNE ZADANIE`

- The main-menu entry remains `AKTUALNE ZADANIE` / `CURRENT TASK`.
- Opening it shows the actual objective `title`.
- Below the title, show the explanatory text derived from `blocks`.

Existing transient Monkey hint fallbacks, Asterion-build secondary guidance and Final Water hint guidance remain separate guidance mechanisms. This contract does not redesign them or fold them into the ordinary objective.

## Scenario binding

Objectives are listed in canonical Scenario traversal order:

```text
1.10 → 1.20 → 1.30 → 1.40 → 1.50 → 1.60 → 1.70 → 1.80 → 1.90
→ 1.100 → 1.110 → 1.120 → 1.130 → 2.10 → 2.20 → 2.30 → 2.40
→ 3.10 → 3.20 → 3.30 → 3.40 → 3.50 → 3.60 → 3.70
→ 4.10 → 4.20 → 4.30 → 4.40 → 4.50 → 4.60 → 4.70 → 4.75
→ 3.80 → 4.80 → 5.10 → 5.15 → 5.20 → 5.30 → 5.40 → 5.50
→ 5.60 → 5.70 → 5.80 → 6.10 → 6.20 → 6.30 → 100.10
```

The placement of `3.80` after `4.75` is intentional and follows the authored graph rather than numeric sorting.

### Binding corrections and conditional truth

- `4.75` is the automatic mandatory Third Ring completion presentation before the Asterion Sphere frontier. It is presentation-only and has **no ordinary Current Objective**.
- `3.80` owns one stable Asterion Sphere objective across Shell collection, construction and claim substates. Those substates must not replace its title.
- Resonator activation is not bound to `4.75`. It is bound to `5.10`, after the physical core Resonator exists.
- At `5.10`, read the existing Resonator field descriptor directly. When `fullActiveCore === false`, project `resonator-activate`; when `fullActiveCore === true`, project `resonator-missing-crystals`.
- Do not introduce a separate counter or readiness state for this split. `fullActiveCore` is authoritative because it already means that the installed Earth, Wood and Fire core channels are all active above level `0`.

## Canonical objective catalog

Each PL/EN `blocks` cell below is exactly one array element.

| Point / condition | `id` | PL `title` | EN `title` | PL `blocks[0]` | EN `blocks[0]` |
| --- | --- | --- | --- | --- | --- |
| `1.10` | `scenario-1.10` | `KALIBRACJA XR` | `XR CALIBRATION` | `Ustaw się wygodnie i zakończ kalibrację. Gdy wszystko będzie gotowe, doświadczenie rozpocznie się automatycznie.` | `Get comfortable and complete the calibration. The experience will begin automatically when everything is ready.` |
| `1.20` | `scenario-1.20` | `OBSERWUJ ŚWIAT` | `OBSERVE THE WORLD` | `Rozejrzyj się. Na razie nie musisz niczego robić.` | `Look around. You do not need to do anything yet.` |
| `1.30` | `scenario-1.30` | `OBSERWUJ ŚWIAT` | `OBSERVE THE WORLD` | `Daj światu chwilę. Zobacz, co pojawiło się wokół ciebie.` | `Give the world a moment. See what has appeared around you.` |
| `1.40` | `scenario-1.40` | `OTWÓRZ PANEL Y` | `OPEN THE PLAYER PANEL` | `Naciśnij Y. W panelu znajdziesz sterowanie, aktualne zadanie i później także zebraną wiedzę.` | `Press Y. The panel contains controls, your current task, and later the knowledge you have collected.` |
| `1.50` | `scenario-1.50` | `OTWÓRZ: STEROWANIE` | `OPEN: CONTROLS` | `Wejdź do sekcji STEROWANIE. Sprawdź podstawowe przyciski kontrolerów.` | `Open the CONTROLS section. Check the basic controller buttons.` |
| `1.60` | `scenario-1.60` | `ZAMKNIJ PANEL Y` | `CLOSE THE PLAYER PANEL` | `Zamknij panel i wróć do świata.` | `Close the panel and return to the world.` |
| `1.70` | `scenario-1.70` | `WSKAŻ MAŁPĘ` | `POINT AT THE MONKEY` | `Skieruj wskaźnik kontrolera na Małpę.` | `Point the controller pointer at the Monkey.` |
| `1.80` | `scenario-1.80` | `SPUST — MAŁPA` | `PRESS THE TRIGGER ON THE MONKEY` | `Trzymając wskaźnik na Małpie, naciśnij spust.` | `Keep the pointer on the Monkey and press the Trigger.` |
| `1.90` | `scenario-1.90` | `PODAJ KRYSZTAŁ MAŁPIE` | `BRING THE CRYSTAL TO THE MONKEY` | `Chwyć kryształ i przynieś go Małpie. Podejdź wystarczająco blisko, żeby mogła go odebrać.` | `Grab the crystal and bring it to the Monkey. Come close enough for it to take the crystal.` |
| `1.100` | `scenario-1.100` | `WYBIERZ ODPOWIEDŹ` | `CHOOSE YOUR RESPONSE` | `Posłuchaj Małpy i wybierz jedną z odpowiedzi. Od ciebie zależy, czy pójdziesz dalej.` | `Listen to the Monkey and choose one of the answers. It is up to you whether you continue.` |
| `1.110` | `scenario-1.110` | `IDŹ ZA MAŁPĄ` | `FOLLOW THE MONKEY` | `Podążaj za Małpą. Zaprowadzi cię do dalszej części świata.` | `Follow the Monkey. It will lead you farther into the world.` |
| `1.120` | `scenario-1.120` | `PRÓG — WYBIERZ` | `CHOOSE AT THE THRESHOLD` | `Podejdź do progu i zdecyduj, czy chcesz przejść dalej.` | `Approach the threshold and decide whether you want to continue.` |
| `1.130` | `scenario-1.130` | `WEJDŹ DO KRĘGU` | `ENTER THE RING` | `Przekrocz próg i wejdź do centralnego kręgu.` | `Cross the threshold and enter the central ring.` |
| `2.10` | `scenario-2.10` | `ZDOBĄDŹ PIERWSZY KRYSZTAŁ` | `GET YOUR FIRST CRYSTAL` | `Wybierz jeden z dużych glifów. Utrzymaj na nim działanie Szpili, aż pojawi się kryształ.` | `Choose one of the Large Glyphs. Keep the Pin on it until a crystal appears.` |
| `2.20` | `scenario-2.20` | `POROZMAWIAJ Z MAŁPĄ` | `TALK TO THE MONKEY` | `Podejdź do Małpy. Ma pomysł, co zrobić ze zdobytym kryształem.` | `Go to the Monkey. It has an idea about what to do with the crystal.` |
| `2.30` | `first-ring-progress` | `UKOŃCZ PIERWSZY KRĄG — n/5` | `COMPLETE THE FIRST RING — n/5` | `Zdobywaj kryształy z dużych glifów i umieszczaj je w Relikwiarzu. Odkryj wszystkie karty pierwszego kręgu.` | `Obtain crystals from the Large Glyphs and place them in the Reliquary. Discover every card in the first ring.` |
| `2.40` | `scenario-2.40` | `OBSERWUJ ZMIANĘ ŚWIATA` | `WATCH THE WORLD CHANGE` | `Pierwszy krąg jest ukończony. Rozejrzyj się i zobacz, co zmieniło się w świecie.` | `The first ring is complete. Look around and see what has changed in the world.` |
| `3.10` | `scenario-3.10` | `OBSERWUJ ZMIANĘ ŚWIATA` | `WATCH THE WORLD CHANGE` | `Spójrz dalej niż wcześniej. W świecie pojawiły się nowe obiekty.` | `Look farther than before. New objects have appeared in the world.` |
| `3.20` | `scenario-3.20` | `OBSERWUJ ZMIANĘ ŚWIATA` | `WATCH THE WORLD CHANGE` | `Daj zmianie się zakończyć. Nie musisz jeszcze niczego uruchamiać.` | `Let the change finish. You do not need to activate anything yet.` |
| `3.30` | `scenario-3.30` | `MAŁPA` | `MONKEY` | `Porozmawiaj z Małpą. Wyjaśni, co pojawiło się poza twoim zasięgiem.` | `Talk to the Monkey. It will explain what has appeared beyond your reach.` |
| `3.40` | `scenario-3.40` | `PIEC` | `FURNACE` | `Podejdź do Pieca. To tutaj będziesz przetwarzać znalezione obiekty.` | `Go to the Furnace. This is where you will process the objects you find.` |
| `3.50` | `scenario-3.50` | `ASTROLABIUM WIĘZI — UTWÓRZ W PIECU` | `BUILD THE ASTROLABE OF BINDING IN THE FURNACE` | `Otwórz panel Pieca i rozpocznij tworzenie Astrolabium Więzi.` | `Open the Furnace panel and begin building the Astrolabe of Binding.` |
| `3.60` | `scenario-3.60` | `ASTROLABIUM WIĘZI — PRODUKCJA` | `ASTROLABE OF BINDING — FORGING` | `Piec pracuje. Poczekaj, aż Astrolabium będzie gotowe.` | `The Furnace is working. Wait until the Astrolabe is ready.` |
| `3.70` | `scenario-3.70` | `ASTROLABIUM WIĘZI — ODBIERZ Z PIECA` | `COLLECT THE ASTROLABE OF BINDING FROM THE FURNACE` | `Otwórz komorę Pieca i odbierz gotowe Astrolabium Więzi.` | `Open the Furnace chamber and collect the finished Astrolabe of Binding.` |
| `4.10` | `second-ring-progress` | `UKOŃCZ DRUGI KRĄG — n/5` | `COMPLETE THE SECOND RING — n/5` | `Używaj Astrolabium i dużych glifów, aby zdobywać kolejne kryształy. Ukończ drugi zestaw kart.` | `Use the Astrolabe and the Large Glyphs to obtain more crystals. Complete the second set of cards.` |
| `4.20` | `scenario-4.20` | `OBSERWUJ ZMIANĘ ŚWIATA` | `WATCH THE WORLD CHANGE` | `Drugi krąg jest ukończony. Rozejrzyj się — świat znowu się zmienia.` | `The second ring is complete. Look around — the world is changing again.` |
| `4.30` | `scenario-4.30` | `OBSERWUJ ZMIANĘ ŚWIATA` | `WATCH THE WORLD CHANGE` | `W przestrzeni pojawiły się małe glify. Na razie zobacz, gdzie się znajdują i jak się poruszają.` | `Small Glyphs have appeared in space. For now, see where they are and how they move.` |
| `4.40` | `scenario-4.40` | `OBSERWUJ ZMIANĘ ŚWIATA` | `WATCH THE WORLD CHANGE` | `Daj nowym elementom świata osiąść na swoich miejscach.` | `Give the new elements of the world time to settle into place.` |
| `4.50` | `scenario-4.50` | `MAŁPA` | `MONKEY` | `Podejdź do Małpy. Ma dla ciebie kolejną wskazówkę.` | `Go to the Monkey. It has another clue for you.` |
| `4.60` | `scenario-4.60` | `MAŁPA` | `MONKEY` | `Posłuchaj Małpy. Dowiesz się, jak wykorzystać nowe obiekty i Astrolabium.` | `Listen to the Monkey. You will learn how to use the new objects and the Astrolabe.` |
| `4.70`, tuning incomplete | `astro-tuning-and-third-ring` | `DOSTRÓJ ASTROLABIUM — n/5 · UKOŃCZ TRZECI KRĄG — n/5` | `TUNE THE ASTROLABE — n/5 · COMPLETE THE THIRD RING — n/5` | `Wydobywaj wiedzę z małych glifów w Piecu. Jednocześnie zdobywaj kolejne kryształy i ukończ trzeci krąg.` | `Extract knowledge from the Small Glyphs in the Furnace. At the same time, obtain more crystals and complete the third ring.` |
| `4.70`, tuning complete | `third-ring-progress` | `UKOŃCZ TRZECI KRĄG — n/5` | `COMPLETE THE THIRD RING — n/5` | `Astrolabium jest już dostrojone. Pozostało ukończyć trzeci zestaw kart.` | `The Astrolabe is fully tuned. All that remains is to complete the third set of cards.` |
| `4.75` | — | **No ordinary Current Objective.** | **No ordinary Current Objective.** | — | — |
| `3.80` | `asterion-sphere` | `ZBUDUJ KULĘ ASTERIONOWĄ` | `BUILD THE ASTERION SPHERE` | `Znajduj Skorupy za pomocą Astrolabium Więzi. Każdą przetwórz w Piecu.` | `Find Shells using the Astrolabe of Binding. Process each one in the Furnace.` |
| `4.80` | `resonator-core` | `PRZYGOTUJ REZONATOR — STROJENIE n/3 · INSTALACJA n/3` | `AWAKEN THE RESONATOR — ATTUNEMENT n/3 · INSTALLATION n/3` | `Dostrój odpowiednie Kamienie Runiczne w Piecu. Przyciągnij je Astrolabium i zainstaluj w przygotowanych sektorach platformy. Gdy Ziemia, Drzewo i Ogień zostaną zainstalowane, powstanie podstawowy Rezonator Asterionowy.` | `Tune the required Rune Stones in the Furnace. Pull them in with the Astrolabe and install them in the prepared platform Sectors. When Earth, Wood, and Fire are installed, the basic Asterion Resonator will be formed.` |
| `5.10`, `fullActiveCore === false` | `resonator-activate` | `URUCHOM REZONATOR ASTERIONOWY` | `ACTIVATE THE ASTERION RESONATOR` | `Użyj chwytu nad sektorem aby zmienić ustawienie sektora platformy. Rezonator będzie gotowy do pracy, gdy minimalnie trzy sektory zostaną poruszone.` | `Use Grip over a Sector to change its setting on the platform. The Resonator will be ready to operate when at least three Sectors have been moved.` |
| `5.10`, `fullActiveCore === true` | `resonator-missing-crystals` | `UŻYJ REZONATORA, ABY ZDOBYĆ BRAKUJĄCE KRYSZTAŁY` | `USE THE RESONATOR TO GET THE MISSING CRYSTALS` | `Rezonator pozwala odnajdywać duże glify znajdujące się poza zwykłym zasięgiem. Steruj sektorami, namierzaj glify i ściągaj je Astrolabium, aby zdobywać kolejne kryształy. Równolegle możesz przygotowywać i instalować następne Kamienie Runiczne.` | `The Resonator can locate Large Glyphs beyond your normal reach. Control the Sectors, acquire the Glyphs, and pull them in with the Astrolabe to obtain more crystals. You can prepare and install the remaining Rune Stones in parallel.` |
| `5.15` | `scenario-5.15` | `NAMIERZ GLIF WODY` | `ACQUIRE THE WATER GLYPH` | `Użyj Rezonatora Asterionowego, aby odnaleźć glif Wody. Spróbuj uzyskać pełne namierzenie i ściągnąć go Astrolabium.` | `Use the Asterion Resonator to locate the Water Glyph. Try to acquire it fully and pull it in with the Astrolabe.` |
| `5.20` | `scenario-5.20` | `Zhakuj system` | `HACK THE SYSTEM` | `Tym razem zwykła droga nie wystarczyła. Porozmawiaj z Małpą — ma pomysł, jak obejść ograniczenie Rezonatora.` | `The usual route was not enough this time. Talk to the Monkey — it has an idea for getting around the Resonator's limitation.` |
| `5.30` | `scenario-5.30` | `Wykonaj strojenie kamienia Etheru` | `TUNE THE ETHER STONE` | `W Piecu wybierz strojenie Kamienia Etheru. Umieść w komorze wymagane składniki i uruchom proces.` | `Select Ether Stone tuning in the Furnace. Place the required ingredients in the chamber and start the process.` |
| `5.40` | `scenario-5.40` | `Zdobądź kamień Etheru` | `GET THE ETHER STONE` | `Kamień Etheru istnieje w świecie. Znajdź go i sprowadź do Małpy przy pomocy Astrolabium.` | `The Ether Stone exists in the world. Find it and bring it to the Monkey using the Astrolabe.` |
| `5.50` | `scenario-5.50` | `Zainstaluj ostatni kamień wody` | `INSTALL THE LAST WATER STONE` | `Droga do sektora Wody jest otwarta. Dostrój Kamień Wody, sprowadź go na platformę i zainstaluj w sektorze.` | `The path to the Water Sector is open. Tune the Water Stone, bring it to the platform, and install it in the Sector.` |
| `5.60` | `scenario-5.60` | `Ściągnij glif wody` | `PULL THE WATER GLYPH` | `Pełny Rezonator jest gotowy. Spróbuj namierzyć Wodę i obserwuj reakcję pola.` | `The full Resonator is ready. Try to acquire Water and watch how the field responds.` |
| `5.70` | `scenario-5.70` | `Skonfiguruj Rezonator aby ściągnąć glif wody` | `CONFIGURE THE RESONATOR TO PULL THE WATER GLYPH` | `Zestrój wszystkie sektory Rezonatora. Obserwuj kształt i zachowanie pola, a następnie ponownie namierz glif Wody. Gdy Rezonator osiągnie właściwą konfigurację, możliwe będzie pełne namierzenie i ściągnięcie glifu.` | `Tune all Resonator Sectors. Watch the shape and behavior of the field, then acquire the Water Glyph again. When the Resonator reaches the correct configuration, full acquisition and pulling the Glyph will become possible.` |
| `5.80` | `scenario-5.80` | `Dzięki` | `THX` | `Ostatnia karta została zdobyta. Podejdź do Małpy i posłuchaj jej po raz ostatni.` | `The final card has been obtained. Go to the Monkey and listen to it one last time.` |
| `6.10` | `scenario-6.10` | `Do zobaczenia` | `CU` | `Nie musisz już niczego naprawiać ani zdobywać. Obserwuj, co dzieje się ze światem.` | `There is nothing left to repair or obtain. Watch what happens to the world.` |
| `6.20` | `scenario-6.20` | `Dalej patrzysz do instrukcji ? ;)` | `ARE YOU STILL CHECKING THE INSTRUCTIONS? ;)` | `Serio? To już napisy końcowe.` | `Seriously? These are already the end credits.` |
| `6.30` | `scenario-6.30` | `Koniec` | `FIN` | `Zostań jeszcze chwilę. To ostatnia plansza Orange Monkey VR.` | `Stay a little longer. This is the final Orange Monkey VR slate.` |
| `100.10` | `scenario-100.10` | `KONIEC DOŚWIADCZENIA` | `EXPERIENCE COMPLETE` | `Doświadczenie zostało ukończone. Sesja VR za chwilę się zakończy.` | `The experience is complete. The VR session is about to end.` |

The `n` tokens in progress titles are live counts supplied by the existing authoritative domain projections; they do not belong in explanatory `blocks`.

At `5.60`, the objective deliberately encourages experimentation and observation. It must not expose the final configuration or explain why the pull is currently blocked.

## Finale surface behavior

- At `5.80`, the ordinary Current Objective may still exist normally.
- From `6.10` onward, existing finale communication owns the Monkey surface. Ordinary Monkey `CO TERAZ?` is therefore not expected to be interactively available.
- Do not add a special Monkey lock for this feature. Preserve existing dialogue-ownership behavior.
- Player Y may still be opened and may show the current objective `title` and explanatory text derived from `blocks` during the finale.
- This contract does not change finale mechanics, timings or transitions.

## Implementation boundary

`createVrCurrentObjectiveProjection` implements the canonical `{ id, title, blocks }` shape and supplies the same semantic objective to all three surfaces. Monkey projects the title and ordered blocks, the Astrolabe of Binding projects the title only, and Player Y projects the title with explanatory text derived from the blocks. The projection remains read-only and does not own progression.
