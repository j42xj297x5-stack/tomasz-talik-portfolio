import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolveFurnaceFrameLayout } from '../src/xr/furnace/drawVrFurnaceFrame.js';
import { resolveProcessTelemetry, shouldRefreshTelemetry } from '../src/xr/furnace/vrFurnaceTelemetry.js';
import { wireframeDissolveVisible } from '../src/xr/furnace/createVrAstroFurnacePanel.js';

const wide = resolveFurnaceFrameLayout({ width: 400, height: 100, cornerSize: 28 });
const tall = resolveFurnaceFrameLayout({ width: 100, height: 400, cornerSize: 28 });
assert.equal(wide.cornerSize, tall.cornerSize); assert.equal(wide.horizontalLength, 344); assert.equal(tall.verticalLength, 344);
const tiny = resolveFurnaceFrameLayout({ width: 12, height: 8, cornerSize: 28 });
assert.ok(tiny.horizontalLength >= 0 && tiny.verticalLength >= 0);

for (const phase of ['IDLE', 'PRESSING', 'SPINUP', 'STEADY', 'EXTRACTION', 'COOLDOWN']) {
  const telemetry = resolveProcessTelemetry({ state: phase, progress: .5, angularSpeed: 2 });
  assert.equal(telemetry.phase, phase);
}
assert.equal(resolveProcessTelemetry({ state: 'IDLE', completed: true }).phase, 'COMPLETE');
const idle = resolveProcessTelemetry({ state: 'IDLE', progress: 1 });
assert.equal(idle.showProgress, false); assert.equal(idle.progress, 0); assert.match(idle.label, /OCZEKIWANIE/);
const openInserted = resolveProcessTelemetry({ state: 'IDLE', contentState: 'INSERTED', chamberState: 'OPEN' });
assert.equal(openInserted.showProgress, false); assert.match(openInserted.label, /ZAMKNIJ POKRYWĘ\nI ROZPOCZNIJ EKSTRAKCJĘ/);
const closedInserted = resolveProcessTelemetry({ state: 'IDLE', contentState: 'INSERTED', chamberState: 'CLOSED' });
assert.equal(closedInserted.showProgress, false); assert.equal(closedInserted.label, 'GOTOWY DO EKSTRAKCJI');
const active = resolveProcessTelemetry({ state: 'EXTRACTION', progress: .6 });
assert.equal(active.showProgress, true); assert.equal(active.silhouetteOpacity, 1);
const complete = resolveProcessTelemetry({ state: 'COMPLETE', progress: 1 });
assert.equal(complete.silhouetteOpacity, 0); assert.match(complete.label, /PAMIĘCI PIECA/);
assert.equal(shouldRefreshTelemetry({ active: false, elapsed: 10, lastRedraw: 0 }), false);
assert.equal(shouldRefreshTelemetry({ active: true, elapsed: .084, lastRedraw: 0, refreshHz: 12 }), true);
assert.equal(shouldRefreshTelemetry({ active: true, elapsed: .02, lastRedraw: 0, refreshHz: 12 }), false);
const panelSource = readFileSync(new URL('../src/xr/furnace/createVrAstroFurnacePanel.js', import.meta.url), 'utf8');
assert.doesNotMatch(panelSource, /resolveAsciiFrame|PROCESS_ASCII|buildProgressBar/);
assert.match(panelSource, /drawAsterionPreview/); assert.match(panelSource, /context\.ellipse/);
assert.match(panelSource, /getInsertedShellWireframe/); assert.doesNotMatch(panelSource, /for \(let ring = 0; ring < 4/);
const ordered = Array.from({ length: 101 }, (_, index) => ({ dissolveOrder: index / 100 }));
assert.equal(ordered.filter((segment) => wireframeDissolveVisible(segment, 0)).length, 101);
assert.equal(ordered.filter((segment) => wireframeDissolveVisible(segment, .5)).length, 51);
assert.equal(ordered.filter((segment) => wireframeDissolveVisible(segment, 1)).length, 0);
assert.match(panelSource, /telemetry\.phase === 'COMPLETE'\) return/);
console.log('VR furnace panel visual helper tests passed.');
