import { VR_MONKEY_COMMUNICATION_COPY_PL, VR_MONKEY_KNOWLEDGE_CATEGORIES_PL,
  VR_MONKEY_KNOWLEDGE_POLICY } from './vrMonkeyCommunicationCopy.js';

export const VR_MONKEY_KNOWLEDGE_ITEM_TYPE = Object.freeze({ CATEGORY: 'CATEGORY', TOPIC: 'TOPIC' });

export const VR_MONKEY_KNOWLEDGE_LIFECYCLE = Object.freeze({
  LOCKED: 'LOCKED', NEW: 'NEW', READ: 'READ', ARCHIVED: 'ARCHIVED'
});

export function createVrMonkeyKnowledgeResolver({ locale, hasAstroKnowledge, hasAstroBandSwitchKnowledge,
  getCurrentGuidanceContextId }) {
  if (typeof hasAstroKnowledge !== 'function') throw new TypeError('hasAstroKnowledge must be a function.');
  if (typeof getCurrentGuidanceContextId !== 'function') throw new TypeError('getCurrentGuidanceContextId must be a function.');
  if (typeof hasAstroBandSwitchKnowledge !== 'function') throw new TypeError('hasAstroBandSwitchKnowledge must be a function.');
  const topics = Object.entries(VR_MONKEY_COMMUNICATION_COPY_PL.knowledge)
    .filter(([id]) => id.startsWith('knowledge.astro.') || id.startsWith('knowledge.p2.'))
    .map(([id, topic]) => Object.freeze({ id, ...topic, label: topic.question,
      type: VR_MONKEY_KNOWLEDGE_ITEM_TYPE.TOPIC }));
  const categories = Object.entries(VR_MONKEY_KNOWLEDGE_CATEGORIES_PL)
    .map(([id, category]) => Object.freeze({ id, ...category, type: VR_MONKEY_KNOWLEDGE_ITEM_TYPE.CATEGORY }));
  const read = new Set();

  function unlocked(topic) {
    if (locale !== 'pl') return false;
    const astro = hasAstroKnowledge() === true;
    if (topic.policy === VR_MONKEY_KNOWLEDGE_POLICY.CONTEXTUAL && topic.contextId) {
      return topic.contextId === getCurrentGuidanceContextId();
    }
    if (topic.id === 'knowledge.astro.bandSwitch') return astro && hasAstroBandSwitchKnowledge() === true;
    return topic.groupId === 'astro' ? astro : true;
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
  const availableCategories = () => locale === 'pl' ? categories.filter((category) => category.id === 'category.whatNow'
    || available().some((topic) => topic.groupId === category.groupId)) : [];
  return Object.freeze({
    getRootItems: () => availableCategories(),
    getGroupTopics: (groupId) => project(available().filter((topic) => topic.groupId === groupId)),
    getCategory: (categoryId) => availableCategories().find(({ id }) => id === categoryId) ?? null,
    getTopic: (topicId) => project(available().filter(({ id }) => id === topicId))[0] ?? null,
    getLifecycle,
    completeTopic(topicId) { if (topics.some(({ id }) => id === topicId) && unlocked(topics.find(({ id }) => id === topicId))) read.add(topicId); },
    reset() { read.clear(); }
  });
}
