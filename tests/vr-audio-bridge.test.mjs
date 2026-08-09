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

test('reliquary activation one-shot prepares and plays on WORLD fail-soft', async () => {
  const prepared = []; const played = []; const warnings = [];
  const path = '/audio/creating_short_01.mp3';
  const bridge = createVrAudioBridge({ manager: {
    prepareVrOneShots(paths) { prepared.push(...paths); },
    playVrOneShot(soundPath, bus) { played.push([soundPath, bus]); throw new Error('optional playback'); },
    stopVrAudio() {}
  }, warn: (...args) => warnings.push(args) });

  assert.doesNotThrow(() => bridge.prepareOneShots([path]));
  assert.doesNotThrow(() => bridge.playOneShot(path, 'WORLD'));
  assert.deepEqual(prepared, [path]);
  assert.deepEqual(played, [[path, 'WORLD']]);
  assert.equal(warnings.length, 1);
  bridge.dispose();
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

function createAttractorHarness() {
  const handles = [], starts = [];
  const manager = {
    startVrProcessSource(path, bus, options) {
      starts.push([path, bus, options]);
      const handle = { ramps: [], stopped: 0, rampTo(value, duration) { this.ramps.push([value, duration]); }, stop() { this.stopped += 1; } };
      handles.push(handle); return handle;
    }, prepareVrOneShots() {}, stopVrAudio() {}
  };
  return { bridge: createVrAudioBridge({ manager, warn: () => {} }), handles, starts };
}

test('Astro Attractor loop starts once on DEVICE and same-target recovery preserves its source', async () => {
  const { bridge, handles, starts } = createAttractorHarness();
  bridge.startAttractor('shell-01', 'shell'); await flush();
  assert.deepEqual(starts, [['/audio/noise_laud_loop_02.mp3', 'DEVICE', { loop: true }]]);
  bridge.startAttractor('shell-01', 'shell'); await flush();
  assert.equal(handles.length, 1, 'continuous callbacks do not restart playback');
  bridge.missAttractor('shell-01'); assert.deepEqual(handles[0].ramps.at(-1), [0, 1]);
  bridge.startAttractor('shell-01', 'shell');
  assert.equal(handles.length, 1); assert.deepEqual(handles[0].ramps.at(-1), [1, 0.1]);
  bridge.dispose();
});

test('Astro Attractor recovery timeout stops and a different logical target starts fresh', async () => {
  const { bridge, handles } = createAttractorHarness();
  bridge.startAttractor('shell-01', 'shell'); await flush(); bridge.missAttractor('shell-01');
  await new Promise((resolve) => setTimeout(resolve, 1010));
  assert.equal(handles[0].stopped, 1); assert.equal(bridge.attractorState, 'idle');
  bridge.startAttractor('shell-02', 'shell'); await flush();
  bridge.startAttractor('shell-03', 'shell'); await flush();
  assert.deepEqual(handles[1].ramps.at(-1), [0, 0.2]);
  await new Promise((resolve) => setTimeout(resolve, 210));
  assert.equal(handles[1].stopped, 1, 'replacement is not inherited even for the same class');
  assert.equal(handles.length, 3); bridge.dispose();
});

test('Astro Attractor handoff and deliberate cancel use their bounded fades', async () => {
  const { bridge, handles } = createAttractorHarness();
  bridge.startAttractor('shell-01', 'shell'); await flush(); bridge.handoffAttractor('shell-01');
  assert.deepEqual(handles[0].ramps.at(-1), [0, 0.5]);
  await new Promise((resolve) => setTimeout(resolve, 510)); assert.equal(handles[0].stopped, 1);
  bridge.startAttractor('shell-02', 'shell'); await flush(); bridge.cancelAttractor('shell-02');
  assert.deepEqual(handles[1].ramps.at(-1), [0, 0.2]);
  await new Promise((resolve) => setTimeout(resolve, 210)); assert.equal(handles[1].stopped, 1); bridge.dispose();
});

test('Astro Attractor contains sync/async start failures and dispose stops an active loop', async () => {
  const warnings = [];
  const sync = createVrAudioBridge({ manager: { startVrProcessSource() { throw new Error('sync'); } }, warn: (...args) => warnings.push(args) });
  assert.doesNotThrow(() => sync.startAttractor('one', 'shell')); assert.equal(sync.attractorState, 'idle');
  const asyncBridge = createVrAudioBridge({ manager: { startVrProcessSource() { return Promise.reject(new Error('async')); } }, warn: (...args) => warnings.push(args) });
  asyncBridge.startAttractor('two', 'shell'); await flush(); assert.equal(asyncBridge.attractorState, 'idle');
  const { bridge, handles } = createAttractorHarness(); bridge.startAttractor('three', 'shell'); await flush(); bridge.dispose(); bridge.dispose();
  assert.equal(handles[0].stopped, 1); assert.equal(warnings.length, 2); sync.dispose(); asyncBridge.dispose();
});

test('Astro Furnace work source starts once on DEVICE, never loops, and cleanup is idempotent', async () => {
  const { bridge, handles } = createProcessHarness();
  assert.equal(bridge.startFurnaceProcess(), true);
  assert.equal(bridge.startFurnaceProcess(), false, 'pending source also blocks duplicate starts');
  await flush();
  assert.equal(bridge.startFurnaceProcess(), false, 'repeated process signal does not restart audio');
  assert.equal(handles.length, 1);
  assert.equal(handles[0].path, '/audio/astro_piec_work_01.mp3');
  assert.equal(handles[0].bus, 'DEVICE');
  bridge.stopFurnaceProcess(); bridge.stopFurnaceProcess();
  assert.equal(handles[0].stopped, 1);
  bridge.dispose();
});

test('Astro Furnace audio failure stays fail-soft and a late source is stopped after reset', async () => {
  const warnings = [];
  const failed = createVrAudioBridge({ manager: { startVrProcessSource() { throw new Error('decode'); } },
    warn: (...args) => warnings.push(args) });
  assert.equal(failed.startFurnaceProcess(), true);
  let resolveSource;
  const handle = { stopped: 0, stop() { this.stopped += 1; } };
  const delayed = createVrAudioBridge({ manager: { startVrProcessSource() {
    return new Promise((resolve) => { resolveSource = resolve; });
  } }, warn: () => {} });
  delayed.startFurnaceProcess(); delayed.stopFurnaceProcess(); resolveSource(handle); await flush();
  assert.equal(handle.stopped, 1, 'session cleanup retires an asynchronously arriving source');
  assert.equal(warnings.length, 1);
  failed.dispose(); delayed.dispose();
});

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

test('production Asterion create source starts exactly once on DEVICE and cleanup stops it', async () => {
  const { bridge, handles } = createProcessHarness();
  assert.equal(bridge.startAsterionCreate(), true);
  assert.equal(bridge.startAsterionCreate(), false);
  await flush();
  assert.equal(handles.length, 1);
  assert.equal(handles[0].path, '/audio/astro_piec_work_create_01.mp3');
  assert.equal(handles[0].bus, 'DEVICE');
  bridge.stopAsterionCreate(); bridge.stopAsterionCreate();
  assert.equal(handles[0].stopped, 1);
  bridge.dispose();
});

test('production Asterion create audio failure is fail-soft', async () => {
  const warnings = [];
  const bridge = createVrAudioBridge({ manager: { startVrProcessSource() { throw new Error('decode'); } }, warn: (...args) => warnings.push(args) });
  assert.doesNotThrow(() => bridge.startAsterionCreate());
  await flush(); assert.equal(warnings.length, 1); bridge.dispose();
});

function createAsterionAudioHarness({ fail = false } = {}) {
  const handles = [], starts = [], timers = [];
  const manager = {
    startVrProcessSource(path, bus, options) {
      starts.push([path, bus, options]);
      if (fail) return Promise.reject(new Error('decode'));
      const handle = { path, ramps: [], stopped: 0,
        rampTo(value, duration) { this.ramps.push([value, duration]); },
        stop() { this.stopped += 1; } };
      handles.push(handle); return handle;
    }, stopVrAudio() {}
  };
  const bridge = createVrAudioBridge({ manager, warn: () => {},
    setTimer(callback, delay) { const timer = { callback, delay, cleared: false }; timers.push(timer); return timer; },
    clearTimer(timer) { timer.cleared = true; }
  });
  return { bridge, handles, starts, timers };
}

test('Asterion Sphere equip starts exactly one independent background loop and unequip stops it', async () => {
  const h = createAsterionAudioHarness();
  h.bridge.setAsterionSphereState({ equipped: true }); await flush();
  h.bridge.setAsterionSphereState({ equipped: true }); await flush();
  assert.deepEqual(h.starts, [['/audio/asterion_sphere_background.mp3', 'DEVICE', { loop: true }]]);
  h.bridge.setAsterionSphereState({ equipped: false });
  assert.equal(h.handles[0].stopped, 1);
  h.bridge.setAsterionSphereState({ equipped: true }); await flush();
  assert.equal(h.handles.length, 2, 'a fresh equip after cleanup creates a fresh source');
  h.bridge.dispose();
});

test('Asterion Sphere work loop fades for two seconds and retrigger preserves its source', async () => {
  const h = createAsterionAudioHarness();
  h.bridge.setAsterionSphereState({ equipped: true, driveActive: true }); await flush();
  const work = h.handles.find((handle) => handle.path === '/audio/asterion_sphere_work.mp3');
  assert.ok(work); assert.deepEqual(h.starts.at(-1), ['/audio/asterion_sphere_work.mp3', 'DEVICE', { loop: true }]);
  h.bridge.setAsterionSphereState({ equipped: true, driveActive: true });
  assert.deepEqual(work.ramps, [], 'continuous active frames neither restart nor reschedule gain');
  h.bridge.setAsterionSphereState({ equipped: true, driveActive: false });
  assert.deepEqual(work.ramps.at(-1), [0, 2]); assert.equal(h.timers.at(-1).delay, 2000);
  h.bridge.setAsterionSphereState({ equipped: true, driveActive: true });
  assert.equal(h.handles.filter((handle) => handle.path === work.path).length, 1);
  assert.equal(h.timers.at(-1).cleared, true); assert.deepEqual(work.ramps.at(-1), [1, 0.1]);
  h.bridge.setAsterionSphereState({ equipped: true, driveActive: false });
  const finalFade = h.timers.at(-1); finalFade.callback();
  assert.equal(work.stopped, 1, 'source stops after the complete fade window');
  assert.equal(h.handles[0].stopped, 0, 'trigger release does not stop the background');
  h.bridge.dispose();
});

test('Asterion Sphere reset/dispose stop both loops and asynchronous failures remain fail-soft', async () => {
  const h = createAsterionAudioHarness();
  h.bridge.setAsterionSphereState({ equipped: true, driveActive: true }); await flush();
  h.bridge.resetAsterionSphereAudio();
  assert.ok(h.handles.every((handle) => handle.stopped === 1));
  assert.doesNotThrow(() => { h.bridge.resetAsterionSphereAudio(); h.bridge.dispose(); h.bridge.dispose(); });
  const failed = createAsterionAudioHarness({ fail: true });
  assert.doesNotThrow(() => failed.bridge.setAsterionSphereState({ equipped: true, driveActive: true }));
  await flush();
  assert.equal(failed.handles.length, 0); failed.bridge.dispose();
});
