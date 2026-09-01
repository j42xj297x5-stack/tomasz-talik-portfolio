import { VR_MONKEY_COMMUNICATION_COPY_PL, VR_MONKEY_KNOWLEDGE_CATEGORIES_PL } from './vrMonkeyCommunicationCopy.js';

export const VR_MONKEY_KNOWLEDGE_ITEM_TYPE = Object.freeze({ CATEGORY: 'CATEGORY', TOPIC: 'TOPIC' });

export const VR_MONKEY_KNOWLEDGE_LIFECYCLE = Object.freeze({
  LOCKED: 'LOCKED', NEW: 'NEW', READ: 'READ', ARCHIVED: 'ARCHIVED'
});

export function createVrMonkeyKnowledgeResolver({ locale, getCurrentObjective, isPostRingStoneGuidance = () => false }) {
  if (typeof getCurrentObjective !== 'function') throw new TypeError('getCurrentObjective must be a function.');
  const category = Object.freeze({ id: 'category.whatNow', ...VR_MONKEY_KNOWLEDGE_CATEGORIES_PL['category.whatNow'],
    type: VR_MONKEY_KNOWLEDGE_ITEM_TYPE.CATEGORY });
  const whatIsIt = Object.freeze({ id: 'category.whatIsIt', ...VR_MONKEY_KNOWLEDGE_CATEGORIES_PL['category.whatIsIt'],
    type: VR_MONKEY_KNOWLEDGE_ITEM_TYPE.CATEGORY });
  let stonesRead = false;
  let stonesLeadRead = false;
  let bindersUnlocked = false;

  function getTopic() {
    if (locale === 'pl' && isPostRingStoneGuidance()) {
      return topicFromCopy(stonesLeadRead ? 'knowledge.p3.stones' : 'knowledge.p3.stonesLead');
    }
    const current = locale === 'pl' ? getCurrentObjective() : null;
    return current ? Object.freeze({ id: `objective:${current.id}`, groupId: category.groupId,
      label: current.body, question: current.body, blocks: Object.freeze([current.body]),
      type: VR_MONKEY_KNOWLEDGE_ITEM_TYPE.TOPIC, lifecycle: VR_MONKEY_KNOWLEDGE_LIFECYCLE.READ }) : null;
  }
  const copyById = (id) => VR_MONKEY_COMMUNICATION_COPY_PL.knowledge[id];
  const topicFromCopy = (id) => { const source = copyById(id); return Object.freeze({ id, groupId: source.groupId,
    label: source.question, question: source.question, blocks: Object.freeze(source.blocks),
    type: VR_MONKEY_KNOWLEDGE_ITEM_TYPE.TOPIC,
    lifecycle: id === 'knowledge.p3.stones' && !stonesRead ? VR_MONKEY_KNOWLEDGE_LIFECYCLE.NEW : VR_MONKEY_KNOWLEDGE_LIFECYCLE.READ }); };
  function topics(groupId) {
    if (groupId === category.groupId) return getTopic() ? [getTopic()] : [];
    if (groupId === whatIsIt.groupId && bindersUnlocked) return [topicFromCopy('knowledge.p3.binders')];
    return [];
  }
  const hasObjective = () => getTopic() !== null;
  return Object.freeze({
    getRootItems: () => [...(hasObjective() ? [category] : []), ...(bindersUnlocked ? [whatIsIt] : [])],
    getGroupTopics: topics,
    getCategory: (categoryId) => [category, whatIsIt].find(({ id }) => id === categoryId && topics(id === category.id ? category.groupId : whatIsIt.groupId).length) ?? null,
    getTopic: (topicId) => [...topics(category.groupId), ...topics(whatIsIt.groupId)].find(({ id }) => id === topicId) ?? null,
    getLifecycle: (topicId) => [...topics(category.groupId), ...topics(whatIsIt.groupId)].find(({ id }) => id === topicId)?.lifecycle ?? VR_MONKEY_KNOWLEDGE_LIFECYCLE.LOCKED,
    completeTopic(topicId) {
      if (topicId === 'knowledge.p3.stonesLead') stonesLeadRead = true;
      if (topicId === 'knowledge.p3.stones') stonesRead = true;
    },
    unlockBinders() { bindersUnlocked = true; },
    hasReadStones: () => stonesRead,
    hasDiscoveredBinders: () => bindersUnlocked,
    reset() { stonesRead = false; stonesLeadRead = false; bindersUnlocked = false; }
  });
}
