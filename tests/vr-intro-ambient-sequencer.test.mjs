import assert from 'node:assert/strict';
import test from 'node:test';
import { createVrIntroAmbientSequencer, INTRO_OVERLAP_SECONDS } from '../src/xr/audio/createVrIntroAmbientSequencer.js';

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
function harness({ pending = false } = {}) {
  const starts = [], handles = [], timers = new Map(); let timerId = 0, resolvePending;
  const bridge = { startOverlappingLoopSource(path, bus, options) {
    starts.push({ path, bus, options });
    const handle = { ramps: [], stops: 0, rampTo(...args) { this.ramps.push(args); }, stop() { this.stops += 1; } };
    handles.push(handle);
    if (pending) return new Promise((resolve) => { resolvePending = () => resolve(handle); });
    return handle;
  } };
  const sequencer = createVrIntroAmbientSequencer({ bridge,
    setTimer(fn, ms) { const id = ++timerId; timers.set(id, { fn, ms }); return id; },
    clearTimer(id) { timers.delete(id); }
  });
  return { sequencer, starts, handles, timers, resolvePending() { resolvePending(); }, fire() { const jobs = [...timers.values()]; timers.clear(); jobs.forEach(({ fn }) => fn()); } };
}

test('cue playback is idempotent, uses AMBIENT authored-overlap loop and crossfades only outgoing output', async () => {
  const h = harness();
  assert.equal(h.sequencer.setCue('03'), true); await flush();
  assert.deepEqual(h.starts[0], { path: '/audio/ambient_intro_03.mp3', bus: 'AMBIENT', options: { overlapSeconds: INTRO_OVERLAP_SECONDS } });
  assert.equal(h.handles[0].ramps.length, 0, 'incoming authored fade is not duplicated programmatically');
  assert.equal(h.sequencer.setCue('03'), false); assert.equal(h.starts.length, 1, 'same cue is a no-op');
  assert.equal(h.sequencer.setCue('04'), true); await flush();
  assert.equal(h.starts.length, 2, 'incoming cue starts immediately');
  assert.deepEqual(h.handles[0].ramps, [[0, 5]]); assert.equal([...h.timers.values()][0].ms, 5000);
  h.fire(); assert.equal(h.handles[0].stops, 1, 'all output owned by outgoing lifecycle is cleaned');
  h.sequencer.stop(); assert.deepEqual(h.handles[1].ramps, [[0, 5]]); h.fire(); assert.equal(h.handles[1].stops, 1);
});

test('reset/dispose stop immediately and late async completion cannot revive an invalid lifecycle', async () => {
  const h = harness({ pending: true }); h.sequencer.setCue('01'); h.sequencer.reset(); h.resolvePending(); await flush();
  assert.equal(h.handles[0].stops, 1); assert.equal(h.sequencer.activeCue, null);
  const d = harness(); d.sequencer.setCue('02'); await flush(); d.sequencer.dispose(); d.sequencer.dispose();
  assert.equal(d.handles[0].stops, 1); assert.equal(d.sequencer.setCue('03'), false);
});
