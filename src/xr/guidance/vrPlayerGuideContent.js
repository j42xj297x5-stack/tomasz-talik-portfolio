const VR_PLAYER_GUIDE_CONTENT = Object.freeze({
  pl: Object.freeze({
    title: 'Panel gracza',
    toolsSectionLabel: 'NARZĘDZIA',
    knowledgeSectionLabel: 'WIEDZA',
    items: Object.freeze([
      Object.freeze({ id: 'controls', label: 'STEROWANIE', body: 'Mapa podstawowych wejść kontrolerów.' }),
      Object.freeze({ id: 'current-task', label: 'AKTUALNE ZADANIE', body: 'Dokonaj wyboru.' })
    ]),
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
      sector: Object.freeze({ label: 'SEKTOR', body: 'Spust — orientacja całej platformy\nChwyt — połącz się z aktywnym sektorem\nPrzytrzymaj strumień — zablokuj sektor\nRuch dłoni — zmieniaj jego ustawienie' })
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
      sector: Object.freeze({ label: 'SECTOR', body: 'Trigger — orient the whole platform\nGrip — connect to the active Sector\nHold the beam — lock the Sector\nHand movement — change its position' })
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
