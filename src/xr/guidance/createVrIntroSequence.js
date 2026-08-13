import * as THREE from '../../vendor/three.js';

export const VR_INTRO_STATE = Object.freeze({
  XR_CALIBRATING: 'XR_CALIBRATING', FOG_REVEAL: 'FOG_REVEAL', WAIT_RUNTIME_AFTER_REVEAL: 'WAIT_RUNTIME_AFTER_REVEAL',
  POST_REVEAL_SILENCE: 'POST_REVEAL_SILENCE', WAIT_RUNTIME_AFTER_POST_REVEAL_SILENCE: 'WAIT_RUNTIME_AFTER_POST_REVEAL_SILENCE',
  CONTROLLER_ONBOARDING: 'CONTROLLER_ONBOARDING', WAIT_PLAYER_PANEL_OPEN: 'WAIT_PLAYER_PANEL_OPEN',
  WAIT_RUNTIME_AFTER_PLAYER_GUIDE_OPEN: 'WAIT_RUNTIME_AFTER_PLAYER_GUIDE_OPEN',
  WAIT_CONTROLS_VIEW: 'WAIT_CONTROLS_VIEW', WAIT_RUNTIME_AFTER_CONTROLS_VIEWED: 'WAIT_RUNTIME_AFTER_CONTROLS_VIEWED',
  WAIT_PANEL_CLOSE: 'WAIT_PANEL_CLOSE', WAIT_RUNTIME_AFTER_PLAYER_GUIDE_CLOSED: 'WAIT_RUNTIME_AFTER_PLAYER_GUIDE_CLOSED', WAIT_HOVER: 'WAIT_HOVER',
  WAIT_RUNTIME_AFTER_MONKEY_HOVERED: 'WAIT_RUNTIME_AFTER_MONKEY_HOVERED',
  WAIT_TRIGGER: 'WAIT_TRIGGER', WAIT_RUNTIME_AFTER_MONKEY_TRIGGERED: 'WAIT_RUNTIME_AFTER_MONKEY_TRIGGERED',
  INVITATION: 'INVITATION', WAIT_RUNTIME_AFTER_INVITATION_SELECTED: 'WAIT_RUNTIME_AFTER_INVITATION_SELECTED', FOLLOWING: 'FOLLOWING',
  WAIT_RUNTIME_AFTER_FOLLOW_PAUSE_CHANGED: 'WAIT_RUNTIME_AFTER_FOLLOW_PAUSE_CHANGED',
  WAIT_RUNTIME_AFTER_MONKEY_REACHED_THRESHOLD: 'WAIT_RUNTIME_AFTER_MONKEY_REACHED_THRESHOLD', THRESHOLD: 'THRESHOLD',
  WAIT_RUNTIME_AFTER_THRESHOLD_SELECTED: 'WAIT_RUNTIME_AFTER_THRESHOLD_SELECTED',
  CROSSING: 'CROSSING', ENTERING_RING: 'ENTERING_RING', MONKEY_SETTLING: 'MONKEY_SETTLING',
  GLYPH_FREE_EXPLORE: 'GLYPH_FREE_EXPLORE', RELIQUARY_REVEAL: 'RELIQUARY_REVEAL', ENDING: 'ENDING', BYPASSED: 'BYPASSED'
});

export const VR_INTRO_COPY = Object.freeze({
  pl: { opening: ['Dobrze.', 'Masz ręce.', 'Sprawdźmy tylko, gdzie co masz.'], panelPrompt: 'Naciśnij Y, żeby wejść do menu.',
    panelDone: ['Jak zapomnisz — przypomnę.', 'Najpierw sprawdźmy, czy świat cię słucha.', 'Wskaż mnie.'], trigger: 'Teraz spust.',
    seen: ['Widzisz?', 'Już nauczyłeś świat, gdzie patrzysz.'], going: 'Idziesz?',
    invitation: [{ id: 'go', label: 'IDĘ' }, { id: 'where', label: 'DOKĄD?' }, { id: 'no', label: 'NIE' }],
    where: ['Gdybym ci powiedział, poszedłbyś do odpowiedzi.', 'A ja pytam, czy pójdziesz za mną.'], no: ['Dobrze.', 'Nie każda droga musi być twoja.'],
    threshold: ['Dalej jest próg.', 'Możesz go nie przekraczać.', 'Jeśli przekroczysz — wrócisz dopiero wtedy, kiedy droga się skończy.', 'Wchodzisz?'],
    thresholdOptions: [{ id: 'cross', label: 'PRZEKRACZAM PRÓG' }, { id: 'beyond', label: 'CO JEST PO DRUGIEJ STRONIE?' }, { id: 'return', label: 'WRACAM' }],
    beyond: ['Po tej stronie pytasz.', 'Po tamtej będziesz sprawdzał.'], returning: ['Mądra decyzja.', 'Albo tchórzliwa.', 'Czasem to ta sama decyzja. Dopiero później wiadomo.'],
    glyphHint: ['Pięć znaków.', 'Nie pytaj jeszcze, co znaczą.', 'Dotknij jednego Szpilą.'], glyphDiscovered: 'O, wydaje mi się, że można tego użyć.' },
  en: { opening: ['Good.', 'You have hands.', 'Let us make sure you know where everything is.'], panelPrompt: 'Press Y to open the menu.',
    panelDone: ["If you forget — I'll remind you.", 'First, let us see if the world listens to you.', 'Point at me.'], trigger: 'Now pull the trigger.',
    seen: ['See?', 'You have already taught the world where you are looking.'], going: 'Will you walk?',
    invitation: [{ id: 'go', label: "I'LL GO" }, { id: 'where', label: 'WHERE TO?' }, { id: 'no', label: 'NO' }],
    where: ['If I told you, you would walk toward the answer.', 'I am asking whether you will follow me.'], no: ['Good.', 'Not every road has to be yours.'],
    threshold: ['There is a threshold ahead.', 'You do not have to cross it.', 'If you cross it, you will return only when the road is over.', 'Will you enter?'],
    thresholdOptions: [{ id: 'cross', label: 'I CROSS THE THRESHOLD' }, { id: 'beyond', label: 'WHAT IS ON THE OTHER SIDE?' }, { id: 'return', label: 'I TURN BACK' }],
    beyond: ['On this side, you ask.', 'On the other, you will find out.'], returning: ['A wise decision.', 'Or a cowardly one.', 'Sometimes they are the same decision. You only know later.'],
    glyphHint: ['Five signs.', 'Do not ask what they mean yet.', 'Touch one with the Spike.'], glyphDiscovered: 'Oh, I think this can be used.' }
});

export function createVrIntroSequence({ monkeyGuide, monkeyMotionRoot, monkeyVisualRoot, monkeyStoneRoot = null, playerRig,
  getHeadPosition = () => playerRig.getWorldPosition(new THREE.Vector3()), playerGuidePanel = null, fogReveal = null,
  glyphRing, progressFloor, platformFixturesRoot, locomotion, spatial, settings,
  onOpeningRaysReady = () => {}, onIntroRevealComplete = () => {}, onPostRevealSilenceComplete = () => {}, onPlayerOpenedGuide = () => {}, onPlayerViewedControls = () => {}, onPlayerClosedGuide = () => {}, onMonkeyHovered = () => {}, onMonkeyTriggered = () => {}, onInvitationSelected = () => {}, onFollowPauseChanged = () => {}, onMonkeyReachedThreshold = () => {}, onThresholdSelected = () => {}, onPlayerEnteredRing = () => {}, onMonkeySettled = () => {}, onEndSession = () => {}, onReliquaryReveal = () => {},
  onProgressionFixturesHidden = () => {}, onBypassFixturesVisible = () => {}, bypass = false }) {
  const copy = VR_INTRO_COPY[settings.locale === 'pl' ? 'pl' : 'en'];
  const canonicalPosition = new THREE.Vector3(spatial.monkeyFinal.x, spatial.monkeyFinal.y, spatial.monkeyFinal.z);
  const canonicalQuaternion = monkeyMotionRoot.quaternion.clone();
  const walkingQuaternion = canonicalQuaternion.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI));
  const center = progressFloor.object;
  const direction = new THREE.Vector3(spatial.entryDirection.x, spatial.entryDirection.y, spatial.entryDirection.z).setY(0).normalize();
  const ringRadius = spatial.ringRadius;
  center.updateWorldMatrix(true, false); const canonicalY = center.worldToLocal(monkeyMotionRoot.getWorldPosition(new THREE.Vector3())).y;
  let state, queue = [], phase = null, elapsed = 0, messageDuration = 0, done = null;
  let silenceElapsed = 0, monkeyRadius = 0, startRadius = 0, turnElapsed = 0, finalTurnElapsed = 0;
  let followCheckResolved = false, walkingPaused = false, playerEnteredRing = false, playerSafelyInside = false;
  let monkeySettled = false, glyphExploreElapsed = 0, glyphExploreResolved = false, glyphHintTriggered = false, xrCalibrated = false;
  const sectors = (progressFloor.geometryRoot ?? progressFloor.object).children.filter((child) => child.userData?.branchId);
  const pointAtRadius = (radius) => { const p = new THREE.Vector3(direction.x * radius, canonicalY, direction.z * radius); center.updateWorldMatrix(true, false); center.localToWorld(p); return monkeyMotionRoot.parent?.worldToLocal(p) ?? p; };
  const placeAtRadius = () => monkeyMotionRoot.position.copy(pointAtRadius(monkeyRadius));
  const radiusOf = (value) => { const p = value?.isObject3D ? value.getWorldPosition(new THREE.Vector3()) : value.clone(); center.updateWorldMatrix(true, false); center.worldToLocal(p); return Math.hypot(p.x, p.z); };
  const updatePlayerRingEntry = () => {
    const headRadius = radiusOf(getHeadPosition());
    if (!playerEnteredRing && headRadius <= ringRadius) { playerEnteredRing = true; locomotion.setWalkRadius(ringRadius, { clamp: false }); onPlayerEnteredRing(); }
    if (!playerSafelyInside && headRadius <= ringRadius - (settings.insideSafeMargin ?? .75)) playerSafelyInside = true;
  };
  const capture = () => monkeyGuide.setDialogueOverride({ onMonkeyPress: () => true });
  const displayNext = () => { const item = queue.shift(); if (!item) return; const metrics = monkeyGuide.showMessage(item.text) ?? {}; if (item.question) { phase = null; const callback = done; done = null; callback?.(); } else { messageDuration = settings.messageDisplayDuration * Math.max(0, metrics.lineCount ?? 1); phase = 'DISPLAY'; } };
  const show = (lines, callback, question = null) => { queue = lines.map((text) => ({ text })); if (question) queue.push({ text: question, question: true }); elapsed = 0; phase = null; done = callback; displayNext(); };
  const options = (items, onSelect) => monkeyGuide.setDialogueOverride({ options: items, onSelect });
  const invitationChoices = Object.freeze({ go: 1, where: 2, no: 3 });
  const thresholdChoices = Object.freeze({ cross: 1, beyond: 2, return: 3 });
  const invitation = () => { state = VR_INTRO_STATE.INVITATION; options(copy.invitation, selectInvitation); };
  function beginPanelTutorial() { state = VR_INTRO_STATE.CONTROLLER_ONBOARDING; monkeyGuide.setInteractionEnabled?.(true); onOpeningRaysReady(); show(copy.opening, () => { state = VR_INTRO_STATE.WAIT_PLAYER_PANEL_OPEN; monkeyGuide.showMessage(copy.panelPrompt); }); }
  function beginPointerTutorial() { state = VR_INTRO_STATE.CONTROLLER_ONBOARDING; show(copy.panelDone, () => { state = VR_INTRO_STATE.WAIT_HOVER; monkeyGuide.setDialogueOverride({ onMonkeyHover() { if (state === VR_INTRO_STATE.WAIT_HOVER) { state = VR_INTRO_STATE.WAIT_RUNTIME_AFTER_MONKEY_HOVERED; onMonkeyHovered(); } }, onMonkeyPress() { if (state !== VR_INTRO_STATE.WAIT_TRIGGER) return true; state = VR_INTRO_STATE.WAIT_RUNTIME_AFTER_MONKEY_TRIGGERED; onMonkeyTriggered(); return true; } }); }); }
  function selectInvitation(id) { const choice = invitationChoices[id]; if (state !== VR_INTRO_STATE.INVITATION || !choice) return true; state = VR_INTRO_STATE.WAIT_RUNTIME_AFTER_INVITATION_SELECTED; onInvitationSelected(choice); return true; }
  function continueInvitation(choice) {
    if (state !== VR_INTRO_STATE.WAIT_RUNTIME_AFTER_INVITATION_SELECTED || ![1, 2, 3].includes(choice)) return false;
    if (choice === 1) { state = VR_INTRO_STATE.FOLLOWING; capture(); monkeyGuide.showMessage(''); startRadius = monkeyRadius; turnElapsed = 0; }
    else if (choice === 2) { monkeyGuide.setDialogueOverride(null); show(copy.where, invitation, copy.going); }
    else { state = VR_INTRO_STATE.ENDING; monkeyGuide.setDialogueOverride(null); show(copy.no, onEndSession); }
    return true;
  }
  const thresholdChoice = () => { state = VR_INTRO_STATE.THRESHOLD; fogReveal?.setRadius(6); show(copy.threshold.slice(0, -1), () => options(copy.thresholdOptions, selectThreshold), copy.threshold.at(-1)); };
  const presentThresholdChoice = () => {
    if (state !== VR_INTRO_STATE.WAIT_RUNTIME_AFTER_MONKEY_REACHED_THRESHOLD) return false;
    thresholdChoice();
    return true;
  };
  const continueFollowPauseChanged = (paused) => {
    if (state !== VR_INTRO_STATE.WAIT_RUNTIME_AFTER_FOLLOW_PAUSE_CHANGED || typeof paused !== 'boolean' || paused === walkingPaused) return false;
    walkingPaused = paused;
    monkeyGuide.showMessage(paused ? copy.going : '');
    state = VR_INTRO_STATE.FOLLOWING;
    return true;
  };
  const beginReliquaryReveal = () => { state = VR_INTRO_STATE.RELIQUARY_REVEAL; elapsed = 0; onReliquaryReveal(3); };
  const armGlyphConversation = () => monkeyGuide.setDialogueOverride({ onMonkeyPress() {
    monkeyGuide.setDialogueOverride(null);
    if (glyphExploreResolved) show([copy.glyphDiscovered], beginReliquaryReveal);
    else show(copy.glyphHint, () => { monkeyGuide.setDialogueOverride(null); });
    return true;
  } });
  function selectThreshold(id) { const choice = thresholdChoices[id]; if (state !== VR_INTRO_STATE.THRESHOLD || !choice) return true; state = VR_INTRO_STATE.WAIT_RUNTIME_AFTER_THRESHOLD_SELECTED; onThresholdSelected(choice); return true; }
  function continueThresholdChoice(choice) {
    if (state !== VR_INTRO_STATE.WAIT_RUNTIME_AFTER_THRESHOLD_SELECTED || ![1, 2, 3].includes(choice)) return false;
    if (choice === 1) { state = VR_INTRO_STATE.CROSSING; capture(); monkeyGuide.showMessage(''); }
    else if (choice === 2) { state = VR_INTRO_STATE.THRESHOLD; monkeyGuide.setDialogueOverride(null); show(copy.beyond, () => options(copy.thresholdOptions, selectThreshold)); }
    else { state = VR_INTRO_STATE.ENDING; monkeyGuide.setDialogueOverride(null); show(copy.returning, onEndSession); }
    return true;
  }
  function beginGlyphFreeExplore() {
    if (state !== VR_INTRO_STATE.MONKEY_SETTLING) return false;
    monkeyMotionRoot.quaternion.copy(canonicalQuaternion); fogReveal?.dispose(); monkeyGuide.setDialogueOverride(null); monkeyGuide.showMessage(''); state = VR_INTRO_STATE.GLYPH_FREE_EXPLORE; glyphExploreElapsed = 0;
    return true;
  }
  function reset() {
    queue = []; phase = null; done = null; elapsed = silenceElapsed = turnElapsed = finalTurnElapsed = glyphExploreElapsed = 0;
    followCheckResolved = walkingPaused = playerEnteredRing = playerSafelyInside = monkeySettled = glyphExploreResolved = glyphHintTriggered = xrCalibrated = false;
    monkeyGuide.setDialogueOverride(null); monkeyGuide.showMessage(''); monkeyMotionRoot.position.copy(canonicalPosition); monkeyMotionRoot.quaternion.copy(canonicalQuaternion); locomotion.reset(); fogReveal?.restart();
    platformFixturesRoot.visible = true; onProgressionFixturesHidden();
    if (bypass || !settings.enabled) { state = VR_INTRO_STATE.BYPASSED; fogReveal?.skipToEnd(); monkeyGuide.setInteractionEnabled?.(true); sectors.forEach((x) => { x.visible = true; }); glyphRing.visible = true; if (monkeyStoneRoot) monkeyStoneRoot.visible = true; onBypassFixturesVisible(); return; }
    locomotion.setWalkRadius(Infinity); state = VR_INTRO_STATE.XR_CALIBRATING; sectors.forEach((x) => { x.visible = false; }); glyphRing.visible = true; if (monkeyStoneRoot) monkeyStoneRoot.visible = true; monkeyVisualRoot.visible = true; fogReveal?.setRadius(20); monkeyGuide.setInteractionEnabled?.(false);
  }
  function beginAfterXrCalibration() { xrCalibrated = true; if (state !== VR_INTRO_STATE.XR_CALIBRATING) return; monkeyRadius = spatial.monkeyStartRadius; placeAtRadius(); state = VR_INTRO_STATE.FOG_REVEAL; fogReveal?.start(); }
  function beginPostRevealSilence() { if (state !== VR_INTRO_STATE.WAIT_RUNTIME_AFTER_REVEAL) return false; silenceElapsed = 0; state = VR_INTRO_STATE.POST_REVEAL_SILENCE; return true; }
  function beginControllerOnboarding() { if (state !== VR_INTRO_STATE.WAIT_RUNTIME_AFTER_POST_REVEAL_SILENCE) return false; beginPanelTutorial(); return true; }
  function continueControllerOnboarding() {
    if (state === VR_INTRO_STATE.WAIT_RUNTIME_AFTER_PLAYER_GUIDE_OPEN) { state = VR_INTRO_STATE.WAIT_CONTROLS_VIEW; return true; }
    if (state === VR_INTRO_STATE.WAIT_RUNTIME_AFTER_CONTROLS_VIEWED) { state = VR_INTRO_STATE.WAIT_PANEL_CLOSE; return true; }
    if (state === VR_INTRO_STATE.WAIT_RUNTIME_AFTER_PLAYER_GUIDE_CLOSED) { beginPointerTutorial(); return true; }
    if (state === VR_INTRO_STATE.WAIT_RUNTIME_AFTER_MONKEY_HOVERED) { state = VR_INTRO_STATE.WAIT_TRIGGER; monkeyGuide.showMessage(copy.trigger); return true; }
    if (state === VR_INTRO_STATE.WAIT_RUNTIME_AFTER_MONKEY_TRIGGERED) { state = VR_INTRO_STATE.CONTROLLER_ONBOARDING; monkeyGuide.setDialogueOverride(null); show(copy.seen, invitation, copy.going); return true; }
    return false;
  }
  function updateMessages(delta) { if (!phase) return; elapsed += Math.max(0, delta); const duration = phase === 'DISPLAY' ? messageDuration : (queue[0]?.question ? settings.questionGapDuration : settings.messageGapDuration); if (elapsed >= duration) { elapsed = 0; if (phase === 'DISPLAY') { monkeyGuide.showMessage(''); phase = 'GAP'; } else if (queue.length) displayNext(); else { phase = null; const callback = done; done = null; callback?.(); } } }
  function moveTowardCanonical(delta) { const distance = monkeyMotionRoot.position.distanceTo(canonicalPosition); if (distance <= 1e-5) { monkeyMotionRoot.position.copy(canonicalPosition); return true; } monkeyMotionRoot.position.lerp(canonicalPosition, Math.min(1, settings.guideSpeed * Math.max(0, delta) / distance)); return false; }
  function update(delta) {
    delta = Math.max(0, delta); fogReveal?.update(delta);
    if (state === VR_INTRO_STATE.FOG_REVEAL) { if ((fogReveal?.getSnapshot().progress ?? Math.min(1, (elapsed += delta) / (settings.introRevealDuration ?? 13))) >= 1) { state = VR_INTRO_STATE.WAIT_RUNTIME_AFTER_REVEAL; onIntroRevealComplete(); } return; }
    if (state === VR_INTRO_STATE.POST_REVEAL_SILENCE) { silenceElapsed += delta; if (silenceElapsed >= (settings.postRevealSilenceDuration ?? 2)) { state = VR_INTRO_STATE.WAIT_RUNTIME_AFTER_POST_REVEAL_SILENCE; onPostRevealSilenceComplete(); } return; }
    updateMessages(delta);
    if (state === VR_INTRO_STATE.WAIT_PLAYER_PANEL_OPEN && playerGuidePanel?.isOpen()) { monkeyGuide.showMessage(''); state = VR_INTRO_STATE.WAIT_RUNTIME_AFTER_PLAYER_GUIDE_OPEN; onPlayerOpenedGuide(); }
    if (state === VR_INTRO_STATE.WAIT_CONTROLS_VIEW && playerGuidePanel?.getActiveSectionId() === 'controls' && playerGuidePanel?.getViewState() === 'DETAIL') { state = VR_INTRO_STATE.WAIT_RUNTIME_AFTER_CONTROLS_VIEWED; onPlayerViewedControls(); }
    if (state === VR_INTRO_STATE.WAIT_PANEL_CLOSE && !playerGuidePanel?.isOpen()) { state = VR_INTRO_STATE.WAIT_RUNTIME_AFTER_PLAYER_GUIDE_CLOSED; onPlayerClosedGuide(); }
    if (state === VR_INTRO_STATE.FOLLOWING) {
      turnElapsed += delta; monkeyMotionRoot.quaternion.slerpQuaternions(canonicalQuaternion, walkingQuaternion, Math.min(1, turnElapsed / (settings.guideTurnDuration ?? 1)));
      const stopRadius = ringRadius + spatial.thresholdOutsideDistance; const walked = startRadius - monkeyRadius; const head = getHeadPosition(); const monkey = monkeyMotionRoot.getWorldPosition(new THREE.Vector3()); const distance = Math.hypot(head.x - monkey.x, head.z - monkey.z);
      if (walked >= settings.followGraceDistance) {
        followCheckResolved = true;
        if (!walkingPaused && distance > settings.pauseDistance) { state = VR_INTRO_STATE.WAIT_RUNTIME_AFTER_FOLLOW_PAUSE_CHANGED; onFollowPauseChanged(true); }
        else if (walkingPaused && distance < settings.resumeDistance) { state = VR_INTRO_STATE.WAIT_RUNTIME_AFTER_FOLLOW_PAUSE_CHANGED; onFollowPauseChanged(false); }
        if (state === VR_INTRO_STATE.WAIT_RUNTIME_AFTER_FOLLOW_PAUSE_CHANGED) return;
      }
      if (!walkingPaused && monkeyRadius > stopRadius) { monkeyRadius = Math.max(stopRadius, monkeyRadius - settings.guideSpeed * delta); placeAtRadius(); }
      const followProgress = THREE.MathUtils.clamp((spatial.monkeyStartRadius - monkeyRadius) / (spatial.monkeyStartRadius - stopRadius), 0, 1);
      fogReveal?.setRadius(THREE.MathUtils.lerp(17, 6, followProgress));
      if (monkeyRadius <= stopRadius + 1e-4) {
        state = VR_INTRO_STATE.WAIT_RUNTIME_AFTER_MONKEY_REACHED_THRESHOLD;
        onMonkeyReachedThreshold();
      }
    } else if ([VR_INTRO_STATE.CROSSING, VR_INTRO_STATE.ENTERING_RING].includes(state)) {
      updatePlayerRingEntry();
      if (moveTowardCanonical(delta)) { state = VR_INTRO_STATE.MONKEY_SETTLING; finalTurnElapsed = 0; }
      const crossingRadius = radiusOf(monkeyMotionRoot);
      fogReveal?.setRadius(THREE.MathUtils.lerp(6, 0, THREE.MathUtils.clamp(1 - crossingRadius / (ringRadius + spatial.thresholdOutsideDistance), 0, 1)));
      if (state === VR_INTRO_STATE.CROSSING && radiusOf(monkeyMotionRoot) <= ringRadius) state = VR_INTRO_STATE.ENTERING_RING;
    } else if (state === VR_INTRO_STATE.MONKEY_SETTLING) {
      updatePlayerRingEntry();
      finalTurnElapsed += delta; monkeyMotionRoot.quaternion.slerpQuaternions(walkingQuaternion, canonicalQuaternion, Math.min(1, finalTurnElapsed / (settings.guideTurnDuration ?? 1)));
      if (!monkeySettled && finalTurnElapsed >= (settings.guideTurnDuration ?? 1)) { monkeySettled = true; onMonkeySettled(); }
    } else if (state === VR_INTRO_STATE.GLYPH_FREE_EXPLORE && !glyphExploreResolved && !glyphHintTriggered) { glyphExploreElapsed += delta; if (glyphExploreElapsed >= (settings.glyphFreeExploreDuration ?? 60)) { glyphHintTriggered = true; monkeyGuide.notifyAttention(); armGlyphConversation(); } }
    else if (state === VR_INTRO_STATE.RELIQUARY_REVEAL && (elapsed += delta) >= 3) state = VR_INTRO_STATE.GLYPH_FREE_EXPLORE;
  }
  reset();
  return { update, reset, beginAfterXrCalibration, beginPostRevealSilence, beginControllerOnboarding, continueControllerOnboarding, continueInvitation, continueFollowPauseChanged, presentThresholdChoice, continueThresholdChoice, beginGlyphFreeExplore, getState: () => state, isGuidePaused: () => walkingPaused,
    notifyGlyphExploreSuccess: () => { if (state !== VR_INTRO_STATE.GLYPH_FREE_EXPLORE || glyphExploreResolved) return false; glyphExploreResolved = true; monkeyGuide.notifyAttention(); armGlyphConversation(); return true; },
    getDebugSnapshot: () => { const head = getHeadPosition(); const fog = fogReveal?.getSnapshot() ?? {}; return { state, headRadius: radiusOf(head), monkeyRadius: radiusOf(monkeyMotionRoot), headToMonkeyDistance: Math.hypot(head.x - monkeyMotionRoot.getWorldPosition(new THREE.Vector3()).x, head.z - monkeyMotionRoot.getWorldPosition(new THREE.Vector3()).z), fogRadius: fog.radius, fogRevealProgress: fog.progress ?? (state === VR_INTRO_STATE.FOG_REVEAL ? 0 : 1), postRevealSilenceRemaining: state === VR_INTRO_STATE.POST_REVEAL_SILENCE ? Math.max(0, (settings.postRevealSilenceDuration ?? 2) - silenceElapsed) : 0, playerGuideOpen: playerGuidePanel?.isOpen() ?? false, playerGuideSection: playerGuidePanel?.getActiveSectionId() ?? null, followCheckResolved, walkingPaused, playerEnteredRing, playerSafelyInside, monkeySettled, glyphExploreElapsed, glyphExploreResolved, glyphHintTriggered, ringRadius, xrCalibrated, visualRoot: monkeyVisualRoot?.name ?? null }; }
  };
}
