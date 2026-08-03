import assert from 'node:assert/strict';
import { resolveFurnaceFrameLayout } from '../src/xr/furnace/drawVrFurnaceFrame.js';
import { buildProgressBar, resolveAsciiFrame, resolveProcessTelemetry, shouldRefreshTelemetry } from '../src/xr/furnace/vrFurnaceTelemetry.js';

const wide = resolveFurnaceFrameLayout({ width: 400, height: 100, cornerSize: 28 });
const tall = resolveFurnaceFrameLayout({ width: 100, height: 400, cornerSize: 28 });
assert.equal(wide.cornerSize, tall.cornerSize); assert.equal(wide.horizontalLength, 344); assert.equal(tall.verticalLength, 344);
const tiny = resolveFurnaceFrameLayout({ width: 12, height: 8, cornerSize: 28 });
assert.ok(tiny.horizontalLength >= 0 && tiny.verticalLength >= 0);

for (const phase of ['IDLE', 'PRESSING', 'SPINUP', 'STEADY', 'EXTRACTION', 'COOLDOWN']) {
  const telemetry = resolveProcessTelemetry({ state: phase, progress: .5, angularSpeed: 2 });
  assert.equal(telemetry.phase, phase); assert.ok(resolveAsciiFrame(telemetry, .5).length > 0);
}
assert.equal(resolveProcessTelemetry({ state: 'IDLE', completed: true }).phase, 'COMPLETE');
const slow = resolveAsciiFrame(resolveProcessTelemetry({ state: 'STEADY', angularSpeed: 0 }), 100);
assert.deepEqual(slow, resolveAsciiFrame(resolveProcessTelemetry({ state: 'STEADY', angularSpeed: 0 }), 200));
assert.notDeepEqual(resolveAsciiFrame(resolveProcessTelemetry({ state: 'STEADY', angularSpeed: 1 }), .25),
  resolveAsciiFrame(resolveProcessTelemetry({ state: 'STEADY', angularSpeed: 10 }), .25));
assert.equal(buildProgressBar(-1), `[${'░'.repeat(18)}]   0%`);
assert.equal(buildProgressBar(.5), `[${'█'.repeat(9)}${'░'.repeat(9)}]  50%`);
assert.equal(buildProgressBar(2), `[${'█'.repeat(18)}] 100%`);
assert.equal(shouldRefreshTelemetry({ active: false, elapsed: 10, lastRedraw: 0 }), false);
assert.equal(shouldRefreshTelemetry({ active: true, elapsed: .084, lastRedraw: 0, refreshHz: 12 }), true);
assert.equal(shouldRefreshTelemetry({ active: true, elapsed: .02, lastRedraw: 0, refreshHz: 12 }), false);
console.log('VR furnace panel visual helper tests passed.');
