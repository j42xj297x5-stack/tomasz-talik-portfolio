import { publicPath } from '../utils/publicPath.js';
import { getPanelThemeForGate } from './panelThemes.js';
import { getInterfaceCopy } from '../i18n/interfaceCopy.js';

export function createOverlay({ language, onClose } = {}) {
  const copy = getInterfaceCopy(language);
  const root = document.createElement('section');
  root.className = 'overlay';
  root.hidden = true;
  root.innerHTML = `
    <div class="overlay__backdrop" data-close-overlay></div>
    <article class="overlay__panel" role="dialog" aria-modal="true" aria-label="${copy.panelDialogLabel}">
      <img class="overlay__ornament" alt="" aria-hidden="true" hidden>
      <div class="overlay__content">
        <div class="overlay__scroll">
          <p class="overlay__status">${copy.draftStatus}</p>
          <h2 class="overlay__title"></h2>
          <p class="overlay__subtitle" hidden></p>
          <figure class="overlay__demo" hidden>
            <button class="overlay__demo-preview" type="button">
              <img class="overlay__demo-image" alt="">
            </button>
            <figcaption class="overlay__demo-caption">
              <button class="overlay__demo-enlarge" type="button">${copy.enlargeDemo}</button>
            </figcaption>
          </figure>
          <p class="overlay__lead" hidden></p>
          <p class="overlay__text"></p>
          <div class="overlay__feature" hidden>
            <p class="overlay__feature-label"></p>
            <p class="overlay__feature-text"></p>
          </div>
          <p class="overlay__closing" hidden></p>
          <nav class="overlay__project-links" aria-label="${copy.projectLinksLabel}" hidden></nav>
          <section class="overlay__case-study" hidden></section>
        </div>
        <div class="overlay__actions">
          <button class="overlay__case-toggle" type="button" hidden aria-expanded="false">${copy.readCaseStudy}</button>
          <button class="overlay__close" type="button" data-close-overlay aria-label="${copy.closePanelAria}">${copy.closePanel}</button>
        </div>
      </div>
    </article>
    <div class="overlay__demo-lightbox" role="dialog" aria-modal="true" hidden>
      <button class="overlay__demo-lightbox-backdrop" type="button" data-close-demo aria-label="${copy.closeEnlargedDemo}"></button>
      <div class="overlay__demo-lightbox-frame">
        <button class="overlay__demo-lightbox-close" type="button" data-close-demo aria-label="${copy.closeEnlargedDemo}">×</button>
        <img class="overlay__demo-lightbox-image" alt="">
      </div>
    </div>
  `;

  const panelEl = root.querySelector('.overlay__panel');
  const statusEl = root.querySelector('.overlay__status');
  const titleEl = root.querySelector('.overlay__title');
  const subtitleEl = root.querySelector('.overlay__subtitle');
  const leadEl = root.querySelector('.overlay__lead');
  const textEl = root.querySelector('.overlay__text');
  const closingEl = root.querySelector('.overlay__closing');
  const projectLinksEl = root.querySelector('.overlay__project-links');
  const featureEl = root.querySelector('.overlay__feature');
  const featureLabelEl = root.querySelector('.overlay__feature-label');
  const featureTextEl = root.querySelector('.overlay__feature-text');
  const caseStudyEl = root.querySelector('.overlay__case-study');
  const caseToggleEl = root.querySelector('.overlay__case-toggle');
  const demoEl = root.querySelector('.overlay__demo');
  const demoPreviewEl = root.querySelector('.overlay__demo-preview');
  const demoEnlargeEl = root.querySelector('.overlay__demo-enlarge');
  const demoImageEl = root.querySelector('.overlay__demo-image');
  const demoLightboxEl = root.querySelector('.overlay__demo-lightbox');
  const demoLightboxImageEl = root.querySelector('.overlay__demo-lightbox-image');
  const demoLightboxCloseEl = root.querySelector('.overlay__demo-lightbox-close');
  const ornamentEl = root.querySelector('.overlay__ornament');

  let demoLightboxOpener = null;

  const appendParagraphs = (parent, paragraphs) => {
    const normalized = Array.isArray(paragraphs) ? paragraphs : [paragraphs];
    normalized.filter(Boolean).forEach((text) => {
      const paragraph = document.createElement('p');
      paragraph.textContent = text;
      parent.append(paragraph);
    });
  };

  const hasCaseContent = (value) => {
    if (Array.isArray(value)) {
      return value.some((item) => String(item ?? '').trim());
    }

    return Boolean(String(value ?? '').trim());
  };

  const appendCaseBlock = (parent, title, paragraphs, { isProcess = false } = {}) => {
    if (!hasCaseContent(paragraphs)) return;

    const block = document.createElement('section');
    block.className = isProcess ? 'overlay__case-block overlay__case-block--process' : 'overlay__case-block';
    const heading = document.createElement('h4');
    heading.textContent = title;
    block.append(heading);
    appendParagraphs(block, paragraphs);
    parent.append(block);
  };

  const renderProjectLinks = (projectLinks) => {
    if (!projectLinksEl) return;

    projectLinksEl.replaceChildren();
    projectLinksEl.hidden = true;

    if (!Array.isArray(projectLinks)) return;

    projectLinks.forEach((projectLink) => {
      if (!projectLink || typeof projectLink.label !== 'string' || typeof projectLink.url !== 'string') return;

      let url;
      try {
        url = new URL(projectLink.url);
      } catch {
        return;
      }

      if (!['http:', 'https:'].includes(url.protocol)) return;

      const kind = ['demo', 'repository'].includes(projectLink.kind) ? projectLink.kind : 'default';
      const link = document.createElement('a');
      link.className = `overlay__project-link overlay__project-link--${kind}`;
      link.textContent = projectLink.label;
      link.href = projectLink.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.setAttribute('aria-label', `${projectLink.label} — ${copy.opensInNewTab}`);
      projectLinksEl.append(link);
    });

    projectLinksEl.hidden = !projectLinksEl.childElementCount;
  };

  const renderCaseStudy = (caseStudy) => {
    if (!caseStudyEl) return;

    caseStudyEl.replaceChildren();
    caseStudyEl.hidden = true;

    if (!caseStudy) return;

    const header = document.createElement('div');
    header.className = 'overlay__case-header';

    const title = document.createElement('p');
    title.className = 'overlay__case-title';
    title.textContent = caseStudy.title ?? '';
    header.append(title);

    const heading = document.createElement('h3');
    heading.textContent = caseStudy.heading ?? '';
    header.append(heading);

    appendParagraphs(header, caseStudy.intro ?? []);
    caseStudyEl.append(header);

    appendCaseBlock(caseStudyEl, copy.problem, caseStudy.problem);
    appendCaseBlock(caseStudyEl, copy.solution, caseStudy.solution);

    if (caseStudy.processSections?.length) {
      const process = document.createElement('section');
      process.className = 'overlay__case-block overlay__case-process';
      const processHeading = document.createElement('h4');
      processHeading.textContent = copy.process;
      process.append(processHeading);

      caseStudy.processSections.forEach((section, index) => {
        const item = document.createElement('article');
        item.className = 'overlay__case-process-item';
        const itemHeading = document.createElement('h5');
        itemHeading.textContent = `${index + 1}. ${section.title}`;
        item.append(itemHeading);
        appendParagraphs(item, section.text);
        process.append(item);
      });

      caseStudyEl.append(process);
    }

    appendCaseBlock(caseStudyEl, copy.aiWorkflow, caseStudy.aiWorkflow);
    appendCaseBlock(caseStudyEl, copy.result, caseStudy.result);
    appendCaseBlock(caseStudyEl, copy.nextSteps, caseStudy.nextSteps);

    if (caseStudy.gallery?.length) {
      const gallerySection = document.createElement('section');
      gallerySection.className = 'overlay__case-gallery-section';
      const galleryHeading = document.createElement('h4');
      galleryHeading.textContent = copy.screenshotGallery;
      gallerySection.append(galleryHeading);

      const gallery = document.createElement('div');
      gallery.className = 'overlay__case-gallery';

      caseStudy.gallery.forEach((item) => {
        const figure = document.createElement('figure');
        figure.className = 'overlay__case-shot';

        const button = document.createElement('button');
        button.className = 'overlay__case-shot-button';
        button.type = 'button';
        button.dataset.mediaOpen = '';
        button.setAttribute('aria-label', `${copy.enlargeScreenshot}: ${item.title ?? item.alt ?? item.caption ?? caseStudy.title}`);

        const image = document.createElement('img');
        image.src = publicPath(item.src);
        image.alt = item.alt ?? item.caption ?? '';
        image.loading = 'lazy';
        image.decoding = 'async';
        button.append(image);

        const caption = document.createElement('figcaption');
        if (item.title) {
          const captionTitle = document.createElement('strong');
          captionTitle.textContent = item.title;
          caption.append(captionTitle);
        }
        if (item.caption) {
          const captionText = document.createElement('span');
          captionText.textContent = item.caption;
          caption.append(captionText);
        }

        figure.append(button, caption);
        gallery.append(figure);
      });

      gallerySection.append(gallery);
      caseStudyEl.append(gallerySection);
    }
  };

  const setCaseStudyOpen = (isOpen, { focusCaseStudy = false } = {}) => {
    if (!caseStudyEl || !caseToggleEl || !caseStudyEl.childElementCount) return;

    caseStudyEl.hidden = !isOpen;
    caseToggleEl.setAttribute('aria-expanded', String(isOpen));
    caseToggleEl.textContent = isOpen ? copy.hideCaseStudy : copy.readCaseStudy;

    if (isOpen && focusCaseStudy) {
      caseStudyEl.setAttribute('tabindex', '-1');
      caseStudyEl.focus({ preventScroll: true });
      caseStudyEl.scrollIntoView({ block: 'start', behavior: 'smooth' });
    } else if (!isOpen) {
      caseStudyEl.removeAttribute('tabindex');
    }
  };

  const closeDemoLightbox = () => {
    if (!demoLightboxEl || demoLightboxEl.hidden) return;

    demoLightboxEl.hidden = true;
    document.body.classList.remove('demo-lightbox-open');

    if (demoLightboxOpener instanceof HTMLElement && demoLightboxOpener.isConnected) {
      demoLightboxOpener.focus();
    }

    demoLightboxOpener = null;
  };

  const openMediaLightbox = ({ src, alt, opener }) => {
    if (!demoLightboxEl || !demoLightboxImageEl || !src) return;

    demoLightboxOpener = opener instanceof HTMLElement ? opener : document.activeElement;
    demoLightboxImageEl.src = src;
    demoLightboxImageEl.alt = alt ?? '';
    demoLightboxEl.hidden = false;
    document.body.classList.add('demo-lightbox-open');
    demoLightboxCloseEl?.focus();
  };

  const openDemoLightbox = (event) => {
    if (!demoImageEl?.src) return;

    openMediaLightbox({
      src: demoImageEl.src,
      alt: demoImageEl.alt,
      opener: event?.currentTarget
    });
  };

  const close = () => {
    if (root.hidden) return;
    closeDemoLightbox();
    root.hidden = true;
    panelEl.removeAttribute('data-gate-id');
    panelEl.removeAttribute('data-panel-theme');
    setCaseStudyOpen(false);
    root.classList.remove('overlay--ethics');
    document.body.classList.remove('overlay-open');
    onClose?.();
  };

  demoPreviewEl?.addEventListener('click', openDemoLightbox);
  demoEnlargeEl?.addEventListener('click', openDemoLightbox);
  caseToggleEl?.addEventListener('click', () => {
    const shouldOpen = caseStudyEl?.hidden;
    setCaseStudyOpen(Boolean(shouldOpen), { focusCaseStudy: Boolean(shouldOpen) });
  });

  root.addEventListener('click', (event) => {
    if (event.target instanceof HTMLElement && event.target.dataset.closeDemo !== undefined) {
      closeDemoLightbox();
      return;
    }

    const mediaButton = event.target instanceof Element ? event.target.closest('[data-media-open]') : null;
    if (mediaButton instanceof HTMLElement) {
      const image = mediaButton.querySelector('img');
      openMediaLightbox({
        src: image?.src,
        alt: image?.alt,
        opener: mediaButton
      });
      return;
    }

    if (event.target instanceof HTMLElement && event.target.dataset.closeOverlay !== undefined) {
      close();
    }
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if (demoLightboxEl && !demoLightboxEl.hidden) {
        closeDemoLightbox();
        return;
      }

      close();
    }
  });

  document.body.append(root);

  return {
    open(nodeData) {
      const gateId = nodeData.id;
      const isAIGuide = gateId === 'ai-guide';
      const isCreativeAI = gateId === 'creative-ai';
      const isEthics = gateId === 'ethics-life-protection';
      const isHaikuCosmos = gateId === 'haiku-cosmos';
      const isSpotifyDigger = gateId === 'spotify-digger';
      const hasStructuredCopy = Boolean(nodeData.leadText || nodeData.bodyText || nodeData.closingText || nodeData.featureText);

      panelEl.dataset.gateId = gateId;
      panelEl.dataset.panelTheme = getPanelThemeForGate(gateId);
      panelEl.classList.toggle('overlay__panel--ai-guide', isAIGuide);
      panelEl.classList.toggle('overlay__panel--creative-ai', isCreativeAI);
      panelEl.classList.toggle('overlay__panel--ethics', isEthics);
      root.classList.toggle('overlay--ethics', isEthics);
      panelEl.classList.toggle('overlay__panel--haiku-cosmos', isHaikuCosmos);
      panelEl.classList.toggle('overlay__panel--spotify-digger', isSpotifyDigger);
      panelEl.classList.remove(
        'theme-ai-guide',
        'theme-creative-ai',
        'theme-ethics-life-protection',
        'theme-haiku-cosmos',
        'theme-spotify-digger'
      );
      panelEl.classList.add(`theme-${gateId}`);
      if (nodeData.ornamentPath) {
        ornamentEl.src = publicPath(nodeData.ornamentPath);
        ornamentEl.hidden = false;
      } else {
        ornamentEl.hidden = true;
        ornamentEl.removeAttribute('src');
      }

      const subtitle = nodeData.subtitle ?? '';
      statusEl.hidden = Boolean(subtitle);
      statusEl.textContent = subtitle ? '' : (nodeData.eyebrow ?? (isAIGuide ? nodeData.shortLabel : copy.draftStatus));

      titleEl.textContent = nodeData.title;
      subtitleEl.hidden = !subtitle;
      subtitleEl.textContent = subtitle;

      renderProjectLinks(nodeData.projectLinks);
      renderCaseStudy(nodeData.caseStudy);
      if (caseToggleEl) {
        caseToggleEl.hidden = !nodeData.caseStudy;
        caseToggleEl.setAttribute('aria-expanded', 'false');
        caseToggleEl.textContent = copy.readCaseStudy;
      }

      if (nodeData.demoGifPath) {
        const demoGifUrl = publicPath(nodeData.demoGifPath);
        const demoAlt = nodeData.demoGifAlt ?? `${nodeData.title} demo`;
        demoImageEl.src = demoGifUrl;
        demoImageEl.alt = demoAlt;
        demoLightboxImageEl.alt = demoAlt;
        demoEl.hidden = false;
      } else {
        demoEl.hidden = true;
        demoImageEl.removeAttribute('src');
        demoImageEl.alt = '';
        demoLightboxImageEl.removeAttribute('src');
        demoLightboxImageEl.alt = '';
      }
      demoPreviewEl?.setAttribute('aria-label', `${copy.enlargeDemo}: ${nodeData.title}`);
      demoLightboxEl?.setAttribute('aria-label', `${copy.enlargedDemo}: ${nodeData.title}`);

      if (hasStructuredCopy) {
        leadEl.hidden = !nodeData.leadText;
        leadEl.textContent = nodeData.leadText ?? '';

        textEl.textContent = nodeData.bodyText ?? nodeData.draftText;

        featureEl.hidden = !nodeData.featureText;
        featureLabelEl.textContent = nodeData.featureLabel ?? '';
        featureTextEl.textContent = nodeData.featureText ?? '';

        closingEl.hidden = !nodeData.closingText;
        closingEl.textContent = nodeData.closingText ?? '';
      } else {
        leadEl.hidden = true;
        leadEl.textContent = '';

        textEl.textContent = nodeData.draftText;

        featureEl.hidden = true;
        featureLabelEl.textContent = '';
        featureTextEl.textContent = '';

        closingEl.hidden = true;
        closingEl.textContent = '';
      }

      root.hidden = false;
      document.body.classList.add('overlay-open');
    },
    close
  };
}
