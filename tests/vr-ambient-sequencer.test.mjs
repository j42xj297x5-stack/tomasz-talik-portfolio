import assert from 'node:assert/strict';
import test from 'node:test';
import { createVrAmbientSequencer, VR_QUIET_QUEUE } from '../src/xr/audio/createVrAmbientSequencer.js';

const flush = () => new Promise((resolve) => setImmediate(resolve));
function harness({ reject = false } = {}) {
  const starts = [], timers = [];
  const bridge = { startFiniteSource(path, bus, options) {
    starts.push({ path, bus, options });
    if (reject) return Promise.reject(new Error('decode'));
    let finish;
    const handle = { stopped: 0, finished: new Promise((resolve) => { finish = resolve; }), stop() { this.stopped += 1; finish(); } };
    handle.finish = finish; starts.at(-1).handle = handle; return Promise.resolve(handle);
  } };
  const sequencer = createVrAmbientSequencer({ bridge,
    setTimer(callback, delay) { const entry = { callback, delay, cleared: false }; timers.push(entry); return entry; },
    clearTimer(entry) { entry.cleared = true; }
  });
  async function finish() { starts.at(-1).handle.finish(); await flush(); }
  async function tick() { const entry = timers.find((item) => !item.cleared && !item.fired); entry.fired = true; entry.callback(); await flush(); }
  return { sequencer, starts, timers, finish, tick };
}

test('full threshold follows ambient, silence, six quiet repetitions, silence and repeat', async () => {
  const h = harness(); h.sequencer.setState({ fullThreshold: 3 }); await flush();
  assert.equal(h.starts[0].path, '/audio/ambient_03.mp3'); assert.equal(h.starts[0].options.repetitions, 1);
  await h.finish(); assert.equal(h.timers[0].delay, 30000); await h.tick();
  assert.equal(h.starts[1].path, VR_QUIET_QUEUE[0]);
  assert.deepEqual({ ...h.starts[1].options, signal: undefined }, { repetitions: 6, fadeIn: 10, fadeOut: 10, signal: undefined });
  await h.finish(); await h.tick(); assert.equal(h.starts[2].path, '/audio/ambient_03.mp3'); h.sequencer.dispose();
});

test('quiet queue is 01,02,03,04,05,07, wraps and survives threshold changes', async () => {
  const h = harness();
  for (let index = 0; index < 7; index += 1) {
    h.sequencer.setState({ fullThreshold: index % 2 ? 2 : 1 }); await flush(); await h.finish(); await h.tick();
    assert.equal(h.starts.at(-1).path, VR_QUIET_QUEUE[index % 6]); await h.finish(); await h.tick();
  }
  h.sequencer.dispose();
});

test('subthreshold uses ambient_loop_01 x13 and the shared quiet cursor', async () => {
  const h = harness(); h.sequencer.setState({ fullThreshold: 1 }); await flush(); await h.finish(); await h.tick(); await h.finish();
  h.sequencer.setState({ fullThreshold: 2, asterionSubthreshold: true }); await flush();
  assert.equal(h.starts.at(-1).path, '/audio/ambient_loop_01.mp3'); assert.equal(h.starts.at(-1).options.repetitions, 13);
  await h.finish(); await h.tick(); assert.equal(h.starts.at(-1).path, VR_QUIET_QUEUE[1]); h.sequencer.dispose();
});

test('state replacement invalidates a late source and reset/dispose are idempotent', async () => {
  const resolvers = []; const late = { stopped: 0, finished: Promise.resolve(), stop() { this.stopped += 1; } };
  const sequencer = createVrAmbientSequencer({ bridge: { startFiniteSource: () => new Promise((resolve) => { resolvers.push(resolve); }) } });
  sequencer.setState({ fullThreshold: 1 }); await flush(); sequencer.setState({ fullThreshold: 2 }); resolvers[0](late); await flush();
  assert.equal(late.stopped, 1); assert.doesNotThrow(() => { sequencer.reset(); sequencer.reset(); sequencer.dispose(); sequencer.dispose(); });
});

test('asset rejection remains fail-soft and advances to bounded silence', async () => {
  const h = harness({ reject: true }); assert.doesNotThrow(() => h.sequencer.setState({ fullThreshold: 1 })); await flush();
  assert.equal(h.timers[0].delay, 30000); h.sequencer.dispose();
});
