import assert from 'node:assert/strict';
import {
  createAtmosphereProgression,
  getSunMoonLightMultiplierForProgress
} from '../src/scene/atmosphere/atmosphereProgression.js';

const expectedMultipliers = [0.6, 0.7, 0.8, 0.9, 1, 1];

expectedMultipliers.forEach((expected, level) => {
  assert.equal(getSunMoonLightMultiplierForProgress(level), expected, `level ${level} uses ${expected}`);
});

assert.equal(getSunMoonLightMultiplierForProgress(-1), 0.6, 'levels below zero clamp to level zero');
assert.equal(getSunMoonLightMultiplierForProgress(6), 1, 'levels above five clamp to level five');
assert.equal(getSunMoonLightMultiplierForProgress(2, false), 1, 'disabled progression uses full intensity');

const progression = createAtmosphereProgression();
expectedMultipliers.forEach((expected, level) => {
  progression.setProgressLevel(level);
  assert.equal(progression.getProgressionMultipliers().sunMoon, expected, `shared multiplier updates at level ${level}`);
});

progression.setProgressionEnabled(false);
assert.equal(progression.getProgressionMultipliers().sunMoon, 1, 'shared multiplier is full intensity when progression is disabled');

console.log('Atmosphere progression assertions passed.');
