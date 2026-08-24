export const VR_MONKEY_MESSAGE_TIMING = Object.freeze({ secondsPerLine: 2, gapSeconds: 0.5 });

export const VR_MONKEY_KNOWLEDGE_CATEGORIES_PL = Object.freeze({
  'category.whatNow': Object.freeze({ label: 'CO TERAZ?', groupId: 'currentGuidance' })
});

export const VR_MONKEY_COMMUNICATION_COPY_PL = Object.freeze({
  progression: Object.freeze({
    'progression.intro.firstPresence': { blocks: ['Dobrze.', 'Masz ręce.\nTo już więcej, niż ma większość problemów.'] },
    'progression.intro.openPlayerGuide': { blocks: ['Sprawdźmy tylko, gdzie co masz.'], prompt: 'Naciśnij Y, żeby wejść do menu.' },
    'progression.intro.afterPlayerGuide': { blocks: ['Jak zapomnisz — przypomnę.', 'Zobaczmy, czy świat cię słucha.', 'Wskaż mnie.'] },
    'progression.intro.triggerMonkey': { blocks: ['Teraz spust.'] },
    'progression.intro.pointerLearned': { blocks: ['Widzisz?\nJuż nauczyłeś świat, gdzie patrzysz.'] },
    'progression.intro.follow': { blocks: ['To chodź.'] },
    'progression.intro.followPause': { blocks: ['Idziesz?'] },
    'progression.threshold.crossed': { blocks: ['No.\nTeraz jest łatwiej.'] },
    'progression.glyphs.firstInstruction': { blocks: ['Pięć znaków.', 'Nie pytaj jeszcze, co znaczą.\nDotknij jednego Szpilą.'] },
    'progression.glyphs.firstDiscovery': { blocks: ['O, wydaje mi się, że można tego użyć.'] },
    'progression.crystal.firstCreated': { blocks: ['Odpowiedział.'] },
    'progression.reliquary.idea': { blocks: ['Co możemy z tym zrobić…  Hmm...', 'Może potrzebuje naczynia.'] },
    'progression.card.first': { blocks: ['Jedna.'] },
    'progression.postRing.changedWorld': { blocks: ['No i świat przestał być uprzejmy.', 'To, czego potrzebujesz, jest teraz poza zasięgiem.', 'Na szczęście nie na długo.'] },
    'progression.furnace.look': { blocks: ['Spójrz na Piec.', 'Tam coś na ciebie czeka.'] },
    'progression.p2.smallGlyphsIntro': { blocks: ['Znowu.', 'Świat odsunął to, czego szukasz.', 'Świat lubi odsuwać rzeczy.\nTy nie musisz za nim biegać.', 'Czasem wystarczy dostroić to, co już masz.', 'Astrolabium ma nowe pasmo.\nB zmienia to, czego słucha.', 'Pojawiły się małe glify.', 'Małe rzeczy czasem prowadzą dalej niż duże.', 'Piec pomoże ci dostroić Astrolabium.', 'Wtedy duże glify znów będą mogły odpowiedzieć.', 'I kolejne karty także.'] },
    'progression.p3.starsIntro': { blocks: ['Rozświetlasz to miejsce.\nAle glify lubią być w cieniu.', 'Możesz ich poszukać.\nNajpierw jednak przygotuj kolejne narzędzie.'] },
    'progression.p3.furnaceNewFunction': { blocks: ['Piec chyba ma nową funkcję.\nJeśli się nie mylę.'] },
    'progression.p3.firstSector': { blocks: ['Teraz możesz kontrolować jedną część.\nŻeby znaleźć glify, potrzebujesz trzech.'] },
    'progression.p3.antennaReady': { blocks: ['A teraz zapytaj świat.\nMoże ci odpowie.'] }
  }),
  tutorial: Object.freeze({ crystal: Object.freeze({
    pointerLearned: ['Widzisz?\nJuż nauczyłeś świat, gdzie patrzysz.'],
    instruction: 'A teraz złap kryształ i podaj go mnie.',
    handoff: ['Tak...', 'tego jeszcze nie możemy użyć.', 'Podstawy poznałeś.']
  }) }),
  decisions: Object.freeze({
    'decision.intro.go': { question: 'Idziesz?', options: ['IDĘ', 'DOKĄD?', 'NIE'] },
    'decision.intro.no': { blocks: ['Dobrze.\nNie każda droga musi być twoja.'] },
    'decision.threshold.enter': { blocks: ['Dalej jest próg.', 'Możesz go nie przekraczać.', 'Jeśli przekroczysz — wrócisz dopiero wtedy, kiedy droga się skończy.'], question: 'Wchodzisz?', options: ['PRZEKRACZAM PRÓG', 'CO JEST PO DRUGIEJ STRONIE?', 'WRACAM'] },
    'decision.threshold.return': { blocks: ['Mądra decyzja.', 'Albo tchórzliwa.', 'Czasem to ta sama decyzja.\nDopiero później wiadomo.'] }
  }),
  hints: Object.freeze({
    'hint.crystal.whatNow.soft': { blocks: ['Najpierw go weź.'] }, 'hint.crystal.grab.medium': { blocks: ['Chwyt.'] },
    'hint.glyphs.how.soft': { blocks: ['Wskaż znak.\nSpust. Przytrzymaj aż otrzymasz kryształ'] },
    'hint.reliquary.inserted': { blocks: ['Aktywuj Kryształ, odsłoń jego znaczenie.'] },
    'hint.reliquary.activate.soft': { blocks: ['Niektóre rzeczy trzeba obudzić.'] },
    'hint.reliquary.activate.medium': { blocks: ['Zobacz. Może coś się stanie.'] },
    'hint.reliquary.active': { blocks: ['Można już go uwolnić. Spełnił swoją rolę.'] },
    'hint.furnace.astroStart': { blocks: ['Otwórz panel informacyjny Pieca.', 'Wybierz moduł Astrolabium Więzi.', 'Zamknij komorę i użyj środkowego przycisku, gdy Piec jest poprawnie przygotowany.', 'Jeśli Piec odpycha obiekt, najpierw sprawdź wybraną operację.'] },
    'hint.furnace.astroAvailable': { blocks: ['Otwórz komorę i wyciągnij swoje narzędzie.', 'Złap je.'] }
  }),
  acquisition: Object.freeze({
    astro: Object.freeze({ blocks: ['To narzędzie do rzeczy, które są daleko,\na chciałbyś, żeby były bliżej.', 'Chwyt służy do namierzania.', 'Spust przyciąga namierzony obiekt.', 'Szpila i chwyt pozwalają przejąć obiekt.'] }),
    asterion: Object.freeze({ blocks: ['To narzędzie do zmiany horyzontu.\nNie przybliża tego, co jest daleko.', 'Zmienia to, skąd patrzysz.\nDzięki temu dosięgniesz tego, czego wcześniej nie mogłeś.'] })
  }),
  knowledge: Object.freeze({
    'knowledge.intro.where': { groupId: 'intro', policy: 'CONTEXTUAL', question: 'DOKĄD?', blocks: ['Gdybym ci powiedział, poszedłbyś do odpowiedzi.', 'A ja pytam, czy pójdziesz za mną.'] },
    'knowledge.threshold.otherSide': { groupId: 'threshold', policy: 'CONTEXTUAL', question: 'CO JEST PO DRUGIEJ STRONIE?', blocks: ['Po tej stronie pytasz.\nPo tamtej będziesz sprawdzał.'] },
    'knowledge.threshold.easier': { groupId: 'threshold', policy: 'CONTEXTUAL', question: 'DLACZEGO ŁATWIEJ?', blocks: ['Nie musisz już wybierać, czy wejść.'] }
  })
});
