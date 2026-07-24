const INTERFACE_COPY = {
  pl: {
    panelDialogLabel: 'Szczegóły projektu',
    draftStatus: 'Treść robocza — finalna redakcja w przygotowaniu',
    projectLinksLabel: 'Linki projektu',
    opensInNewTab: 'otwiera się w nowej karcie',
    enlargeDemo: 'Powiększ demo',
    enlargedDemo: 'Powiększone demo',
    closeEnlargedDemo: 'Zamknij powiększone demo',
    readCaseStudy: 'Czytaj case study',
    hideCaseStudy: 'Ukryj case study',
    closePanel: 'Zamknij',
    closePanelAria: 'Zamknij panel',
    problem: 'Problem',
    solution: 'Rozwiązanie',
    process: 'Proces',
    aiWorkflow: 'AI workflow',
    result: 'Rezultat',
    nextSteps: 'Następne kroki',
    screenshotGallery: 'Galeria screenshotów',
    enlargeScreenshot: 'Powiększ screenshot'
  },
  en: {
    panelDialogLabel: 'Project details',
    draftStatus: 'Draft content — final copy pending',
    projectLinksLabel: 'Project links',
    opensInNewTab: 'opens in a new tab',
    enlargeDemo: 'Enlarge demo',
    enlargedDemo: 'Enlarged demo',
    closeEnlargedDemo: 'Close enlarged demo',
    readCaseStudy: 'Read case study',
    hideCaseStudy: 'Hide case study',
    closePanel: 'Close',
    closePanelAria: 'Close panel',
    problem: 'Problem',
    solution: 'Solution',
    process: 'Process',
    aiWorkflow: 'AI workflow',
    result: 'Result',
    nextSteps: 'Next steps',
    screenshotGallery: 'Screenshot gallery',
    enlargeScreenshot: 'Enlarge screenshot'
  }
};

export function normalizeInterfaceLanguage(language) {
  return language === 'pl' ? 'pl' : 'en';
}

export function getInterfaceCopy(language) {
  return INTERFACE_COPY[normalizeInterfaceLanguage(language)];
}
