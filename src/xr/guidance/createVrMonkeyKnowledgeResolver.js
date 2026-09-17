import { VR_MONKEY_COMMUNICATION_COPY_EN, VR_MONKEY_COMMUNICATION_COPY_PL,
  VR_MONKEY_KNOWLEDGE_CATEGORIES_EN, VR_MONKEY_KNOWLEDGE_CATEGORIES_PL } from './vrMonkeyCommunicationCopy.js';

export const VR_MONKEY_KNOWLEDGE_ITEM_TYPE = Object.freeze({ CATEGORY: 'CATEGORY', TOPIC: 'TOPIC' });

export const VR_MONKEY_KNOWLEDGE_LIFECYCLE = Object.freeze({
  LOCKED: 'LOCKED', NEW: 'NEW', READ: 'READ', ARCHIVED: 'ARCHIVED'
});

export function createVrMonkeyKnowledgeResolver({ locale, getCurrentObjective, isPostRingStoneGuidance = () => false,
  isAstrolabiumOwned = () => false, isAsterionOwned = () => false }) {
  if (typeof getCurrentObjective !== 'function') throw new TypeError('getCurrentObjective must be a function.');
  const copy = locale === 'pl' ? VR_MONKEY_COMMUNICATION_COPY_PL : VR_MONKEY_COMMUNICATION_COPY_EN;
  const categories = locale === 'pl' ? VR_MONKEY_KNOWLEDGE_CATEGORIES_PL : VR_MONKEY_KNOWLEDGE_CATEGORIES_EN;
  const category = Object.freeze({ id: 'category.whatNow', ...categories['category.whatNow'],
    type: VR_MONKEY_KNOWLEDGE_ITEM_TYPE.CATEGORY });
  const whatIsIt = Object.freeze({ id: 'category.whatIsIt', ...categories['category.whatIsIt'],
    type: VR_MONKEY_KNOWLEDGE_ITEM_TYPE.CATEGORY });
  let stonesRead = false;
  let stonesLeadRead = false;
  let bindersUnlocked = false;
  let bindersRead = false;
  let asterionRead = false;
  let resonatorTaught = false;
  let fullResonatorTaught = false;
  const transientHintFallbacks = new Map();

  function getTopic() {
    if (isPostRingStoneGuidance()) {
      return topicFromCopy(stonesLeadRead ? 'knowledge.p3.stones' : 'knowledge.p3.stonesLead');
    }
    const current = getCurrentObjective();
    return current ? Object.freeze({ id: `objective:${current.id}`, groupId: category.groupId,
      label: current.body, question: current.body, blocks: Object.freeze([current.body]),
      type: VR_MONKEY_KNOWLEDGE_ITEM_TYPE.TOPIC, lifecycle: VR_MONKEY_KNOWLEDGE_LIFECYCLE.READ }) : null;
  }
  const copyById = (id) => copy.knowledge[id];
  const topicFromCopy = (id) => { const source = copyById(id); return Object.freeze({ id, groupId: source.groupId,
    label: source.question, question: source.question, blocks: Object.freeze(source.blocks),
    type: VR_MONKEY_KNOWLEDGE_ITEM_TYPE.TOPIC,
    lifecycle: (id === 'knowledge.p3.stones' && !stonesRead)
      || (id === 'knowledge.p3.binders' && !bindersRead)
      || (id === 'knowledge.asterion.sphere' && !asterionRead)
      ? VR_MONKEY_KNOWLEDGE_LIFECYCLE.NEW : VR_MONKEY_KNOWLEDGE_LIFECYCLE.READ }); };
  function topics(groupId) {
    if (groupId === category.groupId) {
      const ordinaryTopic = getTopic();
      const asterionBuild = isAstrolabiumOwned() && !isAsterionOwned()
        ? topicFromCopy('knowledge.asterion.build') : null;
      return [...transientHintFallbacks.values(), ...(asterionBuild ? [asterionBuild] : []),
        ...(ordinaryTopic ? [ordinaryTopic] : [])];
    }
    if (groupId === whatIsIt.groupId) return [
      ...(isAstrolabiumOwned() ? [topicFromCopy('knowledge.asterion.sphere')] : []),
      ...(bindersUnlocked && !bindersRead ? [topicFromCopy('knowledge.p3.binders')] : [])
    ];
    return [];
  }
  const hasWhatNowContent = () => transientHintFallbacks.size > 0
    || (isAstrolabiumOwned() && !isAsterionOwned()) || getTopic() !== null;
  return Object.freeze({
    getRootItems: () => [...(hasWhatNowContent() ? [category] : []),
      ...((bindersUnlocked && !bindersRead) || isAstrolabiumOwned() ? [whatIsIt] : [])],
    getGroupTopics: topics,
    getCategory: (categoryId) => [category, whatIsIt].find(({ id }) => id === categoryId && topics(id === category.id ? category.groupId : whatIsIt.groupId).length) ?? null,
    getTopic: (topicId) => [...topics(category.groupId), ...topics(whatIsIt.groupId)].find(({ id }) => id === topicId) ?? null,
    getLifecycle: (topicId) => [...topics(category.groupId), ...topics(whatIsIt.groupId)].find(({ id }) => id === topicId)?.lifecycle ?? VR_MONKEY_KNOWLEDGE_LIFECYCLE.LOCKED,
    completeTopic(topicId) {
      for (const [slotId, topic] of transientHintFallbacks) {
        if (topic.id === topicId) transientHintFallbacks.delete(slotId);
      }
      if (topicId === 'knowledge.p3.stonesLead') stonesLeadRead = true;
      if (topicId === 'knowledge.p3.stones') stonesRead = true;
      if (topicId === 'knowledge.p3.binders' && bindersUnlocked) bindersRead = true;
      if (topicId === 'knowledge.asterion.sphere') asterionRead = true;
    },
    markPostRingStoneGuidanceTaught() {
      const changed = !stonesLeadRead || !stonesRead;
      stonesLeadRead = true;
      stonesRead = true;
      return changed;
    },
    markResonatorGuidanceTaught() {
      const changed = !resonatorTaught;
      resonatorTaught = true;
      return changed;
    },
    markFullResonatorGuidanceTaught() {
      const changed = !fullResonatorTaught;
      fullResonatorTaught = true;
      return changed;
    },
    publishTransientHintFallback(slotId, hintId) {
      const source = copy.hints[hintId];
      if (!slotId || !source) return false;
      const finalBlock = source.blocks.at(-1);
      const topic = Object.freeze({ id: `fallback:${hintId}`, groupId: category.groupId,
        label: finalBlock, question: finalBlock, blocks: source.blocks,
        type: VR_MONKEY_KNOWLEDGE_ITEM_TYPE.TOPIC, lifecycle: VR_MONKEY_KNOWLEDGE_LIFECYCLE.NEW });
      if (transientHintFallbacks.get(slotId)?.id === topic.id) return false;
      transientHintFallbacks.set(slotId, topic);
      return true;
    },
    withdrawTransientHintFallback(slotId) { return transientHintFallbacks.delete(slotId); },
    unlockBinders() { bindersUnlocked = true; },
    hasReadStones: () => stonesRead,
    hasDiscoveredBinders: () => bindersUnlocked,
    hasReadBinders: () => bindersRead,
    hasLearnedResonator: () => resonatorTaught,
    hasLearnedFullResonator: () => fullResonatorTaught,
    reset() { stonesRead = false; stonesLeadRead = false; bindersUnlocked = false; bindersRead = false; asterionRead = false;
      resonatorTaught = false; fullResonatorTaught = false;
      transientHintFallbacks.clear(); }
  });
}
