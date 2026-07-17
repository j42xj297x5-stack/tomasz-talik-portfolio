import { portfolioNodes } from './content/portfolioNodes.js';
import { publicPath } from './utils/publicPath.js';
import { getGateAccentColor, getPanelThemeForGate } from './ui/panelThemes.js';

const CLASSIC_COPY = {
  pl: {
    eyebrow: 'Klasyczne 2D',
    name: 'Tomasz Talik',
    role: 'Creative Technologist & Game Systems Designer',
    title: 'Interaktywne światy, gry i systemy',
    lead: 'Łączę technologię, mechanikę, obraz i dźwięk, przekładając złożone pomysły na modularne, działające systemy.',
    intro: 'Wybierz jeden z pięciu symboli, aby poznać projekty i obszary mojej pracy.',
    returnToModes: 'Wróć do wyboru trybu',
    closePanel: 'Zamknij panel',
    centralLabel: 'Symboliczna kotwica 2D',
    gateHelp: 'Otwórz panel'
  },
  en: {
    eyebrow: 'Classic 2D',
    title: 'Symbolic portfolio circle',
    intro: 'Choose one of the five signs around the calm center to open a short project panel.',
    returnToModes: 'Back to mode selection',
    closePanel: 'Close panel',
    centralLabel: 'Symbolic 2D anchor',
    gateHelp: 'Open panel'
  }
};

const GLYPH_SYMBOLS = ['☉', '◇', '✦', '△', '☽'];
const GLYPH_SPRITES_BY_GATE_ID = {
  'ai-guide': '/png/glif_ai_guide.png',
  'spotify-digger': '/png/glif_dig_engine.png',
  'haiku-cosmos': '/png/glif_haiku_cosmos.png',
  'creative-ai': '/png/glif_creative_ai.png',
  'ethics-life-protection': '/png/glif_ethics.png'
};
const MONKEY_TILTS = ['-5deg', '4deg', '-3deg', '5deg', '-4deg'];
const CLASSIC_MONKEY_IMAGE_PATH = '/png/monkey_small.png';
const CLASSIC_ORBIT_RADIUS_PERCENT = 34;
const CLASSIC_ORBIT_START_ANGLE_DEGREES = -90;
const CLASSIC_ORBIT_STEP_ANGLE_DEGREES = 72;
const CLASSIC_ORBIT_ORDER = [
  'spotify-digger',
  'haiku-cosmos',
  'creative-ai',
  'ethics-life-protection',
  'ai-guide'
];

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

function getNodeSubtitle(node) {
  return node.subtitle || node.eyebrow || node.shortLabel || '';
}

function createParagraphs(text) {
  return String(text)
    .split(/\n{2,}|\n/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function renderDemoMarkup(node) {
  if (!node.demoGifPath) return '';

  const demoGifUrl = publicPath(node.demoGifPath);
  const demoAlt = node.demoGifAlt || `${node.title} demo`;

  return `
    <figure class="classic-2d-panel__demo">
      <button class="classic-2d-panel__demo-preview" type="button" data-classic-demo-open aria-label="Powiększ demo ${escapeHtml(node.title)}">
        <img class="classic-2d-panel__demo-image" src="${escapeHtml(demoGifUrl)}" alt="${escapeHtml(demoAlt)}" loading="lazy" decoding="async">
      </button>
      <figcaption class="classic-2d-panel__demo-caption">
        <button class="classic-2d-panel__demo-enlarge" type="button" data-classic-demo-open>Powiększ demo</button>
      </figcaption>
    </figure>
  `;
}

function renderCaseBlockMarkup(title, value) {
  if (!value || (Array.isArray(value) && !value.length)) return '';
  const paragraphs = Array.isArray(value) ? value : createParagraphs(value);

  return `
    <section class="classic-2d-panel__case-block">
      <h4>${escapeHtml(title)}</h4>
      ${paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('')}
    </section>
  `;
}

function renderCaseStudyMarkup(caseStudy) {
  if (!caseStudy) return '';

  const introParagraphs = Array.isArray(caseStudy.intro) ? caseStudy.intro : createParagraphs(caseStudy.intro || '');
  const processMarkup = caseStudy.processSections?.length ? `
    <section class="classic-2d-panel__case-block classic-2d-panel__case-process">
      <h4>Proces</h4>
      ${caseStudy.processSections.map((section, index) => `
        <article class="classic-2d-panel__case-process-item">
          <h5>${index + 1}. ${escapeHtml(section.title || '')}</h5>
          ${createParagraphs(section.text || '').map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('')}
        </article>
      `).join('')}
    </section>
  ` : '';
  const galleryMarkup = caseStudy.gallery?.length ? `
    <section class="classic-2d-panel__case-gallery-section">
      <h4>Galeria screenshotów</h4>
      <div class="classic-2d-panel__case-gallery">
        ${caseStudy.gallery.map((item, index) => `
          <figure class="classic-2d-panel__case-shot">
            <button class="classic-2d-panel__case-shot-button" type="button" data-classic-media-open data-classic-media-index="${index}" aria-label="Powiększ screenshot: ${escapeHtml(item.title || item.alt || item.caption || caseStudy.title || '')}">
              <img src="${escapeHtml(publicPath(item.src))}" alt="${escapeHtml(item.alt || item.caption || '')}" loading="lazy" decoding="async">
            </button>
            <figcaption>
              ${item.title ? `<strong>${escapeHtml(item.title)}</strong>` : ''}
              ${item.caption ? `<span>${escapeHtml(item.caption)}</span>` : ''}
            </figcaption>
          </figure>
        `).join('')}
      </div>
    </section>
  ` : '';

  return `
    <div class="classic-2d-panel__case-actions">
      <button class="classic-2d-panel__case-toggle" type="button" data-classic-case-toggle aria-expanded="false">Czytaj case study</button>
    </div>
    <section class="classic-2d-panel__case-study" data-classic-case-study hidden>
      <div class="classic-2d-panel__case-header">
        ${caseStudy.title ? `<p class="classic-2d-panel__case-title">${escapeHtml(caseStudy.title)}</p>` : ''}
        ${caseStudy.heading ? `<h3>${escapeHtml(caseStudy.heading)}</h3>` : ''}
        ${introParagraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('')}
      </div>
      ${renderCaseBlockMarkup('Problem', caseStudy.problem)}
      ${renderCaseBlockMarkup('Rozwiązanie', caseStudy.solution)}
      ${processMarkup}
      ${renderCaseBlockMarkup('AI workflow', caseStudy.aiWorkflow)}
      ${renderCaseBlockMarkup('Rezultat', caseStudy.result)}
      ${renderCaseBlockMarkup('Następne kroki', caseStudy.nextSteps)}
      ${galleryMarkup}
    </section>
  `;
}

function closeClassicDemoLightbox(panel, { restoreFocus = true } = {}) {
  const lightbox = panel.querySelector('.classic-2d-panel__demo-lightbox');
  if (!lightbox || lightbox.hidden) return false;

  lightbox.hidden = true;
  document.body.classList.remove('demo-lightbox-open');

  if (restoreFocus) {
    const openerSelector = lightbox.dataset.openerSelector;
    const opener = openerSelector ? panel.querySelector(openerSelector) : panel.querySelector('[data-classic-demo-open]');
    if (opener instanceof HTMLElement) opener.focus();
  }

  delete lightbox.dataset.openerSelector;
  return true;
}


function renderPanel(panel, node, copy) {
  const lead = node.leadText || '';
  const bodyParagraphs = createParagraphs(getNodeText(node));
  const demoMarkup = renderDemoMarkup(node);
  const caseStudyMarkup = renderCaseStudyMarkup(node.caseStudy);
  const subtitle = getNodeSubtitle(node);

  panel.dataset.panelTheme = getPanelThemeForGate(node.id);
  panel.dataset.gateId = node.id;
  panel.innerHTML = `
    <div class="classic-2d-panel__viewport">
      <div class="classic-2d-panel__card" role="dialog" aria-modal="true" aria-labelledby="classic-2d-panel-title">
      <h2 class="classic-2d-panel__title" id="classic-2d-panel-title">${escapeHtml(node.title)}</h2>
      ${subtitle ? `<p class="classic-2d-panel__label">${escapeHtml(subtitle)}</p>` : ''}
      ${lead ? `<p class="classic-2d-panel__lead">${escapeHtml(lead)}</p>` : ''}
      ${demoMarkup}
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
      ${caseStudyMarkup}
        <button class="classic-2d-panel__close" type="button" data-classic-panel-close>${escapeHtml(copy.closePanel)}</button>
      </div>
    </div>
    <span class="classic-2d-panel__ornament classic-2d-panel__ornament--top" aria-hidden="true"></span>
    <span class="classic-2d-panel__ornament classic-2d-panel__ornament--bottom" aria-hidden="true"></span>
    <div class="classic-2d-panel__demo-lightbox" role="dialog" aria-modal="true" aria-label="Powiększone media ${escapeHtml(node.title)}" hidden>
      <button class="classic-2d-panel__demo-lightbox-backdrop" type="button" data-classic-demo-close aria-label="Zamknij powiększone media"></button>
      <div class="classic-2d-panel__demo-lightbox-frame">
        <button class="classic-2d-panel__demo-lightbox-close" type="button" data-classic-demo-close aria-label="Zamknij powiększone media">×</button>
        <img class="classic-2d-panel__demo-lightbox-image" alt="">
      </div>
    </div>
  `;

  panel.hidden = false;
  document.body.classList.add('classic-2d-panel-open');
  panel.querySelector('[data-classic-panel-close]')?.focus();
}

export function startClassic2D({ container, language = 'en', onBackToModes }) {
  if (!container) throw new Error('Classic 2D requires a container.');

  const copy = resolveCopy(language);
  const isPolishIntro = language === 'pl';
  const polishTitleLines = isPolishIntro ? copy.title.split(', ') : [];
  let activeGateId = null;
  let lastFocusedGate = null;

  container.innerHTML = `
    <main class="classic-2d" aria-labelledby="classic-2d-title">
      <header class="classic-2d__header">
        <div>
          <p class="classic-2d__eyebrow">${escapeHtml(copy.eyebrow)}</p>
          ${isPolishIntro ? `
            <p class="classic-2d__name">${escapeHtml(copy.name)}</p>
            <p class="classic-2d__role">${escapeHtml(copy.role)}</p>
            <h1 class="classic-2d__title" id="classic-2d-title">${escapeHtml(`${polishTitleLines[0]},`)}<br>${escapeHtml(polishTitleLines[1])}</h1>
            <p class="classic-2d__lead">${escapeHtml(copy.lead)}</p>
          ` : `<h1 class="classic-2d__title" id="classic-2d-title">${escapeHtml(copy.title)}</h1>`}
          <p class="classic-2d__intro">${escapeHtml(copy.intro)}</p>
        </div>
        <button class="classic-2d__mode-back" type="button" data-classic-back>${escapeHtml(copy.returnToModes)}</button>
      </header>

      <div class="classic-2d__stage-slot" data-classic-stage-slot>
      <section class="classic-2d__stage" aria-label="${escapeHtml(copy.title)}">
        <div class="classic-2d__orbit-layer" data-classic-orbit></div>
        <div class="classic-2d__center-layer">
          <div class="classic-2d__monkey-optical">
            <div class="classic-2d__monkey-rotation" data-classic-monkey aria-label="${escapeHtml(copy.centralLabel)}" role="img">
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
          </div>
        </div>
      </section>
      </div>

      <aside class="classic-2d-panel" data-classic-panel hidden></aside>
    </main>
  `;

  const orbit = container.querySelector('[data-classic-orbit]');
  const stageSlot = container.querySelector('[data-classic-stage-slot]');
  const panel = container.querySelector('[data-classic-panel]');
  const monkey = container.querySelector('[data-classic-monkey]');
  const monkeyImage = container.querySelector('.classic-2d__monkey-image');
  const resizeStage = ({ width, height }) => {
    stageSlot?.style.setProperty('--classic-stage-size', `${Math.max(0, Math.min(width, height))}px`);
  };
  const stageResizeObserver = typeof ResizeObserver === 'function'
    ? new ResizeObserver(([entry]) => resizeStage(entry.contentRect))
    : null;

  stageResizeObserver?.observe(stageSlot);
  if (!stageResizeObserver && stageSlot) resizeStage(stageSlot.getBoundingClientRect());

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
    const glyphSymbol = GLYPH_SYMBOLS[index] || '✧';
    const glyphSpritePath = GLYPH_SPRITES_BY_GATE_ID[node.id];
    const gateThemeColor = getGateAccentColor(node.id);

    const orbitIndex = CLASSIC_ORBIT_ORDER.indexOf(node.id);
    const regularPentagonIndex = orbitIndex >= 0 ? orbitIndex : index;
    const orbitAngle = CLASSIC_ORBIT_START_ANGLE_DEGREES
      + regularPentagonIndex * CLASSIC_ORBIT_STEP_ANGLE_DEGREES;
    const orbitAngleRadians = orbitAngle * Math.PI / 180;

    button.dataset.orbitIndex = String(regularPentagonIndex);
    button.style.setProperty('--gate-x', `${50 + CLASSIC_ORBIT_RADIUS_PERCENT * Math.cos(orbitAngleRadians)}%`);
    button.style.setProperty('--gate-y', `${50 + CLASSIC_ORBIT_RADIUS_PERCENT * Math.sin(orbitAngleRadians)}%`);
    if (gateThemeColor) button.style.setProperty('--gate-theme-color', gateThemeColor);
    button.innerHTML = `
      <span class="classic-2d-gate__glyph-shell" aria-hidden="true">
        <span class="classic-2d-gate__halo"></span>
        <span class="classic-2d-gate__glyph">
          ${glyphSpritePath ? `
            <img
              class="classic-2d-gate__glyph-image"
              src="${publicPath(glyphSpritePath)}"
              alt=""
              loading="eager"
              decoding="async"
            >
          ` : ''}
          <span class="classic-2d-gate__glyph-fallback">${escapeHtml(glyphSymbol)}</span>
        </span>
      </span>
      <span class="classic-2d-gate__text">
        <span class="classic-2d-gate__title">${escapeHtml(node.title)}</span>
        <span class="classic-2d-gate__label">${escapeHtml(getNodeSubtitle(node) || copy.gateHelp)}</span>
      </span>
    `;

    button.querySelector('.classic-2d-gate__glyph-image')?.addEventListener('error', (event) => {
      event.currentTarget.closest('.classic-2d-gate__glyph')?.classList.add('classic-2d-gate__glyph--image-error');
    });

    button.addEventListener('click', () => {
      lastFocusedGate = button;
      activeGateId = node.id;
      orbit.querySelectorAll('.classic-2d-gate').forEach((gate) => {
        const isActive = gate.dataset.gateId === activeGateId;
        gate.classList.toggle('classic-2d-gate--active', isActive);
        gate.setAttribute('aria-pressed', String(isActive));
      });
      monkey.classList.add('classic-2d__monkey--active');
      monkey.style.setProperty('--classic-monkey-rotation', MONKEY_TILTS[index] || '3deg');
      renderPanel(panel, node, copy);
    });

    orbit.append(button);
  });

  const closePanel = ({ restoreFocus = true } = {}) => {
    if (panel.hidden) return;
    panel.hidden = true;
    panel.innerHTML = '';
    panel.removeAttribute('data-panel-theme');
    panel.removeAttribute('data-gate-id');
    document.body.classList.remove('classic-2d-panel-open', 'demo-lightbox-open');
    activeGateId = null;
    monkey.classList.remove('classic-2d__monkey--active');
    monkey.style.removeProperty('--classic-monkey-rotation');
    orbit.querySelectorAll('.classic-2d-gate').forEach((gate) => {
      gate.classList.remove('classic-2d-gate--active');
      gate.setAttribute('aria-pressed', 'false');
    });

    if (restoreFocus && lastFocusedGate?.isConnected) {
      lastFocusedGate.focus();
    }
  };



  container.querySelector('[data-classic-back]')?.addEventListener('click', () => {
    closePanel({ restoreFocus: false });
    if (typeof onBackToModes === 'function') onBackToModes();
  });

  panel.addEventListener('click', (event) => {
    const closeDemoButton = event.target.closest('[data-classic-demo-close]');
    if (closeDemoButton) {
      closeClassicDemoLightbox(panel);
      return;
    }

    const openDemoButton = event.target.closest('[data-classic-demo-open]');
    if (openDemoButton) {
      const previewImage = panel.querySelector('.classic-2d-panel__demo-image');
      const lightbox = panel.querySelector('.classic-2d-panel__demo-lightbox');
      const lightboxImage = panel.querySelector('.classic-2d-panel__demo-lightbox-image');
      const lightboxClose = panel.querySelector('.classic-2d-panel__demo-lightbox-close');
      if (previewImage?.src && lightbox && lightboxImage) {
        lightboxImage.src = previewImage.src;
        lightboxImage.alt = previewImage.alt;
        lightbox.dataset.openerSelector = openDemoButton.classList.contains('classic-2d-panel__demo-enlarge')
          ? '.classic-2d-panel__demo-enlarge'
          : '.classic-2d-panel__demo-preview';
        lightbox.hidden = false;
        document.body.classList.add('demo-lightbox-open');
        lightboxClose?.focus();
      }
      return;
    }

    const openMediaButton = event.target.closest('[data-classic-media-open]');
    if (openMediaButton) {
      const previewImage = openMediaButton.querySelector('img');
      const lightbox = panel.querySelector('.classic-2d-panel__demo-lightbox');
      const lightboxImage = panel.querySelector('.classic-2d-panel__demo-lightbox-image');
      const lightboxClose = panel.querySelector('.classic-2d-panel__demo-lightbox-close');
      if (previewImage?.src && lightbox && lightboxImage) {
        lightboxImage.src = previewImage.src;
        lightboxImage.alt = previewImage.alt;
        lightbox.dataset.openerSelector = `[data-classic-media-index="${openMediaButton.dataset.classicMediaIndex}"]`;
        lightbox.hidden = false;
        document.body.classList.add('demo-lightbox-open');
        lightboxClose?.focus();
      }
      return;
    }

    const caseToggleButton = event.target.closest('[data-classic-case-toggle]');
    if (caseToggleButton) {
      const caseStudy = panel.querySelector('[data-classic-case-study]');
      if (caseStudy) {
        const shouldOpen = caseStudy.hidden;
        caseStudy.hidden = !shouldOpen;
        caseToggleButton.setAttribute('aria-expanded', String(shouldOpen));
        caseToggleButton.textContent = shouldOpen ? 'Ukryj case study' : 'Czytaj case study';
        if (shouldOpen) {
          caseStudy.setAttribute('tabindex', '-1');
          caseStudy.focus({ preventScroll: true });
          caseStudy.scrollIntoView({ block: 'start', behavior: 'smooth' });
        } else {
          caseStudy.removeAttribute('tabindex');
        }
      }
      return;
    }

    if (!event.target.closest('[data-classic-panel-close]')) return;
    closePanel();
  });

  const handleKeydown = (event) => {
    if (event.key === 'Escape') {
      if (closeClassicDemoLightbox(panel)) return;
      closePanel();
      return;
    }

    if (event.key !== 'Tab' || panel.hidden) return;

    const focusableElements = [...panel.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')]
      .filter((element) => !element.disabled && element.offsetParent !== null);
    if (!focusableElements.length) return;

    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements.at(-1);
    if (event.shiftKey && document.activeElement === firstFocusable) {
      event.preventDefault();
      lastFocusable.focus();
    } else if (!event.shiftKey && document.activeElement === lastFocusable) {
      event.preventDefault();
      firstFocusable.focus();
    }
  };

  window.addEventListener('keydown', handleKeydown);

  return {
    destroy() {
      stageResizeObserver?.disconnect();
      window.removeEventListener('keydown', handleKeydown);
      document.body.classList.remove('classic-2d-panel-open', 'demo-lightbox-open');
      container.innerHTML = '';
    }
  };
}
