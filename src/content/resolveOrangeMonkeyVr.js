import { orangeMonkeyVr } from './orangeMonkeyVr.js';

const SUPPORTED_LANGUAGES = new Set(['pl', 'en']);

function normalizeLanguage(language) {
  const [primaryLanguage] = String(language || '').toLowerCase().split('-');
  return SUPPORTED_LANGUAGES.has(primaryLanguage) ? primaryLanguage : 'en';
}

export function resolveOrangeMonkeyVr(language) {
  const resolvedLanguage = normalizeLanguage(language);
  return { ...orangeMonkeyVr, ...orangeMonkeyVr.translations[resolvedLanguage] };
}
