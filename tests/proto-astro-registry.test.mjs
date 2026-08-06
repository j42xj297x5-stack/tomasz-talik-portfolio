import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import {
  PROTO_ASTRO_FAMILIES,
  PROTO_ASTRO_FORMS,
  PROTO_ASTRO_SYLLABLES,
  resolveProtoAstroAssetUrl,
  resolveProtoAstroDescriptor,
  resolveProtoAstroSyllable
} from '../src/xr/protoAstro/protoAstroRegistry.js';
import { resolveAttractorShellGlyph, VR_ATTRACTOR_SHELL_GLYPHS } from '../src/xr/tools/vrAttractorShellGlyphs.js';

const naturalFamilies = ['K', 'T', 'S', 'L', 'R'];
const naturalForms = ['A', 'O', 'I', 'U'];
const expectedNaturalSyllables = naturalFamilies.flatMap((family) => naturalForms.map((form) => `${family}${form}`));
const expectedSyllables = [...expectedNaturalSyllables, 'VO', 'VI'];

assert.equal(PROTO_ASTRO_SYLLABLES.length, 22);
assert.deepEqual(PROTO_ASTRO_SYLLABLES.map(({ syllable }) => syllable), expectedSyllables);
assert.deepEqual(Object.fromEntries(Object.entries(PROTO_ASTRO_FAMILIES).map(([code, family]) => [code, family.id])), {
  K: 'earth', T: 'metal', S: 'water', L: 'tree', R: 'fire', V: 'astro'
});
assert.deepEqual(Object.fromEntries(Object.entries(PROTO_ASTRO_FORMS).map(([code, form]) => [code, form.id])), {
  A: 'archetype', O: 'shell', I: 'small-glyph', U: 'runestone'
});

for (const syllable of expectedSyllables) {
  const descriptor = resolveProtoAstroSyllable(syllable);
  assert.ok(descriptor, `${syllable} has a descriptor`);
  assert.equal(resolveProtoAstroDescriptor(syllable[0], syllable[1]), descriptor);
  assert.equal(descriptor.familyCode, syllable[0]);
  assert.equal(descriptor.familyId, PROTO_ASTRO_FAMILIES[syllable[0]].id);
  assert.equal(descriptor.formCode, syllable[1]);
  assert.equal(descriptor.formId, PROTO_ASTRO_FORMS[syllable[1]].id);
  assert.equal(descriptor.path, `svg/${syllable}.svg`);
  assert.match(resolveProtoAstroAssetUrl(descriptor), new RegExp(`/svg/${syllable}\\.svg$`));
  await access(new URL(`../public/${descriptor.path}`, import.meta.url));
}

assert.equal(resolveProtoAstroSyllable('VA'), null);
assert.equal(resolveProtoAstroSyllable('VU'), null);
assert.equal(resolveProtoAstroDescriptor('V', 'A'), null);
assert.equal(resolveProtoAstroDescriptor('V', 'U'), null);
assert.equal(resolveProtoAstroAssetUrl('VA'), null);

const expectedShells = [
  ['shell_01', 'RO'], ['shell_02', 'KO'], ['shell_03', 'LO'],
  ['shell_04', 'SO'], ['shell_05', 'TO'], ['shell_06', 'VO']
];
assert.deepEqual(Object.entries(VR_ATTRACTOR_SHELL_GLYPHS).map(([identity, glyph]) => [identity, glyph.syllable]), expectedShells);
expectedShells.forEach(([identity, syllable], index) => {
  assert.equal(VR_ATTRACTOR_SHELL_GLYPHS[identity], resolveProtoAstroSyllable(syllable));
  const glyph = resolveAttractorShellGlyph(`shell-relic-${index + 1}`);
  assert.equal(glyph.identity, identity);
  assert.equal(glyph.syllable, syllable);
  assert.equal(glyph.path, `svg/${syllable}.svg`);
});

console.log('Proto-Astro registry tests passed.');
