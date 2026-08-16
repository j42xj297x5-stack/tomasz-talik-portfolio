import { deriveScenarioSpine } from './scenarioSpineNavigation.js';
import { experienceVrPageIdsByTier } from '../../content/experienceVrPages.js';

function immutableIdentifiers(names) {
  return Object.freeze(Object.fromEntries(names.map((name) => [name, name])));
}

export const VR_SCENARIO_TRANSITION_KIND = immutableIdentifiers([
  'STAY',
  'COMPLETE',
  'COMPLETE_IF',
  'EXPLICIT'
]);

export const VR_SCENARIO_EVENT = immutableIdentifiers([
  'XR_CALIBRATED',
  'INTRO_REVEAL_COMPLETE',
  'POST_REVEAL_SILENCE_COMPLETE',
  'PLAYER_OPENED_GUIDE',
  'PLAYER_VIEWED_CONTROLS',
  'PLAYER_CLOSED_GUIDE',
  'MONKEY_HOVERED',
  'MONKEY_TRIGGERED',
  'INTRO_INVITATION_SELECTED',
  'FOLLOW_PAUSE_CHANGED',
  'MONKEY_REACHED_THRESHOLD',
  'THRESHOLD_SELECTED',
  'PLAYER_ENTERED_RING',
  'MONKEY_SETTLED',
  'GLYPH_FREE_EXPLORE_STARTED',
  'GLYPH_HINT_TIMEOUT',
  'GLYPH_HOLD_STARTED',
  'GLYPH_HOLD_CANCELLED',
  'GLYPH_HOLD_RESUMED',
  'CRYSTAL_CREATED',
  'FIRST_CRYSTAL_DISCOVERED',
  'RELIQUARY_REVEAL_REQUESTED',
  'RELIQUARY_REVEAL_COMPLETED',
  'CRYSTAL_INSERTED',
  'RELIQUARY_HINT_TIMEOUT',
  'CRYSTAL_ACTIVATED',
  'CARD_COMMITTED',
  'FIRST_RING_COMPLETED',
  'FIRST_RING_PRESENTATION_COMPLETED',
  'POST_RING_WORLD_PRESENTATION_COMPLETED',
  'OBSERVATION_WINDOW_COMPLETED',
  'POST_RING_MONKEY_DIALOGUE_COMPLETED',
  'FURNACE_INTRO_COMPLETED',
  'ASTRO_ATTRACTOR_PRODUCTION_REQUESTED',
  'ASTRO_ATTRACTOR_PRODUCED',
  'ASTRO_ATTRACTOR_CLAIMED',
  'TIER_COMPLETED',
  'ASTRO_UNLOCKED',
  'SHELL_PULL_STARTED',
  'SHELL_PULL_CANCELLED',
  'SHELL_HANDED_OFF',
  'SHELL_INSERTED_IN_FURNACE',
  'FURNACE_PROCESS_STARTED',
  'FURNACE_PROCESS_COMPLETED',
  'FURNACE_PROCESS_ABORTED',
  'SHELL_ABSORBED',
  'SHELL_SET_COMPLETED',
  'ASTERION_BUILD_REQUESTED',
  'ASTERION_BUILD_STARTED',
  'ASTERION_BUILT',
  'ASTERION_CLAIMED',
  'ASTERION_EARNED',
  'ASTERION_EQUIPPED',
  'ASTERION_UNEQUIPPED',
  'ASTERION_DRIVE_STARTED',
  'ASTERION_DRIVE_STOPPED',
  'XR_SESSION_ENDING',
  'XR_SESSION_ENDED',
  'XR_SESSION_START_FAILED'
]);

export const VR_SCENARIO_CAPABILITY = immutableIdentifiers([
  'CAN_USE_GLYPHS',
  'CAN_USE_RELIQUARY',
  'CAN_ACTIVATE_RELIQUARY',
  'CAN_RELEASE_RELIQUARY',
  'CAN_TALK_TO_MONKEY',
  'CAN_MOVE',
  'CAN_YAW',
  'CAN_EQUIP_ASTRO',
  'CAN_SCAN_SHELLS',
  'CAN_TARGET_SHELLS',
  'CAN_USE_FURNACE',
  'CAN_OPEN_FURNACE',
  'CAN_INSERT_FURNACE_MATERIAL',
  'CAN_START_FURNACE_PROCESS',
  'CAN_BUILD_ASTERION',
  'CAN_CLAIM_ASTERION',
  'CAN_EQUIP_ASTERION',
  'CAN_CONTROL_PLATFORM'
]);

export const VR_SCENARIO_MILESTONE = immutableIdentifiers([
  'XR_CALIBRATED',
  'INTRO_REVEAL_COMPLETE',
  'POST_REVEAL_SILENCE_COMPLETE',
  'PLAYER_VIEWED_CONTROLS',
  'FIRST_CRYSTAL_DISCOVERED',
  'CARD_COMMITTED',
  'TIER_COMPLETED',
  'SHELL_ABSORBED',
  'SHELL_SET_COMPLETED',
  'ASTERION_BUILD_STARTED',
  'ASTERION_BUILT',
  'ASTERION_EARNED'
]);

export const VR_SCENARIO_EFFECT = immutableIdentifiers([
  'BEGIN_INTRO_REVEAL',
  'BEGIN_POST_REVEAL_SILENCE',
  'BEGIN_CONTROLLER_ONBOARDING',
  'CONTINUE_CONTROLLER_ONBOARDING',
  'CONTINUE_INTRO_INVITATION',
  'APPLY_FOLLOW_PAUSE_STATE',
  'PRESENT_THRESHOLD_CHOICE',
  'CONTINUE_THRESHOLD_CHOICE',
  'BEGIN_GLYPH_FREE_EXPLORE',
  'SHOW_GUIDE_PROMPT',
  'START_MONKEY_FOLLOW',
  'SHOW_GLYPH_HINT',
  'REVEAL_RELIQUARY',
  'BEGIN_RELIQUARY_REVEAL',
  'COMPLETE_RELIQUARY_REVEAL',
  'SHOW_RELIQUARY_CONTEXT_HINT',
  'PRESENT_ACTIVE_CARD_PREVIEW',
  'UPDATE_COMMITTED_CARD_PRESENTATION',
  'PLAY_CARD_COMMIT_FEEDBACK',
  'COMPLETE_FIRST_RING_PRESENTATION',
  'PLAY_FIRST_RING_COMPLETE_FEEDBACK',
  'REVEAL_SHELL_FIELD_PRESENTATION',
  'ELEVATE_MAIN_GLYPHS',
  'BEGIN_OBSERVATION_WINDOW',
  'BEGIN_MONKEY_ATTENTION',
  'BEGIN_FURNACE_INTRO',
  'REVEAL_SHELL_FIELD',
  'REVEAL_FURNACE',
  'PRESENT_ASTERION',
  'SHOW_ASTERION_EARNED_CUE'
]);

export const VR_EXPERIENCE_POINT = immutableIdentifiers([
  '1.10',
  '1.20',
  '1.30',
  '1.40',
  '1.50',
  '1.60',
  '1.70',
  '1.80',
  '1.100',
  '1.110',
  '1.120',
  '1.130',
  '2.10',
  '2.20',
  '2.30',
  '2.40',
  '3.10',
  '3.20',
  '3.30',
  '3.40',
  '3.50',
  '3.60',
  '3.70',
  '3.80',
  '100.10'
]);

// Compatibility export only; both names reference the same identifier set.
export const VR_EXPERIENCE_SCENE = VR_EXPERIENCE_POINT;

// Canonical order is authored on point graph edges and derived below.

const EMPTY_SETTLED_CONSEQUENCES = Object.freeze({});
const INTRO_REVEALED_SETTLED_CONSEQUENCES = Object.freeze({
  intro: Object.freeze({ stage: 'REVEALED', fog: 'CLEARED', glyphRingVisible: true,
    progressionFixturesVisible: true, guideInteractionEnabled: false })
});
const INTRO_COMPLETE_SETTLED_CONSEQUENCES = Object.freeze({
  monkey: Object.freeze({ placement: 'FINAL_STONE', visible: true, stoneVisible: true }),
  intro: Object.freeze({ stage: 'GLYPH_FREE_EXPLORE', phase: 'GLYPH_FREE_EXPLORE', fog: 'CLEARED', glyphRingVisible: true,
    progressionFixturesVisible: true, guideInteractionEnabled: true }),
  locomotion: Object.freeze({ boundary: 'GLYPH_RING' })
});
const RELIQUARY_REVEALED_SETTLED_CONSEQUENCES = Object.freeze({
  reliquary: Object.freeze({ revealed: true, interactionEnabled: true }),
  portal: Object.freeze({ visible: true })
});
const FIRST_RING_COMPLETE_SETTLED_CONSEQUENCES = Object.freeze({
  progression: Object.freeze({ tier: 2, completedTier: 1,
    activatedPageIds: experienceVrPageIdsByTier[1] }),
  progressFloor: Object.freeze({ completedTier: 1,
    activatedPages: Object.freeze([
      Object.freeze({ glyphId: 'ethics-life-protection', order: 1 }),
      Object.freeze({ glyphId: 'creative-ai', order: 1 }),
      Object.freeze({ glyphId: 'ai-guide', order: 1 }),
      Object.freeze({ glyphId: 'spotify-digger', order: 1 }),
      Object.freeze({ glyphId: 'haiku-cosmos', order: 1 })
    ]) }),
  crystals: Object.freeze({ consumedTier: 1 })
});
const ACT_TWO_ENTRY_SETTLED_CONSEQUENCES = Object.freeze({
  postRing: Object.freeze({ shellFieldVisible: true, shellInteractionEnabled: false,
    mainGlyphsElevated: true })
});

const points = Object.freeze([
  Object.freeze({
    id: VR_EXPERIENCE_POINT['1.10'],
    canonicalMainline: Object.freeze({ target: VR_EXPERIENCE_POINT['1.20'] }),
    settledConsequences: EMPTY_SETTLED_CONSEQUENCES,
    label: 'Bootstrap / oczekiwanie na kalibrację XR',
    capabilities: Object.freeze([]),
    transitions: Object.freeze([
      Object.freeze({ kind: VR_SCENARIO_TRANSITION_KIND.COMPLETE,
        event: VR_SCENARIO_EVENT.XR_CALIBRATED,
        milestonesToAdd: Object.freeze([VR_SCENARIO_MILESTONE.XR_CALIBRATED])
      })
    ])
  }),
  Object.freeze({
    id: VR_EXPERIENCE_POINT['1.20'],
    canonicalMainline: Object.freeze({ target: VR_EXPERIENCE_POINT['1.30'] }),
    settledConsequences: INTRO_REVEALED_SETTLED_CONSEQUENCES,
    label: 'Intro reveal',
    capabilities: Object.freeze([]),
    entryEffects: Object.freeze([VR_SCENARIO_EFFECT.BEGIN_INTRO_REVEAL]),
    transitions: Object.freeze([
      Object.freeze({ kind: VR_SCENARIO_TRANSITION_KIND.COMPLETE,
        event: VR_SCENARIO_EVENT.INTRO_REVEAL_COMPLETE,
        milestonesToAdd: Object.freeze([VR_SCENARIO_MILESTONE.INTRO_REVEAL_COMPLETE])
      })
    ])
  }),
  Object.freeze({
    id: VR_EXPERIENCE_POINT['1.30'],
    canonicalMainline: Object.freeze({ target: VR_EXPERIENCE_POINT['1.40'] }),
    settledConsequences: EMPTY_SETTLED_CONSEQUENCES,
    label: 'Cisza po revealu',
    capabilities: Object.freeze([]),
    entryEffects: Object.freeze([VR_SCENARIO_EFFECT.BEGIN_POST_REVEAL_SILENCE]),
    transitions: Object.freeze([
      Object.freeze({ kind: VR_SCENARIO_TRANSITION_KIND.COMPLETE,
        event: VR_SCENARIO_EVENT.POST_REVEAL_SILENCE_COMPLETE,
        milestonesToAdd: Object.freeze([VR_SCENARIO_MILESTONE.POST_REVEAL_SILENCE_COMPLETE])
      })
    ])
  }),
  Object.freeze({
    id: VR_EXPERIENCE_POINT['1.40'],
    canonicalMainline: Object.freeze({ target: VR_EXPERIENCE_POINT['1.50'] }),
    settledConsequences: EMPTY_SETTLED_CONSEQUENCES,
    label: 'Controller onboarding',
    capabilities: Object.freeze([]),
    entryEffects: Object.freeze([VR_SCENARIO_EFFECT.BEGIN_CONTROLLER_ONBOARDING]),
    transitions: Object.freeze([
      Object.freeze({ kind: VR_SCENARIO_TRANSITION_KIND.COMPLETE,
        event: VR_SCENARIO_EVENT.PLAYER_OPENED_GUIDE,
        milestonesToAdd: Object.freeze([])
      })
    ])
  }),
  Object.freeze({
    id: VR_EXPERIENCE_POINT['1.50'],
    canonicalMainline: Object.freeze({ target: VR_EXPERIENCE_POINT['1.60'] }),
    settledConsequences: EMPTY_SETTLED_CONSEQUENCES,
    label: 'Player Guide otwarty / oczekiwanie na obejrzenie controls',
    capabilities: Object.freeze([]),
    entryEffects: Object.freeze([VR_SCENARIO_EFFECT.CONTINUE_CONTROLLER_ONBOARDING]),
    transitions: Object.freeze([
      Object.freeze({ kind: VR_SCENARIO_TRANSITION_KIND.COMPLETE,
        event: VR_SCENARIO_EVENT.PLAYER_VIEWED_CONTROLS,
        milestonesToAdd: Object.freeze([VR_SCENARIO_MILESTONE.PLAYER_VIEWED_CONTROLS])
      })
    ])
  }),
  Object.freeze({
    id: VR_EXPERIENCE_POINT['1.60'],
    canonicalMainline: Object.freeze({ target: VR_EXPERIENCE_POINT['1.70'] }),
    settledConsequences: EMPTY_SETTLED_CONSEQUENCES,
    label: 'Controls obejrzane / oczekiwanie na zamknięcie panelu',
    capabilities: Object.freeze([]),
    entryEffects: Object.freeze([VR_SCENARIO_EFFECT.CONTINUE_CONTROLLER_ONBOARDING]),
    transitions: Object.freeze([
      Object.freeze({ kind: VR_SCENARIO_TRANSITION_KIND.COMPLETE,
        event: VR_SCENARIO_EVENT.PLAYER_CLOSED_GUIDE,
        milestonesToAdd: Object.freeze([])
      })
    ])
  }),
  Object.freeze({
    id: VR_EXPERIENCE_POINT['1.70'],
    canonicalMainline: Object.freeze({ target: VR_EXPERIENCE_POINT['1.80'] }),
    settledConsequences: EMPTY_SETTLED_CONSEQUENCES,
    label: 'Pointer tutorial uruchomiony / oczekiwanie na wskazanie Monkey',
    capabilities: Object.freeze([]),
    entryEffects: Object.freeze([VR_SCENARIO_EFFECT.CONTINUE_CONTROLLER_ONBOARDING]),
    transitions: Object.freeze([
      Object.freeze({ kind: VR_SCENARIO_TRANSITION_KIND.COMPLETE,
        event: VR_SCENARIO_EVENT.MONKEY_HOVERED,
        milestonesToAdd: Object.freeze([]),
        effects: Object.freeze([VR_SCENARIO_EFFECT.CONTINUE_CONTROLLER_ONBOARDING])
      })
    ])
  }),
  Object.freeze({
    id: VR_EXPERIENCE_POINT['1.80'],
    canonicalMainline: Object.freeze({ target: VR_EXPERIENCE_POINT['1.100'] }),
    settledConsequences: EMPTY_SETTLED_CONSEQUENCES,
    label: 'Monkey wskazany / oczekiwanie na trigger',
    capabilities: Object.freeze([]),
    transitions: Object.freeze([
      Object.freeze({ kind: VR_SCENARIO_TRANSITION_KIND.COMPLETE,
        event: VR_SCENARIO_EVENT.MONKEY_TRIGGERED,
        milestonesToAdd: Object.freeze([]),
        effects: Object.freeze([VR_SCENARIO_EFFECT.CONTINUE_CONTROLLER_ONBOARDING])
      })
    ])
  }),
  Object.freeze({
    id: VR_EXPERIENCE_POINT['1.100'],
    canonicalMainline: Object.freeze({ target: VR_EXPERIENCE_POINT['1.110'] }),
    settledConsequences: EMPTY_SETTLED_CONSEQUENCES,
    label: 'Sekwencja po triggerze / invitation / oczekiwanie na wybór',
    capabilities: Object.freeze([]),
    transitions: Object.freeze([
      Object.freeze({ kind: VR_SCENARIO_TRANSITION_KIND.COMPLETE, event: VR_SCENARIO_EVENT.INTRO_INVITATION_SELECTED, choice: 1, milestonesToAdd: Object.freeze([]), effects: Object.freeze([VR_SCENARIO_EFFECT.CONTINUE_INTRO_INVITATION]) }),
      Object.freeze({ kind: VR_SCENARIO_TRANSITION_KIND.STAY, event: VR_SCENARIO_EVENT.INTRO_INVITATION_SELECTED, choice: 2, milestonesToAdd: Object.freeze([]), effects: Object.freeze([VR_SCENARIO_EFFECT.CONTINUE_INTRO_INVITATION]) }),
      Object.freeze({ kind: VR_SCENARIO_TRANSITION_KIND.EXPLICIT, event: VR_SCENARIO_EVENT.INTRO_INVITATION_SELECTED, choice: 3, target: VR_EXPERIENCE_POINT['100.10'], milestonesToAdd: Object.freeze([]), effects: Object.freeze([VR_SCENARIO_EFFECT.CONTINUE_INTRO_INVITATION]) })
    ])
  }),
  Object.freeze({
    id: VR_EXPERIENCE_POINT['1.110'],
    canonicalMainline: Object.freeze({ target: VR_EXPERIENCE_POINT['1.120'] }),
    settledConsequences: EMPTY_SETTLED_CONSEQUENCES,
    label: 'Gracz zgadza się iść za Monkey / FOLLOWING zaczyna się',
    capabilities: Object.freeze([]),
    transitions: Object.freeze([
      Object.freeze({ kind: VR_SCENARIO_TRANSITION_KIND.STAY,
        event: VR_SCENARIO_EVENT.FOLLOW_PAUSE_CHANGED,
        milestonesToAdd: Object.freeze([]),
        effects: Object.freeze([VR_SCENARIO_EFFECT.APPLY_FOLLOW_PAUSE_STATE])
      }),
      Object.freeze({ kind: VR_SCENARIO_TRANSITION_KIND.COMPLETE,
        event: VR_SCENARIO_EVENT.MONKEY_REACHED_THRESHOLD,
        milestonesToAdd: Object.freeze([]),
        effects: Object.freeze([VR_SCENARIO_EFFECT.PRESENT_THRESHOLD_CHOICE])
      })
    ])
  }),
  Object.freeze({
    id: VR_EXPERIENCE_POINT['1.120'],
    canonicalMainline: Object.freeze({ target: VR_EXPERIENCE_POINT['1.130'] }),
    settledConsequences: EMPTY_SETTLED_CONSEQUENCES,
    label: 'Monkey dotarła do progu / threshold dialogue prezentowany',
    capabilities: Object.freeze([]),
    transitions: Object.freeze([
      Object.freeze({ kind: VR_SCENARIO_TRANSITION_KIND.COMPLETE, event: VR_SCENARIO_EVENT.THRESHOLD_SELECTED, choice: 1, milestonesToAdd: Object.freeze([]), effects: Object.freeze([VR_SCENARIO_EFFECT.CONTINUE_THRESHOLD_CHOICE]) }),
      Object.freeze({ kind: VR_SCENARIO_TRANSITION_KIND.STAY, event: VR_SCENARIO_EVENT.THRESHOLD_SELECTED, choice: 2, milestonesToAdd: Object.freeze([]), effects: Object.freeze([VR_SCENARIO_EFFECT.CONTINUE_THRESHOLD_CHOICE]) }),
      Object.freeze({ kind: VR_SCENARIO_TRANSITION_KIND.EXPLICIT, event: VR_SCENARIO_EVENT.THRESHOLD_SELECTED, choice: 3, target: VR_EXPERIENCE_POINT['100.10'], milestonesToAdd: Object.freeze([]), effects: Object.freeze([VR_SCENARIO_EFFECT.CONTINUE_THRESHOLD_CHOICE]) })
    ])
  }),
  Object.freeze({
    id: VR_EXPERIENCE_POINT['1.130'],
    canonicalMainline: Object.freeze({ target: VR_EXPERIENCE_POINT['2.10'] }),
    settledConsequences: INTRO_COMPLETE_SETTLED_CONSEQUENCES,
    label: 'Gracz przekracza próg / CROSSING rozpoczyna się',
    capabilities: Object.freeze([]),
    transitions: Object.freeze([
      Object.freeze({ kind: VR_SCENARIO_TRANSITION_KIND.COMPLETE_IF, condition: 'crossingComplete', event: VR_SCENARIO_EVENT.PLAYER_ENTERED_RING, milestonesToAdd: Object.freeze([]), effects: Object.freeze([VR_SCENARIO_EFFECT.BEGIN_GLYPH_FREE_EXPLORE]) }),
      Object.freeze({ kind: VR_SCENARIO_TRANSITION_KIND.COMPLETE_IF, condition: 'crossingComplete', event: VR_SCENARIO_EVENT.MONKEY_SETTLED, milestonesToAdd: Object.freeze([]), effects: Object.freeze([VR_SCENARIO_EFFECT.BEGIN_GLYPH_FREE_EXPLORE]) })
    ])
  }),
  Object.freeze({
    id: VR_EXPERIENCE_POINT['2.10'],
    canonicalMainline: Object.freeze({ target: VR_EXPERIENCE_POINT['2.20'] }),
    settledConsequences: EMPTY_SETTLED_CONSEQUENCES,
    label: 'GLYPH_FREE_EXPLORE rozpoczęte',
    capabilities: Object.freeze([VR_SCENARIO_CAPABILITY.CAN_USE_GLYPHS]),
    transitions: Object.freeze([
      Object.freeze({ kind: VR_SCENARIO_TRANSITION_KIND.STAY, event: VR_SCENARIO_EVENT.GLYPH_HINT_TIMEOUT, milestonesToAdd: Object.freeze([]), effects: Object.freeze([VR_SCENARIO_EFFECT.SHOW_GLYPH_HINT]) }),
      Object.freeze({ kind: VR_SCENARIO_TRANSITION_KIND.COMPLETE, event: VR_SCENARIO_EVENT.FIRST_CRYSTAL_DISCOVERED, milestonesToAdd: Object.freeze([VR_SCENARIO_MILESTONE.FIRST_CRYSTAL_DISCOVERED]), effects: Object.freeze([VR_SCENARIO_EFFECT.REVEAL_RELIQUARY]) })
    ])
  }),
  Object.freeze({
    id: VR_EXPERIENCE_POINT['2.20'],
    canonicalMainline: Object.freeze({ target: VR_EXPERIENCE_POINT['2.30'] }),
    settledConsequences: RELIQUARY_REVEALED_SETTLED_CONSEQUENCES,
    label: 'Pierwszy kryształ odkryty / oczekiwanie na aktywację Monkey i reliquary reveal',
    capabilities: Object.freeze([]),
    transitions: Object.freeze([
      Object.freeze({ kind: VR_SCENARIO_TRANSITION_KIND.STAY, event: VR_SCENARIO_EVENT.MONKEY_TRIGGERED, milestonesToAdd: Object.freeze([]), effects: Object.freeze([VR_SCENARIO_EFFECT.BEGIN_RELIQUARY_REVEAL]) }),
      Object.freeze({ kind: VR_SCENARIO_TRANSITION_KIND.COMPLETE, event: VR_SCENARIO_EVENT.RELIQUARY_REVEAL_COMPLETED, milestonesToAdd: Object.freeze([]), effects: Object.freeze([VR_SCENARIO_EFFECT.COMPLETE_RELIQUARY_REVEAL]) })
    ])
  }),
  Object.freeze({
    id: VR_EXPERIENCE_POINT['2.30'],
    canonicalMainline: Object.freeze({ target: VR_EXPERIENCE_POINT['2.40'] }),
    settledConsequences: FIRST_RING_COMPLETE_SETTLED_CONSEQUENCES,
    label: 'Pierwszy ring / zdobywanie pierwszych 5 kart',
    capabilities: Object.freeze([
      VR_SCENARIO_CAPABILITY.CAN_USE_GLYPHS,
      VR_SCENARIO_CAPABILITY.CAN_USE_RELIQUARY,
      VR_SCENARIO_CAPABILITY.CAN_ACTIVATE_RELIQUARY,
      VR_SCENARIO_CAPABILITY.CAN_RELEASE_RELIQUARY
    ]),
    transitions: Object.freeze([
      Object.freeze({ kind: VR_SCENARIO_TRANSITION_KIND.STAY, event: VR_SCENARIO_EVENT.RELIQUARY_HINT_TIMEOUT, milestonesToAdd: Object.freeze([]), effects: Object.freeze([VR_SCENARIO_EFFECT.SHOW_RELIQUARY_CONTEXT_HINT]) }),
      Object.freeze({ kind: VR_SCENARIO_TRANSITION_KIND.STAY, event: VR_SCENARIO_EVENT.CRYSTAL_ACTIVATED, milestonesToAdd: Object.freeze([]), effects: Object.freeze([VR_SCENARIO_EFFECT.PRESENT_ACTIVE_CARD_PREVIEW]) }),
      Object.freeze({ kind: VR_SCENARIO_TRANSITION_KIND.STAY, event: VR_SCENARIO_EVENT.CARD_COMMITTED, milestonesToAdd: Object.freeze([VR_SCENARIO_MILESTONE.CARD_COMMITTED]), effects: Object.freeze([
        VR_SCENARIO_EFFECT.UPDATE_COMMITTED_CARD_PRESENTATION,
        VR_SCENARIO_EFFECT.PLAY_CARD_COMMIT_FEEDBACK
      ]) }),
      Object.freeze({ kind: VR_SCENARIO_TRANSITION_KIND.COMPLETE, event: VR_SCENARIO_EVENT.FIRST_RING_COMPLETED, milestonesToAdd: Object.freeze([]), effects: Object.freeze([
        VR_SCENARIO_EFFECT.COMPLETE_FIRST_RING_PRESENTATION,
        VR_SCENARIO_EFFECT.PLAY_FIRST_RING_COMPLETE_FEEDBACK
      ]) })
    ])
  }),
  Object.freeze({
    id: VR_EXPERIENCE_POINT['2.40'],
    canonicalMainline: Object.freeze({ target: VR_EXPERIENCE_POINT['3.10'] }),
    settledConsequences: EMPTY_SETTLED_CONSEQUENCES,
    label: 'Pierwszy ring / pierwszy globalny poziom ukończony 5/5',
    capabilities: Object.freeze([]),
    transitions: Object.freeze([
      Object.freeze({ kind: VR_SCENARIO_TRANSITION_KIND.COMPLETE,
        event: VR_SCENARIO_EVENT.FIRST_RING_PRESENTATION_COMPLETED,
        milestonesToAdd: Object.freeze([]),
        effects: Object.freeze([])
      })
    ])
  }),
  Object.freeze({
    id: VR_EXPERIENCE_POINT['3.10'],
    canonicalMainline: Object.freeze({ target: VR_EXPERIENCE_POINT['3.20'] }),
    settledConsequences: ACT_TWO_ENTRY_SETTLED_CONSEQUENCES,
    entryEffects: Object.freeze([
      VR_SCENARIO_EFFECT.REVEAL_SHELL_FIELD_PRESENTATION,
      VR_SCENARIO_EFFECT.ELEVATE_MAIN_GLYPHS
    ]),
    label: 'Post-ring world transition / prezentacja pola Muszli i elevacja głównych glyphów',
    capabilities: Object.freeze([]),
    transitions: Object.freeze([
      Object.freeze({ kind: VR_SCENARIO_TRANSITION_KIND.COMPLETE,
        event: VR_SCENARIO_EVENT.POST_RING_WORLD_PRESENTATION_COMPLETED,
        milestonesToAdd: Object.freeze([]),
        effects: Object.freeze([])
      })
    ])
  }),
  Object.freeze({
    id: VR_EXPERIENCE_POINT['3.20'],
    canonicalMainline: Object.freeze({ target: VR_EXPERIENCE_POINT['3.30'] }),
    settledConsequences: EMPTY_SETTLED_CONSEQUENCES,
    entryEffects: Object.freeze([VR_SCENARIO_EFFECT.BEGIN_OBSERVATION_WINDOW]),
    label: 'Observation window / około 10 sekund',
    capabilities: Object.freeze([]),
    transitions: Object.freeze([
      Object.freeze({ kind: VR_SCENARIO_TRANSITION_KIND.COMPLETE,
        event: VR_SCENARIO_EVENT.OBSERVATION_WINDOW_COMPLETED,
        milestonesToAdd: Object.freeze([]),
        effects: Object.freeze([])
      })
    ])
  }),
  Object.freeze({
    id: VR_EXPERIENCE_POINT['3.30'],
    canonicalMainline: Object.freeze({ target: VR_EXPERIENCE_POINT['3.40'] }),
    settledConsequences: EMPTY_SETTLED_CONSEQUENCES,
    entryEffects: Object.freeze([VR_SCENARIO_EFFECT.BEGIN_MONKEY_ATTENTION]),
    label: 'Monkey post-ring dialogue / attention, świadoma interakcja i obowiązkowa wiadomość',
    capabilities: Object.freeze([]),
    transitions: Object.freeze([
      Object.freeze({ kind: VR_SCENARIO_TRANSITION_KIND.COMPLETE,
        event: VR_SCENARIO_EVENT.POST_RING_MONKEY_DIALOGUE_COMPLETED,
        milestonesToAdd: Object.freeze([]),
        effects: Object.freeze([])
      })
    ])
  }),
  Object.freeze({
    id: VR_EXPERIENCE_POINT['3.40'],
    canonicalMainline: Object.freeze({ target: VR_EXPERIENCE_POINT['3.50'] }),
    settledConsequences: EMPTY_SETTLED_CONSEQUENCES,
    entryEffects: Object.freeze([VR_SCENARIO_EFFECT.BEGIN_FURNACE_INTRO]),
    label: 'Monkey → Furnace intro',
    capabilities: Object.freeze([]),
    transitions: Object.freeze([
      Object.freeze({ kind: VR_SCENARIO_TRANSITION_KIND.COMPLETE,
        event: VR_SCENARIO_EVENT.FURNACE_INTRO_COMPLETED, milestonesToAdd: Object.freeze([]), effects: Object.freeze([]) })
    ])
  }),
  Object.freeze({
    id: VR_EXPERIENCE_POINT['3.50'],
    canonicalMainline: Object.freeze({ target: VR_EXPERIENCE_POINT['3.60'] }), settledConsequences: EMPTY_SETTLED_CONSEQUENCES,
    label: 'Furnace available / Astro production ready',
    capabilities: Object.freeze([VR_SCENARIO_CAPABILITY.CAN_USE_FURNACE, VR_SCENARIO_CAPABILITY.CAN_OPEN_FURNACE,
      VR_SCENARIO_CAPABILITY.CAN_START_FURNACE_PROCESS]),
    transitions: Object.freeze([Object.freeze({ kind: VR_SCENARIO_TRANSITION_KIND.COMPLETE,
      event: VR_SCENARIO_EVENT.ASTRO_ATTRACTOR_PRODUCTION_REQUESTED, milestonesToAdd: Object.freeze([]), effects: Object.freeze([]) })])
  }),
  Object.freeze({
    id: VR_EXPERIENCE_POINT['3.60'],
    canonicalMainline: Object.freeze({ target: VR_EXPERIENCE_POINT['3.70'] }), settledConsequences: EMPTY_SETTLED_CONSEQUENCES,
    label: 'Astro Attractor construction', capabilities: Object.freeze([VR_SCENARIO_CAPABILITY.CAN_USE_FURNACE]),
    transitions: Object.freeze([Object.freeze({ kind: VR_SCENARIO_TRANSITION_KIND.COMPLETE,
      event: VR_SCENARIO_EVENT.ASTRO_ATTRACTOR_PRODUCED, milestonesToAdd: Object.freeze([]), effects: Object.freeze([]) })])
  }),
  Object.freeze({
    id: VR_EXPERIENCE_POINT['3.70'],
    canonicalMainline: Object.freeze({ target: VR_EXPERIENCE_POINT['3.80'] }), settledConsequences: EMPTY_SETTLED_CONSEQUENCES,
    label: 'Physical Astro available / waiting for claim',
    capabilities: Object.freeze([VR_SCENARIO_CAPABILITY.CAN_USE_FURNACE, VR_SCENARIO_CAPABILITY.CAN_OPEN_FURNACE]),
    transitions: Object.freeze([Object.freeze({ kind: VR_SCENARIO_TRANSITION_KIND.COMPLETE,
      event: VR_SCENARIO_EVENT.ASTRO_ATTRACTOR_CLAIMED, milestonesToAdd: Object.freeze([]), effects: Object.freeze([]) })])
  }),
  Object.freeze({
    id: VR_EXPERIENCE_POINT['3.80'],
    canonicalMainline: Object.freeze({ target: VR_EXPERIENCE_POINT['100.10'] }), settledConsequences: EMPTY_SETTLED_CONSEQUENCES,
    label: 'Astro Attractor physically claimed / EARNED',
    capabilities: Object.freeze([VR_SCENARIO_CAPABILITY.CAN_EQUIP_ASTRO, VR_SCENARIO_CAPABILITY.CAN_SCAN_SHELLS,
      VR_SCENARIO_CAPABILITY.CAN_TARGET_SHELLS, VR_SCENARIO_CAPABILITY.CAN_USE_FURNACE,
      VR_SCENARIO_CAPABILITY.CAN_OPEN_FURNACE, VR_SCENARIO_CAPABILITY.CAN_INSERT_FURNACE_MATERIAL,
      VR_SCENARIO_CAPABILITY.CAN_START_FURNACE_PROCESS]), transitions: Object.freeze([])
  }),
  Object.freeze({
    id: VR_EXPERIENCE_POINT['100.10'],
    settledConsequences: EMPTY_SETTLED_CONSEQUENCES,
    label: 'EXIT EXPERIENCE VR',
    capabilities: Object.freeze([]), transitions: Object.freeze([])
  })
]);

const scenarioGraph = Object.freeze({
  initialPointId: VR_EXPERIENCE_POINT['1.10'],
  canonicalTerminalPointId: VR_EXPERIENCE_POINT['100.10'],
  points
});

export const VR_EXPERIENCE_SCENARIO_SPINE = Object.freeze(deriveScenarioSpine(scenarioGraph));

export const vrExperienceScenario = Object.freeze({
  id: 'experience-vr',
  initialPointId: scenarioGraph.initialPointId,
  canonicalTerminalPointId: scenarioGraph.canonicalTerminalPointId,
  canonicalTerminalIsExit: true,
  points,
  spine: VR_EXPERIENCE_SCENARIO_SPINE,
  // Compatibility aliases share the canonical point data; they are not a second model.
  initialSceneId: scenarioGraph.initialPointId,
  scenes: points,
  vocabulary: Object.freeze({
    events: Object.freeze(Object.values(VR_SCENARIO_EVENT)),
    capabilities: Object.freeze(Object.values(VR_SCENARIO_CAPABILITY)),
    milestones: Object.freeze(Object.values(VR_SCENARIO_MILESTONE)),
    effects: Object.freeze(Object.values(VR_SCENARIO_EFFECT))
  }),
  metadata: Object.freeze({
    stage: 'M3_ASTRO_PHYSICAL_CLAIM',
    authoritativeForLiveGameplay: true,
    // Canonical routing topology lives on authored point graph edges.
  })
});
