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

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

function createProcessHarness() {
  const handles = [];
  const oneShots = [];
  const manager = {
    startVrProcessSource(path, bus) {
      const handle = {
        path, bus, ramps: [], stopped: 0,
        rampTo(value, duration) { this.ramps.push([value, duration]); },
        stop() { this.stopped += 1; },
        onEnded(callback) { this.ended = callback; }
      };
      handles.push(handle);
      return handle;
    },
    playVrOneShot(path, bus) { oneShots.push([path, bus]); },
    stopVrAudio() {}
  };
  return { bridge: createVrAudioBridge({ manager, warn: () => {} }), handles, oneShots };
}

test('glyph acquisition lifecycle starts immediately and resumes the same source after a miss', async () => {
  const { bridge, handles } = createProcessHarness();
  bridge.startGlyphAcquisition('earth');
  await flush();
  assert.equal(handles.length, 1);
  assert.equal(handles[0].path, '/audio/glif_hover_loop.mp3');
  assert.equal(handles[0].bus, 'WORLD');
  assert.deepEqual(handles[0].ramps, [], 'first playback has gain 1 and no fade-in');
  bridge.missGlyphAcquisition('earth');
  assert.deepEqual(handles[0].ramps.at(-1), [0, 1]);
  bridge.startGlyphAcquisition('earth');
  assert.equal(handles.length, 1, 'recovery reuses the source');
  assert.deepEqual(handles[0].ramps.at(-1), [1, 0.1]);
  bridge.dispose();
});

test('glyph acquisition fully stops after the one-second recovery window', async () => {
  const { bridge, handles } = createProcessHarness();
  bridge.startGlyphAcquisition('earth'); await flush();
  bridge.missGlyphAcquisition('earth');
  await new Promise((resolve) => setTimeout(resolve, 1010));
  assert.equal(handles[0].stopped, 1);
  assert.equal(bridge.glyphAcquisitionState, 'idle');
  bridge.dispose();
});

test('glyph success fades for 0.2 seconds and immediately triggers the elemental one-shot', async () => {
  const { bridge, handles, oneShots } = createProcessHarness();
  bridge.startGlyphAcquisition('water'); await flush();
  bridge.completeGlyphAcquisition('water', '/audio/glif_water_4s_04.mp3');
  assert.deepEqual(handles[0].ramps.at(-1), [0, 0.2]);
  assert.deepEqual(oneShots, [['/audio/glif_water_4s_04.mp3', 'WORLD']]);
  await new Promise((resolve) => setTimeout(resolve, 210));
  assert.equal(handles[0].stopped, 1);
  bridge.dispose();
});

test('changing glyphs never transfers the old source', async () => {
  const { bridge, handles } = createProcessHarness();
  bridge.startGlyphAcquisition('earth'); await flush();
  bridge.missGlyphAcquisition('earth');
  bridge.startGlyphAcquisition('fire'); await flush();
  assert.deepEqual(handles[0].ramps.at(-1), [0, 0.2]);
  assert.equal(handles.length, 2);
  assert.equal(handles[1].stopped, 0);
  await new Promise((resolve) => setTimeout(resolve, 210));
  assert.equal(handles[0].stopped, 1);
  bridge.dispose();
});

test('natural process-source end restarts only while acquisition is active', async () => {
  const { bridge, handles } = createProcessHarness();
  bridge.startGlyphAcquisition('wood'); await flush();
  handles[0].ended(); await flush();
  assert.equal(handles.length, 2);
  bridge.cancelGlyphAcquisition('wood');
  handles[1].ended(); await flush();
  assert.equal(handles.length, 2);
  bridge.dispose();
});

test('glyph audio synchronous and rejected starts fail soft', async () => {
  const warnings = [];
  const synchronous = createVrAudioBridge({ manager: { startVrProcessSource() { throw new Error('sync'); } }, warn: (...args) => warnings.push(args) });
  assert.doesNotThrow(() => synchronous.startGlyphAcquisition('earth'));
  const rejected = createVrAudioBridge({ manager: { startVrProcessSource() { return Promise.reject(new Error('decode')); } }, warn: (...args) => warnings.push(args) });
  assert.doesNotThrow(() => rejected.startGlyphAcquisition('fire'));
  await flush();
  assert.equal(warnings.length, 2);
  synchronous.dispose(); rejected.dispose();
});
