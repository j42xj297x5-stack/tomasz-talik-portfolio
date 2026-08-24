import { experienceVrPages } from '../../content/experienceVrPages.js';
import { VR_EXPERIENCE_POINT, VR_SCENARIO_CAPABILITY } from '../progression/vrExperienceScenario.js';
import { resolveVrPlayerGuideContent } from './vrPlayerGuideContent.js';

const TASK_BODY_BY_POINT = Object.freeze({
  [VR_EXPERIENCE_POINT['1.10']]: 'KALIBRACJA XR',
  [VR_EXPERIENCE_POINT['1.20']]: 'OBSERWUJ ŚWIAT',
  [VR_EXPERIENCE_POINT['1.30']]: 'OBSERWUJ ŚWIAT',
  [VR_EXPERIENCE_POINT['1.40']]: 'OTWÓRZ PANEL Y',
  [VR_EXPERIENCE_POINT['1.50']]: 'OTWÓRZ: STEROWANIE',
  [VR_EXPERIENCE_POINT['1.60']]: 'ZAMKNIJ PANEL Y',
  [VR_EXPERIENCE_POINT['1.70']]: 'WSKAŻ MAŁPĘ',
  [VR_EXPERIENCE_POINT['1.80']]: 'SPUST — MAŁPA',
  [VR_EXPERIENCE_POINT['1.90']]: 'PODAJ KRYSZTAŁ MAŁPIE',
  [VR_EXPERIENCE_POINT['1.100']]: 'WYBIERZ ODPOWIEDŹ',
  [VR_EXPERIENCE_POINT['1.110']]: 'IDŹ ZA MAŁPĄ',
  [VR_EXPERIENCE_POINT['1.120']]: 'PRÓG — WYBIERZ',
  [VR_EXPERIENCE_POINT['1.130']]: 'WEJDŹ DO KRĘGU',
  [VR_EXPERIENCE_POINT['2.10']]: 'PIERWSZY KRĄG — ZDOBĄDŹ PIERWSZY KRYSZTAŁ',
  [VR_EXPERIENCE_POINT['2.20']]: 'PIERWSZY KRĄG — ZDOBĄDŹ PIERWSZY KRYSZTAŁ',
  [VR_EXPERIENCE_POINT['2.40']]: 'OBSERWUJ ZMIANĘ ŚWIATA',
  [VR_EXPERIENCE_POINT['3.10']]: 'OBSERWUJ ZMIANĘ ŚWIATA',
  [VR_EXPERIENCE_POINT['3.20']]: 'OBSERWUJ ZMIANĘ ŚWIATA',
  [VR_EXPERIENCE_POINT['3.30']]: 'MAŁPA',
  [VR_EXPERIENCE_POINT['3.40']]: 'PIEC',
  [VR_EXPERIENCE_POINT['3.50']]: 'ASTROLABIUM WIĘZI — UTWÓRZ W PIECU',
  [VR_EXPERIENCE_POINT['3.60']]: 'ASTROLABIUM WIĘZI — PRODUKCJA',
  [VR_EXPERIENCE_POINT['3.70']]: 'ASTROLABIUM WIĘZI — ODBIERZ Z PIECA',
  [VR_EXPERIENCE_POINT['3.80']]: 'KULA ASTERIONOWA — ZGROMADŹ SKORUPY I ZBUDUJ',
  [VR_EXPERIENCE_POINT['4.20']]: 'OBSERWUJ ZMIANĘ ŚWIATA',
  [VR_EXPERIENCE_POINT['4.30']]: 'OBSERWUJ ZMIANĘ ŚWIATA',
  [VR_EXPERIENCE_POINT['4.40']]: 'OBSERWUJ ZMIANĘ ŚWIATA',
  [VR_EXPERIENCE_POINT['4.50']]: 'MAŁPA',
  [VR_EXPERIENCE_POINT['4.60']]: 'MAŁPA',
  [VR_EXPERIENCE_POINT['4.80']]: 'TRZECI KRĄG — 5/5',
  [VR_EXPERIENCE_POINT['100.10']]: 'KONIEC DOŚWIADCZENIA'
});

const TOOLS = Object.freeze([
  Object.freeze({
    id: 'furnace',
    capability: VR_SCENARIO_CAPABILITY.CAN_USE_FURNACE
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

export function createVrPlayerGuideProjection({ locale, getCurrentPointId, can, getActivatedPageIds, getExtractedFamilyCodes }) {
  if (typeof getCurrentPointId !== 'function' || typeof can !== 'function'
    || typeof getActivatedPageIds !== 'function' || typeof getExtractedFamilyCodes !== 'function') {
    throw new TypeError('Player guide projection dependencies must be functions.');
  }

  function countActivatedPagesAtOrder(order) {
    const activatedPageIds = new Set(getActivatedPageIds());
    return experienceVrPages.filter((page) => page.order === order && activatedPageIds.has(page.id)).length;
  }

  function getCurrentTask() {
    if (locale !== 'pl') return null;
    const pointId = getCurrentPointId();
    if (pointId === VR_EXPERIENCE_POINT['2.30']) {
      return { body: `PIERWSZY KRĄG — ${countActivatedPagesAtOrder(1)}/5` };
    }
    if (pointId === VR_EXPERIENCE_POINT['4.70']) {
      return { body: getExtractedFamilyCodes().length === 0 ? 'DOSTRÓJ ASTROLABIUM WIĘZI'
        : `TRZECI KRĄG — ${countActivatedPagesAtOrder(3)}/5` };
    }
    if (pointId === VR_EXPERIENCE_POINT['4.10']) {
      return { body: `DRUGI RING — ${countActivatedPagesAtOrder(2)}/5` };
    }
    const body = TASK_BODY_BY_POINT[pointId];
    return body ? { body } : null;
  }

  function getTools() {
    if (locale !== 'pl') return [];
    const content = resolveVrPlayerGuideContent(locale);
    return TOOLS.filter(({ capability }) => can(capability))
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

  return { getCurrentTask, getTools, getVisibleControlIds };
}
