import assert from 'node:assert/strict';
import test from 'node:test';

globalThis.window = {
  localStorage: {
    getItem: () => null,
    setItem: () => {}
  }
};
const { createVrAudioBridge } = await import('../src/xr/audio/createVrAudioBridge.js');

test('VR audio bridge contains synchronous throws and asynchronous rejections', async () => {
  const warnings = [];
  const bridge = createVrAudioBridge({
    manager: {},
    warn: (...args) => warnings.push(args)
  });

  assert.doesNotThrow(() => bridge.runOptional('throw-test', () => {
    throw new Error('TEST_AUDIO_FAILURE');
  }));
  assert.doesNotThrow(() => bridge.runOptional('rejection-test', () => (
    Promise.reject(new Error('TEST_AUDIO_REJECTION'))
  )));

  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.equal(warnings.length, 2);
  assert.match(warnings[0][0], /^\[vr-audio\] Optional audio operation failed: throw-test$/);
  assert.equal(warnings[0][1].message, 'TEST_AUDIO_FAILURE');
  assert.match(warnings[1][0], /^\[vr-audio\] Optional audio operation failed: rejection-test$/);
  assert.equal(warnings[1][1].message, 'TEST_AUDIO_REJECTION');
});

test('VR audio bridge dispose is idempotent and prevents later requests', () => {
  let calls = 0;
  const bridge = createVrAudioBridge({ manager: {}, warn: () => {} });

  bridge.dispose();
  bridge.dispose();
  bridge.runOptional('after-dispose', () => { calls += 1; });

  assert.equal(calls, 0);
});
