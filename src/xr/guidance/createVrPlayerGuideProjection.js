import { VR_SCENARIO_CAPABILITY } from '../progression/vrExperienceScenario.js';
import { resolveVrPlayerGuideContent } from './vrPlayerGuideContent.js';

const TOOLS = Object.freeze([
  Object.freeze({
    id: 'furnace'
  }),
  Object.freeze({
    id: 'astro'
  }),
  Object.freeze({
    id: 'asterion',
    capability: VR_SCENARIO_CAPABILITY.CAN_EQUIP_ASTERION
  })
]);

export function createVrPlayerGuideProjection({ locale, can, getCurrentObjective, isFurnaceRevealed,
  isShellFieldRevealed, isAstrolabiumOwned, hasReadRuneStones = () => false, hasDiscoveredBinders = () => false,
  hasInstalledRune = () => false }) {
  if (typeof can !== 'function' || typeof getCurrentObjective !== 'function'
    || typeof isFurnaceRevealed !== 'function' || typeof isShellFieldRevealed !== 'function'
    || typeof isAstrolabiumOwned !== 'function') {
    throw new TypeError('Player guide projection dependencies must be functions.');
  }

  function getKnowledge() {
    if (locale !== 'pl' || !isShellFieldRevealed()) return [];
    const knowledge = resolveVrPlayerGuideContent(locale).knowledge;
    return [
      { id: 'shells', ...knowledge.shells },
      ...(hasReadRuneStones() ? [{ id: 'runeStones', ...knowledge.runeStones }] : []),
      ...(hasDiscoveredBinders() ? [{ id: 'binders', ...knowledge.binders }] : []),
      ...(hasInstalledRune() ? [{ id: 'sector', ...knowledge.sector }] : [])
    ];
  }

  const getCurrentTask = () => getCurrentObjective();

  function getTools() {
    if (locale !== 'pl') return [];
    const content = resolveVrPlayerGuideContent(locale);
    return TOOLS.filter(({ id, capability }) => id === 'furnace'
      ? isFurnaceRevealed()
      : id === 'astro' ? isAstrolabiumOwned() : can(capability))
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
    if (can(VR_SCENARIO_CAPABILITY.CAN_EQUIP_ASTERION)) ids.push('X');
    if (isAstrolabiumOwned()) ids.push('B');
    return ids;
  }

  return { getCurrentTask, getTools, getKnowledge, getVisibleControlIds };
}
