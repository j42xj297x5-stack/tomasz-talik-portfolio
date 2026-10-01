import { VR_MONKEY_COMMUNICATION_COPY_EN, VR_MONKEY_COMMUNICATION_COPY_PL,
  VR_MONKEY_KNOWLEDGE_CATEGORIES_EN, VR_MONKEY_KNOWLEDGE_CATEGORIES_PL } from './vrMonkeyCommunicationCopy.js';

export const VR_MONKEY_KNOWLEDGE_ITEM_TYPE = Object.freeze({ CATEGORY: 'CATEGORY', TOPIC: 'TOPIC' });

export const VR_MONKEY_KNOWLEDGE_LIFECYCLE = Object.freeze({
  LOCKED: 'LOCKED', NEW: 'NEW', READ: 'READ', ARCHIVED: 'ARCHIVED'
});
export const VR_FINAL_WATER_GUIDANCE_LEVEL = Object.freeze({ NONE: 'NONE', BALANCE: 'BALANCE', SOLUTION: 'SOLUTION' });

export function createVrMonkeyKnowledgeResolver({ locale, getCurrentObjective, isPostRingStoneGuidance = () => false,
  isAstrolabiumOwned = () => false, isAsterionOwned = () => false }) {
  if (typeof getCurrentObjective !== 'function') throw new TypeError('getCurrentObjective must be a function.');
  const copy = locale === 'pl' ? VR_MONKEY_COMMUNICATION_COPY_PL : VR_MONKEY_COMMUNICATION_COPY_EN;
  const categories = locale === 'pl' ? VR_MONKEY_KNOWLEDGE_CATEGORIES_PL : VR_MONKEY_KNOWLEDGE_CATEGORIES_EN;
  const category = Object.freeze({ id: 'category.whatNow', ...categories['category.whatNow'],
    type: VR_MONKEY_KNOWLEDGE_ITEM_TYPE.CATEGORY });
  let stonesRead = false;
  let stonesLeadRead = false;
  let bindersUnlocked = false;
  let resonatorTaught = false;
  let fullResonatorTaught = false;
  let finalWaterBalanceHintTaught = false;
  let finalWaterSolutionOfferAvailable = false;
  let finalWaterSolutionRevealed = false;
  let finalWaterGuidanceResolved = false;
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
      || (id === 'knowledge.finalWater.solution' && !finalWaterSolutionRevealed)
      ? VR_MONKEY_KNOWLEDGE_LIFECYCLE.NEW : VR_MONKEY_KNOWLEDGE_LIFECYCLE.READ }); };
  function topics(groupId) {
    if (groupId === category.groupId) {
      const ordinaryTopic = getTopic();
      const asterionBuild = isAstrolabiumOwned() && !isAsterionOwned()
        ? topicFromCopy('knowledge.asterion.build') : null;
      const finalWaterTopics = finalWaterGuidanceResolved ? [] : finalWaterSolutionRevealed
        ? [topicFromCopy('knowledge.finalWater.solution')]
        : [
            ...(finalWaterBalanceHintTaught ? [topicFromCopy('knowledge.finalWater.balance')] : []),
            ...(finalWaterSolutionOfferAvailable ? [topicFromCopy('knowledge.finalWater.solution')] : [])
          ];
      return [...transientHintFallbacks.values(), ...(asterionBuild ? [asterionBuild] : []),
        ...finalWaterTopics,
        ...(ordinaryTopic ? [ordinaryTopic] : [])];
    }
    return [];
  }
  const hasWhatNowContent = () => transientHintFallbacks.size > 0
    || (isAstrolabiumOwned() && !isAsterionOwned())
    || (!finalWaterGuidanceResolved && (finalWaterBalanceHintTaught || finalWaterSolutionOfferAvailable
      || finalWaterSolutionRevealed))
    || getTopic() !== null;
  return Object.freeze({
    getRootItems: () => hasWhatNowContent() ? [category] : [],
    getGroupTopics: topics,
    getCategory: (categoryId) => categoryId === category.id && topics(category.groupId).length ? category : null,
    getTopic: (topicId) => topics(category.groupId).find(({ id }) => id === topicId) ?? null,
    getLifecycle: (topicId) => topics(category.groupId).find(({ id }) => id === topicId)?.lifecycle
      ?? VR_MONKEY_KNOWLEDGE_LIFECYCLE.LOCKED,
    completeTopic(topicId) {
      for (const [slotId, topic] of transientHintFallbacks) {
        if (topic.id === topicId) transientHintFallbacks.delete(slotId);
      }
      if (topicId === 'knowledge.p3.stonesLead') stonesLeadRead = true;
      if (topicId === 'knowledge.p3.stones') stonesRead = true;
      if (topicId === 'knowledge.finalWater.solution' && finalWaterSolutionOfferAvailable) {
        finalWaterSolutionRevealed = true;
        finalWaterSolutionOfferAvailable = false;
      }
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
    markFinalWaterBalanceHintTaught() {
      if (finalWaterGuidanceResolved || finalWaterBalanceHintTaught) return false;
      finalWaterBalanceHintTaught = true;
      return true;
    },
    makeFinalWaterSolutionOfferAvailable() {
      if (finalWaterGuidanceResolved || finalWaterSolutionRevealed || finalWaterSolutionOfferAvailable) return false;
      finalWaterSolutionOfferAvailable = true;
      return true;
    },
    markFinalWaterSolutionRevealed() {
      if (finalWaterGuidanceResolved || finalWaterSolutionRevealed) return false;
      finalWaterSolutionRevealed = true;
      finalWaterSolutionOfferAvailable = false;
      return true;
    },
    resolveFinalWaterGuidance() {
      const changed = !finalWaterGuidanceResolved;
      finalWaterGuidanceResolved = true;
      finalWaterSolutionOfferAvailable = false;
      return changed;
    },
    getFinalWaterGuidanceLevel() {
      if (finalWaterGuidanceResolved) return VR_FINAL_WATER_GUIDANCE_LEVEL.NONE;
      if (finalWaterSolutionRevealed) return VR_FINAL_WATER_GUIDANCE_LEVEL.SOLUTION;
      return finalWaterBalanceHintTaught ? VR_FINAL_WATER_GUIDANCE_LEVEL.BALANCE : VR_FINAL_WATER_GUIDANCE_LEVEL.NONE;
    },
    isFinalWaterSolutionOfferAvailable: () => !finalWaterGuidanceResolved && finalWaterSolutionOfferAvailable,
    hasFinalWaterSolutionRevealed: () => finalWaterSolutionRevealed,
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
    hasReadBinders: () => bindersUnlocked,
    hasLearnedResonator: () => resonatorTaught,
    hasLearnedFullResonator: () => fullResonatorTaught,
    reset() { stonesRead = false; stonesLeadRead = false; bindersUnlocked = false;
      resonatorTaught = false; fullResonatorTaught = false;
      finalWaterBalanceHintTaught = false; finalWaterSolutionOfferAvailable = false;
      finalWaterSolutionRevealed = false; finalWaterGuidanceResolved = false;
      transientHintFallbacks.clear(); }
  });
}
