const REQUIRED_BRANCHES_BY_TIER = Object.freeze({
  1: Object.freeze(['ethics-life-protection', 'creative-ai', 'ai-guide', 'spotify-digger', 'haiku-cosmos']),
  2: Object.freeze(['ethics-life-protection', 'creative-ai', 'ai-guide', 'spotify-digger', 'haiku-cosmos']),
  3: Object.freeze(['ethics-life-protection', 'creative-ai', 'ai-guide', 'spotify-digger', 'haiku-cosmos']),
  4: Object.freeze(['spotify-digger', 'haiku-cosmos']),
  5: Object.freeze(['haiku-cosmos'])
});

export function createVrProgressionController({ pages }) {
  const orderedPages = [...pages].sort((a, b) => a.order - b.order);
  const pagesByBranchAndTier = new Map(orderedPages.map((page) => [`${page.glyphId}:${page.order}`, page]));
  const activatedPageIds = new Set();
  let currentTier = 1;

  function isTierComplete(tier) {
    const branches = REQUIRED_BRANCHES_BY_TIER[tier];
    return Boolean(branches?.every((branchId) => {
      const page = pagesByBranchAndTier.get(`${branchId}:${tier}`);
      return page && activatedPageIds.has(page.id);
    }));
  }

  function advanceTier() {
    while (currentTier < 5 && isTierComplete(currentTier)) currentTier += 1;
  }

  function getCurrentTier() { return currentTier; }

  function getNextPage(branchId, tier) {
    if (!Number.isInteger(tier) || tier !== currentTier) return null;
    const page = pagesByBranchAndTier.get(`${branchId}:${tier}`) ?? null;
    if (!page || activatedPageIds.has(page.id)) return null;
    for (let previousTier = 1; previousTier < tier; previousTier += 1) {
      const previousPage = pagesByBranchAndTier.get(`${branchId}:${previousTier}`);
      if (previousPage && !activatedPageIds.has(previousPage.id)) return null;
    }
    return page;
  }

  function canInsertCrystal(branchId, tier) {
    return Boolean(getNextPage(branchId, tier));
  }

  function commitPage(page) {
    if (!page || getNextPage(page.glyphId, page.order)?.id !== page.id) return false;
    activatedPageIds.add(page.id);
    advanceTier();
    return true;
  }

  function hasActivatedPage(pageId) { return activatedPageIds.has(pageId); }
  function getActivatedPageIds() { return [...activatedPageIds]; }
  function reset() { activatedPageIds.clear(); currentTier = 1; }

  function hydrateScenarioState(state) {
    if (!Array.isArray(state?.activatedPageIds)) {
      throw new TypeError('Progression hydration requires activatedPageIds');
    }

    // Validate and derive against an isolated candidate first. Hydration replaces
    // persistent truth only after the complete state has passed owner invariants.
    const candidateIds = new Set();
    for (const pageId of state.activatedPageIds) {
      if (typeof pageId !== 'string' || !orderedPages.some(({ id }) => id === pageId)) {
        throw new Error(`Unknown hydrated page: ${pageId}`);
      }
      if (candidateIds.has(pageId)) throw new Error(`Duplicate hydrated page: ${pageId}`);
      candidateIds.add(pageId);
    }

    const candidateTierComplete = (tier) => REQUIRED_BRANCHES_BY_TIER[tier]?.every((branchId) => {
      const page = pagesByBranchAndTier.get(`${branchId}:${tier}`);
      return page && candidateIds.has(page.id);
    }) ?? false;
    let candidateTier = 1;
    while (candidateTier < 5 && candidateTierComplete(candidateTier)) candidateTier += 1;

    for (const page of orderedPages) {
      if (!candidateIds.has(page.id)) continue;
      for (let tier = 1; tier < page.order; tier += 1) {
        if (!candidateTierComplete(tier)) {
          throw new Error(`Hydrated page violates tier ordering: ${page.id}`);
        }
        const previousPage = pagesByBranchAndTier.get(`${page.glyphId}:${tier}`);
        if (previousPage && !candidateIds.has(previousPage.id)) {
          throw new Error(`Hydrated page violates branch ordering: ${page.id}`);
        }
      }
    }
    if (state.tier !== undefined && state.tier !== candidateTier) {
      throw new Error('Hydrated tier does not match activated pages');
    }
    if (state.completedTier !== undefined
      && state.completedTier !== (candidateTier > 1 ? candidateTier - 1 : null)) {
      throw new Error('Hydrated completed tier does not match activated pages');
    }

    activatedPageIds.clear();
    candidateIds.forEach((pageId) => activatedPageIds.add(pageId));
    currentTier = candidateTier;
  }

  return { getCurrentTier, canInsertCrystal, getNextPage, commitPage, hasActivatedPage, getActivatedPageIds,
    isTierComplete, hydrateScenarioState, reset };
}
