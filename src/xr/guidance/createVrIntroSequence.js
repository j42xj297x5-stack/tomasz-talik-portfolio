import * as THREE from '../../vendor/three.js';

export const VR_INTRO_STATE = Object.freeze({
  XR_CALIBRATING: 'XR_CALIBRATING', FOG_REVEAL: 'FOG_REVEAL', POST_REVEAL_SILENCE: 'POST_REVEAL_SILENCE',
  CONTROLLER_ONBOARDING: 'CONTROLLER_ONBOARDING', WAIT_PLAYER_PANEL_OPEN: 'WAIT_PLAYER_PANEL_OPEN',
  WAIT_CONTROLS_VIEW: 'WAIT_CONTROLS_VIEW', WAIT_PANEL_CLOSE: 'WAIT_PANEL_CLOSE', WAIT_HOVER: 'WAIT_HOVER',
  WAIT_TRIGGER: 'WAIT_TRIGGER', INVITATION: 'INVITATION', FOLLOWING: 'FOLLOWING', THRESHOLD: 'THRESHOLD',
  CROSSING: 'CROSSING', ENTERING_RING: 'ENTERING_RING', MONKEY_SETTLING: 'MONKEY_SETTLING',
  GLYPH_FREE_EXPLORE: 'GLYPH_FREE_EXPLORE', ENDING: 'ENDING', BYPASSED: 'BYPASSED'
});

export const VR_INTRO_COPY = Object.freeze({
  pl: { opening: ['Dobrze.', 'Masz ręce.', 'Sprawdźmy tylko, gdzie co masz.'], panelPrompt: 'Naciśnij Y, żeby wejść do menu.',
    panelDone: ['Jak zapomnisz — przypomnę.', 'Najpierw sprawdźmy, czy świat cię słucha.', 'Wskaż mnie.'], trigger: 'Teraz spust.',
    seen: ['Widzisz?', 'Już nauczyłeś świat, gdzie patrzysz.'], going: 'Idziesz?',
    invitation: [{ id: 'go', label: 'IDĘ' }, { id: 'where', label: 'DOKĄD?' }, { id: 'no', label: 'NIE' }],
    where: ['Gdybym ci powiedział, poszedłbyś do odpowiedzi.', 'A ja pytam, czy pójdziesz za mną.'], no: ['Dobrze.', 'Nie każda droga musi być twoja.'],
    threshold: ['Dalej jest próg.', 'Możesz go nie przekraczać.', 'Jeśli przekroczysz — wrócisz dopiero wtedy, kiedy droga się skończy.', 'Wchodzisz?'],
    thresholdOptions: [{ id: 'cross', label: 'PRZEKRACZAM PRÓG' }, { id: 'beyond', label: 'CO JEST PO DRUGIEJ STRONIE?' }, { id: 'return', label: 'WRACAM' }],
    beyond: ['Po tej stronie pytasz.', 'Po tamtej będziesz sprawdzał.'], returning: ['Mądra decyzja.', 'Albo tchórzliwa.', 'Czasem to ta sama decyzja. Dopiero później wiadomo.'] },
  en: { opening: ['Good.', 'You have hands.', 'Let us make sure you know where everything is.'], panelPrompt: 'Press Y to open the menu.',
    panelDone: ["If you forget — I'll remind you.", 'First, let us see if the world listens to you.', 'Point at me.'], trigger: 'Now pull the trigger.',
    seen: ['See?', 'You have already taught the world where you are looking.'], going: 'Will you walk?',
    invitation: [{ id: 'go', label: "I'LL GO" }, { id: 'where', label: 'WHERE TO?' }, { id: 'no', label: 'NO' }],
    where: ['If I told you, you would walk toward the answer.', 'I am asking whether you will follow me.'], no: ['Good.', 'Not every road has to be yours.'],
    threshold: ['There is a threshold ahead.', 'You do not have to cross it.', 'If you cross it, you will return only when the road is over.', 'Will you enter?'],
    thresholdOptions: [{ id: 'cross', label: 'I CROSS THE THRESHOLD' }, { id: 'beyond', label: 'WHAT IS ON THE OTHER SIDE?' }, { id: 'return', label: 'I TURN BACK' }],
    beyond: ['On this side, you ask.', 'On the other, you will find out.'], returning: ['A wise decision.', 'Or a cowardly one.', 'Sometimes they are the same decision. You only know later.'] }
});

export function createVrIntroSequence({ monkeyGuide, monkeyMotionRoot, monkeyVisualRoot, monkeyStoneRoot = null, playerRig,
  getHeadPosition = () => playerRig.getWorldPosition(new THREE.Vector3()), playerGuidePanel = null, fogReveal = null,
  glyphRing, progressFloor, platformFixturesRoot, locomotion, spatial, settings,
  onOpeningRaysReady = () => {}, onEndSession = () => {}, bypass = false }) {
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
  let controlsTutorialVisited = false, followCheckResolved = false, walkingPaused = false, playerSafelyInside = false;
  let monkeySettled = false, glyphExploreElapsed = 0, glyphExploreResolved = false, glyphHintTriggered = false, xrCalibrated = false;
  const sectors = (progressFloor.geometryRoot ?? progressFloor.object).children.filter((child) => child.userData?.branchId);
  const pointAtRadius = (radius) => { const p = new THREE.Vector3(direction.x * radius, canonicalY, direction.z * radius); center.updateWorldMatrix(true, false); center.localToWorld(p); return monkeyMotionRoot.parent?.worldToLocal(p) ?? p; };
  const placeAtRadius = () => monkeyMotionRoot.position.copy(pointAtRadius(monkeyRadius));
  const radiusOf = (value) => { const p = value?.isObject3D ? value.getWorldPosition(new THREE.Vector3()) : value.clone(); center.updateWorldMatrix(true, false); center.worldToLocal(p); return Math.hypot(p.x, p.z); };
  const capture = () => monkeyGuide.setDialogueOverride({ onMonkeyPress: () => true });
  const displayNext = () => { const item = queue.shift(); if (!item) return; const metrics = monkeyGuide.showMessage(item.text) ?? {}; if (item.question) { phase = null; const callback = done; done = null; callback?.(); } else { messageDuration = settings.messageDisplayDuration * Math.max(0, metrics.lineCount ?? 1); phase = 'DISPLAY'; } };
  const show = (lines, callback, question = null) => { queue = lines.map((text) => ({ text })); if (question) queue.push({ text: question, question: true }); elapsed = 0; phase = null; done = callback; displayNext(); };
  const options = (items, onSelect) => monkeyGuide.setDialogueOverride({ options: items, onSelect });
  const invitation = () => { state = VR_INTRO_STATE.INVITATION; options(copy.invitation, chooseInvitation); };
  function beginPanelTutorial() { state = VR_INTRO_STATE.CONTROLLER_ONBOARDING; monkeyGuide.setInteractionEnabled?.(true); onOpeningRaysReady(); show(copy.opening, () => { state = VR_INTRO_STATE.WAIT_PLAYER_PANEL_OPEN; monkeyGuide.showMessage(copy.panelPrompt); }); }
  function beginPointerTutorial() { state = VR_INTRO_STATE.CONTROLLER_ONBOARDING; show(copy.panelDone, () => { state = VR_INTRO_STATE.WAIT_HOVER; monkeyGuide.setDialogueOverride({ onMonkeyHover() { if (state === VR_INTRO_STATE.WAIT_HOVER) { state = VR_INTRO_STATE.WAIT_TRIGGER; monkeyGuide.showMessage(copy.trigger); } }, onMonkeyPress() { if (state !== VR_INTRO_STATE.WAIT_TRIGGER) return true; monkeyGuide.setDialogueOverride(null); show(copy.seen, invitation, copy.going); return true; } }); }); }
  function chooseInvitation(id) { if (id === 'where') { monkeyGuide.setDialogueOverride(null); show(copy.where, invitation, copy.going); } else if (id === 'no') { state = VR_INTRO_STATE.ENDING; monkeyGuide.setDialogueOverride(null); show(copy.no, onEndSession); } else if (id === 'go') { state = VR_INTRO_STATE.FOLLOWING; capture(); monkeyGuide.showMessage(''); startRadius = monkeyRadius; turnElapsed = 0; } return true; }
  const thresholdChoice = () => { state = VR_INTRO_STATE.THRESHOLD; show(copy.threshold.slice(0, -1), () => options(copy.thresholdOptions, chooseThreshold), copy.threshold.at(-1)); };
  function chooseThreshold(id) { if (id === 'beyond') { monkeyGuide.setDialogueOverride(null); show(copy.beyond, () => options(copy.thresholdOptions, chooseThreshold)); } else if (id === 'return') { state = VR_INTRO_STATE.ENDING; monkeyGuide.setDialogueOverride(null); show(copy.returning, onEndSession); } else if (id === 'cross') { state = VR_INTRO_STATE.CROSSING; capture(); monkeyGuide.showMessage(''); } return true; }
  function reset() {
    queue = []; phase = null; done = null; elapsed = silenceElapsed = turnElapsed = finalTurnElapsed = glyphExploreElapsed = 0;
    controlsTutorialVisited = followCheckResolved = walkingPaused = playerSafelyInside = monkeySettled = glyphExploreResolved = glyphHintTriggered = xrCalibrated = false;
    monkeyGuide.setDialogueOverride(null); monkeyGuide.showMessage(''); monkeyMotionRoot.position.copy(canonicalPosition); monkeyMotionRoot.quaternion.copy(canonicalQuaternion); locomotion.reset(); fogReveal?.restart();
    if (bypass || !settings.enabled) { state = VR_INTRO_STATE.BYPASSED; fogReveal?.skipToEnd(); monkeyGuide.setInteractionEnabled?.(true); sectors.forEach((x) => { x.visible = true; }); platformFixturesRoot.visible = glyphRing.visible = true; if (monkeyStoneRoot) monkeyStoneRoot.visible = true; return; }
    locomotion.setWalkRadius(Infinity); state = VR_INTRO_STATE.XR_CALIBRATING; sectors.forEach((x) => { x.visible = false; }); platformFixturesRoot.visible = glyphRing.visible = false; if (monkeyStoneRoot) monkeyStoneRoot.visible = false; monkeyGuide.setInteractionEnabled?.(false);
  }
  function beginAfterXrCalibration() { xrCalibrated = true; if (state !== VR_INTRO_STATE.XR_CALIBRATING) return; monkeyRadius = spatial.monkeyStartRadius; placeAtRadius(); state = VR_INTRO_STATE.FOG_REVEAL; fogReveal?.start(); }
  function updateMessages(delta) { if (!phase) return; elapsed += Math.max(0, delta); const duration = phase === 'DISPLAY' ? messageDuration : (queue[0]?.question ? settings.questionGapDuration : settings.messageGapDuration); if (elapsed >= duration) { elapsed = 0; if (phase === 'DISPLAY') { monkeyGuide.showMessage(''); phase = 'GAP'; } else if (queue.length) displayNext(); else { phase = null; const callback = done; done = null; callback?.(); } } }
  function moveTowardCanonical(delta) { const distance = monkeyMotionRoot.position.distanceTo(canonicalPosition); if (distance <= 1e-5) { monkeyMotionRoot.position.copy(canonicalPosition); return true; } monkeyMotionRoot.position.lerp(canonicalPosition, Math.min(1, settings.guideSpeed * Math.max(0, delta) / distance)); return false; }
  function update(delta) {
    delta = Math.max(0, delta); fogReveal?.update(delta);
    if (state === VR_INTRO_STATE.FOG_REVEAL) { if ((fogReveal?.getSnapshot().progress ?? Math.min(1, (elapsed += delta) / (settings.introRevealDuration ?? 13))) >= 1) { state = VR_INTRO_STATE.POST_REVEAL_SILENCE; silenceElapsed = 0; } return; }
    if (state === VR_INTRO_STATE.POST_REVEAL_SILENCE) { silenceElapsed += delta; if (silenceElapsed >= (settings.postRevealSilenceDuration ?? 2)) beginPanelTutorial(); return; }
    updateMessages(delta);
    if (state === VR_INTRO_STATE.WAIT_PLAYER_PANEL_OPEN && playerGuidePanel?.isOpen()) { monkeyGuide.showMessage(''); state = VR_INTRO_STATE.WAIT_CONTROLS_VIEW; }
    if ([VR_INTRO_STATE.WAIT_CONTROLS_VIEW, VR_INTRO_STATE.WAIT_PANEL_CLOSE].includes(state)) { if (playerGuidePanel?.getActiveSectionId() === 'controls' && playerGuidePanel?.getViewState() === 'DETAIL') { controlsTutorialVisited = true; state = VR_INTRO_STATE.WAIT_PANEL_CLOSE; } if (controlsTutorialVisited && !playerGuidePanel?.isOpen()) beginPointerTutorial(); }
    if (state === VR_INTRO_STATE.FOLLOWING) {
      turnElapsed += delta; monkeyMotionRoot.quaternion.slerpQuaternions(canonicalQuaternion, walkingQuaternion, Math.min(1, turnElapsed / (settings.guideTurnDuration ?? 1)));
      const stopRadius = ringRadius + spatial.thresholdOutsideDistance; const walked = startRadius - monkeyRadius; const head = getHeadPosition(); const monkey = monkeyMotionRoot.getWorldPosition(new THREE.Vector3()); const distance = Math.hypot(head.x - monkey.x, head.z - monkey.z);
      if (walked >= settings.followGraceDistance) {
        followCheckResolved = true;
        if (!walkingPaused && distance > settings.pauseDistance) { walkingPaused = true; monkeyGuide.showMessage(copy.going); }
        else if (walkingPaused && distance < settings.resumeDistance) { walkingPaused = false; monkeyGuide.showMessage(''); }
      }
      if (!walkingPaused && monkeyRadius > stopRadius) { monkeyRadius = Math.max(stopRadius, monkeyRadius - settings.guideSpeed * delta); placeAtRadius(); }
      if ((startRadius - monkeyRadius) / Math.max(.001, startRadius - stopRadius) >= settings.revealProgress) { glyphRing.visible = true; if (monkeyStoneRoot) monkeyStoneRoot.visible = true; }
      if (monkeyRadius <= stopRadius + 1e-4) thresholdChoice();
    } else if ([VR_INTRO_STATE.CROSSING, VR_INTRO_STATE.ENTERING_RING].includes(state)) {
      if (moveTowardCanonical(delta)) { state = VR_INTRO_STATE.MONKEY_SETTLING; finalTurnElapsed = 0; }
      if (state === VR_INTRO_STATE.CROSSING && radiusOf(monkeyMotionRoot) <= ringRadius) state = VR_INTRO_STATE.ENTERING_RING;
      if (!playerSafelyInside && radiusOf(getHeadPosition()) <= ringRadius - (settings.insideSafeMargin ?? .75)) { playerSafelyInside = true; locomotion.setWalkRadius(ringRadius, { clamp: false }); }
    } else if (state === VR_INTRO_STATE.MONKEY_SETTLING) {
      finalTurnElapsed += delta; monkeyMotionRoot.quaternion.slerpQuaternions(walkingQuaternion, canonicalQuaternion, Math.min(1, finalTurnElapsed / (settings.guideTurnDuration ?? 1))); monkeySettled = finalTurnElapsed >= (settings.guideTurnDuration ?? 1);
      if (monkeySettled && playerSafelyInside) { monkeyMotionRoot.quaternion.copy(canonicalQuaternion); monkeyGuide.setDialogueOverride(null); monkeyGuide.showMessage(''); state = VR_INTRO_STATE.GLYPH_FREE_EXPLORE; glyphExploreElapsed = 0; }
    } else if (state === VR_INTRO_STATE.GLYPH_FREE_EXPLORE && !glyphExploreResolved && !glyphHintTriggered) { glyphExploreElapsed += delta; if (glyphExploreElapsed >= (settings.glyphFreeExploreDuration ?? 60)) { glyphHintTriggered = true; monkeyGuide.notifyAttention(); } }
  }
  reset();
  return { update, reset, beginAfterXrCalibration, chooseInvitation, chooseThreshold, getState: () => state, isGuidePaused: () => walkingPaused,
    notifyGlyphExploreSuccess: () => { if (state === VR_INTRO_STATE.GLYPH_FREE_EXPLORE) glyphExploreResolved = true; },
    getDebugSnapshot: () => { const head = getHeadPosition(); const fog = fogReveal?.getSnapshot() ?? {}; return { state, headRadius: radiusOf(head), monkeyRadius: radiusOf(monkeyMotionRoot), headToMonkeyDistance: Math.hypot(head.x - monkeyMotionRoot.getWorldPosition(new THREE.Vector3()).x, head.z - monkeyMotionRoot.getWorldPosition(new THREE.Vector3()).z), fogRevealProgress: fog.progress ?? (state === VR_INTRO_STATE.FOG_REVEAL ? 0 : 1), postRevealSilenceRemaining: state === VR_INTRO_STATE.POST_REVEAL_SILENCE ? Math.max(0, (settings.postRevealSilenceDuration ?? 2) - silenceElapsed) : 0, controlsTutorialVisited, playerGuideOpen: playerGuidePanel?.isOpen() ?? false, playerGuideSection: playerGuidePanel?.getActiveSectionId() ?? null, followCheckResolved, walkingPaused, playerSafelyInside, monkeySettled, glyphExploreElapsed, glyphExploreResolved, glyphHintTriggered, ringRadius, xrCalibrated, visualRoot: monkeyVisualRoot?.name ?? null }; }
  };
}
