const VR_PLAYER_GUIDE_CONTENT = Object.freeze({
  pl: Object.freeze({
    title: 'Panel gracza',
    toolsSectionLabel: 'NARZĘDZIA',
    knowledgeSectionLabel: 'WIEDZA',
    items: Object.freeze([
      Object.freeze({ id: 'controls', label: 'STEROWANIE', body: 'Mapa podstawowych wejść kontrolerów.' }),
      Object.freeze({ id: 'current-task', label: 'AKTUALNE ZADANIE', body: 'Dokonaj wyboru.' })
    ]),
    asterionBuildTask: 'Teraz zbieraj Skorupy.\nPotrzebujesz sześciu. Każdą przetwórz w Piecu.\nGdy Piec przyjmie komplet, zbuduj Kulę Asterionową.',
    finalWaterBalanceTask: 'Zestrój sektory podobnie.\nSzukaj środka i symetrii.\nObserwuj reakcję pola.',
    finalWaterSolutionTask: 'USTAW REZONATOR:\nZiemia, Drzewo, Ogień — poziom 2.\nMetal — oba ustawienia 2.\nWoda — oba ustawienia 2.\nObserwuj pole. Gdy zacznie pulsować, namierz Wodę ponownie.',
    tools: Object.freeze({
      furnace: Object.freeze({
        label: 'PIEC',
        description: 'Otwórz panel informacyjny Pieca i wybierz odpowiedni moduł lub operację.',
        controls: 'Otwórz komorę, gdy wkładasz lub odbierasz obiekt.\nŚrodkowy przycisk uruchamia proces dopiero, gdy Piec jest poprawnie przygotowany.\nJeśli Piec odpycha wkładany obiekt, najpierw sprawdź wybraną operację.'
      }),
      astro: Object.freeze({
        label: 'ASTROLABIUM WIĘZI',
        description: 'To narzędzie do rzeczy, które są daleko,\na chciałbyś, żeby były bliżej.',
        controls: 'A — wyposaż / schowaj\nChwyt — namierzanie\nSpust — przyciąganie\nSzpila + chwyt drugiej ręki — przejęcie obiektu',
        bandSwitchControl: 'B — zmień pasmo celu'
      }),
      asterion: Object.freeze({
        label: 'KULA ASTERIONOWA',
        description: 'To narzędzie do zmiany horyzontu.\nNie przybliża tego, co jest daleko.\nZmienia to, skąd patrzysz.\nDzięki temu dosięgniesz tego, czego wcześniej nie mogłeś.',
        controls: 'X — wyposaż / schowaj\nSpust — zmieniaj orientację platformy\nChwyt - przywiąż sektor i zmień jego położenie'
      })
    }),
    knowledge: Object.freeze({
      shells: Object.freeze({ label: 'SKORUPY', body: 'Małe elementy tego świata' }),
      runeStones: Object.freeze({ label: 'KAMIENIE RUNICZNE', body: 'Są daleko.\nPiec potrafi stroić rzeczy.\nAstrolabium potrafi je sprowadzać.\nSprawdźmy, czy to wystarczy.' }),
      binders: Object.freeze({ label: 'ZWORNIKI', body: 'Zworniki.\nPojawiały się, kiedy domykałeś te części platformy.\nWygląda na to, że nie są ozdobą.' }),
      sector: Object.freeze({ label: 'SEKTOR', body: 'Spust — orientacja całej platformy\nChwyt — połącz się z aktywnym sektorem\nPrzytrzymaj strumień — zablokuj sektor\nRuch dłoni — zmieniaj jego ustawienie' }),
      resonator: Object.freeze({ label: 'REZONATOR ASTERIONOWY', body: 'Rezonator Asterionowy odnajduje Duże Glify.\nWyposaż Kulę. Przytrzymaj Chwyt i celuj w zasilony sektor przez 1 s.\nPo blokadzie nie puszczaj Chwytu. Ułożenie dłoni staje się punktem neutralnym.\nZIEMIA — skręt dłoni · lewa część pola.\nDRZEWO — skręt dłoni · prawa część pola.\nOGIEŃ — pochylenie dłoni · odległość pola.\nKażdy z trzech sektorów musi być ustawiony powyżej 0.\nJeśli choć jeden pozostaje na 0, Rezonator nie namierza.\nGlif w polu pokazuje znak i kolejne kręgi.\n3 kręgi — gotowy do ściągnięcia Astrolabium Więzi.' }),
      metalSector: Object.freeze({ label: 'SEKTOR METALU', body: 'Metal rozszerza pole Rezonatora.\nSkręt dłoni — rozszerza pole na boki.\nPochylenie dłoni — rozszerza pole w głąb.\nObie osie działają niezależnie.\nPoziom 0 — brak rozszerzenia.\nIm wyższy poziom, tym większy zasięg.\nMetal nie zastępuje Ziemi, Drzewa ani Ognia.\nRozszerza pole, które już tworzą.' }),
      waterSector: Object.freeze({ label: 'SEKTOR WODY', body: 'Woda stroi barwę i intensywność pola Rezonatora.\nSkręt dłoni — wybiera częstotliwość: zieloną, niebieską lub fioletową.\nPoziom 0 — barwa neutralna.\nPochylenie dłoni — zwiększa jasność i halo pola.\nObie osie działają niezależnie.\nBarwa nie jest poziomem mocy.\nWoda stroi pole, zamiast zmieniać jego zasięg.\nJej ustawienia uczestniczą w strojeniu pełnego Rezonatora.' })
    }),
    mainMenuHint: 'Lewy drążek — wybór · X — otwórz · Y — zamknij',
    toolListHint: 'Lewy drążek — wybór · X — otwórz · Y — wróć',
    sectionDetailHint: 'Y — wróć',
    toolDetailHint: 'Y — wróć',
    knowledgeListHint: 'Lewy drążek — wybór · X — otwórz · Y — wróć',
    knowledgeDetailHint: 'Y — wróć',
    controllersFallback: 'Schemat kontrolerów niedostępny.'
  }),
  en: Object.freeze({
    title: 'Player panel',
    toolsSectionLabel: 'TOOLS',
    knowledgeSectionLabel: 'KNOWLEDGE',
    items: Object.freeze([
      Object.freeze({ id: 'controls', label: 'CONTROLS', body: 'Basic controller input map.' }),
      Object.freeze({ id: 'current-task', label: 'CURRENT TASK', body: 'Make a choice.' })
    ]),
    asterionBuildTask: 'Now collect Shells.\nYou need six. Process each one in the Furnace.\nOnce the Furnace has taken the full set, build the Asterion Sphere.',
    finalWaterBalanceTask: 'Tune the Sectors similarly.\nLook for the middle and symmetry.\nWatch how the field responds.',
    finalWaterSolutionTask: 'SET THE RESONATOR:\nEarth, Wood, Fire — level 2.\nMetal — both settings at 2.\nWater — both settings at 2.\nWatch the field. When it starts to pulse, acquire Water again.',
    tools: Object.freeze({
      furnace: Object.freeze({
        label: 'FURNACE',
        description: 'Open the Furnace information panel and select the appropriate module or operation.',
        controls: 'Open the chamber when inserting or retrieving an object.\nThe middle button starts the process only when the Furnace is prepared correctly.\nIf the Furnace rejects an inserted object, check the selected operation first.'
      }),
      astro: Object.freeze({
        label: 'ASTROLABE OF BINDING',
        description: "A tool for things beyond your reach,\nwhen you'd rather draw them nearer.",
        controls: 'A — equip / stow\nGrip — target\nTrigger — pull\nPin + other hand’s Grip — take control of object',
        bandSwitchControl: 'B — change target band'
      }),
      asterion: Object.freeze({
        label: 'ASTERION SPHERE',
        description: 'A tool for changing the horizon.\nIt does not bring distant things closer.\nIt changes where you look from.\nThat lets you reach what you could not before.',
        controls: 'X — equip / stow\nTrigger — change platform orientation\nGrip - bind a Sector and change its position'
      })
    }),
    knowledge: Object.freeze({
      shells: Object.freeze({ label: 'SHELLS', body: 'Small pieces of this world' }),
      runeStones: Object.freeze({ label: 'RUNE STONES', body: 'They are far away.\nThe Furnace can tune things.\nThe Astrolabe can bring them in.\nLet us see if that is enough.' }),
      binders: Object.freeze({ label: 'KEYSTONES', body: 'Keystones.\nThey appeared when you completed those parts of the platform.\nIt seems they are not decoration.' }),
      sector: Object.freeze({ label: 'SECTOR', body: 'Trigger — orient the whole platform\nGrip — connect to the active Sector\nHold the beam — lock the Sector\nHand movement — change its position' }),
      resonator: Object.freeze({ label: 'ASTERION RESONATOR', body: 'The Asterion Resonator finds Large Glyphs.\nEquip the Sphere. Hold Grip and aim at a powered Sector for 1 s.\nOnce it locks, keep holding Grip. Your hand pose becomes the neutral point.\nEARTH — twist your wrist · left side of the field.\nWOOD — twist your wrist · right side of the field.\nFIRE — tilt your hand · field depth.\nAll three Sectors must be set above 0.\nIf even one stays at 0, the Resonator cannot acquire targets.\nA glyph inside the field reveals its sign and builds rings.\n3 rings — ready to pull with the Astrolabe of Binding.' }),
      metalSector: Object.freeze({ label: 'METAL SECTOR', body: 'Metal extends the Resonator field.\nTwist your wrist — extend the field sideways.\nTilt your hand — extend the field in depth.\nThe two axes work independently.\nLevel 0 — no extension.\nHigher levels give greater reach.\nMetal does not replace Earth, Wood, or Fire.\nIt extends the field they already create.' }),
      waterSector: Object.freeze({ label: 'WATER SECTOR', body: "Water tunes the Resonator field's hue and intensity.\nTwist your wrist — choose the frequency: green, blue, or violet.\nLevel 0 — neutral hue.\nTilt your hand — increase the field's brightness and halo.\nThe two axes work independently.\nHue is not a power level.\nWater tunes the field instead of changing its reach.\nIts settings are part of tuning the complete Resonator." })
    }),
    mainMenuHint: 'Left stick — select · X — open · Y — close',
    toolListHint: 'Left stick — select · X — open · Y — back',
    sectionDetailHint: 'Y — back',
    toolDetailHint: 'Y — back',
    knowledgeListHint: 'Left stick — select · X — open · Y — back',
    knowledgeDetailHint: 'Y — back',
    controllersFallback: 'Controller diagram unavailable.'
  })
});

export function resolveVrPlayerGuideContent(locale = 'en') {
  return VR_PLAYER_GUIDE_CONTENT[locale] ?? VR_PLAYER_GUIDE_CONTENT.en;
}

export { VR_PLAYER_GUIDE_CONTENT };
