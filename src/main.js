import './styles/main.css';
import { startClassic2D } from './classic2d.js';

const app = document.querySelector('#app');
if (!app) throw new Error('Missing #app mount element.');

const STORAGE_KEY = 'portfolioEntrySelection';

const COPY = {
  pl: {
    languageName: 'Polski',
    introEyebrow: 'Portfolio Tomasza Talika',
    languageTitle: 'Wybierz język',
    languageText: 'Najpierw wybierz język interfejsu wejściowego.',
    modeEyebrow: 'Tryb doświadczenia',
    modeTitle: 'Wybierz tryb',
    modeText: 'Możesz uruchomić obecne doświadczenie 3D albo wejść do lekkiego trybu 2D.',
    classicTitle: 'Klasyczne 2D',
    classicDescription: 'Lekka, płaska, retro-symboliczna wersja portfolio z pięcioma bramami treści.',
    classicButton: 'Klasyczne 2D',
    experienceButton: 'Doświadczenie 3D',
    placeholderBack: 'Wróć do wyboru trybu',
    launchStatus: 'Uruchamianie doświadczenia 3D…'
  },
  en: {
    languageName: 'English',
    introEyebrow: 'Tomasz Talik Portfolio',
    languageTitle: 'Choose language / Wybierz język',
    languageText: 'Select the language for this entry flow. Wybierz język interfejsu wejściowego.',
    modeEyebrow: 'Experience mode',
    modeTitle: 'Choose mode',
    modeText: 'Launch the current 3D experience or enter the lightweight 2D mode.',
    classicTitle: 'Classic 2D',
    classicDescription: 'A lightweight, flat, retro-symbolic version of the portfolio with five content gates.',
    classicButton: 'Classic 2D',
    experienceButton: 'Experience 3D',
    placeholderBack: 'Back to mode selection',
    launchStatus: 'Starting Experience 3D…'
  }
};

const state = {
  language: null,
  mode: null,
  runtimeStarted: false
};

function loadStoredSelection() {
  try {
    const rawSelection = window.localStorage?.getItem(STORAGE_KEY);
    if (!rawSelection) return;

    const parsedSelection = JSON.parse(rawSelection);
    if (parsedSelection?.language === 'pl' || parsedSelection?.language === 'en') {
      state.language = parsedSelection.language;
    }
  } catch (error) {
    console.warn('[entry] Stored entry selection could not be read.', error);
  }
}

function saveSelection() {
  try {
    window.localStorage?.setItem(STORAGE_KEY, JSON.stringify({
      language: state.language,
      mode: state.mode
    }));
  } catch (error) {
    console.warn('[entry] Entry selection could not be saved.', error);
  }
}

function setLanguage(language) {
  state.language = language;
  state.mode = null;
  document.documentElement.lang = language;
  saveSelection();
  renderModeSelection();
}

function renderEntryShell(content) {
  app.innerHTML = `
    <main class="entry-shell" aria-live="polite">
      <section class="entry-shell__panel" aria-labelledby="entry-title">
        <div class="entry-shell__sigil" aria-hidden="true"></div>
        ${content}
      </section>
    </main>
  `;
}

function createChoiceButton({ label, value, onClick, modifier = '' }) {
  const button = document.createElement('button');
  button.className = `entry-choice ${modifier}`.trim();
  button.type = 'button';
  button.dataset.value = value;
  button.textContent = label;
  button.addEventListener('click', onClick);
  return button;
}

function renderLanguageSelection() {
  const copy = COPY.en;
  renderEntryShell(`
    <p class="entry-shell__eyebrow">${copy.introEyebrow}</p>
    <h1 class="entry-shell__title" id="entry-title">${copy.languageTitle}</h1>
    <p class="entry-shell__text">${copy.languageText}</p>
    <div class="entry-shell__choices" data-entry-choices></div>
  `);

  const choices = app.querySelector('[data-entry-choices]');
  choices.append(
    createChoiceButton({ label: COPY.pl.languageName, value: 'pl', onClick: () => setLanguage('pl') }),
    createChoiceButton({ label: COPY.en.languageName, value: 'en', onClick: () => setLanguage('en') })
  );
}

function renderModeSelection() {
  if (!state.language) {
    renderLanguageSelection();
    return;
  }

  const copy = COPY[state.language];
  const backLanguage = state.language === 'pl' ? 'en' : 'pl';
  const backLabel = state.language === 'pl' ? 'Back to language selection' : 'Wróć do wyboru języka';
  renderEntryShell(`
    <p class="entry-shell__eyebrow">${copy.modeEyebrow}</p>
    <h1 class="entry-shell__title" id="entry-title">${copy.modeTitle}</h1>
    <p class="entry-shell__text">${copy.modeText}</p>
    <div class="entry-shell__choices" data-entry-choices></div>
    <button class="entry-shell__back" type="button" data-entry-back lang="${backLanguage}">${backLabel}</button>
  `);

  const choices = app.querySelector('[data-entry-choices]');
  choices.append(
    createChoiceButton({
      label: copy.classicButton,
      value: 'classic-2d',
      onClick: () => {
        state.mode = 'classic-2d';
        saveSelection();
        renderClassic2D();
      }
    }),
    createChoiceButton({
      label: copy.experienceButton,
      value: 'experience-3d',
      modifier: 'entry-choice--primary',
      onClick: startExperience3d
    })
  );

  app.querySelector('[data-entry-back]').addEventListener('click', () => {
    state.language = null;
    state.mode = null;
    saveSelection();
    renderLanguageSelection();
  });
}

function renderClassic2D() {
  document.documentElement.lang = state.language || 'en';
  startClassic2D({
    container: app,
    language: state.language || 'en',
    onBackToModes: renderModeSelection
  });
}

async function startExperience3d() {
  if (state.runtimeStarted) return;

  state.mode = 'experience-3d';
  state.runtimeStarted = true;
  document.documentElement.lang = state.language || 'en';
  saveSelection();

  const copy = COPY[state.language || 'en'];
  renderEntryShell(`
    <p class="entry-shell__eyebrow">${copy.modeEyebrow}</p>
    <h1 class="entry-shell__title" id="entry-title">${copy.experienceButton}</h1>
    <p class="entry-shell__text">${copy.launchStatus}</p>
  `);

  await import('./experience3d.js');
}

loadStoredSelection();

if (state.language) {
  document.documentElement.lang = state.language;
  renderModeSelection();
} else {
  renderLanguageSelection();
}
