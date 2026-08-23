import { VR_MONKEY_COMMUNICATION_COPY_PL, VR_MONKEY_KNOWLEDGE_POLICY } from './vrMonkeyCommunicationCopy.js';

export const VR_MONKEY_KNOWLEDGE_LIFECYCLE = Object.freeze({
  LOCKED: 'LOCKED', NEW: 'NEW', READ: 'READ', ARCHIVED: 'ARCHIVED'
});

export function createVrMonkeyKnowledgeResolver({ locale, hasAstroKnowledge, hasAstroBandSwitchKnowledge,
  hasAsterionKnowledge, hasP2Knowledge }) {
  if (typeof hasAstroKnowledge !== 'function') throw new TypeError('hasAstroKnowledge must be a function.');
  if (typeof hasAsterionKnowledge !== 'function') throw new TypeError('hasAsterionKnowledge must be a function.');
  if (typeof hasP2Knowledge !== 'function') throw new TypeError('hasP2Knowledge must be a function.');
  if (typeof hasAstroBandSwitchKnowledge !== 'function') throw new TypeError('hasAstroBandSwitchKnowledge must be a function.');
  const topics = Object.entries(VR_MONKEY_COMMUNICATION_COPY_PL.knowledge)
    .filter(([id]) => id.startsWith('knowledge.astro.') || id.startsWith('knowledge.p2.') || id === 'knowledge.asterion.whatIsIt')
    .map(([id, topic]) => Object.freeze({ id, ...topic, label: topic.question }));
  const read = new Set();

  function unlocked(topic) {
    if (locale !== 'pl') return false;
    const astro = hasAstroKnowledge() === true; const asterion = hasAsterionKnowledge() === true;
    if (topic.id === 'knowledge.astro.next') return astro && !asterion;
    if (topic.id === 'knowledge.astro.bandSwitch') return astro && hasAstroBandSwitchKnowledge() === true;
    if (topic.groupId === 'p2') return hasP2Knowledge() === true;
    return topic.groupId === 'astro' ? astro : asterion;
  }
  function getLifecycle(topicId) {
    const topic = topics.find(({ id }) => id === topicId);
    if (!topic || !unlocked(topic)) return read.has(topicId) || topic?.policy === VR_MONKEY_KNOWLEDGE_POLICY.CONTEXTUAL
      ? VR_MONKEY_KNOWLEDGE_LIFECYCLE.ARCHIVED : VR_MONKEY_KNOWLEDGE_LIFECYCLE.LOCKED;
    if (!read.has(topicId)) return VR_MONKEY_KNOWLEDGE_LIFECYCLE.NEW;
    return topic.policy !== VR_MONKEY_KNOWLEDGE_POLICY.ONCE
      ? VR_MONKEY_KNOWLEDGE_LIFECYCLE.READ : VR_MONKEY_KNOWLEDGE_LIFECYCLE.ARCHIVED;
  }
  const available = () => topics.filter((topic) => [VR_MONKEY_KNOWLEDGE_LIFECYCLE.NEW,
    VR_MONKEY_KNOWLEDGE_LIFECYCLE.READ].includes(getLifecycle(topic.id)));
  const project = (items) => items.map((topic) => Object.freeze({ ...topic, lifecycle: getLifecycle(topic.id) }));
  return Object.freeze({
    getRootTopics: () => project(available().filter(({ root }) => root)),
    getGroupTopics: (groupId) => project(available().filter((topic) => topic.groupId === groupId)),
    getTopic: (topicId) => project(available().filter(({ id }) => id === topicId))[0] ?? null,
    getLifecycle,
    completeTopic(topicId) { if (topics.some(({ id }) => id === topicId) && unlocked(topics.find(({ id }) => id === topicId))) read.add(topicId); },
    reset() { read.clear(); }
  });
}
