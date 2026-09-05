import { VR_DIAGNOSTIC_SCOPES } from './vrDiagnosticScopes.js';

const COPY = {
  pl: {
    eyebrow: 'Tryb debug', title: 'Diagnostyka sesji', recording: 'Nagrywanie diagnostyki',
    scopes: 'Zakresy diagnostyczne', off: 'OFF', on: 'ON', continue: 'DALEJ',
    validation: 'Wybierz co najmniej jeden zakres diagnostyczny albo wyłącz nagrywanie.'
  },
  en: {
    eyebrow: 'Debug mode', title: 'Session diagnostics', recording: 'Diagnostic recording',
    scopes: 'Diagnostic scopes', off: 'OFF', on: 'ON', continue: 'CONTINUE',
    validation: 'Select at least one diagnostic scope or turn recording off.'
  }
};

export function createVrDebugPreloadGate({ root, language = 'en' }) {
  const locale = language === 'pl' ? 'pl' : 'en';
  const copy = COPY[locale];
  root.innerHTML = `
    <main class="entry-shell">
      <section class="entry-shell__panel vr-debug-gate" aria-labelledby="entry-title">
        <div class="entry-shell__sigil" aria-hidden="true"></div>
        <p class="entry-shell__eyebrow">${copy.eyebrow}</p>
        <h1 class="entry-shell__title" id="entry-title">${copy.title}</h1>
        <div class="vr-debug-gate__recording">
          <span>${copy.recording}</span>
          <button class="vr-debug-gate__toggle" type="button" aria-pressed="false" data-recording-toggle>
            <span data-recording-state>${copy.off}</span> / ${copy.on}
          </button>
        </div>
        <fieldset class="vr-debug-gate__scopes">
          <legend>${copy.scopes}</legend>
          ${VR_DIAGNOSTIC_SCOPES.map((scope) => `
            <label class="vr-debug-gate__scope">
              <input type="checkbox" value="${scope.id}" data-diagnostic-scope>
              <span><strong>${scope[locale === 'pl' ? 'labelPl' : 'labelEn']}</strong>
              <small>${scope[locale === 'pl' ? 'descriptionPl' : 'descriptionEn']}</small></span>
            </label>`).join('')}
        </fieldset>
        <p class="vr-debug-gate__validation" data-gate-validation aria-live="polite"></p>
        <button class="entry-choice entry-choice--primary" type="button" data-gate-continue>${copy.continue}</button>
      </section>
    </main>`;

  const toggle = root.querySelector('[data-recording-toggle]');
  const stateLabel = root.querySelector('[data-recording-state]');
  const validation = root.querySelector('[data-gate-validation]');
  let recordingEnabled = false;

  toggle.addEventListener('click', () => {
    recordingEnabled = !recordingEnabled;
    toggle.setAttribute('aria-pressed', String(recordingEnabled));
    stateLabel.textContent = recordingEnabled ? copy.on : copy.off;
    validation.textContent = '';
  });

  return new Promise((resolve) => {
    root.querySelector('[data-gate-continue]').addEventListener('click', () => {
      const scopes = [...root.querySelectorAll('[data-diagnostic-scope]:checked')].map(({ value }) => value);
      if (recordingEnabled && scopes.length === 0) {
        validation.textContent = copy.validation;
        return;
      }
      resolve({ debugMode: true, recording: { enabled: recordingEnabled, scopes: recordingEnabled ? scopes : [] } });
    });
  });
}
