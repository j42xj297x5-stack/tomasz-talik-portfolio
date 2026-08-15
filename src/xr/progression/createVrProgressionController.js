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
    if (!Array.isArray(state?.activatedPageIds) || state.completedTier !== 1 || state.tier !== 2) {
      throw new Error('Progression owner only supports the settled Tier 1 completion state');
    }
    activatedPageIds.clear();
    for (const pageId of state.activatedPageIds) {
      if (!orderedPages.some(({ id }) => id === pageId)) throw new Error(`Unknown hydrated page: ${pageId}`);
      activatedPageIds.add(pageId);
    }
    currentTier = 1;
    advanceTier();
    if (currentTier !== 2 || !isTierComplete(1)) throw new Error('Hydrated Tier 1 pages are incomplete');
  }

  return { getCurrentTier, canInsertCrystal, getNextPage, commitPage, hasActivatedPage, getActivatedPageIds,
    isTierComplete, hydrateScenarioState, reset };
}
