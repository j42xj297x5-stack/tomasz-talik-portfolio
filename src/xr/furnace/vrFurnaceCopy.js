const format = (template, values) => template.replace(/\{(\w+)\}/g, (_, key) => values[key]);

const createCopy = (copy) => Object.freeze({
  ...copy,
  home: Object.freeze({ ...copy.home, asterionAvailable: (absorbed) => format(copy.home.asterionAvailable, { absorbed }) }),
  runeTuning: Object.freeze({
    ...copy.runeTuning,
    familyCard: (family, syllable) => format(copy.runeTuning.familyCard, { family, syllable }),
    tuningStatus: (family, progress) => format(copy.runeTuning.tuningStatus, { family, progress }),
    progress: (progress) => format(copy.runeTuning.progress, { progress })
  }),
  production: Object.freeze({ ...copy.production, progress: (progress) => format(copy.production.progress, { progress }) }),
  extraction: Object.freeze({
    ...copy.extraction,
    glyph: (syllable) => format(copy.extraction.glyph, { syllable }),
    status: (processStatus) => format(copy.extraction.status, { processStatus }),
    progress: (progress) => format(copy.extraction.progress, { progress })
  }),
  sphere: Object.freeze({
    ...copy.sphere,
    monitorStatus: (processStatus) => format(copy.sphere.monitorStatus, { processStatus }),
    progress: (progress) => format(copy.sphere.progress, { progress })
  }),
  telemetry: Object.freeze(copy.telemetry)
});

export const VR_FURNACE_COPY = Object.freeze({
  pl: createCopy({
    home: { title: 'ASTRO PIEC', eyebrow: 'MODUŁY TRANSFORMACJI', asterionMetric: 'SKORUPY',
      asterionAvailable: '{absorbed} / 6   DOSTĘPNE', asterionStatusMetric: 'STATUS',
      asterionStates: { AVAILABLE: 'KULA GOTOWA // ODBIERZ', EARNED: 'KULA ASTERIONOWA // UTWORZONA' }, astrolabiumMetric: 'STATUS',
      astrolabiumStates: { AVAILABLE: 'GOTOWE // ODBIERZ', EARNED: 'STROJENIE', DEFAULT: 'WEJDŹ DO MODUŁU' } },
    navigation: { backModules: '← MODUŁY' },
    asterion: { title: 'SFERA ASTERIONOWA', detail: 'Rdzeń żyroskopowy sterowania kręgiem' },
    astrolabium: { title: 'ASTROLABIUM WIĘZI', detail: 'Narzędzie przyciągania i synchronizacji', menuEyebrow: 'NARZĘDZIA SYNCHRONIZACJI',
      menu: { create: ['UTWÓRZ ASTROLABIUM WIĘZI', 'Materializacja narzędzia w Astro Piecu'], glyphTuning: ['STROJENIE GLIFÓW', 'Trwała konfiguracja Małych Glifów'], runeTuning: ['STROJENIE KAMIENI RUNICZNYCH', 'Receptury rodzin Wu Xing'] } },
    runeTuning: { title: 'STROJENIE KAMIENI RUNICZNYCH', instruction: 'WYBIERZ DOCELOWĄ RODZINĘ KAMIENIA',
      families: { earth: 'ZIEMIA', metal: 'METAL', water: 'WODA', tree: 'DREWNO', fire: 'OGIEŃ', astro: 'ETER' },
      familyCard: '{family} // {syllable}', familyStates: { tuned: 'ZESTROJONA', selected: 'WYBRANA', special: 'SPECJALNY', available: 'DOSTĘPNA' },
      slots: { glyph: 'MAŁY GLIF', shell: 'SKORUPA' }, monitorHeading: 'PRZEBIEG STROJENIA', progress: '{progress}%', tuningStatus: 'STATUS // STROJENIE {family} // {progress}%',
      status: { waiting: 'STATUS // OCZEKIWANIE NA SKŁADNIKI', ready: 'STATUS // GOTOWA DO STROJENIA', invalid: 'STATUS // NIEPRAWIDŁOWA RECEPTURA', complete: 'STATUS // STROJENIE ZAKOŃCZONE' } },
    production: { heading: 'STAN PRODUKCJI', states: { READY: ['GOTOWE DO UTWORZENIA', 'Rozpocznij świadomie proces w Piecu.'], BUILDING: ['MATERIALIZACJA', 'Proces konstrukcji trwa w komorze.'], AVAILABLE: ['ASTROLABIUM GOTOWE', 'Otwórz komorę i odbierz obiekt.'], CLAIMING: ['PRZEKAZYWANIE', 'Fizyczny odbiór Astrolabium trwa.'], DEFAULT: ['NIEDOSTĘPNE', 'Stan produkcji jest poza kontraktem modułu.'] }, progress: '{progress}%' },
    action: { create: 'UTWÓRZ' },
    glyphTuning: { title: 'STROJENIE ASTROLABIUM', detail: 'Trwała konfiguracja Astrolabium Więzi', section: 'MAŁE GLIFY', states: { tuned: 'DOSTROJONY', processing: 'PRZETWARZANIE', ready: 'GOTOWY', inactive: 'NIEAKTYWNY' } },
    extraction: { heading: 'PRZEBIEG EKSTRAKCJI', glyph: 'MAŁY GLIF // {syllable}', glyphWaiting: 'MAŁY GLIF // OCZEKIWANIE', status: 'STATUS // {processStatus}', progress: '{progress}%', materialStates: { INSERTED: 'MATERIAŁ // GOTOWY', CONSUMING: 'MATERIAŁ // EKSTRAKCJA', CONSUMED: 'MATERIAŁ // ZABEZPIECZONO' } },
    sphere: { productionStates: { BUILDING: 'MATERIALIZACJA', AVAILABLE: ['KULA GOTOWA', 'OTWÓRZ KOMORĘ'], EARNED: ['UTWORZONA', 'KULA ASTERIONOWA'] }, completed: ['KULA ASTERIONOWA', 'STATUS // UTWORZONA'], monitorHeading: { constructing: 'MATERIALIZACJA KULI', absorbing: 'PRZEBIEG ABSORPCJI' }, constructionStates: ['STATUS // INICJACJA', 'STATUS // STABILIZACJA POLA', 'STATUS // FORMOWANIE', 'STATUS // KONDENSACJA'], monitorStatus: 'STATUS // {processStatus}', progress: '{progress}%', materialStates: { INSERTED: 'MATERIAŁ // GOTOWY', CONSUMING: 'MATERIAŁ // ABSORPCJA', CONSUMED: 'MATERIAŁ // ZABEZPIECZONO' }, preview: (absorbed) => `KULA ASTERIONOWA  ${absorbed}/6` },
    telemetry: { IDLE: 'GOTOWY — OCZEKIWANIE NA WKŁAD', PRESSING: 'INICJALIZACJA', SPINUP: 'ROZRUCH', STEADY: 'STABILIZACJA', EXTRACTION: 'EKSTRAKCJA', COOLDOWN: 'WYGASZANIE', COMPLETE: 'ESENCJA ZAPISANA W PAMIĘCI PIECA', INSERTED_OPEN: 'ZAMKNIJ POKRYWĘ\nI ROZPOCZNIJ EKSTRAKCJĘ', INSERTED_CLOSED: 'GOTOWY DO EKSTRAKCJI' }
  }),
  en: createCopy({
    home: { title: 'ASTRO FURNACE', eyebrow: 'MODULES OF TRANSFORMATION', asterionMetric: 'SHELLS', asterionAvailable: '{absorbed} / 6   AVAILABLE',
      asterionStatusMetric: 'STATUS', asterionStates: { AVAILABLE: 'SPHERE READY // COLLECT', EARNED: 'ASTERION SPHERE // CREATED' },
      astrolabiumMetric: 'STATUS', astrolabiumStates: { AVAILABLE: 'READY // COLLECT', EARNED: 'TUNING', DEFAULT: 'ENTER MODULE' } },
    navigation: { backModules: '← MODULES' }, asterion: { title: 'ASTERION SPHERE', detail: 'Gyroscopic ring-control core' },
    astrolabium: { title: 'ASTROLABE OF BINDING', detail: 'Attraction and synchronization tool', menuEyebrow: 'SYNCHRONIZATION TOOLS', menu: { create: ['BUILD THE ASTROLABE OF BINDING', 'Materialize the tool in the Astro Furnace'], glyphTuning: ['GLYPH TUNING', 'Permanent Small Glyph configuration'], runeTuning: ['TUNE THE RUNE STONES', 'Wu Xing family recipes'] } },
    runeTuning: { title: 'TUNE THE RUNE STONES', instruction: 'SELECT TARGET STONE FAMILY', families: { earth: 'EARTH', metal: 'METAL', water: 'WATER', tree: 'WOOD', fire: 'FIRE', astro: 'ETHER' }, familyCard: '{family} // {syllable}', familyStates: { tuned: 'TUNED', selected: 'SELECTED', special: 'SPECIAL', available: 'AVAILABLE' }, slots: { glyph: 'SMALL GLYPH', shell: 'SHELL' }, monitorHeading: 'TUNING PROGRESS', progress: '{progress}%', tuningStatus: 'STATUS // TUNING {family} // {progress}%', status: { waiting: 'STATUS // WAITING FOR INGREDIENTS', ready: 'STATUS // READY FOR TUNING', invalid: 'STATUS // INVALID RECIPE', complete: 'STATUS // TUNING COMPLETE' } },
    production: { heading: 'PRODUCTION STATUS', states: { READY: ['READY TO CREATE', 'Consciously begin the process in the Furnace.'], BUILDING: ['MATERIALIZATION', 'Construction is underway in the chamber.'], AVAILABLE: ['ASTROLABE READY', 'Open the chamber and collect the object.'], CLAIMING: ['TRANSFER', 'Physical retrieval of the Astrolabe is underway.'], DEFAULT: ['UNAVAILABLE', 'Production state is outside the module contract.'] }, progress: '{progress}%' }, action: { create: 'CREATE' },
    glyphTuning: { title: 'ASTROLABE TUNING', detail: 'Permanent Astrolabe of Binding configuration', section: 'SMALL GLYPHS', states: { tuned: 'TUNED', processing: 'PROCESSING', ready: 'READY', inactive: 'INACTIVE' } },
    extraction: { heading: 'EXTRACTION PROGRESS', glyph: 'SMALL GLYPH // {syllable}', glyphWaiting: 'SMALL GLYPH // WAITING', status: 'STATUS // {processStatus}', progress: '{progress}%', materialStates: { INSERTED: 'MATERIAL // PREPARED', CONSUMING: 'MATERIAL // EXTRACTION', CONSUMED: 'MATERIAL // CONTAINED' } },
    sphere: { productionStates: { BUILDING: 'MATERIALIZATION', AVAILABLE: ['SPHERE READY', 'OPEN CHAMBER'], EARNED: ['CREATED', 'ASTERION SPHERE'] }, completed: ['ASTERION SPHERE', 'STATUS // CREATED'], monitorHeading: { constructing: 'SPHERE MATERIALIZATION', absorbing: 'ABSORPTION PROGRESS' }, constructionStates: ['STATUS // INITIALIZATION', 'STATUS // FIELD STABILIZATION', 'STATUS // FORMING', 'STATUS // CONDENSATION'], monitorStatus: 'STATUS // {processStatus}', progress: '{progress}%', materialStates: { INSERTED: 'MATERIAL // PREPARED', CONSUMING: 'MATERIAL // ABSORPTION', CONSUMED: 'MATERIAL // CONTAINED' }, preview: (absorbed) => `ASTERION SPHERE  ${absorbed}/6` },
    telemetry: { IDLE: 'READY — WAITING FOR INPUT', PRESSING: 'INITIALIZATION', SPINUP: 'STARTUP', STEADY: 'STABILIZATION', EXTRACTION: 'EXTRACTION', COOLDOWN: 'SHUTDOWN', COMPLETE: 'ESSENCE STORED IN FURNACE MEMORY', INSERTED_OPEN: 'CLOSE THE LID\nAND START EXTRACTION', INSERTED_CLOSED: 'READY FOR EXTRACTION' }
  })
});

export const resolveVrFurnaceCopy = (locale = 'pl') => VR_FURNACE_COPY[locale] ?? VR_FURNACE_COPY.pl;
