import { getInterfaceCopy } from '../i18n/interfaceCopy.js';

const MOTION_DURATION_MS = 8500;
const REDUCED_MOTION_DURATION_MS = 1350;
const BACKGROUND_FADE_MS = 525;
const EVENT_GRACE_MS = 250;

function waitForVisualEnd(element, eventName, duration) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (event) => {
      if (event && event.target !== element) return;
      if (settled) return;
      settled = true;
      window.clearTimeout(fallbackTimer);
      element.removeEventListener(eventName, finish);
      resolve();
    };
    const fallbackTimer = window.setTimeout(finish, duration + EVENT_GRACE_MS);
    element.addEventListener(eventName, finish);
  });
}

export function createExperienceIntro({ language } = {}) {
  const root = document.createElement('section');
  root.className = 'experience-intro';
  root.setAttribute('aria-hidden', 'true');

  const text = document.createElement('div');
  text.className = 'experience-intro__text';
  getInterfaceCopy(language).experienceIntro.forEach((lines) => {
    const stanza = document.createElement('p');
    stanza.className = 'experience-intro__stanza';
    lines.forEach((line, index) => {
      if (index > 0) stanza.append(document.createElement('br'));
      const lineElement = document.createElement('span');
      lineElement.textContent = line;
      stanza.append(lineElement);
    });
    text.append(stanza);
  });
  root.append(text);
  document.body.append(root);

  let playPromise;
  return {
    play() {
      if (playPromise) return playPromise;
      playPromise = (async () => {
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const textDuration = reducedMotion ? REDUCED_MOTION_DURATION_MS : MOTION_DURATION_MS;
        root.classList.add('experience-intro--playing');
        await waitForVisualEnd(text, 'animationend', textDuration);
        root.classList.add('experience-intro--fading');
        await waitForVisualEnd(root, 'transitionend', BACKGROUND_FADE_MS);
        root.remove();
      })();
      return playPromise;
    }
  };
}
