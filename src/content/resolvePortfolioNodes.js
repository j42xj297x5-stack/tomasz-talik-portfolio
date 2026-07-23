import { portfolioNodes } from './portfolioNodes.js';

const SUPPORTED_LANGUAGES = new Set(['pl', 'en']);

function normalizeLanguage(language) {
  const [primaryLanguage] = String(language || '').toLowerCase().split('-');
  return SUPPORTED_LANGUAGES.has(primaryLanguage) ? primaryLanguage : 'en';
}

export function resolvePortfolioNodes(language) {
  const resolvedLanguage = normalizeLanguage(language);

  return portfolioNodes.map((node) => {
    const translation = node.translations?.[resolvedLanguage];
    return translation ? { ...node, ...translation } : node;
  });
}
