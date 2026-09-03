export const VR_MONKEY_MESSAGE_TIMING = Object.freeze({ secondsPerLine: 2, gapSeconds: 0.5 });

export const VR_MONKEY_KNOWLEDGE_CATEGORIES_PL = Object.freeze({
  'category.whatNow': Object.freeze({ label: 'CO TERAZ?', groupId: 'currentGuidance' }),
  'category.whatIsIt': Object.freeze({ label: 'CO TO JEST?', groupId: 'discoveredWorld' })
});

export const VR_MONKEY_COMMUNICATION_COPY_PL = Object.freeze({
  progression: Object.freeze({
    'progression.intro.firstPresence': { blocks: ['Dobrze.', 'Masz ręce.\nTo już więcej, niż ma większość problemów.'] },
    'progression.intro.openPlayerGuide': { blocks: ['Sprawdźmy tylko, gdzie co masz.'], prompt: 'Naciśnij Y, żeby wejść do menu.' },
    'progression.intro.afterPlayerGuide': { blocks: ['Jak zapomnisz — przypomnę.', 'Zobaczmy, czy świat cię słucha.', 'Wskaż mnie.'] },
    'progression.intro.triggerMonkey': { blocks: ['Teraz spust.'] },
    'progression.intro.pointerLearned': { blocks: ['Widzisz?\nJuż nauczyłeś świat, gdzie patrzysz.'] },
    'progression.intro.followPause': { blocks: ['Idziesz?'] },
    'progression.threshold.crossed': { blocks: ['No.\nTeraz jest łatwiej.'] },
    'progression.glyphs.firstInstruction': { blocks: ['Pięć znaków.', 'Nie pytaj jeszcze, co znaczą.\nDotknij jednego Szpilą.'] },
    'progression.glyphs.firstDiscovery': { blocks: ['O, wydaje mi się, że można tego użyć.'] },
    'progression.crystal.firstCreated': { blocks: ['Odpowiedział.'] },
    'progression.reliquary.idea': { blocks: ['Co możemy z tym zrobić…', 'Może potrzebuje naczynia.'] },
    'progression.card.first': { blocks: ['Jedna.'] },
    'progression.postRing.changedWorld': { blocks: ['No i świat przestał być uprzejmy.', 'To, czego potrzebujesz, jest teraz poza zasięgiem.', 'Na szczęście nie na długo.'] },
    'progression.furnace.look': { blocks: ['Spójrz na Piec.', 'Tam coś na ciebie czeka.'] },
    'progression.p2.smallGlyphsIntro': { blocks: ['Znowu.', 'Świat odsunął to, czego szukasz.', 'Świat lubi odsuwać rzeczy.\nTy nie musisz za nimi biegać.', 'Czasem wystarczy dostroić to, co już masz.', 'Astrolabium ma pasma.\nB zmienia to, czego słucha.', 'Widzisz te małe glify?', 'Małe rzeczy czasem prowadzą dalej niż duże.', 'Piec pomoże ci dostroić Astrolabium.', 'Wtedy duże glify znów będą mogły odpowiedzieć.', 'I kolejne karty także.'] },
    'progression.p3.glyphsGone': { blocks: ['No.', 'Tym razem naprawdę uciekły.', 'Nie widać ich. Nie słychać.'] },
    'progression.p3.firstRuneInstalled': { blocks: ['O.', 'Sam wiedział, gdzie ma trafić.', 'Teraz możesz kontrolować jedną część.\nŻeby znaleźć glify, potrzebujesz trzech.', 'Teraz odpowiada na Kulę.', 'Przytrzymaj chwyt nad sektorem.\nNie puszczaj od razu.', 'Gdy już go przywiążesz, możesz nim sterować.\nJak całą platformą.', 'No prawie...'] },
    'progression.p3.firstSectorLock': { blocks: ['No.', 'Teraz ruszasz częścią świata.'] },
    'progression.p3.resonator': { blocks: ['No dobrze.', 'Trzy razem zaczynają słuchać.', 'Chyba zbudowałeś Rezonator Asterionowy.', 'Radar mówiłby ci, gdzie coś jest.', 'To jest bardziej uparte.', 'Musisz zapytać przestrzeń we właściwym kierunku.', 'A teraz zapytaj świat.\nMoże ci odpowie.'] },
    'progression.p4.etherIntervention': { blocks: ['Cztery.', 'Została Woda.', 'Tylko że jej sektor nie ma jak się domknąć.', 'Normalnie powiedziałbym, że utknęliśmy.', 'Na szczęście normalnie już dawno przestało tu działać.', 'Jest jeszcze jeden kamień.', 'Nie należy do tej piątki.', 'Eter.', 'Może właśnie dlatego się przyda.'] },
    'progression.p4.waterPathOpen': { blocks: ['No.', 'To powinno wystarczyć.', 'Spójrz na Wodę.', 'Teraz ma się czego trzymać.'] }
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
    'hint.glyphs.how.strong': { blocks: ['Dotknij glif Szpilą.', 'Przytrzymaj spust.', 'Wydobądź kryształ.'] },
    'hint.reliquary.firstCrystal': { blocks: ['Co możemy z tym zrobić…', 'Może potrzebuje naczynia.'] },
    'hint.protoAstro.tuning': { blocks: ['Małe glify są związane z dużymi.', 'Astrolabium potrafi przyciągnąć duże.', 'Gdy wie czego szukać.'] },
    'hint.reliquary.inserted': { blocks: ['Aktywuj Kryształ, odsłoń jego znaczenie.'] },
    'hint.reliquary.active': { blocks: ['Można już go uwolnić. Spełnił swoją rolę.'] },
    'hint.furnace.astroStart': { blocks: ['Otwórz panel informacyjny Pieca.', 'Wybierz moduł Astrolabium Więzi.', 'Zamknij komorę i użyj środkowego przycisku, gdy Piec jest poprawnie przygotowany.', 'Jeśli Piec odpycha obiekt, najpierw sprawdź wybraną operację.'] },
    'hint.furnace.astroAvailable': { blocks: ['Otwórz komorę i wyciągnij swoje narzędzie.', 'Złap je.'] },
    'hint.rune.noBinder.soft': { blocks: ['Działa.', 'Tylko nie ma gdzie go przywiązać.'] },
    'hint.rune.noBinder.medium': { blocks: ['Spójrz na sektory.\nUkończone posiadają zwornik.', 'On pozwoli Ci przywiązać kamień.'] }
  }),
  acquisition: Object.freeze({
    astro: Object.freeze({ blocks: ['To narzędzie do rzeczy, które są daleko,\na chciałbyś, żeby były bliżej.', 'Chwyt służy do namierzania.', 'Spust przyciąga namierzony obiekt.', 'Szpila i chwyt drugiej ręki pozwalają przejąć obiekt.'] }),
    asterion: Object.freeze({ blocks: ['To narzędzie do zmiany horyzontu.\nNie przybliża tego, co jest daleko.', 'Zmienia to, skąd patrzysz.\nDzięki temu dosięgniesz tego, czego wcześniej nie mogłeś.'] })
  }),
  knowledge: Object.freeze({
    'knowledge.intro.where': { groupId: 'intro', policy: 'CONTEXTUAL', question: 'DOKĄD?', blocks: ['Gdybym ci powiedział, poszedłbyś do odpowiedzi.', 'A ja pytam, czy pójdziesz za mną.'] },
    'knowledge.threshold.otherSide': { groupId: 'threshold', policy: 'CONTEXTUAL', question: 'CO JEST PO DRUGIEJ STRONIE?', blocks: ['Po tej stronie pytasz.\nPo tamtej będziesz sprawdzał.'] },
    'knowledge.threshold.easier': { groupId: 'threshold', policy: 'CONTEXTUAL', question: 'DLACZEGO ŁATWIEJ?', blocks: ['Nie musisz już wybierać, czy wejść.'] },
    'knowledge.p3.stonesLead': { groupId: 'currentGuidance', question: 'Zostały jeszcze kamienie.', blocks: ['Możemy patrzeć w niebo.', 'Albo sprawić, żeby to miejsce patrzyło dalej niż my.', 'Zostały jeszcze kamienie.'] },
    'knowledge.p3.stones': { groupId: 'currentGuidance', question: 'KAMIENIE', blocks: ['Są daleko.', 'Piec potrafi stroić rzeczy.', 'Astrolabium potrafi je sprowadzać.', 'Sprawdźmy, czy to wystarczy.'] },
    'knowledge.p3.binders': { groupId: 'discoveredWorld', question: 'ZWORNIKI', blocks: ['Zworniki.', 'Pojawiały się, kiedy domykałeś te części platformy.', 'Wygląda na to, że nie są ozdobą.'] }
  })
});
