const GLYPH_ELEMENTS = Object.freeze({
  'ethics-life-protection': 'earth',
  'creative-ai': 'fire',
  'ai-guide': 'wood',
  'spotify-digger': 'metal',
  'haiku-cosmos': 'water'
});

const card = (slug, glyphId, order, pl, en) => ({
  id: `portal-card-${slug}`,
  crystalId: `portal-crystal-${slug}`,
  glyphId,
  elementId: GLYPH_ELEMENTS[glyphId],
  order,
  starter: order === 1,
  translations: { pl, en }
});

const portalCardRecords = [
  card('ethics-life-protection-foundation', 'ethics-life-protection', 1,
    { title: 'Etyka i ochrona życia', crystalLabel: 'Fundament', body: 'AI wzmacnia ludzkie intencje — zarówno te, które służą życiu, jak i te, które prowadzą do krzywdy. Dlatego każda technologia potrzebuje etycznego fundamentu.' },
    { title: 'Ethics and Life Protection', crystalLabel: 'Foundation', body: 'AI amplifies human intentions — both those that serve life and those that lead to harm. That is why every technology needs an ethical foundation.' }),
  card('ethics-life-protection-responsible-power', 'ethics-life-protection', 2,
    { title: 'Odpowiedzialna moc', crystalLabel: 'Odpowiedzialność', body: 'Uważność, odpowiedzialność i edukacja pozwalają korzystać z mocy bez oddawania jej przypadkowi. Rozwój zaczyna się od rozumienia skutków własnych decyzji.' },
    { title: 'Responsible Power', crystalLabel: 'Responsibility', body: 'Mindfulness, responsibility, and education allow us to use power without leaving it to chance. Development begins with understanding the consequences of our own decisions.' }),
  card('ethics-life-protection-service-to-life', 'ethics-life-protection', 3,
    { title: 'Technologia w służbie życia', crystalLabel: 'Służba życiu', body: 'Technologia powinna zmniejszać cierpienie, poszerzać zrozumienie i chronić ludzi, inne istoty oraz wspólny świat. Ma służyć wielu — nie tylko tym, którzy kontrolują narzędzia.' },
    { title: 'Technology in Service of Life', crystalLabel: 'Service to Life', body: 'Technology should reduce suffering, deepen understanding, and protect people, other beings, and the world we share. It should serve the many — not only those who control the tools.' }),

  card('creative-ai-digital-domain', 'creative-ai', 1,
    { title: 'Creative AI', crystalLabel: 'Domena cyfrowa', body: 'Tworzę z AI w całej domenie cyfrowej: obraz, dźwięk, tekst, kod, modelowanie 3D i projektowanie użytkowe. Narzędzia zmieniają się, lecz twórczy kierunek pozostaje.' },
    { title: 'Creative AI', crystalLabel: 'Digital Domain', body: 'I create with AI across the digital domain: image, sound, text, code, 3D modeling, and applied design. Tools change, but the creative direction remains.' }),
  card('creative-ai-creative-feedback', 'creative-ai', 2,
    { title: 'Twórcze sprzężenie', crystalLabel: 'Sprzężenie', body: 'Praca z AI jest żywym szkicownikiem i laboratorium. Nieoczekiwany obraz, brzmienie, zdanie lub rozwiązanie może otworzyć kierunek, którego nie dałoby się wcześniej dokładnie zaplanować.' },
    { title: 'Creative Feedback', crystalLabel: 'Feedback', body: 'Working with AI is a living sketchbook and laboratory. An unexpected image, sound, sentence, or solution can open a direction that could not have been precisely planned in advance.' }),
  card('creative-ai-conscious-creativity', 'creative-ai', 3,
    { title: 'Świadoma kreatywność', crystalLabel: 'Świadoma kreacja', body: 'Gdy cel jest wyraźny, iteruję: poprawiam prompt, zmieniam narzędzie, łączę techniki i oceniam rezultat. AI poszerza pole eksperymentu, ale to twórca wybiera formę i nadaje znaczenie.' },
    { title: 'Conscious Creativity', crystalLabel: 'Conscious Creation', body: 'When the goal is clear, I iterate: refine the prompt, change the tool, combine techniques, and evaluate the result. AI expands the field of experimentation, but the creator chooses the form and gives it meaning.' }),

  card('ai-guide-orientation', 'ai-guide', 1,
    { title: 'AI Guide', crystalLabel: 'Orientacja', body: 'Pomagam oswoić AI tam, gdzie technologia spotyka lęk, chaos i poczucie gwałtownej zmiany. Pierwszym krokiem nie jest znajomość wszystkich narzędzi, lecz odzyskanie orientacji.' },
    { title: 'AI Guide', crystalLabel: 'Orientation', body: 'I help people become comfortable with AI where technology meets fear, chaos, and a sense of rapid change. The first step is not knowing every tool, but regaining orientation.' }),
  card('ai-guide-collaboration-method', 'ai-guide', 2,
    { title: 'Metoda współpracy', crystalLabel: 'Metoda', body: 'Uczę przekładać potrzebę na proces: nazwać cel, dostarczyć kontekst, prowadzić rozmowę, porównywać warianty i oceniać odpowiedzi. Ta metoda pozostaje użyteczna, nawet gdy narzędzia się zmieniają.' },
    { title: 'A Method of Collaboration', crystalLabel: 'Method', body: 'I teach how to turn a need into a process: define the goal, provide context, conduct the dialogue, compare alternatives, and evaluate responses. This method remains useful even as the tools change.' }),
  card('ai-guide-autonomous-action', 'ai-guide', 3,
    { title: 'Autonomia działania', crystalLabel: 'Autonomia', body: 'Człowiek wyznacza kierunek, rozumie proces i podejmuje decyzje. AI pomaga szybciej próbować, porządkować i tworzyć — bez odbierania autorowi odpowiedzialności ani inicjatywy.' },
    { title: 'Autonomy in Action', crystalLabel: 'Autonomy', body: 'The human sets the direction, understands the process, and makes decisions. AI helps people experiment, organize, and create faster — without taking away the author’s responsibility or initiative.' }),

  card('spotify-digger-exploration-system', 'spotify-digger', 1,
    { title: 'DIG Engine', crystalLabel: 'Eksploracja', body: 'DIG Engine to lokalny system eksploracji muzyki. Zamienia wyszukiwanie artystów, albumów, tagi, historię odsłuchów i luźne tropy w czytelny, powtarzalny proces odkrywania.' },
    { title: 'DIG Engine', crystalLabel: 'Exploration', body: 'DIG Engine is a local music exploration system. It turns searches for artists and albums, tags, listening history, and loose leads into a clear, repeatable discovery process.' }),
  card('spotify-digger-music-as-data', 'spotify-digger', 2,
    { title: 'Muzyka jako dane', crystalLabel: 'Muzyka jako dane', body: 'System łączy API, Last.fm, Spotify, lokalną bazę Discogs w SQLite i historię użytkownika — jego muzyczne DNA. Zbiera kandydatów, wzbogaca dane, porównuje źródła i filtruje wyniki bez ograniczania się do jednej rekomendacji.' },
    { title: 'Music as Data', crystalLabel: 'Music as Data', body: 'The system combines APIs, Last.fm, Spotify, a local Discogs database in SQLite, and the user’s history — their musical DNA. It gathers candidates, enriches data, compares sources, and filters results without relying on a single recommendation.' }),
  card('spotify-digger-workflow-architecture', 'spotify-digger', 3,
    { title: 'Workflow i architektura', crystalLabel: 'Workflow', body: 'Workflow Composer składa proces z konfigurowalnych modułów, a GUI pokazuje postęp, decyzje i rezultaty. Źródłem prawdy są backend, dane i artefakty uruchomienia.' },
    { title: 'Workflow and Architecture', crystalLabel: 'Workflow', body: 'Workflow Composer builds a process from configurable modules, while the GUI shows progress, decisions, and results. The backend, data, and runtime artifacts remain the source of truth.' }),
  card('spotify-digger-system-supported-intuition', 'spotify-digger', 4,
    { title: 'Intuicja wsparta systemem', crystalLabel: 'Intuicja', body: 'Automatyzacja wspiera intuicję słuchacza, zamiast ją zastępować. Projekt pokazuje, jak z AI rozwijam złożone narzędzie: etapami, z kontrolą architektury, dokumentacją i testami.' },
    { title: 'Intuition Supported by the System', crystalLabel: 'Intuition', body: 'Automation supports the listener’s intuition instead of replacing it. The project shows how I develop a complex tool with AI: step by step, with architectural control, documentation, and testing.' }),

  card('haiku-cosmos-overview', 'haiku-cosmos', 1,
    { title: 'Haiku Cosmos', crystalLabel: 'Kosmos', body: 'Haiku Cosmos to autorska, kontemplacyjna gra-system o kształtowaniu żywego kosmosu. Łączy game design, system design, UI/UX, obraz i dźwięk z Three.js, światem 3D oraz produkcją wspieraną przez AI.' },
    { title: 'Haiku Cosmos', crystalLabel: 'Cosmos', body: 'Haiku Cosmos is an original, contemplative game-system about shaping a living cosmos. It combines game design, system design, UI/UX, visuals, and sound with Three.js, a 3D world, and AI-assisted production.' }),
  card('haiku-cosmos-living-cosmos', 'haiku-cosmos', 2,
    { title: 'Żywy kosmos', crystalLabel: 'Przemiana', body: 'Meteory poruszają się, zderzają i przechodzą przez kolejne stadia rozwoju. Masa, kolor, materiały, światło i ruch tworzą czytelny język przemian zachodzących w świecie gry.' },
    { title: 'A Living Cosmos', crystalLabel: 'Transformation', body: 'Meteors move, collide, and pass through successive stages of development. Mass, color, materials, light, and motion form a readable language of transformation within the game world.' }),
  card('haiku-cosmos-game-architecture', 'haiku-cosmos', 3,
    { title: 'Architektura gry', crystalLabel: 'Architektura', body: 'Gracz zbiera karty oparte na sekwencjach harmonicznych, zdobywa Punkty Rezonansu i wpływa na świat przez PRG oraz SUB-META. Artefakty, pył, stabilizatory i trwałość kart tworzą zależną sieć decyzji.' },
    { title: 'Game Architecture', crystalLabel: 'Architecture', body: 'The player collects cards based on harmonic sequences, earns Resonance Points, and influences the world through PRG and SUB-META. Artifacts, dust, stabilizers, and card durability form an interdependent network of decisions.' }),
  card('haiku-cosmos-3d-world-production', 'haiku-cosmos', 4,
    { title: 'Produkcja świata 3D', crystalLabel: 'Produkcja 3D', body: 'Modele GLB, materiały PBR, tekstury i mapy emisji tworzą kontrolowany pipeline. Cache, zgodne rodziny modeli i strojenie sceny utrzymują płynny, zróżnicowany świat bezpośrednio w przeglądarce.' },
    { title: '3D World Production', crystalLabel: '3D Production', body: 'GLB models, PBR materials, textures, and emission maps form a controlled pipeline. Cache, compatible model families, and scene tuning keep a fluid, varied world running directly in the browser.' }),
  card('haiku-cosmos-complexity-leadership', 'haiku-cosmos', 5,
    { title: 'Prowadzenie złożoności', crystalLabel: 'Złożoność', body: 'Dokumentacja jest pamięcią operacyjną projektu. Prowadzę wizję, mechanikę, kod i produkcję jako jeden system, a ChatGPT i Codex wspierają analizę oraz wykonanie bez przejmowania kierunku.' },
    { title: 'Leading Complexity', crystalLabel: 'Complexity', body: 'Documentation is the project’s operational memory. I lead the vision, mechanics, code, and production as one system, while ChatGPT and Codex support analysis and execution without taking over the direction.' })
];

const fail = (record, message) => {
  throw new Error(`Invalid portal card "${record?.id ?? '<missing-id>'}": ${message}`);
};

function validatePortalCards(records) {
  const ids = new Set();
  const crystalIds = new Set();
  const ordersByGlyph = new Map();
  const startersByGlyph = new Map();

  for (const record of records) {
    if (!record.id || ids.has(record.id)) fail(record, 'id must be present and unique');
    ids.add(record.id);
    if (!record.crystalId || crystalIds.has(record.crystalId)) fail(record, 'crystalId must be present and unique');
    crystalIds.add(record.crystalId);
    if (!Object.hasOwn(GLYPH_ELEMENTS, record.glyphId)) fail(record, `unknown glyphId "${record.glyphId}"`);
    if (record.elementId !== GLYPH_ELEMENTS[record.glyphId]) fail(record, `invalid elementId "${record.elementId}"`);
    if (!Number.isInteger(record.order) || record.order <= 0) fail(record, 'order must be a positive integer');
    const orders = ordersByGlyph.get(record.glyphId) ?? new Set();
    if (orders.has(record.order)) fail(record, `duplicate order ${record.order} for glyphId "${record.glyphId}"`);
    orders.add(record.order);
    ordersByGlyph.set(record.glyphId, orders);
    startersByGlyph.set(record.glyphId, (startersByGlyph.get(record.glyphId) ?? 0) + (record.starter === true ? 1 : 0));
    if (typeof record.starter !== 'boolean') fail(record, 'starter must be a boolean');
    for (const language of ['pl', 'en']) {
      const translation = record.translations?.[language];
      if (!translation) fail(record, `missing ${language} translation`);
      for (const field of ['title', 'crystalLabel', 'body']) {
        if (typeof translation[field] !== 'string' || !translation[field].trim()) fail(record, `${language}.${field} must be a non-empty string`);
      }
    }
  }

  for (const glyphId of Object.keys(GLYPH_ELEMENTS)) {
    const representative = records.find((record) => record.glyphId === glyphId) ?? { id: glyphId };
    if (startersByGlyph.get(glyphId) !== 1) fail(representative, `glyphId "${glyphId}" must have exactly one starter`);
  }
}

const freezeCard = (record) => Object.freeze({
  ...record,
  translations: Object.freeze({
    pl: Object.freeze({ ...record.translations.pl }),
    en: Object.freeze({ ...record.translations.en })
  })
});

validatePortalCards(portalCardRecords);

export const portalCards = Object.freeze(portalCardRecords.map(freezeCard));

export const portalCardsByGlyphId = Object.freeze(Object.fromEntries(
  Object.keys(GLYPH_ELEMENTS).map((glyphId) => [glyphId, Object.freeze(
    portalCards.filter((record) => record.glyphId === glyphId).sort((a, b) => a.order - b.order)
  )])
));

const portalCardsById = new Map(portalCards.map((record) => [record.id, record]));

export function getPortalCards(glyphId) {
  return portalCardsByGlyphId[glyphId] ?? Object.freeze([]);
}

export function getPortalCard(cardId) {
  return portalCardsById.get(cardId);
}

export function resolvePortalCard(cardRecord, language) {
  if (!cardRecord) return undefined;
  const normalizedLanguage = String(language || '').toLowerCase().split('-')[0];
  const translation = cardRecord.translations?.[normalizedLanguage === 'pl' ? 'pl' : 'en'];
  return translation ? Object.freeze({ ...cardRecord, ...translation }) : cardRecord;
}
