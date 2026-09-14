import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { createVrIntroProgressionDiagnosticCapture } from '../src/xr/debug/createVrIntroProgressionDiagnosticCapture.js';
import { VR_DIAGNOSTIC_SCOPE, VR_DIAGNOSTIC_SCOPES } from '../src/xr/debug/vrDiagnosticScopes.js';

test('preload registry exposes separate Intro and Rune scopes', async () => {
  const ids = VR_DIAGNOSTIC_SCOPES.map(({ id }) => id);
  assert(ids.includes(VR_DIAGNOSTIC_SCOPE.INTRO_MONKEY_HOVER_PROGRESSION));
  assert(ids.includes(VR_DIAGNOSTIC_SCOPE.RUNE_TUNING_COMPLETION));
  assert.notEqual(VR_DIAGNOSTIC_SCOPE.INTRO_MONKEY_HOVER_PROGRESSION, VR_DIAGNOSTIC_SCOPE.RUNE_TUNING_COMPLETION);
  const gateSource = await readFile(new URL('../src/xr/debug/createVrDebugPreloadGate.js', import.meta.url), 'utf8');
  assert.match(gateSource, /VR_DIAGNOSTIC_SCOPES\.map/);
});

test('selected Intro capture emits records and remains fail-soft', () => {
  const records = [];
  const capture = createVrIntroProgressionDiagnosticCapture({
    locale: 'pl',
    transport: {
      sendBreadcrumb(record) { records.push(record); throw new Error('transport unavailable'); },
      sendFailure() { throw new Error('transport unavailable'); }
    },
    windowRef: {}
  });
  capture.configureSources({ getIntroState: () => 'WAIT_HOVER', getScenarioPoint: () => '1.70' });
  assert.doesNotThrow(() => capture.begin());
  assert.doesNotThrow(() => capture.record('WAIT_HOVER_ARMED'));
  assert.equal(records[0].kind, 'INTRO_DIAGNOSTIC_BEGIN');
  assert.equal(records[1].eventSequence, 2);
  assert.equal(records[1].scenarioPoint, '1.70');
});

test('unselected Intro capture is inert', () => {
  let sends = 0;
  const capture = createVrIntroProgressionDiagnosticCapture({
    recordingEnabled: false,
    transport: { sendBreadcrumb() { sends += 1; }, sendFailure() { sends += 1; } },
    windowRef: {}
  });
  capture.begin(); capture.record('WAIT_HOVER_ARMED'); capture.failure(new Error('ignored'));
  assert.equal(sends, 0);
});
