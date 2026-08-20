import { experienceVrPages } from '../../content/experienceVrPages.js';
import { VR_EXPERIENCE_POINT, VR_SCENARIO_CAPABILITY } from '../progression/vrExperienceScenario.js';

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
  [VR_EXPERIENCE_POINT['2.10']]: 'PIERWSZY RING — ZDOBĄDŹ PIERWSZĄ KARTĘ',
  [VR_EXPERIENCE_POINT['2.20']]: 'PIERWSZY RING — ZDOBĄDŹ PIERWSZĄ KARTĘ',
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
  [VR_EXPERIENCE_POINT['100.10']]: 'KONIEC DOŚWIADCZENIA'
});

const TOOLS = Object.freeze([
  Object.freeze({
    capability: VR_SCENARIO_CAPABILITY.CAN_EQUIP_ASTRO,
    label: 'ASTROLABIUM WIĘZI',
    body: 'A — wyposaż / schowaj\nChwyt — namierzanie\nSpust — przyciąganie\nSzpila + chwyt — przejęcie obiektu'
  }),
  Object.freeze({
    capability: VR_SCENARIO_CAPABILITY.CAN_EQUIP_ASTERION,
    label: 'KULA ASTERIONOWA',
    body: 'X — wyposaż / schowaj\nSpust — zmieniaj orientację platformy'
  })
]);

export function createVrPlayerGuideProjection({ locale, getCurrentPointId, can, getActivatedPageIds }) {
  if (typeof getCurrentPointId !== 'function' || typeof can !== 'function'
    || typeof getActivatedPageIds !== 'function') {
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
      return { body: `PIERWSZY RING — ${countActivatedPagesAtOrder(1)}/5` };
    }
    if (pointId === VR_EXPERIENCE_POINT['4.10']) {
      return { body: `DRUGI RING — ${countActivatedPagesAtOrder(2)}/5` };
    }
    const body = TASK_BODY_BY_POINT[pointId];
    return body ? { body } : null;
  }

  function getTools() {
    if (locale !== 'pl') return [];
    return TOOLS.filter(({ capability }) => can(capability))
      .map(({ label, body }) => ({ label, body }));
  }

  return { getCurrentTask, getTools };
}
