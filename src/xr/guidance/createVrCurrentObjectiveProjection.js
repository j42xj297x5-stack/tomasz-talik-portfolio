import { experienceVrPageIdsByTier } from '../../content/experienceVrPages.js';
import { VR_ASTERION_PRODUCTION_STATES } from '../asterion/createVrAsterionProductionController.js';
import { PROTO_ASTRO_NATURAL_FAMILY_CODES } from '../protoAstro/protoAstroRegistry.js';
import { VR_EXPERIENCE_POINT } from '../progression/vrExperienceScenario.js';

const OBJECTIVE_BODY_BY_POINT = Object.freeze({
  [VR_EXPERIENCE_POINT['1.10']]: 'KALIBRACJA XR',
  [VR_EXPERIENCE_POINT['1.20']]: 'OBSERWUJ ŚWIAT', [VR_EXPERIENCE_POINT['1.30']]: 'OBSERWUJ ŚWIAT',
  [VR_EXPERIENCE_POINT['1.40']]: 'OTWÓRZ PANEL Y', [VR_EXPERIENCE_POINT['1.50']]: 'OTWÓRZ: STEROWANIE',
  [VR_EXPERIENCE_POINT['1.60']]: 'ZAMKNIJ PANEL Y', [VR_EXPERIENCE_POINT['1.70']]: 'WSKAŻ MAŁPĘ',
  [VR_EXPERIENCE_POINT['1.80']]: 'SPUST — MAŁPA', [VR_EXPERIENCE_POINT['1.90']]: 'PODAJ KRYSZTAŁ MAŁPIE',
  [VR_EXPERIENCE_POINT['1.100']]: 'WYBIERZ ODPOWIEDŹ', [VR_EXPERIENCE_POINT['1.110']]: 'IDŹ ZA MAŁPĄ',
  [VR_EXPERIENCE_POINT['1.120']]: 'PRÓG — WYBIERZ', [VR_EXPERIENCE_POINT['1.130']]: 'WEJDŹ DO KRĘGU',
  [VR_EXPERIENCE_POINT['2.10']]: 'ZDOBĄDŹ PIERWSZY KRYSZTAŁ', [VR_EXPERIENCE_POINT['2.20']]: 'POROZMAWIAJ Z MAŁPĄ',
  [VR_EXPERIENCE_POINT['2.40']]: 'OBSERWUJ ZMIANĘ ŚWIATA', [VR_EXPERIENCE_POINT['3.10']]: 'OBSERWUJ ZMIANĘ ŚWIATA',
  [VR_EXPERIENCE_POINT['3.20']]: 'OBSERWUJ ZMIANĘ ŚWIATA', [VR_EXPERIENCE_POINT['3.30']]: 'MAŁPA',
  [VR_EXPERIENCE_POINT['3.40']]: 'PIEC', [VR_EXPERIENCE_POINT['3.50']]: 'ASTROLABIUM WIĘZI — UTWÓRZ W PIECU',
  [VR_EXPERIENCE_POINT['3.60']]: 'ASTROLABIUM WIĘZI — PRODUKCJA', [VR_EXPERIENCE_POINT['3.70']]: 'ASTROLABIUM WIĘZI — ODBIERZ Z PIECA',
  [VR_EXPERIENCE_POINT['4.20']]: 'OBSERWUJ ZMIANĘ ŚWIATA', [VR_EXPERIENCE_POINT['4.30']]: 'OBSERWUJ ZMIANĘ ŚWIATA',
  [VR_EXPERIENCE_POINT['4.40']]: 'OBSERWUJ ZMIANĘ ŚWIATA', [VR_EXPERIENCE_POINT['4.50']]: 'MAŁPA',
  [VR_EXPERIENCE_POINT['4.60']]: 'MAŁPA', [VR_EXPERIENCE_POINT['100.10']]: 'KONIEC DOŚWIADCZENIA'
});

export function createVrCurrentObjectiveProjection({ locale, getCurrentPointId, getActivatedPageIds,
  getAsterionProductionState, getAsterionSphereProgress, getExtractedFamilyCodes }) {
  if ([getCurrentPointId, getActivatedPageIds, getAsterionProductionState, getAsterionSphereProgress,
    getExtractedFamilyCodes].some((dependency) => typeof dependency !== 'function')) {
    throw new TypeError('Current objective projection dependencies must be functions.');
  }
  function countActivatedPages(tier) {
    const activated = new Set(getActivatedPageIds());
    return experienceVrPageIdsByTier[tier].filter((pageId) => activated.has(pageId)).length;
  }
  const objective = (id, body) => Object.freeze({ id, body });
  function getCurrentObjective() {
    if (locale !== 'pl') return null;
    const pointId = getCurrentPointId();
    if (pointId === VR_EXPERIENCE_POINT['2.30']) return objective('first-ring-progress',
      `PIERWSZY KRĄG — ${countActivatedPages(1)}/${experienceVrPageIdsByTier[1].length}`);
    if (pointId === VR_EXPERIENCE_POINT['3.80']) {
      const progress = getAsterionSphereProgress(); const state = getAsterionProductionState();
      if (!progress.complete) return objective('asterion-shell-collection', `ZGROMADŹ SKORUPY — ${progress.absorbed}/${progress.required}`);
      if (state === VR_ASTERION_PRODUCTION_STATES.READY) return objective('asterion-build', 'ZBUDUJ KULĘ ASTERIONOWĄ');
      if (state === VR_ASTERION_PRODUCTION_STATES.BUILDING) return objective('asterion-production', 'KULA ASTERIONOWA — PRODUKCJA');
      if (state === VR_ASTERION_PRODUCTION_STATES.AVAILABLE) return objective('asterion-claim', 'ODBIERZ KULĘ ASTERIONOWĄ');
      return null;
    }
    if (pointId === VR_EXPERIENCE_POINT['4.10']) return objective('second-ring-progress',
      `DRUGI KRĄG — ${countActivatedPages(2)}/${experienceVrPageIdsByTier[2].length}`);
    if (pointId === VR_EXPERIENCE_POINT['4.70']) {
      const tunedCount = getExtractedFamilyCodes().length; const tunedTotal = PROTO_ASTRO_NATURAL_FAMILY_CODES.length;
      const ringCount = countActivatedPages(3); const ringTotal = experienceVrPageIdsByTier[3].length;
      return tunedCount < tunedTotal
        ? objective('astro-tuning-and-third-ring', `DOSTRÓJ ASTROLABIUM — ${tunedCount}/${tunedTotal} · TRZECI KRĄG — ${ringCount}/${ringTotal}`)
        : objective('third-ring-progress', `TRZECI KRĄG — ${ringCount}/${ringTotal}`);
    }
    if (pointId === VR_EXPERIENCE_POINT['4.80']) {
      const total = experienceVrPageIdsByTier[3].length;
      return objective('third-ring-complete', `TRZECI KRĄG — ${total}/${total}`);
    }
    const body = OBJECTIVE_BODY_BY_POINT[pointId];
    return body ? objective(`scenario-${pointId}`, body) : null;
  }
  return Object.freeze({ getCurrentObjective });
}
