import { createVrDevDiagnosticTransport } from './createVrDevDiagnosticTransport.js';

const SCHEMA_VERSION = 1;
const STORAGE_KEY = 'experienceVr.runeTuningDiagnostics.v1';
const MAX_RECORDS = 5;

const now = () => new Date().toISOString();
const createSessionId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

function serializeError(error) {
  return {
    name: error?.name ?? typeof error,
    message: error?.message ?? String(error),
    stack: typeof error?.stack === 'string' ? error.stack : null
  };
}

function createEmptyJournal() {
  return { schemaVersion: SCHEMA_VERSION, sequence: 0, current: null, lastFailure: null, records: [] };
}

function sanitizeJournal(value) {
  if (!value || value.schemaVersion !== SCHEMA_VERSION || !Array.isArray(value.records)) return createEmptyJournal();
  return {
    schemaVersion: SCHEMA_VERSION,
    sequence: Number.isInteger(value.sequence) ? value.sequence : 0,
    current: value.current ?? null,
    lastFailure: value.lastFailure ?? null,
    records: value.records.slice(-MAX_RECORDS)
  };
}

function formatFilename(timestamp) {
  const compact = String(timestamp ?? now()).replace(/[:.]/g, '-');
  return `vr-rune-diagnostic-${compact}.json`;
}

export function createVrRuneTuningDiagnosticCapture({ windowRef = globalThis.window,
  surfaceRoot = null, recordingEnabled = true } = {}) {
  const transport = recordingEnabled
    ? createVrDevDiagnosticTransport({ windowRef })
    : Object.freeze({ sendBreadcrumb() {}, sendFailure() {} });
  let eventSequence = 0;
  let storage = null;
  try { storage = windowRef?.localStorage ?? null; } catch { storage = null; }
  let journal = createEmptyJournal();
  let recipeSource = null;
  let progressionSource = null;

  function readJournal() {
    try {
      const stored = storage?.getItem(STORAGE_KEY);
      journal = stored ? sanitizeJournal(JSON.parse(stored)) : createEmptyJournal();
    } catch { journal = createEmptyJournal(); }
  }

  function persist() {
    try { storage?.setItem(STORAGE_KEY, JSON.stringify(journal)); } catch { /* Diagnostics must stay fail-soft. */ }
  }

  function remoteRecord(record, kind = record.kind, full = false) {
    eventSequence += 1;
    const payload = {
      schemaVersion: record.schemaVersion,
      sessionId: record.sessionId,
      completionSequence: record.sequence,
      eventSequence,
      clientTimestamp: now(),
      kind,
      stage: record.stage,
      targetFamilyCode: record.targetFamilyCode,
      failedPredicates: record.failedPredicates
    };
    if (full) Object.assign(payload, {
      recipe: record.recipe,
      identities: record.identities,
      predicates: record.predicates,
      slots: record.slots,
      progression: record.progression,
      error: record.error,
      globalError: record.globalError ?? null
    });
    return payload;
  }

  function recipeSnapshot() {
    try {
      const snapshot = recipeSource?.getSnapshot?.();
      return {
        smallGlyphSlotState: snapshot?.smallGlyph?.state ?? null,
        smallGlyphSlotOccupied: snapshot?.smallGlyph?.occupied === true,
        shellSlotState: snapshot?.shell?.state ?? null,
        shellSlotOccupied: snapshot?.shell?.occupied === true
      };
    } catch { return null; }
  }

  function progressionSnapshot() {
    try {
      return {
        tunedFamilyCodes: [...(progressionSource?.getTunedFamilyCodes?.() ?? [])],
        etherRuneTuned: progressionSource?.isEtherRuneTuned?.() === true
      };
    } catch { return null; }
  }

  function archive(record) {
    if (!record) return;
    journal.records = [...journal.records, record].slice(-MAX_RECORDS);
  }

  function ensureCurrent() {
    if (journal.current) return journal.current;
    journal.sequence += 1;
    journal.current = {
      schemaVersion: SCHEMA_VERSION, timestamp: now(), sessionId: createSessionId(),
      sequence: journal.sequence, kind: 'BEGIN', stage: 'UNKNOWN', targetFamilyCode: null,
      recipe: null, identities: null, predicates: null, failedPredicates: [], slots: recipeSnapshot(),
      progression: progressionSnapshot(), error: null
    };
    return journal.current;
  }

  function begin({ targetFamilyCode, expectedRecipe, smallGlyph, shell } = {}) {
    if (!recordingEnabled) return;
    try {
      if (journal.current && !['COMPLETE', 'FAIL'].includes(journal.current.kind)) {
        archive({ ...journal.current, kind: 'INTERRUPTED', interruptedAt: now() });
      }
      journal.sequence += 1;
      journal.current = {
        schemaVersion: SCHEMA_VERSION, timestamp: now(), sessionId: createSessionId(),
        sequence: journal.sequence, kind: 'BEGIN', stage: 'BEGIN', targetFamilyCode: targetFamilyCode ?? null,
        recipe: {
          kind: expectedRecipe?.kind ?? null,
          targetFamilyCode: expectedRecipe?.targetFamilyCode ?? null,
          smallGlyphSyllable: expectedRecipe?.smallGlyphDescriptor?.syllable ?? null,
          smallGlyphFamilyCode: expectedRecipe?.smallGlyphFamilyCode ?? null,
          shellSyllable: expectedRecipe?.shellDescriptor?.syllable ?? null,
          shellFamilyCode: expectedRecipe?.shellFamilyCode ?? null
        },
        identities: {
          smallGlyph: { assetId: smallGlyph?.userData?.smallGlyphAssetId ?? null,
            resolvedSyllable: null, resolvedFamilyCode: null },
          shell: { identity: shell?.userData?.shellAssetId ?? shell?.userData?.attractorId ?? shell?.name ?? null,
            resolvedSyllable: null, resolvedFamilyCode: null }
        },
        predicates: null, failedPredicates: [], slots: recipeSnapshot(),
        progression: progressionSnapshot(), error: null
      };
      persist();
      transport.sendBreadcrumb(remoteRecord(journal.current));
    } catch { /* Diagnostics must stay fail-soft. */ }
  }

  function stage(stageName) {
    if (!recordingEnabled) return;
    try {
      const record = ensureCurrent();
      record.kind = 'STAGE'; record.stage = stageName; record.timestamp = now();
      record.slots = recipeSnapshot(); record.progression = progressionSnapshot();
      persist();
      transport.sendBreadcrumb(remoteRecord(record));
    } catch { /* Diagnostics must stay fail-soft. */ }
  }

  function preflight({ glyphIdentity, shellIdentity, predicates } = {}) {
    if (!recordingEnabled) return;
    try {
      const record = ensureCurrent();
      record.stage = 'PRE_FLIGHT';
      record.identities = {
        smallGlyph: {
          assetId: glyphIdentity?.assetId ?? record.identities?.smallGlyph?.assetId ?? null,
          resolvedSyllable: glyphIdentity?.descriptor?.syllable ?? null,
          resolvedFamilyCode: glyphIdentity?.descriptor?.familyCode ?? null
        },
        shell: {
          identity: shellIdentity?.identity ?? record.identities?.shell?.identity ?? null,
          resolvedSyllable: shellIdentity?.syllable ?? null,
          resolvedFamilyCode: shellIdentity?.familyCode ?? null
        }
      };
      record.predicates = { ...predicates };
      record.failedPredicates = Object.entries(predicates ?? {})
        .filter(([, passed]) => passed !== true).map(([name]) => name);
      record.slots = recipeSnapshot(); record.progression = progressionSnapshot();
      persist();
      transport.sendBreadcrumb(remoteRecord(record, 'PRE_FLIGHT', true));
    } catch { /* Diagnostics must stay fail-soft. */ }
  }

  function failure(error, { stage: failedStage, predicates } = {}) {
    if (!recordingEnabled) return;
    try {
      const record = ensureCurrent();
      record.kind = 'FAIL'; record.stage = failedStage ?? record.stage; record.timestamp = now();
      if (predicates) {
        record.predicates = { ...predicates };
        record.failedPredicates = Object.entries(predicates)
          .filter(([, passed]) => passed !== true).map(([name]) => name);
      }
      record.slots = recipeSnapshot(); record.progression = progressionSnapshot();
      record.error = serializeError(error);
      journal.lastFailure = { ...record };
      archive({ ...record });
      persist();
      transport.sendFailure(remoteRecord(record, 'FAIL', true));
      console.error('[Experience VR][RuneTuningCompletion] Failed', {
        stage: record.stage,
        targetFamilyCode: record.targetFamilyCode,
        failedPredicates: record.failedPredicates,
        identities: record.identities,
        recipe: record.recipe,
        predicates: record.predicates,
        slots: record.slots,
        progression: record.progression,
        error
      });
    } catch { /* Diagnostics must never replace the original gameplay error. */ }
  }

  function complete() {
    if (!recordingEnabled) return;
    try {
      const record = ensureCurrent();
      record.kind = 'COMPLETE'; record.stage = 'COMPLETE'; record.timestamp = now();
      record.slots = recipeSnapshot(); record.progression = progressionSnapshot();
      archive({ ...record }); journal.current = null; persist();
      transport.sendBreadcrumb(remoteRecord(record));
    } catch { /* Diagnostics must stay fail-soft. */ }
  }

  function abort() {
    if (!recordingEnabled) return;
    try {
      if (!journal.current) return;
      const record = { ...journal.current, kind: 'ABORT', stage: 'ABORT', timestamp: now() };
      archive(record); journal.current = null; persist();
      transport.sendBreadcrumb(remoteRecord(record));
    } catch { /* Diagnostics must stay fail-soft. */ }
  }

  function captureGlobalError(error, source) {
    try {
      if (!journal.current || journal.current.kind === 'COMPLETE') return;
      const record = journal.current;
      record.globalError = { source, timestamp: now(), ...serializeError(error) };
      if (!record.error) record.error = serializeError(error);
      record.kind = 'FAIL'; journal.lastFailure = { ...record };
      archive({ ...record }); persist();
      transport.sendFailure(remoteRecord(record, 'FAIL', true));
    } catch { /* Black-box capture must stay fail-soft. */ }
  }

  const onError = (event) => captureGlobalError(event?.error ?? event?.message, 'error');
  const onUnhandledRejection = (event) => captureGlobalError(event?.reason, 'unhandledrejection');
  if (recordingEnabled) {
    try {
      windowRef?.addEventListener?.('error', onError);
      windowRef?.addEventListener?.('unhandledrejection', onUnhandledRejection);
    } catch { /* Diagnostics must stay fail-soft. */ }
  }

  function report() {
    try { return JSON.stringify({ ...journal, exportedAt: now() }, null, 2); }
    catch { return '{"error":"Rune diagnostic report could not be serialized."}'; }
  }

  function mountRecoverySurface() {
    try {
      if (new URLSearchParams(windowRef?.location?.search ?? '').get('vrDebug') !== 'rune' || !surfaceRoot) return;
      const surface = document.createElement('section');
      surface.setAttribute('aria-label', 'Rune tuning diagnostics');
      surface.style.cssText = 'position:fixed;inset:0;z-index:2147483647;overflow:auto;padding:24px;background:#071018;color:#dff7ff;font:16px/1.45 monospace;';
      const heading = document.createElement('h1'); heading.textContent = 'LAST RUNE COMPLETION FAILURE';
      const actions = document.createElement('div'); actions.style.cssText = 'display:flex;gap:12px;margin:16px 0;';
      const copyButton = document.createElement('button'); copyButton.type = 'button'; copyButton.textContent = 'KOPIUJ JSON';
      const downloadButton = document.createElement('button'); downloadButton.type = 'button'; downloadButton.textContent = 'POBIERZ JSON';
      const output = document.createElement('pre'); output.style.cssText = 'white-space:pre-wrap;word-break:break-word;'; output.textContent = report();
      copyButton.addEventListener('click', () => { try { void windowRef?.navigator?.clipboard?.writeText(output.textContent); } catch {} });
      downloadButton.addEventListener('click', () => {
        try {
          const blob = new Blob([output.textContent], { type: 'application/json' });
          const link = document.createElement('a'); link.href = URL.createObjectURL(blob);
          link.download = formatFilename(journal.lastFailure?.timestamp); link.click();
          setTimeout(() => URL.revokeObjectURL(link.href), 0);
        } catch { /* Export remains best-effort. */ }
      });
      actions.append(copyButton, downloadButton); surface.append(heading, actions, output); surfaceRoot.append(surface);
    } catch { /* Recovery surface must not affect application startup. */ }
  }

  readJournal();
  mountRecoverySurface();

  return Object.freeze({
    configureSources({ runeRecipeInteraction, runeStoneProgressionController } = {}) {
      recipeSource = runeRecipeInteraction ?? null; progressionSource = runeStoneProgressionController ?? null;
    },
    begin, stage, preflight, failure, complete, abort,
    getJournal: () => journal,
    exportJson: report,
    dispose() {
      if (!recordingEnabled) return;
      try {
        windowRef?.removeEventListener?.('error', onError);
        windowRef?.removeEventListener?.('unhandledrejection', onUnhandledRejection);
      } catch { /* Diagnostics must stay fail-soft. */ }
    }
  });
}
