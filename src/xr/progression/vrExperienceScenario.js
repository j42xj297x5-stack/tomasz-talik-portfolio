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
  'COMPLETE_RELIQUARY_REVEAL',
  'SHOW_RELIQUARY_CONTEXT_HINT',
  'PRESENT_ACTIVE_CARD_PREVIEW',
  'UPDATE_COMMITTED_CARD_PRESENTATION',
  'PLAY_CARD_COMMIT_FEEDBACK',
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
  '2.10.1',
  '2.20',
  '2.30',
  '2.30.1',
  '2.40',
  '2.40.1',
  '100.10'
]);

// Compatibility export only; both names reference the same identifier set.
export const VR_EXPERIENCE_SCENE = VR_EXPERIENCE_POINT;

// Authored story order. This is deliberately explicit and independent from
// identifier sorting and transition topology; local branches never belong here.
export const VR_EXPERIENCE_SCENARIO_SPINE = Object.freeze([
  VR_EXPERIENCE_POINT['1.10'],
  VR_EXPERIENCE_POINT['1.20'],
  VR_EXPERIENCE_POINT['1.30'],
  VR_EXPERIENCE_POINT['1.40'],
  VR_EXPERIENCE_POINT['1.50'],
  VR_EXPERIENCE_POINT['1.60'],
  VR_EXPERIENCE_POINT['1.70'],
  VR_EXPERIENCE_POINT['1.80'],
  VR_EXPERIENCE_POINT['1.100'],
  VR_EXPERIENCE_POINT['1.110'],
  VR_EXPERIENCE_POINT['1.120'],
  VR_EXPERIENCE_POINT['1.130'],
  VR_EXPERIENCE_POINT['2.10'],
  VR_EXPERIENCE_POINT['2.20'],
  VR_EXPERIENCE_POINT['2.30'],
  VR_EXPERIENCE_POINT['2.40']
]);

const EMPTY_SETTLED_CONSEQUENCES = Object.freeze({});

const points = Object.freeze([
  Object.freeze({
    id: VR_EXPERIENCE_POINT['1.10'],
    settledConsequences: EMPTY_SETTLED_CONSEQUENCES,
    label: 'Bootstrap / oczekiwanie na kalibrację XR',
    capabilities: Object.freeze([]),
    transitions: Object.freeze([
      Object.freeze({ kind: VR_SCENARIO_TRANSITION_KIND.COMPLETE,
        event: VR_SCENARIO_EVENT.XR_CALIBRATED,
        milestonesToAdd: Object.freeze([VR_SCENARIO_MILESTONE.XR_CALIBRATED]),
        effects: Object.freeze([VR_SCENARIO_EFFECT.BEGIN_INTRO_REVEAL])
      })
    ])
  }),
  Object.freeze({
    id: VR_EXPERIENCE_POINT['1.20'],
    settledConsequences: EMPTY_SETTLED_CONSEQUENCES,
    label: 'Intro reveal',
    capabilities: Object.freeze([]),
    transitions: Object.freeze([
      Object.freeze({ kind: VR_SCENARIO_TRANSITION_KIND.COMPLETE,
        event: VR_SCENARIO_EVENT.INTRO_REVEAL_COMPLETE,
        milestonesToAdd: Object.freeze([VR_SCENARIO_MILESTONE.INTRO_REVEAL_COMPLETE]),
        effects: Object.freeze([VR_SCENARIO_EFFECT.BEGIN_POST_REVEAL_SILENCE])
      })
    ])
  }),
  Object.freeze({
    id: VR_EXPERIENCE_POINT['1.30'],
    settledConsequences: EMPTY_SETTLED_CONSEQUENCES,
    label: 'Cisza po revealu',
    capabilities: Object.freeze([]),
    transitions: Object.freeze([
      Object.freeze({ kind: VR_SCENARIO_TRANSITION_KIND.COMPLETE,
        event: VR_SCENARIO_EVENT.POST_REVEAL_SILENCE_COMPLETE,
        milestonesToAdd: Object.freeze([VR_SCENARIO_MILESTONE.POST_REVEAL_SILENCE_COMPLETE]),
        effects: Object.freeze([VR_SCENARIO_EFFECT.BEGIN_CONTROLLER_ONBOARDING])
      })
    ])
  }),
  Object.freeze({
    id: VR_EXPERIENCE_POINT['1.40'],
    settledConsequences: EMPTY_SETTLED_CONSEQUENCES,
    label: 'Controller onboarding',
    capabilities: Object.freeze([]),
    transitions: Object.freeze([
      Object.freeze({ kind: VR_SCENARIO_TRANSITION_KIND.COMPLETE,
        event: VR_SCENARIO_EVENT.PLAYER_OPENED_GUIDE,
        milestonesToAdd: Object.freeze([]),
        effects: Object.freeze([VR_SCENARIO_EFFECT.CONTINUE_CONTROLLER_ONBOARDING])
      })
    ])
  }),
  Object.freeze({
    id: VR_EXPERIENCE_POINT['1.50'],
    settledConsequences: EMPTY_SETTLED_CONSEQUENCES,
    label: 'Player Guide otwarty / oczekiwanie na obejrzenie controls',
    capabilities: Object.freeze([]),
    transitions: Object.freeze([
      Object.freeze({ kind: VR_SCENARIO_TRANSITION_KIND.COMPLETE,
        event: VR_SCENARIO_EVENT.PLAYER_VIEWED_CONTROLS,
        milestonesToAdd: Object.freeze([VR_SCENARIO_MILESTONE.PLAYER_VIEWED_CONTROLS]),
        effects: Object.freeze([VR_SCENARIO_EFFECT.CONTINUE_CONTROLLER_ONBOARDING])
      })
    ])
  }),
  Object.freeze({
    id: VR_EXPERIENCE_POINT['1.60'],
    settledConsequences: EMPTY_SETTLED_CONSEQUENCES,
    label: 'Controls obejrzane / oczekiwanie na zamknięcie panelu',
    capabilities: Object.freeze([]),
    transitions: Object.freeze([
      Object.freeze({ kind: VR_SCENARIO_TRANSITION_KIND.COMPLETE,
        event: VR_SCENARIO_EVENT.PLAYER_CLOSED_GUIDE,
        milestonesToAdd: Object.freeze([]),
        effects: Object.freeze([VR_SCENARIO_EFFECT.CONTINUE_CONTROLLER_ONBOARDING])
      })
    ])
  }),
  Object.freeze({
    id: VR_EXPERIENCE_POINT['1.70'],
    settledConsequences: EMPTY_SETTLED_CONSEQUENCES,
    label: 'Pointer tutorial uruchomiony / oczekiwanie na wskazanie Monkey',
    capabilities: Object.freeze([]),
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
    settledConsequences: EMPTY_SETTLED_CONSEQUENCES,
    label: 'Gracz przekracza próg / CROSSING rozpoczyna się',
    capabilities: Object.freeze([]),
    transitions: Object.freeze([
      Object.freeze({ kind: VR_SCENARIO_TRANSITION_KIND.COMPLETE_IF, condition: 'crossingComplete', event: VR_SCENARIO_EVENT.PLAYER_ENTERED_RING, milestonesToAdd: Object.freeze([]), effects: Object.freeze([VR_SCENARIO_EFFECT.BEGIN_GLYPH_FREE_EXPLORE]) }),
      Object.freeze({ kind: VR_SCENARIO_TRANSITION_KIND.COMPLETE_IF, condition: 'crossingComplete', event: VR_SCENARIO_EVENT.MONKEY_SETTLED, milestonesToAdd: Object.freeze([]), effects: Object.freeze([VR_SCENARIO_EFFECT.BEGIN_GLYPH_FREE_EXPLORE]) })
    ])
  }),
  Object.freeze({
    id: VR_EXPERIENCE_POINT['2.10'],
    settledConsequences: EMPTY_SETTLED_CONSEQUENCES,
    label: 'GLYPH_FREE_EXPLORE rozpoczęte',
    capabilities: Object.freeze([VR_SCENARIO_CAPABILITY.CAN_USE_GLYPHS]),
    transitions: Object.freeze([
      Object.freeze({ kind: VR_SCENARIO_TRANSITION_KIND.EXPLICIT, event: VR_SCENARIO_EVENT.GLYPH_HINT_TIMEOUT, target: VR_EXPERIENCE_POINT['2.10.1'], milestonesToAdd: Object.freeze([]), effects: Object.freeze([VR_SCENARIO_EFFECT.SHOW_GLYPH_HINT]) }),
      Object.freeze({ kind: VR_SCENARIO_TRANSITION_KIND.COMPLETE, event: VR_SCENARIO_EVENT.FIRST_CRYSTAL_DISCOVERED, milestonesToAdd: Object.freeze([VR_SCENARIO_MILESTONE.FIRST_CRYSTAL_DISCOVERED]), effects: Object.freeze([VR_SCENARIO_EFFECT.REVEAL_RELIQUARY]) })
    ])
  }),
  Object.freeze({
    id: VR_EXPERIENCE_POINT['2.10.1'],
    label: 'GLYPH_FREE_EXPLORE po pokazaniu timeout hintu',
    capabilities: Object.freeze([VR_SCENARIO_CAPABILITY.CAN_USE_GLYPHS]),
    transitions: Object.freeze([
      Object.freeze({ kind: VR_SCENARIO_TRANSITION_KIND.EXPLICIT, event: VR_SCENARIO_EVENT.FIRST_CRYSTAL_DISCOVERED, target: VR_EXPERIENCE_POINT['2.20'], milestonesToAdd: Object.freeze([VR_SCENARIO_MILESTONE.FIRST_CRYSTAL_DISCOVERED]), effects: Object.freeze([VR_SCENARIO_EFFECT.REVEAL_RELIQUARY]) })
    ])
  }),
  Object.freeze({
    id: VR_EXPERIENCE_POINT['2.20'],
    settledConsequences: EMPTY_SETTLED_CONSEQUENCES,
    label: 'Pierwszy kryształ odkryty / discovery i reliquary reveal rozpoczęte',
    capabilities: Object.freeze([]),
    transitions: Object.freeze([
      Object.freeze({ kind: VR_SCENARIO_TRANSITION_KIND.COMPLETE, event: VR_SCENARIO_EVENT.RELIQUARY_REVEAL_COMPLETED, milestonesToAdd: Object.freeze([]), effects: Object.freeze([VR_SCENARIO_EFFECT.COMPLETE_RELIQUARY_REVEAL]) })
    ])
  }),
  Object.freeze({
    id: VR_EXPERIENCE_POINT['2.30'],
    settledConsequences: EMPTY_SETTLED_CONSEQUENCES,
    label: 'Reliquary reveal zakończony / powrót do GLYPH_FREE_EXPLORE',
    capabilities: Object.freeze([
      VR_SCENARIO_CAPABILITY.CAN_USE_GLYPHS,
      VR_SCENARIO_CAPABILITY.CAN_USE_RELIQUARY,
      VR_SCENARIO_CAPABILITY.CAN_ACTIVATE_RELIQUARY
    ]),
    transitions: Object.freeze([
      Object.freeze({ kind: VR_SCENARIO_TRANSITION_KIND.EXPLICIT, event: VR_SCENARIO_EVENT.RELIQUARY_HINT_TIMEOUT, target: VR_EXPERIENCE_POINT['2.30.1'], milestonesToAdd: Object.freeze([]), effects: Object.freeze([VR_SCENARIO_EFFECT.SHOW_RELIQUARY_CONTEXT_HINT]) }),
      Object.freeze({ kind: VR_SCENARIO_TRANSITION_KIND.COMPLETE, event: VR_SCENARIO_EVENT.CRYSTAL_ACTIVATED, milestonesToAdd: Object.freeze([]), effects: Object.freeze([VR_SCENARIO_EFFECT.PRESENT_ACTIVE_CARD_PREVIEW]) })
    ])
  }),
  Object.freeze({
    id: VR_EXPERIENCE_POINT['2.30.1'],
    label: 'Oczekiwanie na Activate po contextual hincie',
    capabilities: Object.freeze([
      VR_SCENARIO_CAPABILITY.CAN_USE_GLYPHS,
      VR_SCENARIO_CAPABILITY.CAN_USE_RELIQUARY,
      VR_SCENARIO_CAPABILITY.CAN_ACTIVATE_RELIQUARY
    ]),
    transitions: Object.freeze([
      Object.freeze({ kind: VR_SCENARIO_TRANSITION_KIND.EXPLICIT, event: VR_SCENARIO_EVENT.CRYSTAL_ACTIVATED, target: VR_EXPERIENCE_POINT['2.40'], milestonesToAdd: Object.freeze([]), effects: Object.freeze([VR_SCENARIO_EFFECT.PRESENT_ACTIVE_CARD_PREVIEW]) })
    ])
  }),
  Object.freeze({
    id: VR_EXPERIENCE_POINT['2.40'],
    settledConsequences: EMPTY_SETTLED_CONSEQUENCES,
    label: 'Reliquary aktywowane / oczekiwanie na Release',
    capabilities: Object.freeze([
      VR_SCENARIO_CAPABILITY.CAN_USE_GLYPHS,
      VR_SCENARIO_CAPABILITY.CAN_USE_RELIQUARY,
      VR_SCENARIO_CAPABILITY.CAN_RELEASE_RELIQUARY
    ]),
    transitions: Object.freeze([
      Object.freeze({ kind: VR_SCENARIO_TRANSITION_KIND.EXPLICIT, event: VR_SCENARIO_EVENT.RELIQUARY_HINT_TIMEOUT, target: VR_EXPERIENCE_POINT['2.40.1'], milestonesToAdd: Object.freeze([]), effects: Object.freeze([VR_SCENARIO_EFFECT.SHOW_RELIQUARY_CONTEXT_HINT]) }),
      Object.freeze({ kind: VR_SCENARIO_TRANSITION_KIND.EXPLICIT, event: VR_SCENARIO_EVENT.CARD_COMMITTED, target: VR_EXPERIENCE_POINT['2.30'], milestonesToAdd: Object.freeze([VR_SCENARIO_MILESTONE.CARD_COMMITTED]), effects: Object.freeze([
        VR_SCENARIO_EFFECT.UPDATE_COMMITTED_CARD_PRESENTATION,
        VR_SCENARIO_EFFECT.PLAY_CARD_COMMIT_FEEDBACK
      ]) })
    ])
  }),
  Object.freeze({
    id: VR_EXPERIENCE_POINT['2.40.1'],
    label: 'Oczekiwanie na Release po contextual hincie',
    capabilities: Object.freeze([
      VR_SCENARIO_CAPABILITY.CAN_USE_GLYPHS,
      VR_SCENARIO_CAPABILITY.CAN_USE_RELIQUARY,
      VR_SCENARIO_CAPABILITY.CAN_RELEASE_RELIQUARY
    ]),
    transitions: Object.freeze([
      Object.freeze({ kind: VR_SCENARIO_TRANSITION_KIND.EXPLICIT, event: VR_SCENARIO_EVENT.CARD_COMMITTED, target: VR_EXPERIENCE_POINT['2.30'], milestonesToAdd: Object.freeze([VR_SCENARIO_MILESTONE.CARD_COMMITTED]), effects: Object.freeze([
        VR_SCENARIO_EFFECT.UPDATE_COMMITTED_CARD_PRESENTATION,
        VR_SCENARIO_EFFECT.PLAY_CARD_COMMIT_FEEDBACK
      ]) })
    ])
  }),
  Object.freeze({
    id: VR_EXPERIENCE_POINT['100.10'],
    settledConsequences: EMPTY_SETTLED_CONSEQUENCES,
    label: 'EXIT EXPERIENCE VR',
    capabilities: Object.freeze([]), transitions: Object.freeze([])
  })
]);

export const vrExperienceScenario = Object.freeze({
  id: 'experience-vr',
  initialPointId: VR_EXPERIENCE_SCENARIO_SPINE[0],
  points,
  spine: VR_EXPERIENCE_SCENARIO_SPINE,
  // Compatibility aliases share the canonical point data; they are not a second model.
  initialSceneId: VR_EXPERIENCE_SCENARIO_SPINE[0],
  scenes: points,
  vocabulary: Object.freeze({
    events: Object.freeze(Object.values(VR_SCENARIO_EVENT)),
    capabilities: Object.freeze(Object.values(VR_SCENARIO_CAPABILITY)),
    milestones: Object.freeze(Object.values(VR_SCENARIO_MILESTONE)),
    effects: Object.freeze(Object.values(VR_SCENARIO_EFFECT))
  }),
  metadata: Object.freeze({
    stage: 'M2_2C_CANONICAL_CROSSING_JOIN',
    authoritativeForLiveGameplay: true,
    // Routing topology lives only in points/transitions and the authored Spine.
  })
});
