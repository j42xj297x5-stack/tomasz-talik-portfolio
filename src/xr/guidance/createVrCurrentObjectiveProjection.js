import { experienceVrPageIdsByTier } from '../../content/experienceVrPages.js';
import { PROTO_ASTRO_NATURAL_FAMILY_CODES } from '../protoAstro/protoAstroRegistry.js';
import { VR_EXPERIENCE_POINT } from '../progression/vrExperienceScenario.js';

const STATIC_OBJECTIVES_BY_POINT = Object.freeze({
  '1.10': { pl: ['KALIBRACJA XR', 'Ustaw się wygodnie i zakończ kalibrację. Gdy wszystko będzie gotowe, doświadczenie rozpocznie się automatycznie.'], en: ['XR CALIBRATION', 'Get comfortable and complete the calibration. The experience will begin automatically when everything is ready.'] },
  '1.20': { pl: ['OBSERWUJ ŚWIAT', 'Rozejrzyj się. Na razie nie musisz niczego robić.'], en: ['OBSERVE THE WORLD', 'Look around. You do not need to do anything yet.'] },
  '1.30': { pl: ['OBSERWUJ ŚWIAT', 'Daj światu chwilę. Zobacz, co pojawiło się wokół ciebie.'], en: ['OBSERVE THE WORLD', 'Give the world a moment. See what has appeared around you.'] },
  '1.40': { pl: ['OTWÓRZ PANEL Y', 'Naciśnij Y. W panelu znajdziesz sterowanie, aktualne zadanie i później także zebraną wiedzę.'], en: ['OPEN THE PLAYER PANEL', 'Press Y. The panel contains controls, your current task, and later the knowledge you have collected.'] },
  '1.50': { pl: ['OTWÓRZ: STEROWANIE', 'Wejdź do sekcji STEROWANIE. Sprawdź podstawowe przyciski kontrolerów.'], en: ['OPEN: CONTROLS', 'Open the CONTROLS section. Check the basic controller buttons.'] },
  '1.60': { pl: ['ZAMKNIJ PANEL Y', 'Zamknij panel i wróć do świata.'], en: ['CLOSE THE PLAYER PANEL', 'Close the panel and return to the world.'] },
  '1.70': { pl: ['WSKAŻ MAŁPĘ', 'Skieruj wskaźnik kontrolera na Małpę.'], en: ['POINT AT THE MONKEY', 'Point the controller pointer at the Monkey.'] },
  '1.80': { pl: ['SPUST — MAŁPA', 'Trzymając wskaźnik na Małpie, naciśnij spust.'], en: ['PRESS THE TRIGGER ON THE MONKEY', 'Keep the pointer on the Monkey and press the Trigger.'] },
  '1.90': { pl: ['PODAJ KRYSZTAŁ MAŁPIE', 'Chwyć kryształ i przynieś go Małpie. Podejdź wystarczająco blisko, żeby mogła go odebrać.'], en: ['BRING THE CRYSTAL TO THE MONKEY', 'Grab the crystal and bring it to the Monkey. Come close enough for it to take the crystal.'] },
  '1.100': { pl: ['WYBIERZ ODPOWIEDŹ', 'Posłuchaj Małpy i wybierz jedną z odpowiedzi. Od ciebie zależy, czy pójdziesz dalej.'], en: ['CHOOSE YOUR RESPONSE', 'Listen to the Monkey and choose one of the answers. It is up to you whether you continue.'] },
  '1.110': { pl: ['IDŹ ZA MAŁPĄ', 'Podążaj za Małpą. Zaprowadzi cię do dalszej części świata.'], en: ['FOLLOW THE MONKEY', 'Follow the Monkey. It will lead you farther into the world.'] },
  '1.120': { pl: ['PRÓG — WYBIERZ', 'Podejdź do progu i zdecyduj, czy chcesz przejść dalej.'], en: ['CHOOSE AT THE THRESHOLD', 'Approach the threshold and decide whether you want to continue.'] },
  '1.130': { pl: ['WEJDŹ DO KRĘGU', 'Przekrocz próg i wejdź do centralnego kręgu.'], en: ['ENTER THE RING', 'Cross the threshold and enter the central ring.'] },
  '2.10': { pl: ['ZDOBĄDŹ PIERWSZY KRYSZTAŁ', 'Wybierz jeden z dużych glifów. Utrzymaj na nim działanie Szpili, aż pojawi się kryształ.'], en: ['GET YOUR FIRST CRYSTAL', 'Choose one of the Large Glyphs. Keep the Pin on it until a crystal appears.'] },
  '2.20': { pl: ['POROZMAWIAJ Z MAŁPĄ', 'Podejdź do Małpy. Ma pomysł, co zrobić ze zdobytym kryształem.'], en: ['TALK TO THE MONKEY', 'Go to the Monkey. It has an idea about what to do with the crystal.'] },
  '2.40': { pl: ['OBSERWUJ ZMIANĘ ŚWIATA', 'Pierwszy krąg jest ukończony. Rozejrzyj się i zobacz, co zmieniło się w świecie.'], en: ['WATCH THE WORLD CHANGE', 'The first ring is complete. Look around and see what has changed in the world.'] },
  '3.10': { pl: ['OBSERWUJ ZMIANĘ ŚWIATA', 'Spójrz dalej niż wcześniej. W świecie pojawiły się nowe obiekty.'], en: ['WATCH THE WORLD CHANGE', 'Look farther than before. New objects have appeared in the world.'] },
  '3.20': { pl: ['OBSERWUJ ZMIANĘ ŚWIATA', 'Daj zmianie się zakończyć. Nie musisz jeszcze niczego uruchamiać.'], en: ['WATCH THE WORLD CHANGE', 'Let the change finish. You do not need to activate anything yet.'] },
  '3.30': { pl: ['MAŁPA', 'Porozmawiaj z Małpą. Wyjaśni, co pojawiło się poza twoim zasięgiem.'], en: ['MONKEY', 'Talk to the Monkey. It will explain what has appeared beyond your reach.'] },
  '3.40': { pl: ['PIEC', 'Podejdź do Pieca. To tutaj będziesz przetwarzać znalezione obiekty.'], en: ['FURNACE', 'Go to the Furnace. This is where you will process the objects you find.'] },
  '3.50': { pl: ['ASTROLABIUM WIĘZI — UTWÓRZ W PIECU', 'Otwórz panel Pieca i rozpocznij tworzenie Astrolabium Więzi.'], en: ['BUILD THE ASTROLABE OF BINDING IN THE FURNACE', 'Open the Furnace panel and begin building the Astrolabe of Binding.'] },
  '3.60': { pl: ['ASTROLABIUM WIĘZI — PRODUKCJA', 'Piec pracuje. Poczekaj, aż Astrolabium będzie gotowe.'], en: ['ASTROLABE OF BINDING — FORGING', 'The Furnace is working. Wait until the Astrolabe is ready.'] },
  '3.70': { pl: ['ASTROLABIUM WIĘZI — ODBIERZ Z PIECA', 'Otwórz komorę Pieca i odbierz gotowe Astrolabium Więzi.'], en: ['COLLECT THE ASTROLABE OF BINDING FROM THE FURNACE', 'Open the Furnace chamber and collect the finished Astrolabe of Binding.'] },
  '4.20': { pl: ['OBSERWUJ ZMIANĘ ŚWIATA', 'Drugi krąg jest ukończony. Rozejrzyj się — świat znowu się zmienia.'], en: ['WATCH THE WORLD CHANGE', 'The second ring is complete. Look around — the world is changing again.'] },
  '4.30': { pl: ['OBSERWUJ ZMIANĘ ŚWIATA', 'W przestrzeni pojawiły się małe glify. Na razie zobacz, gdzie się znajdują i jak się poruszają.'], en: ['WATCH THE WORLD CHANGE', 'Small Glyphs have appeared in space. For now, see where they are and how they move.'] },
  '4.40': { pl: ['OBSERWUJ ZMIANĘ ŚWIATA', 'Daj nowym elementom świata osiąść na swoich miejscach.'], en: ['WATCH THE WORLD CHANGE', 'Give the new elements of the world time to settle into place.'] },
  '4.50': { pl: ['MAŁPA', 'Podejdź do Małpy. Ma dla ciebie kolejną wskazówkę.'], en: ['MONKEY', 'Go to the Monkey. It has another clue for you.'] },
  '4.60': { pl: ['MAŁPA', 'Posłuchaj Małpy. Dowiesz się, jak wykorzystać nowe obiekty i Astrolabium.'], en: ['MONKEY', 'Listen to the Monkey. You will learn how to use the new objects and the Astrolabe.'] },
  '3.80': { id: 'asterion-sphere', pl: ['ZBUDUJ KULĘ ASTERIONOWĄ', 'Znajduj Skorupy za pomocą Astrolabium Więzi. Każdą przetwórz w Piecu.'], en: ['BUILD THE ASTERION SPHERE', 'Find Shells using the Astrolabe of Binding. Process each one in the Furnace.'] },
  '5.15': { pl: ['NAMIERZ GLIF WODY', 'Użyj Rezonatora Asterionowego, aby odnaleźć glif Wody. Spróbuj uzyskać pełne namierzenie i ściągnąć go Astrolabium.'], en: ['ACQUIRE THE WATER GLYPH', 'Use the Asterion Resonator to locate the Water Glyph. Try to acquire it fully and pull it in with the Astrolabe.'] },
  '5.20': { pl: ['Zhakuj system', 'Tym razem zwykła droga nie wystarczyła. Porozmawiaj z Małpą — ma pomysł, jak obejść ograniczenie Rezonatora.'], en: ['HACK THE SYSTEM', "The usual route was not enough this time. Talk to the Monkey — it has an idea for getting around the Resonator's limitation."] },
  '5.30': { pl: ['Wykonaj strojenie kamienia Etheru', 'W Piecu wybierz strojenie Kamienia Etheru. Umieść w komorze wymagane składniki i uruchom proces.'], en: ['TUNE THE ETHER STONE', 'Select Ether Stone tuning in the Furnace. Place the required ingredients in the chamber and start the process.'] },
  '5.40': { pl: ['Zdobądź kamień Etheru', 'Kamień Etheru istnieje w świecie. Znajdź go i sprowadź do Małpy przy pomocy Astrolabium.'], en: ['GET THE ETHER STONE', 'The Ether Stone exists in the world. Find it and bring it to the Monkey using the Astrolabe.'] },
  '5.50': { pl: ['Zainstaluj ostatni kamień wody', 'Droga do sektora Wody jest otwarta. Dostrój Kamień Wody, sprowadź go na platformę i zainstaluj w sektorze.'], en: ['INSTALL THE LAST WATER STONE', 'The path to the Water Sector is open. Tune the Water Stone, bring it to the platform, and install it in the Sector.'] },
  '5.60': { pl: ['Ściągnij glif wody', 'Pełny Rezonator jest gotowy. Spróbuj namierzyć Wodę i obserwuj reakcję pola.'], en: ['PULL THE WATER GLYPH', 'The full Resonator is ready. Try to acquire Water and watch how the field responds.'] },
  '5.70': { pl: ['Skonfiguruj Rezonator aby ściągnąć glif wody', 'Zestrój wszystkie sektory Rezonatora. Obserwuj kształt i zachowanie pola, a następnie ponownie namierz glif Wody. Gdy Rezonator osiągnie właściwą konfigurację, możliwe będzie pełne namierzenie i ściągnięcie glifu.'], en: ['CONFIGURE THE RESONATOR TO PULL THE WATER GLYPH', 'Tune all Resonator Sectors. Watch the shape and behavior of the field, then acquire the Water Glyph again. When the Resonator reaches the correct configuration, full acquisition and pulling the Glyph will become possible.'] },
  '5.80': { pl: ['Dzięki', 'Ostatnia karta została zdobyta. Podejdź do Małpy i posłuchaj jej po raz ostatni.'], en: ['THX', 'The final card has been obtained. Go to the Monkey and listen to it one last time.'] },
  '6.10': { pl: ['Do zobaczenia', 'Nie musisz już niczego naprawiać ani zdobywać. Obserwuj, co dzieje się ze światem.'], en: ['CU', 'There is nothing left to repair or obtain. Watch what happens to the world.'] },
  '6.20': { pl: ['Dalej patrzysz do instrukcji ? ;)', 'Serio? To już napisy końcowe.'], en: ['ARE YOU STILL CHECKING THE INSTRUCTIONS? ;)', 'Seriously? These are already the end credits.'] },
  '6.30': { pl: ['Koniec', 'Zostań jeszcze chwilę. To ostatnia plansza Orange Monkey VR.'], en: ['FIN', 'Stay a little longer. This is the final Orange Monkey VR slate.'] },
  '100.10': { pl: ['KONIEC DOŚWIADCZENIA', 'Doświadczenie zostało ukończone. Sesja VR za chwilę się zakończy.'], en: ['EXPERIENCE COMPLETE', 'The experience is complete. The VR session is about to end.'] }
});

const DYNAMIC_OBJECTIVES = Object.freeze({
  'first-ring-progress': { pl: [({ count, total }) => `UKOŃCZ PIERWSZY KRĄG — ${count}/${total}`, 'Zdobywaj kryształy z dużych glifów i umieszczaj je w Relikwiarzu. Odkryj wszystkie karty pierwszego kręgu.'], en: [({ count, total }) => `COMPLETE THE FIRST RING — ${count}/${total}`, 'Obtain crystals from the Large Glyphs and place them in the Reliquary. Discover every card in the first ring.'] },
  'second-ring-progress': { pl: [({ count, total }) => `UKOŃCZ DRUGI KRĄG — ${count}/${total}`, 'Używaj Astrolabium i dużych glifów, aby zdobywać kolejne kryształy. Ukończ drugi zestaw kart.'], en: [({ count, total }) => `COMPLETE THE SECOND RING — ${count}/${total}`, 'Use the Astrolabe and the Large Glyphs to obtain more crystals. Complete the second set of cards.'] },
  'astro-tuning-and-third-ring': { pl: [({ tunedCount, tunedTotal, ringCount, ringTotal }) => `DOSTRÓJ ASTROLABIUM — ${tunedCount}/${tunedTotal} · UKOŃCZ TRZECI KRĄG — ${ringCount}/${ringTotal}`, 'Wydobywaj wiedzę z małych glifów w Piecu. Jednocześnie zdobywaj kolejne kryształy i ukończ trzeci krąg.'], en: [({ tunedCount, tunedTotal, ringCount, ringTotal }) => `TUNE THE ASTROLABE — ${tunedCount}/${tunedTotal} · COMPLETE THE THIRD RING — ${ringCount}/${ringTotal}`, 'Extract knowledge from the Small Glyphs in the Furnace. At the same time, obtain more crystals and complete the third ring.'] },
  'third-ring-progress': { pl: [({ count, total }) => `UKOŃCZ TRZECI KRĄG — ${count}/${total}`, 'Astrolabium jest już dostrojone. Pozostało ukończyć trzeci zestaw kart.'], en: [({ count, total }) => `COMPLETE THE THIRD RING — ${count}/${total}`, 'The Astrolabe is fully tuned. All that remains is to complete the third set of cards.'] },
  'resonator-core': { pl: [({ tuned, installed, total }) => `PRZYGOTUJ REZONATOR — STROJENIE ${tuned}/${total} · INSTALACJA ${installed}/${total}`, 'Dostrój odpowiednie Kamienie Runiczne w Piecu. Przyciągnij je Astrolabium i zainstaluj w przygotowanych sektorach platformy. Gdy Ziemia, Drzewo i Ogień zostaną zainstalowane, powstanie podstawowy Rezonator Asterionowy.'], en: [({ tuned, installed, total }) => `AWAKEN THE RESONATOR — ATTUNEMENT ${tuned}/${total} · INSTALLATION ${installed}/${total}`, 'Tune the required Rune Stones in the Furnace. Pull them in with the Astrolabe and install them in the prepared platform Sectors. When Earth, Wood, and Fire are installed, the basic Asterion Resonator will be formed.'] },
  'resonator-activate': { pl: ['URUCHOM REZONATOR ASTERIONOWY', 'Użyj chwytu nad sektorem aby zmienić ustawienie sektora platformy. Rezonator będzie gotowy do pracy, gdy minimalnie trzy sektory zostaną poruszone.'], en: ['ACTIVATE THE ASTERION RESONATOR', 'Use Grip over a Sector to change its setting on the platform. The Resonator will be ready to operate when at least three Sectors have been moved.'] },
  'resonator-missing-crystals': { pl: ['UŻYJ REZONATORA, ABY ZDOBYĆ BRAKUJĄCE KRYSZTAŁY', 'Rezonator pozwala odnajdywać duże glify znajdujące się poza zwykłym zasięgiem. Steruj sektorami, namierzaj glify i ściągaj je Astrolabium, aby zdobywać kolejne kryształy. Równolegle możesz przygotowywać i instalować następne Kamienie Runiczne.'], en: ['USE THE RESONATOR TO GET THE MISSING CRYSTALS', 'The Resonator can locate Large Glyphs beyond your normal reach. Control the Sectors, acquire the Glyphs, and pull them in with the Astrolabe to obtain more crystals. You can prepare and install the remaining Rune Stones in parallel.'] }
});

export function createVrCurrentObjectiveProjection({ locale, getCurrentPointId, getActivatedPageIds,
  getExtractedFamilyCodes, getRuneProgressionSnapshot, getResonatorDescriptor }) {
  if ([getCurrentPointId, getActivatedPageIds, getExtractedFamilyCodes, getRuneProgressionSnapshot,
    getResonatorDescriptor].some((dependency) => typeof dependency !== 'function')) {
    throw new TypeError('Current objective projection dependencies must be functions.');
  }
  function countActivatedPages(tier) {
    const activated = new Set(getActivatedPageIds());
    return experienceVrPageIdsByTier[tier].filter((pageId) => activated.has(pageId)).length;
  }
  const objective = (id, source, values = {}) => {
    const [titleSource, block] = source?.[locale] ?? [];
    if (!titleSource || !block) return null;
    const title = typeof titleSource === 'function' ? titleSource(values) : titleSource;
    return Object.freeze({ id, title, blocks: Object.freeze([block]) });
  };
  function getCurrentObjective() {
    const pointId = getCurrentPointId();
    if (pointId === VR_EXPERIENCE_POINT['4.75']) return null;
    if (pointId === VR_EXPERIENCE_POINT['2.30']) return objective('first-ring-progress', DYNAMIC_OBJECTIVES['first-ring-progress'],
      { count: countActivatedPages(1), total: experienceVrPageIdsByTier[1].length });
    if (pointId === VR_EXPERIENCE_POINT['4.10']) return objective('second-ring-progress', DYNAMIC_OBJECTIVES['second-ring-progress'],
      { count: countActivatedPages(2), total: experienceVrPageIdsByTier[2].length });
    if (pointId === VR_EXPERIENCE_POINT['4.70']) {
      const tunedCount = getExtractedFamilyCodes().length; const tunedTotal = PROTO_ASTRO_NATURAL_FAMILY_CODES.length;
      const ringCount = countActivatedPages(3); const ringTotal = experienceVrPageIdsByTier[3].length;
      return tunedCount < tunedTotal
        ? objective('astro-tuning-and-third-ring', DYNAMIC_OBJECTIVES['astro-tuning-and-third-ring'], { tunedCount, tunedTotal, ringCount, ringTotal })
        : objective('third-ring-progress', DYNAMIC_OBJECTIVES['third-ring-progress'], { count: ringCount, total: ringTotal });
    }
    if (pointId === VR_EXPERIENCE_POINT['4.80']) {
      if (getResonatorDescriptor().resonatorExists) return null;
      const { tunedRuneFamilies, installedRuneFamilies } = getRuneProgressionSnapshot();
      const coreFamilies = ['K', 'R', 'L'];
      return objective('resonator-core', DYNAMIC_OBJECTIVES['resonator-core'], {
        tuned: coreFamilies.filter((family) => tunedRuneFamilies.includes(family)).length,
        installed: coreFamilies.filter((family) => installedRuneFamilies.includes(family)).length,
        total: coreFamilies.length
      });
    }
    if (pointId === VR_EXPERIENCE_POINT['5.10']) {
      const id = getResonatorDescriptor().fullActiveCore === true
        ? 'resonator-missing-crystals' : 'resonator-activate';
      return objective(id, DYNAMIC_OBJECTIVES[id]);
    }
    const source = STATIC_OBJECTIVES_BY_POINT[pointId];
    return source ? objective(source.id ?? `scenario-${pointId}`, source) : null;
  }
  return Object.freeze({ getCurrentObjective });
}
