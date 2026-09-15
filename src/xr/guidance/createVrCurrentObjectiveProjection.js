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

const APPROVED_OBJECTIVE_BODY_BY_LOCALE = Object.freeze({
  'first-ring-progress': Object.freeze({
    pl: ({ count, total }) => `UKOŃCZ PIERWSZY KRĄG — ${count}/${total}`,
    en: ({ count, total }) => `COMPLETE THE FIRST RING — ${count}/${total}`
  }),
  'asterion-shell-collection': Object.freeze({
    pl: ({ count, total }) => `ZGROMADŹ SKORUPY — ${count}/${total}`,
    en: ({ count, total }) => `COLLECT SHELLS — ${count}/${total}`
  }),
  'asterion-build': Object.freeze({
    pl: () => 'ZBUDUJ KULĘ ASTERIONOWĄ',
    en: () => 'BUILD THE ASTERION SPHERE'
  }),
  'asterion-production': Object.freeze({
    pl: () => 'KULA ASTERIONOWA — PRODUKCJA',
    en: () => 'ASTERION SPHERE — FORGING'
  }),
  'asterion-claim': Object.freeze({
    pl: () => 'ODBIERZ KULĘ ASTERIONOWĄ',
    en: () => 'COLLECT THE ASTERION SPHERE'
  }),
  'second-ring-progress': Object.freeze({
    pl: ({ count, total }) => `UKOŃCZ DRUGI KRĄG — ${count}/${total}`,
    en: ({ count, total }) => `COMPLETE THE SECOND RING — ${count}/${total}`
  }),
  'astro-tuning-and-third-ring': Object.freeze({
    pl: ({ tunedCount, tunedTotal, ringCount, ringTotal }) => `DOSTRÓJ ASTROLABIUM — ${tunedCount}/${tunedTotal} · UKOŃCZ TRZECI KRĄG — ${ringCount}/${ringTotal}`,
    en: ({ tunedCount, tunedTotal, ringCount, ringTotal }) => `TUNE THE ASTROLABE — ${tunedCount}/${tunedTotal} · COMPLETE THE THIRD RING — ${ringCount}/${ringTotal}`
  }),
  'third-ring-progress': Object.freeze({
    pl: ({ count, total }) => `UKOŃCZ TRZECI KRĄG — ${count}/${total}`,
    en: ({ count, total }) => `COMPLETE THE THIRD RING — ${count}/${total}`
  }),
  'resonator-core': Object.freeze({
    pl: ({ tuned, installed, total }) => `PRZYGOTUJ REZONATOR — STROJENIE ${tuned}/${total} · INSTALACJA ${installed}/${total}`,
    en: ({ tuned, installed, total }) => `AWAKEN THE RESONATOR — ATTUNEMENT ${tuned}/${total} · INSTALLATION ${installed}/${total}`
  })
});

export function createVrCurrentObjectiveProjection({ locale, getCurrentPointId, getActivatedPageIds,
  getAsterionProductionState, getAsterionSphereProgress, getExtractedFamilyCodes,
  getRuneProgressionSnapshot, getResonatorDescriptor }) {
  if ([getCurrentPointId, getActivatedPageIds, getAsterionProductionState, getAsterionSphereProgress,
    getExtractedFamilyCodes, getRuneProgressionSnapshot, getResonatorDescriptor]
    .some((dependency) => typeof dependency !== 'function')) {
    throw new TypeError('Current objective projection dependencies must be functions.');
  }
  function countActivatedPages(tier) {
    const activated = new Set(getActivatedPageIds());
    return experienceVrPageIdsByTier[tier].filter((pageId) => activated.has(pageId)).length;
  }
  const objective = (id, values = {}) => {
    const formatBody = APPROVED_OBJECTIVE_BODY_BY_LOCALE[id]?.[locale];
    return formatBody ? Object.freeze({ id, body: formatBody(values) }) : null;
  };
  function getCurrentObjective() {
    const pointId = getCurrentPointId();
    if (pointId === VR_EXPERIENCE_POINT['2.30']) return objective('first-ring-progress',
      { count: countActivatedPages(1), total: experienceVrPageIdsByTier[1].length });
    if (pointId === VR_EXPERIENCE_POINT['3.80']) {
      const progress = getAsterionSphereProgress(); const state = getAsterionProductionState();
      if (!progress.complete) return objective('asterion-shell-collection', { count: progress.absorbed, total: progress.required });
      if (state === VR_ASTERION_PRODUCTION_STATES.READY) return objective('asterion-build');
      if (state === VR_ASTERION_PRODUCTION_STATES.BUILDING) return objective('asterion-production');
      if (state === VR_ASTERION_PRODUCTION_STATES.AVAILABLE) return objective('asterion-claim');
      return null;
    }
    if (pointId === VR_EXPERIENCE_POINT['4.10']) return objective('second-ring-progress',
      { count: countActivatedPages(2), total: experienceVrPageIdsByTier[2].length });
    if (pointId === VR_EXPERIENCE_POINT['4.70']) {
      const tunedCount = getExtractedFamilyCodes().length; const tunedTotal = PROTO_ASTRO_NATURAL_FAMILY_CODES.length;
      const ringCount = countActivatedPages(3); const ringTotal = experienceVrPageIdsByTier[3].length;
      return tunedCount < tunedTotal
        ? objective('astro-tuning-and-third-ring', { tunedCount, tunedTotal, ringCount, ringTotal })
        : objective('third-ring-progress', { count: ringCount, total: ringTotal });
    }
    if (pointId === VR_EXPERIENCE_POINT['4.80']) {
      if (getResonatorDescriptor().resonatorExists) return null;
      const { tunedRuneFamilies, installedRuneFamilies } = getRuneProgressionSnapshot();
      const coreFamilies = ['K', 'R', 'L'];
      const tuned = coreFamilies.filter((family) => tunedRuneFamilies.includes(family)).length;
      const installed = coreFamilies.filter((family) => installedRuneFamilies.includes(family)).length;
      return objective('resonator-core', { tuned, installed, total: coreFamilies.length });
    }
    const body = OBJECTIVE_BODY_BY_POINT[pointId];
    return locale === 'pl' && body ? Object.freeze({ id: `scenario-${pointId}`, body }) : null;
  }
  return Object.freeze({ getCurrentObjective });
}
