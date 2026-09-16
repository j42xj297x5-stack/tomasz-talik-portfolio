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
  isShellFieldRevealed, isAstrolabiumOwned, hasReadRuneStones = () => false, hasDiscoveredBinders = () => false,
  hasInstalledRune = () => false, isAsterionOwned = () => false }) {
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
      ...(hasDiscoveredBinders() ? [{ id: 'binders', ...knowledge.binders }] : []),
      ...(hasInstalledRune() ? [{ id: 'sector', ...knowledge.sector }] : [])
    ];
  }

  const getCurrentTask = () => {
    const current = getCurrentObjective();
    if (!isAstrolabiumOwned() || isAsterionOwned()) return current;
    const secondary = resolveVrPlayerGuideContent(locale).asterionBuildTask;
    return Object.freeze({ id: current ? `${current.id}+asterion-build` : 'asterion-build',
      body: current ? `${current.body}\n\n${secondary}` : secondary });
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
