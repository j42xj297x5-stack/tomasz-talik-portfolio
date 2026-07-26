import assert from 'node:assert/strict';
import * as THREE from '../src/vendor/three.js';
import { createFogRevealController, fogRevealEasing } from '../src/scene/fogRevealController.js';
import { serializeExperience3dSettings, toRuntimeSettings, DEFAULT_EXPERIENCE3D_SETTINGS } from '../src/config/experience3dSettings.js';

const settings = { enabled: true, color: '#05070b', near: 2, far: 100, reveal: { enabled: true, durationSeconds: 10, startNear: 0, startFar: 0.1, easing: 'smoothstep' } };
const scene = new THREE.Scene();
const progression = { progressLevel: 3, visitedGateIds: ['a'] };
const controller = createFogRevealController({ scene, settings });
assert.equal(scene.fog.near, 0); assert.equal(scene.fog.far, 0.1, 'progress zero uses intro distances');
controller.start(); controller.update(5);
assert.equal(controller.getSnapshot().progress, 0.5);
assert.equal(scene.fog.near, 1); assert.ok(Math.abs(scene.fog.far - 50.05) < 1e-10, 'midpoint is smoothly interpolated');
controller.update(5);
assert.equal(scene.fog.near, 2); assert.equal(scene.fog.far, 100, 'progress one is exact final fog');
for (let i = 1; i <= 100; i += 1) assert.ok(fogRevealEasing('smoothstep', i / 100) >= fogRevealEasing('smoothstep', (i - 1) / 100));
controller.restart(); assert.equal(scene.fog.far, 0.1); assert.equal(controller.getSnapshot().progress, 0);
controller.skipToEnd(); assert.equal(scene.fog.far, 100); assert.equal(controller.getSnapshot().progress, 1);
controller.applySettings({ ...settings, reveal: { ...settings.reveal, enabled: false } }); assert.equal(scene.fog.far, 100);
controller.applySettings({ ...settings, reveal: { ...settings.reveal, durationSeconds: 0 } }, { restartReveal: true }); assert.equal(controller.getSnapshot().completed, true);
assert.deepEqual(progression, { progressLevel: 3, visitedGateIds: ['a'] }, 'controller has no progression dependency or mutation');

const exported = serializeExperience3dSettings(toRuntimeSettings(DEFAULT_EXPERIENCE3D_SETTINGS));
for (const runtimeKey of ['elapsedSeconds', 'progress', 'currentNear', 'currentFar', 'started', 'completed']) assert.equal(JSON.stringify(exported).includes(`"${runtimeKey}"`), false);
assert.equal(new THREE.Scene().fog, null, 'independent galaxy/background scenes do not receive fog');
const warmupScene = new THREE.Scene(); const warmupController = createFogRevealController({ scene: warmupScene, settings });
assert.equal(warmupController.getSnapshot().elapsedSeconds, 0, 'construction/warm-up does not consume intro time');
warmupController.restart(); assert.equal(warmupController.getSnapshot().elapsedSeconds, 0);
console.log('Fog reveal controller assertions passed');
