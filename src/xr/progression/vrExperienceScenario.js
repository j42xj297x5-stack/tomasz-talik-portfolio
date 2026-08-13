function immutableIdentifiers(names) {
  return Object.freeze(Object.fromEntries(names.map((name) => [name, name])));
}

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
  'PLAYER_ENTERED_RING',
  'MONKEY_SETTLED',
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
  '1.100.1',
  '1.110',
  '1.110.1',
  '1.120',
  '1.120.1',
  '1.130',
  '1.130.1',
  '1.130.2',
  '1.140',
  '1.150',
  '1.160',
  '100.10'
]);

// Compatibility export only; both names reference the same identifier set.
export const VR_EXPERIENCE_SCENE = VR_EXPERIENCE_POINT;

const points = Object.freeze([
  Object.freeze({
    id: VR_EXPERIENCE_POINT['1.10'],
    label: 'Bootstrap / oczekiwanie na kalibrację XR',
    capabilities: Object.freeze([]),
    transitions: Object.freeze([
      Object.freeze({
        event: VR_SCENARIO_EVENT.XR_CALIBRATED,
        target: VR_EXPERIENCE_POINT['1.20'],
        milestonesToAdd: Object.freeze([VR_SCENARIO_MILESTONE.XR_CALIBRATED]),
        effects: Object.freeze([VR_SCENARIO_EFFECT.BEGIN_INTRO_REVEAL])
      })
    ])
  }),
  Object.freeze({
    id: VR_EXPERIENCE_POINT['1.20'],
    label: 'Intro reveal',
    capabilities: Object.freeze([]),
    transitions: Object.freeze([
      Object.freeze({
        event: VR_SCENARIO_EVENT.INTRO_REVEAL_COMPLETE,
        target: VR_EXPERIENCE_POINT['1.30'],
        milestonesToAdd: Object.freeze([VR_SCENARIO_MILESTONE.INTRO_REVEAL_COMPLETE]),
        effects: Object.freeze([VR_SCENARIO_EFFECT.BEGIN_POST_REVEAL_SILENCE])
      })
    ])
  }),
  Object.freeze({
    id: VR_EXPERIENCE_POINT['1.30'],
    label: 'Cisza po revealu',
    capabilities: Object.freeze([]),
    transitions: Object.freeze([
      Object.freeze({
        event: VR_SCENARIO_EVENT.POST_REVEAL_SILENCE_COMPLETE,
        target: VR_EXPERIENCE_POINT['1.40'],
        milestonesToAdd: Object.freeze([VR_SCENARIO_MILESTONE.POST_REVEAL_SILENCE_COMPLETE]),
        effects: Object.freeze([VR_SCENARIO_EFFECT.BEGIN_CONTROLLER_ONBOARDING])
      })
    ])
  }),
  Object.freeze({
    id: VR_EXPERIENCE_POINT['1.40'],
    label: 'Controller onboarding',
    capabilities: Object.freeze([]),
    transitions: Object.freeze([
      Object.freeze({
        event: VR_SCENARIO_EVENT.PLAYER_OPENED_GUIDE,
        target: VR_EXPERIENCE_POINT['1.50'],
        milestonesToAdd: Object.freeze([]),
        effects: Object.freeze([VR_SCENARIO_EFFECT.CONTINUE_CONTROLLER_ONBOARDING])
      })
    ])
  }),
  Object.freeze({
    id: VR_EXPERIENCE_POINT['1.50'],
    label: 'Player Guide otwarty / oczekiwanie na obejrzenie controls',
    capabilities: Object.freeze([]),
    transitions: Object.freeze([
      Object.freeze({
        event: VR_SCENARIO_EVENT.PLAYER_VIEWED_CONTROLS,
        target: VR_EXPERIENCE_POINT['1.60'],
        milestonesToAdd: Object.freeze([VR_SCENARIO_MILESTONE.PLAYER_VIEWED_CONTROLS]),
        effects: Object.freeze([VR_SCENARIO_EFFECT.CONTINUE_CONTROLLER_ONBOARDING])
      })
    ])
  }),
  Object.freeze({
    id: VR_EXPERIENCE_POINT['1.60'],
    label: 'Controls obejrzane / oczekiwanie na zamknięcie panelu',
    capabilities: Object.freeze([]),
    transitions: Object.freeze([
      Object.freeze({
        event: VR_SCENARIO_EVENT.PLAYER_CLOSED_GUIDE,
        target: VR_EXPERIENCE_POINT['1.70'],
        milestonesToAdd: Object.freeze([]),
        effects: Object.freeze([VR_SCENARIO_EFFECT.CONTINUE_CONTROLLER_ONBOARDING])
      })
    ])
  }),
  Object.freeze({
    id: VR_EXPERIENCE_POINT['1.70'],
    label: 'Pointer tutorial uruchomiony / oczekiwanie na wskazanie Monkey',
    capabilities: Object.freeze([]),
    transitions: Object.freeze([
      Object.freeze({
        event: VR_SCENARIO_EVENT.MONKEY_HOVERED,
        target: VR_EXPERIENCE_POINT['1.80'],
        milestonesToAdd: Object.freeze([]),
        effects: Object.freeze([VR_SCENARIO_EFFECT.CONTINUE_CONTROLLER_ONBOARDING])
      })
    ])
  }),
  Object.freeze({
    id: VR_EXPERIENCE_POINT['1.80'],
    label: 'Monkey wskazany / oczekiwanie na trigger',
    capabilities: Object.freeze([]),
    transitions: Object.freeze([
      Object.freeze({
        event: VR_SCENARIO_EVENT.MONKEY_TRIGGERED,
        target: VR_EXPERIENCE_POINT['1.100'],
        milestonesToAdd: Object.freeze([]),
        effects: Object.freeze([VR_SCENARIO_EFFECT.CONTINUE_CONTROLLER_ONBOARDING])
      })
    ])
  }),
  Object.freeze({
    id: VR_EXPERIENCE_POINT['1.100'],
    label: 'Sekwencja po triggerze / invitation / oczekiwanie na wybór',
    capabilities: Object.freeze([]),
    transitions: Object.freeze([
      Object.freeze({ event: VR_SCENARIO_EVENT.INTRO_INVITATION_SELECTED, choice: 1, target: VR_EXPERIENCE_POINT['1.110'], milestonesToAdd: Object.freeze([]), effects: Object.freeze([VR_SCENARIO_EFFECT.CONTINUE_INTRO_INVITATION]) }),
      Object.freeze({ event: VR_SCENARIO_EVENT.INTRO_INVITATION_SELECTED, choice: 2, target: VR_EXPERIENCE_POINT['1.100.1'], milestonesToAdd: Object.freeze([]), effects: Object.freeze([VR_SCENARIO_EFFECT.CONTINUE_INTRO_INVITATION]) }),
      Object.freeze({ event: VR_SCENARIO_EVENT.INTRO_INVITATION_SELECTED, choice: 3, target: VR_EXPERIENCE_POINT['100.10'], milestonesToAdd: Object.freeze([]), effects: Object.freeze([VR_SCENARIO_EFFECT.CONTINUE_INTRO_INVITATION]) })
    ])
  }),
  Object.freeze({
    id: VR_EXPERIENCE_POINT['1.100.1'],
    label: 'Gracz pyta dokąd / odpowiedź Monkey i ponowne invitation',
    capabilities: Object.freeze([]),
    transitions: Object.freeze([
      Object.freeze({ event: VR_SCENARIO_EVENT.INTRO_INVITATION_SELECTED, choice: 1, target: VR_EXPERIENCE_POINT['1.110'], milestonesToAdd: Object.freeze([]), effects: Object.freeze([VR_SCENARIO_EFFECT.CONTINUE_INTRO_INVITATION]) }),
      Object.freeze({ event: VR_SCENARIO_EVENT.INTRO_INVITATION_SELECTED, choice: 2, target: VR_EXPERIENCE_POINT['1.100.1'], milestonesToAdd: Object.freeze([]), effects: Object.freeze([VR_SCENARIO_EFFECT.CONTINUE_INTRO_INVITATION]) }),
      Object.freeze({ event: VR_SCENARIO_EVENT.INTRO_INVITATION_SELECTED, choice: 3, target: VR_EXPERIENCE_POINT['100.10'], milestonesToAdd: Object.freeze([]), effects: Object.freeze([VR_SCENARIO_EFFECT.CONTINUE_INTRO_INVITATION]) })
    ])
  }),
  Object.freeze({
    id: VR_EXPERIENCE_POINT['1.110'],
    label: 'Gracz zgadza się iść za Monkey / FOLLOWING zaczyna się',
    capabilities: Object.freeze([]),
    transitions: Object.freeze([
      Object.freeze({
        event: VR_SCENARIO_EVENT.FOLLOW_PAUSE_CHANGED,
        target: VR_EXPERIENCE_POINT['1.110.1'],
        milestonesToAdd: Object.freeze([]),
        effects: Object.freeze([VR_SCENARIO_EFFECT.APPLY_FOLLOW_PAUSE_STATE])
      }),
      Object.freeze({
        event: VR_SCENARIO_EVENT.MONKEY_REACHED_THRESHOLD,
        target: VR_EXPERIENCE_POINT['1.120'],
        milestonesToAdd: Object.freeze([]),
        effects: Object.freeze([VR_SCENARIO_EFFECT.PRESENT_THRESHOLD_CHOICE])
      })
    ])
  }),
  Object.freeze({
    id: VR_EXPERIENCE_POINT['1.110.1'],
    label: 'FOLLOWING / Monkey zatrzymana i oczekuje na gracza',
    capabilities: Object.freeze([]),
    transitions: Object.freeze([
      Object.freeze({
        event: VR_SCENARIO_EVENT.FOLLOW_PAUSE_CHANGED,
        target: VR_EXPERIENCE_POINT['1.110'],
        milestonesToAdd: Object.freeze([]),
        effects: Object.freeze([VR_SCENARIO_EFFECT.APPLY_FOLLOW_PAUSE_STATE])
      })
    ])
  }),
  Object.freeze({
    id: VR_EXPERIENCE_POINT['1.120'],
    label: 'Monkey dotarła do progu / threshold dialogue prezentowany',
    capabilities: Object.freeze([]),
    transitions: Object.freeze([
      Object.freeze({ event: VR_SCENARIO_EVENT.THRESHOLD_SELECTED, choice: 1, target: VR_EXPERIENCE_POINT['1.130'], milestonesToAdd: Object.freeze([]), effects: Object.freeze([VR_SCENARIO_EFFECT.CONTINUE_THRESHOLD_CHOICE]) }),
      Object.freeze({ event: VR_SCENARIO_EVENT.THRESHOLD_SELECTED, choice: 2, target: VR_EXPERIENCE_POINT['1.120.1'], milestonesToAdd: Object.freeze([]), effects: Object.freeze([VR_SCENARIO_EFFECT.CONTINUE_THRESHOLD_CHOICE]) }),
      Object.freeze({ event: VR_SCENARIO_EVENT.THRESHOLD_SELECTED, choice: 3, target: VR_EXPERIENCE_POINT['100.10'], milestonesToAdd: Object.freeze([]), effects: Object.freeze([VR_SCENARIO_EFFECT.CONTINUE_THRESHOLD_CHOICE]) })
    ])
  }),
  Object.freeze({
    id: VR_EXPERIENCE_POINT['1.120.1'],
    label: 'Gracz pyta co jest po drugiej stronie / odpowiedź i ponowny wybór',
    capabilities: Object.freeze([]),
    transitions: Object.freeze([
      Object.freeze({ event: VR_SCENARIO_EVENT.THRESHOLD_SELECTED, choice: 1, target: VR_EXPERIENCE_POINT['1.130'], milestonesToAdd: Object.freeze([]), effects: Object.freeze([VR_SCENARIO_EFFECT.CONTINUE_THRESHOLD_CHOICE]) }),
      Object.freeze({ event: VR_SCENARIO_EVENT.THRESHOLD_SELECTED, choice: 2, target: VR_EXPERIENCE_POINT['1.120.1'], milestonesToAdd: Object.freeze([]), effects: Object.freeze([VR_SCENARIO_EFFECT.CONTINUE_THRESHOLD_CHOICE]) }),
      Object.freeze({ event: VR_SCENARIO_EVENT.THRESHOLD_SELECTED, choice: 3, target: VR_EXPERIENCE_POINT['100.10'], milestonesToAdd: Object.freeze([]), effects: Object.freeze([VR_SCENARIO_EFFECT.CONTINUE_THRESHOLD_CHOICE]) })
    ])
  }),
  Object.freeze({
    id: VR_EXPERIENCE_POINT['1.130'],
    label: 'Gracz przekracza próg / CROSSING rozpoczyna się',
    capabilities: Object.freeze([]),
    transitions: Object.freeze([
      Object.freeze({ event: VR_SCENARIO_EVENT.PLAYER_ENTERED_RING, target: VR_EXPERIENCE_POINT['1.130.1'], milestonesToAdd: Object.freeze([VR_SCENARIO_MILESTONE.PLAYER_ENTERED_RING]), effects: Object.freeze([]) }),
      Object.freeze({ event: VR_SCENARIO_EVENT.MONKEY_SETTLED, target: VR_EXPERIENCE_POINT['1.130.2'], milestonesToAdd: Object.freeze([VR_SCENARIO_MILESTONE.MONKEY_SETTLED]), effects: Object.freeze([]) })
    ])
  }),
  Object.freeze({
    id: VR_EXPERIENCE_POINT['1.130.1'],
    label: 'Gracz w ringu / oczekiwanie na osadzenie Monkey',
    capabilities: Object.freeze([]),
    transitions: Object.freeze([
      Object.freeze({ event: VR_SCENARIO_EVENT.MONKEY_SETTLED, target: VR_EXPERIENCE_POINT['1.140'], milestonesToAdd: Object.freeze([VR_SCENARIO_MILESTONE.MONKEY_SETTLED]), effects: Object.freeze([VR_SCENARIO_EFFECT.BEGIN_GLYPH_FREE_EXPLORE]) })
    ])
  }),
  Object.freeze({
    id: VR_EXPERIENCE_POINT['1.130.2'],
    label: 'Monkey osadzona / oczekiwanie na wejście gracza do ringu',
    capabilities: Object.freeze([]),
    transitions: Object.freeze([
      Object.freeze({ event: VR_SCENARIO_EVENT.PLAYER_ENTERED_RING, target: VR_EXPERIENCE_POINT['1.140'], milestonesToAdd: Object.freeze([VR_SCENARIO_MILESTONE.PLAYER_ENTERED_RING]), effects: Object.freeze([VR_SCENARIO_EFFECT.BEGIN_GLYPH_FREE_EXPLORE]) })
    ])
  }),
  Object.freeze({
    id: VR_EXPERIENCE_POINT['1.140'],
    label: 'GLYPH_FREE_EXPLORE rozpoczęte',
    capabilities: Object.freeze([VR_SCENARIO_CAPABILITY.CAN_USE_GLYPHS]),
    transitions: Object.freeze([
      Object.freeze({ event: VR_SCENARIO_EVENT.GLYPH_HINT_TIMEOUT, target: VR_EXPERIENCE_POINT['1.150'], milestonesToAdd: Object.freeze([]), effects: Object.freeze([VR_SCENARIO_EFFECT.SHOW_GLYPH_HINT]) }),
      Object.freeze({ event: VR_SCENARIO_EVENT.FIRST_CRYSTAL_DISCOVERED, target: VR_EXPERIENCE_POINT['1.160'], milestonesToAdd: Object.freeze([VR_SCENARIO_MILESTONE.FIRST_CRYSTAL_DISCOVERED]), effects: Object.freeze([VR_SCENARIO_EFFECT.REVEAL_RELIQUARY]) })
    ])
  }),
  Object.freeze({
    id: VR_EXPERIENCE_POINT['1.150'],
    label: 'GLYPH_FREE_EXPLORE po pokazaniu timeout hintu',
    capabilities: Object.freeze([VR_SCENARIO_CAPABILITY.CAN_USE_GLYPHS]),
    transitions: Object.freeze([
      Object.freeze({ event: VR_SCENARIO_EVENT.FIRST_CRYSTAL_DISCOVERED, target: VR_EXPERIENCE_POINT['1.160'], milestonesToAdd: Object.freeze([VR_SCENARIO_MILESTONE.FIRST_CRYSTAL_DISCOVERED]), effects: Object.freeze([VR_SCENARIO_EFFECT.REVEAL_RELIQUARY]) })
    ])
  }),
  Object.freeze({
    id: VR_EXPERIENCE_POINT['1.160'],
    label: 'Pierwszy kryształ odkryty / discovery i reliquary reveal rozpoczęte',
    capabilities: Object.freeze([]), transitions: Object.freeze([])
  }),
  Object.freeze({
    id: VR_EXPERIENCE_POINT['100.10'],
    label: 'EXIT EXPERIENCE VR',
    capabilities: Object.freeze([]), transitions: Object.freeze([])
  })
]);

export const vrExperienceScenario = Object.freeze({
  id: 'experience-vr',
  initialPointId: VR_EXPERIENCE_POINT['1.10'],
  points,
  // Compatibility aliases share the canonical point data; they are not a second model.
  initialSceneId: VR_EXPERIENCE_POINT['1.10'],
  scenes: points,
  vocabulary: Object.freeze({
    events: Object.freeze(Object.values(VR_SCENARIO_EVENT)),
    capabilities: Object.freeze(Object.values(VR_SCENARIO_CAPABILITY)),
    milestones: Object.freeze(Object.values(VR_SCENARIO_MILESTONE)),
    effects: Object.freeze(Object.values(VR_SCENARIO_EFFECT))
  }),
  metadata: Object.freeze({
    stage: 'M1_16_FIRST_CRYSTAL_DISCOVERY_HANDOFF',
    authoritativeForLiveGameplay: true,
    authoritativeScope: Object.freeze([
      'XR_CALIBRATED → BEGIN_INTRO_REVEAL',
      'INTRO_REVEAL_COMPLETE → BEGIN_POST_REVEAL_SILENCE',
      'POST_REVEAL_SILENCE_COMPLETE → BEGIN_CONTROLLER_ONBOARDING',
      'PLAYER_OPENED_GUIDE → CONTINUE_CONTROLLER_ONBOARDING',
      'PLAYER_VIEWED_CONTROLS → CONTINUE_CONTROLLER_ONBOARDING',
      'PLAYER_CLOSED_GUIDE → CONTINUE_CONTROLLER_ONBOARDING',
      'MONKEY_HOVERED → CONTINUE_CONTROLLER_ONBOARDING',
      'MONKEY_TRIGGERED → CONTINUE_CONTROLLER_ONBOARDING',
      'INTRO_INVITATION_SELECTED / choice 1 → 1.110',
      'FOLLOW_PAUSE_CHANGED → APPLY_FOLLOW_PAUSE_STATE → 1.110 / 1.110.1',
      'MONKEY_REACHED_THRESHOLD → PRESENT_THRESHOLD_CHOICE → 1.120',
      'THRESHOLD_SELECTED / choice 1 → 1.130',
      'THRESHOLD_SELECTED / choice 2 → 1.120.1',
      'THRESHOLD_SELECTED / choice 3 → 100.10',
      'PLAYER_ENTERED_RING + MONKEY_SETTLED → BEGIN_GLYPH_FREE_EXPLORE → 1.140',
      'GLYPH_HINT_TIMEOUT → SHOW_GLYPH_HINT → 1.150',
      'FIRST_CRYSTAL_DISCOVERED → REVEAL_RELIQUARY → 1.160',
      'INTRO_INVITATION_SELECTED / choice 2 → 1.100.1',
      'INTRO_INVITATION_SELECTED / choice 3 → 100.10'
    ])
  })
});
