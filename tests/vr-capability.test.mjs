import assert from 'node:assert/strict';
import { detectVrCapability } from '../src/xr/vrCapability.js';

assert.deepEqual(await detectVrCapability({ secureContext: false, xr: undefined }), {
  supported: false,
  reason: 'insecure-context'
});

assert.deepEqual(await detectVrCapability({ secureContext: true, xr: undefined }), {
  supported: false,
  reason: 'webxr-unavailable'
});

const calls = [];
assert.deepEqual(await detectVrCapability({
  secureContext: true,
  xr: { isSessionSupported: async (mode) => { calls.push(mode); return true; } }
}), { supported: true, reason: null });
assert.deepEqual(calls, ['immersive-vr']);

const failed = await detectVrCapability({
  secureContext: true,
  xr: { isSessionSupported: async () => { throw new Error('permission denied'); } }
});
assert.equal(failed.supported, false);
assert.equal(failed.reason, 'capability-check-failed');
assert.equal(failed.error, 'permission denied');

console.log('VR capability assertions passed');
