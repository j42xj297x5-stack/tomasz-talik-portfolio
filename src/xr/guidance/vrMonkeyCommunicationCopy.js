export const VR_MONKEY_MESSAGE_TIMING = Object.freeze({ secondsPerLine: 2, gapSeconds: 0.5 });

export const VR_MONKEY_KNOWLEDGE_CATEGORIES_PL = Object.freeze({
  'category.whatNow': Object.freeze({ label: 'CO TERAZ?', groupId: 'currentGuidance' }),
  'category.whatIsIt': Object.freeze({ label: 'CO TO JEST?', groupId: 'discoveredWorld' })
});

export const VR_MONKEY_KNOWLEDGE_CATEGORIES_EN = Object.freeze({
  'category.whatNow': Object.freeze({ label: 'WHAT COMES NEXT?', groupId: 'currentGuidance' }),
  'category.whatIsIt': Object.freeze({ label: "WHAT'S THAT?", groupId: 'discoveredWorld' })
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
    'progression.p3.glyphsGone': { blocks: ['No.', 'Tym razem naprawdę uciekły.', 'Nie widać ich. Nie słychać.', 'Możemy patrzeć w niebo.', 'Albo sprawić, żeby to miejsce patrzyło dalej niż my.', 'Zostały jeszcze kamienie.', 'Są daleko.', 'Piec potrafi stroić rzeczy.', 'Astrolabium potrafi je sprowadzać.', 'Sprawdźmy, czy to wystarczy.'] },
    'progression.p3.firstRuneInstalledWithAsterion': { blocks: ['O.', 'Sam wiedział, gdzie ma trafić.', 'Teraz możesz kontrolować jedną część.\nŻeby znaleźć glify, potrzebujesz trzech.', 'Teraz odpowiada na Kulę.', 'Przytrzymaj chwyt nad sektorem.\nNie puszczaj od razu.', 'Gdy już go przywiążesz, możesz nim sterować.\nJak całą platformą.', 'No prawie...'] },
    'progression.p3.firstRuneInstalledWithoutAsterion': { blocks: ['O.', 'Sam wiedział, gdzie ma trafić.', 'Teraz możesz kontrolować jedną część.\nŻeby znaleźć glify, potrzebujesz trzech.', 'Tylko jeszcze nie masz czym jej poruszyć.', 'Potrzebujesz Kuli Asterionowej.', 'Zbuduj ją w Piecu.', 'Wtedy ten sektor zacznie odpowiadać na twoje ruchy.'] },
    'progression.p3.firstSectorLock': { blocks: ['No.', 'Teraz ruszasz częścią świata.'] },
    'progression.p3.resonator': { blocks: ['No dobrze.', 'Trzy razem zaczynają słuchać.', 'Chyba zbudowałeś Rezonator Asterionowy.', 'Radar mówiłby ci, gdzie coś jest.', 'To jest bardziej uparte.', 'Musisz zapytać przestrzeń we właściwym kierunku.', 'A teraz zapytaj świat.\nMoże ci odpowie.'] },
    'progression.p4.etherIntervention': { blocks: ['Cztery.', 'Została Woda.', 'Tylko że jej sektor nie ma jak się domknąć.', 'Normalnie powiedziałbym, że utknęliśmy.', 'Na szczęście normalnie już dawno przestało tu działać.', 'Jest jeszcze jeden kamień.', 'Nie należy do tej piątki.', 'Eter.', 'Może właśnie dlatego się przyda.'] },
    'progression.p4.waterPathOpen': { blocks: ['No.', 'To powinno wystarczyć.', 'Spójrz na Wodę.', 'Teraz ma się czego trzymać.'] },
    'progression.p4.fullResonator': { blocks: ['Pięć.', 'Teraz odpowiada cała platforma.', 'Metal i Woda też weszły do układu.', 'Rezonator ma więcej ruchów niż wcześniej.', 'Sprawdź je.'] },
    'progression.final.monkeyFarewell': { blocks: [
      'Ukończyłeś drogę.',
      'Ten świat nie będzie ci już potrzebny.',
      'Dzięki za twój wysiłek.',
      'I za to, że chciałeś zobaczyć, co robię.',
      'Do zobaczenia.',
      'W realu… może. :)'
    ] }
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
    astro: Object.freeze({ blocks: ['To narzędzie do rzeczy, które są daleko,\na chciałbyś, żeby były bliżej.', 'Chwyt służy do namierzania.', 'Spust przyciąga namierzony obiekt.', 'Szpila i chwyt drugiej ręki pozwalają przejąć obiekt.', 'Glify są dalej, niż możesz sięgnąć.', 'Czy odległość jest problemem?', 'Może nie trzeba przyciągać świata,\ntylko zmienić miejsce, z którego patrzysz.', 'Zmienić horyzont.', 'Piec może ci pomóc.\nKula Asterionowa.', 'Nie przyciągnie glifów.', 'Pozwoli ci znów ich dotknąć.'] }),
    asterion: Object.freeze({ blocks: ['To narzędzie do zmiany horyzontu.\nNie przybliża tego, co jest daleko.', 'Zmienia to, skąd patrzysz.\nDzięki temu dosięgniesz tego, czego wcześniej nie mogłeś.'] })
  }),
  knowledge: Object.freeze({
    'knowledge.intro.where': { groupId: 'intro', policy: 'CONTEXTUAL', question: 'DOKĄD?', blocks: ['Gdybym ci powiedział, poszedłbyś do odpowiedzi.', 'A ja pytam, czy pójdziesz za mną.'] },
    'knowledge.threshold.otherSide': { groupId: 'threshold', policy: 'CONTEXTUAL', question: 'CO JEST PO DRUGIEJ STRONIE?', blocks: ['Po tej stronie pytasz.\nPo tamtej będziesz sprawdzał.'] },
    'knowledge.threshold.easier': { groupId: 'threshold', policy: 'CONTEXTUAL', question: 'DLACZEGO ŁATWIEJ?', blocks: ['Nie musisz już wybierać, czy wejść.'] },
    'knowledge.p3.stonesLead': { groupId: 'currentGuidance', question: 'Zostały jeszcze kamienie.', blocks: ['Możemy patrzeć w niebo.', 'Albo sprawić, żeby to miejsce patrzyło dalej niż my.', 'Zostały jeszcze kamienie.'] },
    'knowledge.p3.stones': { groupId: 'currentGuidance', question: 'KAMIENIE', blocks: ['Są daleko.', 'Piec potrafi stroić rzeczy.', 'Astrolabium potrafi je sprowadzać.', 'Sprawdźmy, czy to wystarczy.'] },
    'knowledge.p3.binders': { groupId: 'discoveredWorld', question: 'ZWORNIKI', blocks: ['Zworniki.', 'Pojawiały się, kiedy domykałeś te części platformy.', 'Wygląda na to, że nie są ozdobą.'] },
    'knowledge.asterion.build': { groupId: 'currentGuidance', question: 'ZBUDUJ KULĘ ASTERIONOWĄ', blocks: ['Teraz zbieraj Skorupy.\nPotrzebujesz sześciu. Każdą przetwórz w Piecu.\nGdy Piec przyjmie komplet, zbuduj Kulę Asterionową.'] },
    'knowledge.asterion.sphere': { groupId: 'discoveredWorld', question: 'KULA ASTERIONOWA', blocks: ['To narzędzie do zmiany horyzontu.\nNie przybliża tego, co jest daleko.', 'Zmienia to, skąd patrzysz.\nDzięki temu dosięgniesz tego, czego wcześniej nie mogłeś.'] }
  })
});

export const VR_MONKEY_COMMUNICATION_COPY_EN = Object.freeze({
  progression: Object.freeze({
    'progression.intro.firstPresence': { blocks: ['Good.', 'You have hands.\nThat is already more than most problems have.'] },
    'progression.intro.openPlayerGuide': { blocks: ['Let’s check where everything is'], prompt: 'Press Y to open the menu.' },
    'progression.intro.afterPlayerGuide': { blocks: ["If you forget — I'll remind you.", 'Let’s see if the world hears you', 'Point at me.'] },
    'progression.intro.triggerMonkey': { blocks: ['Now the Trigger.'] },
    'progression.intro.pointerLearned': { blocks: ["See?\nYou've already taught the world where you're looking."] },
    'progression.intro.followPause': { blocks: ['Are you coming?'] },
    'progression.threshold.crossed': { blocks: ['Well. That makes things easier.'] },
    'progression.glyphs.firstInstruction': { blocks: ['Five signs.', "Don't ask what they mean yet.\nTouch one with the Pin."] },
    'progression.glyphs.firstDiscovery': { blocks: ['Oh, I think we can use this.'] },
    'progression.crystal.firstCreated': { blocks: ['It answered.'] },
    'progression.reliquary.idea': { blocks: ['What can we do with this…', 'Maybe it needs a vessel.'] },
    'progression.card.first': { blocks: ['One.'] },
    'progression.postRing.changedWorld': { blocks: ['Well, the world has stopped being kind.', 'What you need now lies beyond your reach.', 'Fortunately, only for a little while.'] },
    'progression.furnace.look': { blocks: ['Look at the Furnace.', 'Something is waiting for you there.'] },
    'progression.p2.smallGlyphsIntro': { blocks: ['Again.', "The world moved what you're looking for farther away.", "The world likes moving things out of reach.\nYou don't have to chase them.", 'Sometimes you just need to tune what you already have.', 'The Astrolabe has bands.\nB changes what it listens for.', 'See those little glyphs?', 'Small things can sometimes take you farther than big ones.', 'The Furnace will help you tune the Astrolabe.', 'Then the large glyphs will be able to answer again.', 'And so will the next cards.'] },
    'progression.p3.glyphsGone': { blocks: ['Well.', "This time they're truly gone.", 'They cannot be seen. Or heard.', 'We can gaze into the sky.', 'Or teach this place to see farther than we ever could.', 'There are still stones waiting.', 'They lie far beyond our reach.', 'The Furnace knows how to tune things.', 'The Astrolabe knows how to draw them near.', "Let's see whether that is enough."] },
    'progression.p3.firstRuneInstalledWithAsterion': { blocks: ['Oh.', 'It knew where it belonged.', "Now you can control one section.\nTo find the glyphs, you'll need three.", 'Now it answers to the Sphere.', 'Hold the grip over the sector.\nKeep holding it for a moment.', "Once you've bound it, you can guide it.\nJust like the whole platform.", 'Almost, anyway...'] },
    'progression.p3.firstRuneInstalledWithoutAsterion': { blocks: ['Oh.', 'It knew where it belonged.', "Now you can control one section.\nTo find the glyphs, you'll need three.", 'But you still have nothing to move it with.', 'You need the Asterion Sphere.', 'Build it in the Furnace.', 'Then this sector will begin to respond to your movements.'] },
    'progression.p3.firstSectorLock': { blocks: ['All Right.', 'Now you are moving part of the world.'] },
    'progression.p3.resonator': { blocks: ['Well then.', 'Three together begin to listen.', "It seems you've built the Asterion Resonator.", 'A radar would simply tell you where to look.', 'This is a little more stubborn.', 'You have to ask space in the right direction.', 'Now ask the world.\nPerhaps it will answer.'] },
    'progression.p4.etherIntervention': { blocks: ['Four.', 'Only Water remains.', 'But its sector has no way to complete the circle.', "Normally, I'd say we've reached a dead end.", 'Fortunately, normal stopped applying here a long time ago.', 'There is one more stone.', 'It belongs to none of the five.', 'Ether.', "Perhaps that's precisely why we need it."] },
    'progression.p4.waterPathOpen': { blocks: ['Well then.', 'That should be enough.', 'Look at Water.', 'Now it has something to anchor itself to.'] },
    'progression.p4.fullResonator': { blocks: ['Five.', 'Now the entire platform answers.', 'Metal and Water have joined the pattern as well.', "The Resonator can move in ways it couldn't before.", 'See what it can do.'] },
    'progression.final.monkeyFarewell': { blocks: [
      "You've reached the end of the path.",
      "You won't need this world anymore.",
      'Thank you for all the effort you put in.',
      "And for wanting to see what I've been creating.",
      'Until next time.',
      'In the real world... perhaps. :)'
    ] }
  }),
  tutorial: Object.freeze({ crystal: Object.freeze({
    pointerLearned: ['See?\nThe world has already learned where your gaze falls.'],
    instruction: 'Now take the crystal and bring it to me.',
    handoff: ['Yes...', "We're not ready to use that yet.", "You've learned the fundamentals."]
  }) }),
  decisions: Object.freeze({
    'decision.intro.go': { question: 'Coming?', options: ["I'M COMING", 'WHERE TO?', 'NO'] },
    'decision.intro.no': { blocks: ['Very well.\nNot every path is meant to be yours.'] },
    'decision.threshold.enter': { blocks: ['A threshold lies ahead.', 'You may choose not to cross it.', "If you do cross it, you won't return until the path has run its course."], question: 'Will you cross?', options: ["I'LL CROSS THE THRESHOLD", 'WHAT LIES BEYOND?', "I'LL TURN BACK"] },
    'decision.threshold.return': { blocks: ['A wise choice.', 'Or a cowardly one.', "Sometimes they're one and the same.\nOnly later do you find out."] }
  }),
  hints: Object.freeze({
    'hint.crystal.whatNow.soft': { blocks: ['First, take it.'] }, 'hint.crystal.grab.medium': { blocks: ['Grip.'] },
    'hint.glyphs.how.soft': { blocks: ['Point at the symbol.\nPull the trigger. Hold it until you receive the crystal.'] },
    'hint.glyphs.how.strong': { blocks: ['Bring the Pin to the glyph.', 'Hold the trigger.', 'Draw the crystal out.'] },
    'hint.reliquary.firstCrystal': { blocks: ['What can we do with this...', 'Maybe it needs a vessel.'] },
    'hint.protoAstro.tuning': { blocks: ['The small glyphs are connected to the large ones.', 'The Astrolabe can pull the large ones in.', 'Once it knows what to look for.'] },
    'hint.reliquary.inserted': { blocks: ['Activate the Crystal. Reveal its meaning.'] },
    'hint.reliquary.active': { blocks: ['It may be set free now. \nIt has fulfilled its purpose.'] },
    'hint.furnace.astroStart': { blocks: ['Open the Furnace information panel.', 'Choose the Astrolabe of Binding module.', 'Seal the chamber, then use the middle button once the Furnace is properly prepared.', 'If the Furnace rejects the object, first check which operation you have chosen.'] },
    'hint.furnace.astroAvailable': { blocks: ['Open the chamber. Take your tool out.', 'Grab it.'] },
    'hint.rune.noBinder.soft': { blocks: ['It works.', 'It just has nowhere to bind.'] },
    'hint.rune.noBinder.medium': { blocks: ['Look at the Sectors.\nCompleted ones have a Keystone.', 'It will let you bind the stone.'] }
  }),
  acquisition: Object.freeze({
    astro: Object.freeze({ blocks: ["A tool for things beyond your reach,\nwhen you'd rather bring them closer.", 'Grip chooses what you seek.', 'The Trigger draws it toward you.', 'With the Pin and the Grip of your other hand, you can take hold of its movement.', 'The glyphs are farther than you can reach.', 'Is distance the problem?', "Maybe you don't need to bring the world closer.\nMaybe you need to change where you look from.", 'Change the horizon.', 'The Furnace can help.\nThe Asterion Sphere.', "It won't bring the glyphs closer.", 'It will let you touch them again.'] }),
    asterion: Object.freeze({ blocks: ['This is a tool for shifting the horizon.\nIt does not draw distant things nearer.', 'It changes the place from which you look.\nAnd from there, what was once beyond your reach may no longer be.'] })
  }),
  knowledge: Object.freeze({
    'knowledge.intro.where': { groupId: 'intro', policy: 'CONTEXTUAL', question: 'WHERE?', blocks: ['If I told you, you would follow the answer.', "But I'm asking whether you'll follow me."] },
    'knowledge.threshold.otherSide': { groupId: 'threshold', policy: 'CONTEXTUAL', question: 'WHAT IS ON THE OTHER SIDE?', blocks: ['On this side, you ask.\nBeyond it, you will discover for yourself.'] },
    'knowledge.threshold.easier': { groupId: 'threshold', policy: 'CONTEXTUAL', question: 'WHY IS IT EASIER?', blocks: ['You no longer need to decide whether to cross.'] },
    'knowledge.p3.stonesLead': { groupId: 'currentGuidance', question: 'There are still stones left.', blocks: ['We can gaze into the sky.', 'Or teach this place to see farther than we ever could.', 'There are still stones waiting.'] },
    'knowledge.p3.stones': { groupId: 'currentGuidance', question: 'STONES', blocks: ['They lie far beyond our reach.', 'The Furnace knows how to tune things.', 'The Astrolabe knows how to draw them near.', "Let's see whether that is enough."] },
    'knowledge.p3.binders': { groupId: 'discoveredWorld', question: 'KEYSTONES', blocks: ['Keystones.', 'They appeared when you completed those parts of the platform.', 'It seems they were never merely ornaments.'] },
    'knowledge.asterion.build': { groupId: 'currentGuidance', question: 'BUILD THE ASTERION SPHERE', blocks: ['Now collect Shells.\nYou need six. Process each one in the Furnace.\nOnce the Furnace has taken the full set, build the Asterion Sphere.'] },
    'knowledge.asterion.sphere': { groupId: 'discoveredWorld', question: 'ASTERION SPHERE', blocks: ['A tool for changing the horizon.\nIt does not bring distant things closer.', 'It changes where you look from.\nThat lets you reach what you could not before.'] }
  })
});
