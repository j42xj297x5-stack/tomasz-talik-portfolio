import { VR_MONKEY_KNOWLEDGE_CATEGORIES_PL } from './vrMonkeyCommunicationCopy.js';

export const VR_MONKEY_KNOWLEDGE_ITEM_TYPE = Object.freeze({ CATEGORY: 'CATEGORY', TOPIC: 'TOPIC' });

export const VR_MONKEY_KNOWLEDGE_LIFECYCLE = Object.freeze({
  LOCKED: 'LOCKED', NEW: 'NEW', READ: 'READ', ARCHIVED: 'ARCHIVED'
});

export function createVrMonkeyKnowledgeResolver({ locale, getCurrentObjective }) {
  if (typeof getCurrentObjective !== 'function') throw new TypeError('getCurrentObjective must be a function.');
  const category = Object.freeze({ id: 'category.whatNow', ...VR_MONKEY_KNOWLEDGE_CATEGORIES_PL['category.whatNow'],
    type: VR_MONKEY_KNOWLEDGE_ITEM_TYPE.CATEGORY });

  function getTopic() {
    const current = locale === 'pl' ? getCurrentObjective() : null;
    return current ? Object.freeze({ id: `objective:${current.id}`, groupId: category.groupId,
      label: current.body, question: current.body, blocks: Object.freeze([current.body]),
      type: VR_MONKEY_KNOWLEDGE_ITEM_TYPE.TOPIC, lifecycle: VR_MONKEY_KNOWLEDGE_LIFECYCLE.READ }) : null;
  }
  const hasObjective = () => getTopic() !== null;
  return Object.freeze({
    getRootItems: () => hasObjective() ? [category] : [],
    getGroupTopics: (groupId) => groupId === category.groupId && hasObjective() ? [getTopic()] : [],
    getCategory: (categoryId) => categoryId === category.id && hasObjective() ? category : null,
    getTopic: (topicId) => { const topic = getTopic(); return topic?.id === topicId ? topic : null; },
    getLifecycle: (topicId) => getTopic()?.id === topicId ? VR_MONKEY_KNOWLEDGE_LIFECYCLE.READ : VR_MONKEY_KNOWLEDGE_LIFECYCLE.LOCKED,
    completeTopic() {}, reset() {}
  });
}
