const PL_TOPICS = Object.freeze([
  Object.freeze({
    id: 'knowledge.astro.whatIsIt',
    groupId: 'astro',
    label: 'CO TO JEST ASTROLABIUM WIĘZI?',
    text: 'To narzędzie do rzeczy, które są daleko,\na chciałbyś, żeby były bliżej.\nChwytem namierzasz. Spustem przyciągasz.\nJeśli chcesz coś zachować — użyj Szpili i chwyć.',
    root: true
  }),
  Object.freeze({
    id: 'knowledge.astro.why',
    groupId: 'astro',
    label: 'A PO CO MI TO?',
    text: 'Żebyś mógł sięgnąć trochę dalej.\nGlify niestety trochę ci uciekły.\nTak już to zaprojektowano.',
    root: false
  }),
  Object.freeze({
    id: 'knowledge.astro.next',
    groupId: 'astro',
    label: 'CO DALEJ?',
    text: 'Potrzebujesz Kuli Asterionowej.\nPiec potrafi ją zbudować.\nZgromadź skorupy.',
    root: false
  }),
  Object.freeze({
    id: 'knowledge.asterion.whatIsIt',
    groupId: 'asterion',
    label: 'CO TO JEST KULA ASTERIONOWA?',
    text: 'To narzędzie do zmiany horyzontu.\nNie przybliża tego, co jest daleko.\nZmienia to, skąd patrzysz.\nDzięki temu dosięgniesz tego, czego wcześniej nie mogłeś.',
    root: true
  })
]);

export function createVrMonkeyKnowledgeResolver({ locale, hasAstroKnowledge, hasAsterionKnowledge }) {
  if (typeof hasAstroKnowledge !== 'function') throw new TypeError('hasAstroKnowledge must be a function.');
  if (typeof hasAsterionKnowledge !== 'function') throw new TypeError('hasAsterionKnowledge must be a function.');

  function availableTopics() {
    if (locale !== 'pl') return [];
    const astroAvailable = hasAstroKnowledge() === true;
    const asterionAvailable = hasAsterionKnowledge() === true;
    return PL_TOPICS.filter((topic) => {
      if (topic.id === 'knowledge.astro.next') return astroAvailable && !asterionAvailable;
      if (topic.groupId === 'astro') return astroAvailable;
      return asterionAvailable;
    });
  }
  const project = (topics) => topics.map((topic) => Object.freeze({ ...topic }));

  return Object.freeze({
    getRootTopics: () => project(availableTopics().filter((topic) => topic.root)),
    getGroupTopics: (groupId) => project(availableTopics().filter((topic) => topic.groupId === groupId)),
    getTopic: (topicId) => {
      const topic = availableTopics().find((candidate) => candidate.id === topicId);
      return topic ? Object.freeze({ ...topic }) : null;
    }
  });
}
