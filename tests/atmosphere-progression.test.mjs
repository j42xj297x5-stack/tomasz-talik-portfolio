import assert from 'node:assert/strict';
import {
  ATMOSPHERE_PROGRESSION_LAYER_ORDER,
  ATMOSPHERE_PROGRESSION_MAPPING,
  createAtmosphereProgression,
  getSunMoonLightMultiplierForProgress
} from '../src/scene/atmosphere/atmosphereProgression.js';

const expectedLightMultipliers = [0.6, 0.7, 0.8, 0.9, 1, 1];
expectedLightMultipliers.forEach((expected, level) => {
  assert.equal(getSunMoonLightMultiplierForProgress(level), expected, `level ${level} uses ${expected}`);
});
assert.equal(getSunMoonLightMultiplierForProgress(-1), 0.6, 'levels below zero clamp to level zero');
assert.equal(getSunMoonLightMultiplierForProgress(6), 1, 'levels above five clamp to level five');
assert.equal(getSunMoonLightMultiplierForProgress(2, false), 1, 'disabled progression uses full intensity');

const layerOrder = ['shells', 'smallGlyphs', 'stars', 'stones', 'galaxies'];
assert.deepEqual(ATMOSPHERE_PROGRESSION_LAYER_ORDER, layerOrder);
assert.deepEqual(ATMOSPHERE_PROGRESSION_MAPPING, {
  0: ['monkey', 'mainGlyphs', 'sun', 'moon'],
  1: ['shells'],
  2: ['smallGlyphs'],
  3: ['stars'],
  4: ['stones'],
  5: ['galaxies']
});

const progression = createAtmosphereProgression();
assert.deepEqual(progression.getProgressionDebugState().transitionTimes, {
  shells: 10,
  smallGlyphs: 10,
  stars: 10,
  stones: 10,
  galaxies: 10
});
expectedLightMultipliers.forEach((expected, level) => {
  progression.setProgressLevel(level);
  assert.equal(progression.getProgressionMultipliers().sunMoon, expected, `shared multiplier updates at level ${level}`);
});
const assertLayerState = (level, visibleLayers) => {
  progression.setProgressLevel(level);
  progression.updateAtmosphereProgression(100);
  const multipliers = progression.getProgressionMultipliers();
  layerOrder.forEach((layer) => {
    assert.equal(multipliers[layer], visibleLayers.includes(layer) ? 1 : 0, `unexpected ${layer} multiplier at level ${level}`);
  });
};

layerOrder.forEach((_, index) => assertLayerState(index + 1, layerOrder.slice(0, index + 1)));
progression.resetProgression();
assertLayerState(0, []);

const disabledProgression = createAtmosphereProgression();
disabledProgression.setProgressionEnabled(false);
assert.equal(disabledProgression.getProgressionMultipliers().sunMoon, 1, 'shared multiplier is full intensity when progression is disabled');

progression.setTransitionTimes({ shells: 6, smallGlyphs: 7, stars: 8, stones: 9, galaxies: 10 });
assert.deepEqual(progression.getProgressionDebugState().transitionTimes, {
  shells: 6,
  smallGlyphs: 7,
  stars: 8,
  stones: 9,
  galaxies: 10
});

progression.setTransitionTimes({ threshold1: 1, threshold2: 2, threshold3: 3, threshold4: 4, threshold5: 5 });
assert.deepEqual(progression.getProgressionDebugState().transitionTimes, {
  shells: 1,
  smallGlyphs: 2,
  stars: 3,
  stones: 4,
  galaxies: 5
});

console.log('Atmosphere progression assertions passed.');
