import { portalCards, portalCardsByGlyphId, resolvePortalCard } from './portalCards.js';

const CRYSTAL_PATHS = Object.freeze({
  'ai-guide': 'crystal-ai_guide',
  'creative-ai': 'crystal-creative_ai',
  'spotify-digger': 'crystal-dig_engine',
  'ethics-life-protection': 'crystal-ethics',
  'haiku-cosmos': 'crystal-haiku_cosmos'
});

const toVrPage = (card) => {
  const visualVariant = ((card.order - 1) % 3) + 1;
  return Object.freeze({
    id: card.id,
    cardId: card.id,
    crystalId: card.crystalId,
    glyphId: card.glyphId,
    branchId: card.glyphId,
    elementId: card.elementId,
    order: card.order,
    tier: card.order,
    starter: card.starter,
    visualVariant,
    crystalAssetId: `vr-crystal-${card.glyphId}-${visualVariant}`,
    crystalModelPath: `/glb/${CRYSTAL_PATHS[card.glyphId]}_${String(visualVariant).padStart(2, '0')}.glb`,
    translations: card.translations
  });
};

const pagesByCardId = new Map(portalCards.map((card) => [card.id, toVrPage(card)]));

export const experienceVrPagesByGlyphId = Object.freeze(Object.fromEntries(
  Object.entries(portalCardsByGlyphId).map(([glyphId, cards]) => [
    glyphId,
    Object.freeze(cards.map((card) => pagesByCardId.get(card.id)))
  ])
));

export const experienceVrPages = Object.freeze(portalCards.map((card) => pagesByCardId.get(card.id)));

const pageIdsByTier = new Map();
for (const card of portalCards) {
  const ids = pageIdsByTier.get(card.order) ?? [];
  ids.push(card.id);
  pageIdsByTier.set(card.order, ids);
}
export const experienceVrPageIdsByTier = Object.freeze(Object.fromEntries(
  [...pageIdsByTier].map(([tier, ids]) => [tier, Object.freeze(ids)])
));

export function getExperienceVrPages(glyphId) {
  return experienceVrPagesByGlyphId[glyphId] ?? Object.freeze([]);
}

export function resolveExperienceVrPage(page, language) {
  if (!page) return { title: '', body: '', crystalLabel: '' };
  const resolved = resolvePortalCard(page, language);
  return Object.freeze({ ...page, title: resolved.title, body: resolved.body, crystalLabel: resolved.crystalLabel });
}
