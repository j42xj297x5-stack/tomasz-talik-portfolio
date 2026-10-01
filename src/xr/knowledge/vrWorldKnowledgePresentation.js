import { publicPath } from '../../utils/publicPath.js';
import { VR_WORLD_KNOWLEDGE_STAGE_STATE } from './createVrWorldKnowledgeModel.js';

const natural = (vowel) => Object.freeze(['K', 'T', 'S', 'L', 'R'].map((family) => `${family}${vowel}`));
const asset = (file) => Object.freeze({ type: 'ASSET', sources: Object.freeze([publicPath(`/svg/${file}`)]) });
const composite = (vowel) => Object.freeze({ type: 'COMPOSITE', symbols: natural(vowel),
  sources: Object.freeze(natural(vowel).map((symbol) => publicPath(`/svg/${symbol}.svg`))) });

export const VR_WORLD_KNOWLEDGE_PRESENTATION = Object.freeze([
  ['world.five_transformations', 'Pięć Przemian', 'Five Transformations', asset('proto_piec_przemian.svg')],
  ['world.proto_astro', 'Proto Astro', 'Proto Astro', asset('proto_jezyk.svg')],
  ['world.shells', 'Powłoki', 'Shells', composite('O')],
  ['world.small_glyphs', 'Małe Glify', 'Small Glyphs', composite('I')],
  ['world.large_glyphs', 'Duże Glify', 'Large Glyphs', composite('A')],
  ['world.crystals', 'Kryształy', 'Crystals', asset('proto_krysztal.svg')],
  ['tools.portal_reliquary', 'Portal i Relikwiarz', 'Portal and Reliquary', asset('proto_portal.svg')],
  ['tools.furnace', 'Piec', 'Furnace', asset('proto_piec.svg')],
  ['tools.bond_astrolabe', 'Astrolabium Więzi', 'Bond Astrolabe', asset('proto_astrolabium_wiezi.svg')],
  ['world.rune_stones', 'Kamienie Runiczne', 'Rune Stones', composite('U')],
  ['platform.sectors', 'Sektory Platformy', 'Platform Sectors', asset('proto_sektor.svg')],
  ['platform.keystone', 'Zwornik', 'Keystone', asset('proto_zwornik.svg')],
  ['tools.asterion_sphere', 'Kula Asterionowa', 'Asterion Sphere', asset('proto_kula_asterionowa.svg')],
  ['tools.asterion_resonator', 'Rezonator Asterionowy', 'Asterion Resonator', asset('proto_rezonator_asterionowy.svg')],
  ['world.ether', 'Eter', 'Ether', asset('proto_eter.svg')]
].map(([categoryId, pl, en, icon], index) => Object.freeze({ categoryId, order: index + 1,
  title: Object.freeze({ pl, en }), icon })));

const presentationsById = new Map(VR_WORLD_KNOWLEDGE_PRESENTATION.map((entry) => [entry.categoryId, entry]));

export function projectVrWorldKnowledge(model, locale = 'en') {
  if (!model) return Object.freeze([]);
  const language = locale === 'pl' ? 'pl' : 'en';
  return Object.freeze(model.getCategories().filter(({ id }) => model.isCategoryDiscovered(id)).map((category) => {
    const presentation = presentationsById.get(category.id);
    const stages = model.getStagesForCategory(category.id).filter(({ id }) =>
      model.getStageState(id) !== VR_WORLD_KNOWLEDGE_STAGE_STATE.LOCKED).map((stage) => Object.freeze({
      ...stage, state: model.getStageState(stage.id), unread: model.getStageState(stage.id) === VR_WORLD_KNOWLEDGE_STAGE_STATE.AVAILABLE
    }));
    return Object.freeze({ ...presentation, title: presentation.title[language], stages: Object.freeze(stages),
      unread: stages.some(({ unread }) => unread) });
  }));
}
