import { portfolioNodes } from './content/portfolioNodes.js';
import { publicPath } from './utils/publicPath.js';

const CLASSIC_COPY = {
  pl: {
    eyebrow: 'Klasyczne 2D',
    title: 'Symboliczny krąg portfolio',
    intro: 'Wybierz jeden z pięciu znaków wokół spokojnego centrum, aby otworzyć krótki panel projektu.',
    returnToModes: 'Wróć do wyboru trybu',
    closePanel: 'Zamknij panel',
    panelStatus: 'Treść robocza — finalny tekst w przygotowaniu',
    centralLabel: 'Symboliczna kotwica 2D',
    gateHelp: 'Otwórz panel'
  },
  en: {
    eyebrow: 'Classic 2D',
    title: 'Symbolic portfolio circle',
    intro: 'Choose one of the five signs around the calm center to open a short project panel.',
    returnToModes: 'Back to mode selection',
    closePanel: 'Close panel',
    panelStatus: 'Draft content — final copy pending',
    centralLabel: 'Symbolic 2D anchor',
    gateHelp: 'Open panel'
  }
};

const GLYPH_SYMBOLS = ['☉', '◇', '✦', '△', '☽'];
const MONKEY_TILTS = ['-5deg', '4deg', '-3deg', '5deg', '-4deg'];
const CLASSIC_MONKEY_IMAGE_PATH = '/png/monkey_small.png';

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function resolveCopy(language) {
  return CLASSIC_COPY[language] || CLASSIC_COPY.en;
}

function getNodeText(node) {
  return node.bodyText || node.draftText || node.leadText || '';
}

function createParagraphs(text) {
  return String(text)
    .split(/\n{2,}|\n/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function renderPanel(panel, node, copy) {
  const lead = node.leadText || node.draftText || '';
  const bodyParagraphs = createParagraphs(getNodeText(node));

  panel.innerHTML = `
    <div class="classic-2d-panel__card" role="dialog" aria-modal="false" aria-labelledby="classic-2d-panel-title">
      <p class="classic-2d-panel__status">${escapeHtml(copy.panelStatus)}</p>
      <h2 class="classic-2d-panel__title" id="classic-2d-panel-title">${escapeHtml(node.title)}</h2>
      <p class="classic-2d-panel__label">${escapeHtml(node.shortLabel || node.title)}</p>
      ${lead ? `<p class="classic-2d-panel__lead">${escapeHtml(lead)}</p>` : ''}
      <div class="classic-2d-panel__body">
        ${bodyParagraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('')}
      </div>
      ${node.closingText ? `<p class="classic-2d-panel__closing">${escapeHtml(node.closingText)}</p>` : ''}
      ${node.featureLabel || node.featureText ? `
        <p class="classic-2d-panel__feature">
          ${node.featureLabel ? `<strong>${escapeHtml(node.featureLabel)}</strong>` : ''}
          ${node.featureText ? `<span>${escapeHtml(node.featureText)}</span>` : ''}
        </p>
      ` : ''}
      <button class="classic-2d-panel__close" type="button" data-classic-panel-close>${escapeHtml(copy.closePanel)}</button>
    </div>
  `;

  panel.hidden = false;
  panel.querySelector('[data-classic-panel-close]')?.focus();
}

export function startClassic2D({ container, language = 'en', onBackToModes }) {
  if (!container) throw new Error('Classic 2D requires a container.');

  const copy = resolveCopy(language);
  let activeGateId = null;

  container.innerHTML = `
    <main class="classic-2d" aria-labelledby="classic-2d-title">
      <header class="classic-2d__header">
        <div>
          <p class="classic-2d__eyebrow">${escapeHtml(copy.eyebrow)}</p>
          <h1 class="classic-2d__title" id="classic-2d-title">${escapeHtml(copy.title)}</h1>
          <p class="classic-2d__intro">${escapeHtml(copy.intro)}</p>
        </div>
        <button class="classic-2d__mode-back" type="button" data-classic-back>${escapeHtml(copy.returnToModes)}</button>
      </header>

      <section class="classic-2d__stage" aria-label="${escapeHtml(copy.title)}">
        <div class="classic-2d__orbit" data-classic-orbit></div>
        <div class="classic-2d__monkey" data-classic-monkey aria-label="${escapeHtml(copy.centralLabel)}" role="img">
          <img
            class="classic-2d__monkey-image"
            src="${publicPath(CLASSIC_MONKEY_IMAGE_PATH)}"
            alt=""
            aria-hidden="true"
            loading="eager"
            decoding="async"
          >
          <span class="classic-2d__monkey-fallback" aria-hidden="true">
            <span class="classic-2d__monkey-ear classic-2d__monkey-ear--left"></span>
            <span class="classic-2d__monkey-ear classic-2d__monkey-ear--right"></span>
            <span class="classic-2d__monkey-face">
              <span class="classic-2d__monkey-brow"></span>
              <span class="classic-2d__monkey-eye classic-2d__monkey-eye--left"></span>
              <span class="classic-2d__monkey-eye classic-2d__monkey-eye--right"></span>
              <span class="classic-2d__monkey-mark"></span>
            </span>
          </span>
        </div>
      </section>

      <aside class="classic-2d-panel" data-classic-panel hidden></aside>
    </main>
  `;

  const orbit = container.querySelector('[data-classic-orbit]');
  const panel = container.querySelector('[data-classic-panel]');
  const monkey = container.querySelector('[data-classic-monkey]');
  const monkeyImage = container.querySelector('.classic-2d__monkey-image');

  monkeyImage?.addEventListener('load', () => {
    monkey?.classList.remove('classic-2d__monkey--image-error');
  });

  monkeyImage?.addEventListener('error', () => {
    monkey?.classList.add('classic-2d__monkey--image-error');
  });

  portfolioNodes.forEach((node, index) => {
    const button = document.createElement('button');
    button.className = 'classic-2d-gate';
    button.type = 'button';
    button.dataset.gateId = node.id;
    button.setAttribute('aria-pressed', 'false');
    button.style.setProperty('--gate-index', String(index));
    button.style.setProperty('--gate-total', String(portfolioNodes.length));
    button.innerHTML = `
      <span class="classic-2d-gate__glyph" aria-hidden="true">${escapeHtml(GLYPH_SYMBOLS[index] || '✧')}</span>
      <span class="classic-2d-gate__title">${escapeHtml(node.title)}</span>
      <span class="classic-2d-gate__label">${escapeHtml(node.shortLabel || copy.gateHelp)}</span>
    `;

    button.addEventListener('click', () => {
      activeGateId = node.id;
      orbit.querySelectorAll('.classic-2d-gate').forEach((gate) => {
        const isActive = gate.dataset.gateId === activeGateId;
        gate.classList.toggle('classic-2d-gate--active', isActive);
        gate.setAttribute('aria-pressed', String(isActive));
      });
      monkey.classList.add('classic-2d__monkey--active');
      monkey.style.setProperty('--monkey-tilt', MONKEY_TILTS[index] || '3deg');
      renderPanel(panel, node, copy);
    });

    orbit.append(button);
  });

  container.querySelector('[data-classic-back]')?.addEventListener('click', () => {
    if (typeof onBackToModes === 'function') onBackToModes();
  });

  panel.addEventListener('click', (event) => {
    if (!event.target.closest('[data-classic-panel-close]')) return;
    panel.hidden = true;
    panel.innerHTML = '';
    activeGateId = null;
    monkey.classList.remove('classic-2d__monkey--active');
    monkey.style.removeProperty('--monkey-tilt');
    orbit.querySelectorAll('.classic-2d-gate').forEach((gate) => {
      gate.classList.remove('classic-2d-gate--active');
      gate.setAttribute('aria-pressed', 'false');
    });
    orbit.querySelector('.classic-2d-gate')?.focus();
  });

  return {
    destroy() {
      container.innerHTML = '';
    }
  };
}
