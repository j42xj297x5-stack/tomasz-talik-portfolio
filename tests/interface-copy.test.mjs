import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { getInterfaceCopy, normalizeInterfaceLanguage } from '../src/i18n/interfaceCopy.js';

const polish = getInterfaceCopy('pl');
const english = getInterfaceCopy('en');

assert.equal(normalizeInterfaceLanguage('pl'), 'pl');
assert.equal(normalizeInterfaceLanguage('de'), 'en');
assert.equal(polish.solution, 'Rozwiązanie');
assert.equal(polish.enlargeDemo, 'Powiększ demo');
assert.equal(english.solution, 'Solution');
assert.equal(english.enlargeDemo, 'Enlarge demo');
assert.equal(getInterfaceCopy('unsupported'), english);

const [classic, overlay, experience, main] = await Promise.all([
  readFile(new URL('../src/classic2d.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/ui/overlay.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/experience3d.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/main.js', import.meta.url), 'utf8')
]);

assert.match(classic, /from '\.\/i18n\/interfaceCopy\.js'/);
assert.match(overlay, /from '\.\.\/i18n\/interfaceCopy\.js'/);
assert.match(experience, /createOverlay\(\{\s*language: document\.documentElement\.lang,/);
for (const label of ['Powiększ demo', 'Czytaj case study', 'Ukryj case study', 'Problem', 'Rozwiązanie', 'Proces', 'Rezultat', 'Następne kroki', 'Galeria screenshotów', 'Powiększ screenshot']) {
  assert.doesNotMatch(classic, new RegExp(`['\"]${label}['\"]`));
  assert.doesNotMatch(overlay, new RegExp(`['\"]${label}['\"]`));
}
assert.match(main, /const backLanguage = state\.language === 'pl' \? 'en' : 'pl';/);
assert.match(main, /const backLabel = state\.language === 'pl' \? 'Back to language selection' : 'Wróć do wyboru języka';/);
assert.match(main, /data-entry-back lang="\$\{backLanguage\}"/);

console.log('interface copy localization assertions passed');
