import { resolveVrPlayerGuideContent } from './vrPlayerGuideContent.js';

const TOOLS = Object.freeze([
  Object.freeze({
    id: 'furnace'
  }),
  Object.freeze({
    id: 'astro'
  }),
  Object.freeze({
    id: 'asterion'
  })
]);

export function createVrPlayerGuideProjection({ locale, getCurrentObjective, isFurnaceRevealed,
  isShellFieldRevealed, isAstrolabiumOwned, hasReadRuneStones = () => false, hasReadBinders = () => false,
  hasInstalledRune = () => false, hasLearnedResonator = () => false, isMetalInstalled = () => false,
  hasLearnedFullResonator = () => false, isWaterInstalled = () => false,
  isAsterionOwned = () => false, getFinalWaterGuidanceLevel = () => 'NONE' }) {
  if (typeof getCurrentObjective !== 'function' || typeof isFurnaceRevealed !== 'function'
    || typeof isShellFieldRevealed !== 'function' || typeof isAstrolabiumOwned !== 'function'
    || typeof isAsterionOwned !== 'function') {
    throw new TypeError('Player guide projection dependencies must be functions.');
  }

  function getKnowledge() {
    if (!isShellFieldRevealed()) return [];
    const knowledge = resolveVrPlayerGuideContent(locale).knowledge;
    return [
      { id: 'shells', ...knowledge.shells },
      ...(hasReadRuneStones() ? [{ id: 'runeStones', ...knowledge.runeStones }] : []),
      ...(hasReadBinders() ? [{ id: 'binders', ...knowledge.binders }] : []),
      ...(hasLearnedResonator()
        ? [
            { id: 'resonator', ...knowledge.resonator },
            ...(isMetalInstalled() ? [{ id: 'metalSector', ...knowledge.metalSector }] : []),
            ...(hasLearnedFullResonator() && isWaterInstalled()
              ? [{ id: 'waterSector', ...knowledge.waterSector }] : [])
          ]
        : hasInstalledRune() ? [{ id: 'sector', ...knowledge.sector }] : [])
    ];
  }

  const getCurrentTask = () => {
    const current = getCurrentObjective();
    const content = resolveVrPlayerGuideContent(locale);
    const secondaryTasks = [];
    const secondaryIds = [];
    if (isAstrolabiumOwned() && !isAsterionOwned()) {
      secondaryTasks.push(content.asterionBuildTask);
      secondaryIds.push('asterion-build');
    }
    const finalWaterGuidanceLevel = getFinalWaterGuidanceLevel();
    if (finalWaterGuidanceLevel === 'BALANCE') { secondaryTasks.push(content.finalWaterBalanceTask); secondaryIds.push('final-water-balance'); }
    if (finalWaterGuidanceLevel === 'SOLUTION') { secondaryTasks.push(content.finalWaterSolutionTask); secondaryIds.push('final-water-solution'); }
    if (!secondaryTasks.length) return current;
    const bodies = [...(current ? [current.body] : []), ...secondaryTasks];
    return Object.freeze({ id: `${current?.id ?? 'current-task'}+${secondaryIds.join('+')}`,
      body: bodies.join('\n\n') });
  };

  function getTools() {
    const content = resolveVrPlayerGuideContent(locale);
    return TOOLS.filter(({ id }) => id === 'furnace'
      ? isFurnaceRevealed()
      : id === 'astro' ? isAstrolabiumOwned() : isAsterionOwned())
      .map(({ id }) => ({
        id,
        label: content.tools[id].label,
        body: `${content.tools[id].description}\n\n${id === 'astro'
          ? `${content.tools[id].controls}\n${content.tools[id].bandSwitchControl}`
          : content.tools[id].controls}`
      }));
  }

  function getVisibleControlIds() {
    const ids = ['trigger', 'grab', 'rotate', 'move', 'Y'];
    if (isAstrolabiumOwned()) ids.push('A');
    if (isAsterionOwned()) ids.push('X');
    if (isAstrolabiumOwned()) ids.push('B');
    return ids;
  }

  return { getCurrentTask, getTools, getKnowledge, getVisibleControlIds };
}
