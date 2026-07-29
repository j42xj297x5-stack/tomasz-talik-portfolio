const CRYSTAL_PATHS = Object.freeze({
  'ai-guide': 'crystal-ai_guide',
  'creative-ai': 'crystal-creative_ai',
  'spotify-digger': 'crystal-dig_engine',
  'ethics-life-protection': 'crystal-ethics',
  'haiku-cosmos': 'crystal-haiku_cosmos'
});

const firstParagraph = (value) => String(value || '').split(/\n\s*\n/).find(Boolean)?.trim() || '';

export const experienceVrPagesByGlyphId = Object.freeze(Object.fromEntries(
  Object.entries(CRYSTAL_PATHS).map(([glyphId, filename]) => [glyphId, Object.freeze(
    Array.from({ length: 3 }, (_, index) => Object.freeze({
      id: `${glyphId}-page-${index + 1}`,
      glyphId,
      order: index + 1,
      crystalAssetId: `vr-crystal-${glyphId}-${index + 1}`,
      crystalModelPath: `/glb/${filename}_${String(index + 1).padStart(2, '0')}.glb`,
      contentSelector: index === 0 ? 'project-lead' : index === 1 ? 'project-detail' : 'case-study-fragment'
    }))
  )])
));

export const experienceVrPages = Object.freeze(Object.values(experienceVrPagesByGlyphId).flat());

export function getExperienceVrPages(glyphId) {
  return experienceVrPagesByGlyphId[glyphId] ?? Object.freeze([]);
}

export function resolveExperienceVrPage(page, portfolioNode) {
  if (!page || !portfolioNode || page.glyphId !== portfolioNode.id) return { title: '', body: '' };
  if (page.contentSelector === 'project-lead') {
    return { title: portfolioNode.title, body: portfolioNode.leadText || portfolioNode.draftText || portfolioNode.shortLabel };
  }
  if (page.contentSelector === 'project-detail') {
    return {
      title: portfolioNode.subtitle || portfolioNode.eyebrow || portfolioNode.shortLabel || portfolioNode.title,
      body: firstParagraph(portfolioNode.bodyText) || portfolioNode.closingText || portfolioNode.draftText
    };
  }
  const caseStudy = portfolioNode.caseStudy;
  return {
    title: caseStudy?.title || caseStudy?.heading || portfolioNode.title,
    body: firstParagraph(Array.isArray(caseStudy?.intro) ? caseStudy.intro[0] : caseStudy?.intro)
      || firstParagraph(caseStudy?.problem)
      || portfolioNode.closingText
      || firstParagraph(portfolioNode.bodyText)
  };
}
