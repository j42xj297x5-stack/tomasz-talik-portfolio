import { VR_SCENARIO_CAPABILITY } from '../progression/vrExperienceScenario.js';
import { resolveVrPlayerGuideContent } from './vrPlayerGuideContent.js';

const TOOLS = Object.freeze([
  Object.freeze({
    id: 'furnace'
  }),
  Object.freeze({
    id: 'astro',
    capability: VR_SCENARIO_CAPABILITY.CAN_EQUIP_ASTRO
  }),
  Object.freeze({
    id: 'asterion',
    capability: VR_SCENARIO_CAPABILITY.CAN_EQUIP_ASTERION
  })
]);

export function createVrPlayerGuideProjection({ locale, can, getCurrentObjective, isFurnaceRevealed,
  isShellFieldRevealed }) {
  if (typeof can !== 'function' || typeof getCurrentObjective !== 'function'
    || typeof isFurnaceRevealed !== 'function' || typeof isShellFieldRevealed !== 'function') {
    throw new TypeError('Player guide projection dependencies must be functions.');
  }

  function getKnowledge() {
    if (locale !== 'pl' || !isShellFieldRevealed()) return [];
    const shells = resolveVrPlayerGuideContent(locale).knowledge.shells;
    return [{ id: 'shells', label: shells.label, body: shells.body }];
  }

  const getCurrentTask = () => getCurrentObjective();

  function getTools() {
    if (locale !== 'pl') return [];
    const content = resolveVrPlayerGuideContent(locale);
    return TOOLS.filter(({ id, capability }) => id === 'furnace' ? isFurnaceRevealed() : can(capability))
      .map(({ id }) => ({
        id,
        label: content.tools[id].label,
        body: `${content.tools[id].description}\n\n${id === 'astro'
          && can(VR_SCENARIO_CAPABILITY.CAN_SWITCH_ASTRO_BAND)
          ? `${content.tools[id].controls}\n${content.tools[id].bandSwitchControl}`
          : content.tools[id].controls}`
      }));
  }

  function getVisibleControlIds() {
    const ids = ['trigger', 'grab', 'rotate', 'move', 'Y'];
    if (can(VR_SCENARIO_CAPABILITY.CAN_EQUIP_ASTRO)) ids.push('A');
    if (can(VR_SCENARIO_CAPABILITY.CAN_EQUIP_ASTERION)) ids.push('X');
    if (can(VR_SCENARIO_CAPABILITY.CAN_SWITCH_ASTRO_BAND)) ids.push('B');
    return ids;
  }

  return { getCurrentTask, getTools, getKnowledge, getVisibleControlIds };
}
