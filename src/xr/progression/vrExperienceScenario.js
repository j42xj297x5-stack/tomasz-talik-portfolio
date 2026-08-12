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
  '1.1',
  '1.2',
  '1.3',
  '1.4',
  '1.4.1'
]);

// Compatibility export only; both names reference the same identifier set.
export const VR_EXPERIENCE_SCENE = VR_EXPERIENCE_POINT;

const points = Object.freeze([
  Object.freeze({
    id: VR_EXPERIENCE_POINT['1.1'],
    label: 'Bootstrap / oczekiwanie na kalibrację XR',
    capabilities: Object.freeze([]),
    transitions: Object.freeze([
      Object.freeze({
        event: VR_SCENARIO_EVENT.XR_CALIBRATED,
        target: VR_EXPERIENCE_POINT['1.2'],
        milestonesToAdd: Object.freeze([VR_SCENARIO_MILESTONE.XR_CALIBRATED]),
        effects: Object.freeze([VR_SCENARIO_EFFECT.BEGIN_INTRO_REVEAL])
      })
    ])
  }),
  Object.freeze({
    id: VR_EXPERIENCE_POINT['1.2'],
    label: 'Intro reveal',
    capabilities: Object.freeze([]),
    transitions: Object.freeze([
      Object.freeze({
        event: VR_SCENARIO_EVENT.INTRO_REVEAL_COMPLETE,
        target: VR_EXPERIENCE_POINT['1.3'],
        milestonesToAdd: Object.freeze([VR_SCENARIO_MILESTONE.INTRO_REVEAL_COMPLETE]),
        effects: Object.freeze([VR_SCENARIO_EFFECT.BEGIN_POST_REVEAL_SILENCE])
      })
    ])
  }),
  Object.freeze({
    id: VR_EXPERIENCE_POINT['1.3'],
    label: 'Cisza po revealu',
    capabilities: Object.freeze([]),
    transitions: Object.freeze([
      Object.freeze({
        event: VR_SCENARIO_EVENT.POST_REVEAL_SILENCE_COMPLETE,
        target: VR_EXPERIENCE_POINT['1.4'],
        milestonesToAdd: Object.freeze([VR_SCENARIO_MILESTONE.POST_REVEAL_SILENCE_COMPLETE]),
        effects: Object.freeze([VR_SCENARIO_EFFECT.BEGIN_CONTROLLER_ONBOARDING])
      })
    ])
  }),
  Object.freeze({
    id: VR_EXPERIENCE_POINT['1.4'],
    label: 'Controller onboarding',
    capabilities: Object.freeze([]),
    transitions: Object.freeze([
      Object.freeze({
        event: VR_SCENARIO_EVENT.PLAYER_OPENED_GUIDE,
        target: VR_EXPERIENCE_POINT['1.4.1'],
        milestonesToAdd: Object.freeze([]),
        effects: Object.freeze([VR_SCENARIO_EFFECT.CONTINUE_CONTROLLER_ONBOARDING])
      })
    ])
  }),
  Object.freeze({
    id: VR_EXPERIENCE_POINT['1.4.1'],
    label: 'Player Guide otwarty / dalszy controller tutorial legacy',
    capabilities: Object.freeze([]),
    transitions: Object.freeze([])
  })
]);

export const vrExperienceScenario = Object.freeze({
  id: 'experience-vr',
  initialPointId: VR_EXPERIENCE_POINT['1.1'],
  points,
  // Compatibility aliases share the canonical point data; they are not a second model.
  initialSceneId: VR_EXPERIENCE_POINT['1.1'],
  scenes: points,
  vocabulary: Object.freeze({
    events: Object.freeze(Object.values(VR_SCENARIO_EVENT)),
    capabilities: Object.freeze(Object.values(VR_SCENARIO_CAPABILITY)),
    milestones: Object.freeze(Object.values(VR_SCENARIO_MILESTONE)),
    effects: Object.freeze(Object.values(VR_SCENARIO_EFFECT))
  }),
  metadata: Object.freeze({
    stage: 'M1_4_PLAYER_GUIDE_OPEN_HANDOFF',
    authoritativeForLiveGameplay: true,
    authoritativeScope: Object.freeze([
      'XR_CALIBRATED → BEGIN_INTRO_REVEAL',
      'INTRO_REVEAL_COMPLETE → BEGIN_POST_REVEAL_SILENCE',
      'POST_REVEAL_SILENCE_COMPLETE → BEGIN_CONTROLLER_ONBOARDING',
      'PLAYER_OPENED_GUIDE → CONTINUE_CONTROLLER_ONBOARDING'
    ])
  })
});
