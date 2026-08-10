import * as THREE from '../../vendor/three.js';

export const VR_INTRO_STATE = Object.freeze({
  VOID: 'VOID', WAIT_HOVER: 'WAIT_HOVER', WAIT_TRIGGER: 'WAIT_TRIGGER', INVITATION: 'INVITATION',
  FOLLOWING: 'FOLLOWING', THRESHOLD: 'THRESHOLD', CROSSING: 'CROSSING', INSIDE_RING_READY: 'INSIDE_RING_READY',
  ENDING: 'ENDING', BYPASSED: 'BYPASSED'
});

export const VR_INTRO_COPY = Object.freeze({
  pl: {
    opening: ['Dobrze.', 'Masz ręce.', 'To już więcej, niż ma większość problemów.',
      'Najpierw sprawdźmy, czy świat cię słucha.', 'Wskaż mnie.'], trigger: 'Teraz spust.',
    seen: ['Widzisz?', 'Już nauczyłeś świat, gdzie patrzysz.'], going: 'Idziesz?',
    invitation: [{ id: 'go', label: 'IDĘ' }, { id: 'where', label: 'DOKĄD?' }, { id: 'no', label: 'NIE' }],
    where: ['Gdybym ci powiedział, poszedłbyś do odpowiedzi.', 'A ja pytam, czy pójdziesz za mną.'],
    no: ['Dobrze.', 'Nie każda droga musi być twoja.'],
    threshold: ['Dalej jest próg.', 'Możesz go nie przekraczać.', 'Jeśli przekroczysz — wrócisz dopiero wtedy, kiedy droga się skończy.', 'Wchodzisz?'],
    thresholdOptions: [{ id: 'cross', label: 'PRZEKRACZAM PRÓG' }, { id: 'beyond', label: 'CO JEST PO DRUGIEJ STRONIE?' }, { id: 'return', label: 'WRACAM' }],
    beyond: ['Po tej stronie pytasz.', 'Po tamtej będziesz sprawdzał.'],
    returning: ['Mądra decyzja.', 'Albo tchórzliwa.', 'Czasem to ta sama decyzja. Dopiero później wiadomo.'],
    inside: ['No.', 'Teraz jest łatwiej.']
  },
  en: {
    opening: ['Good.', 'You have hands.', 'That is already more than most problems have.',
      'First, let us see if the world listens to you.', 'Point at me.'], trigger: 'Now pull the trigger.',
    seen: ['See?', 'You have already taught the world where you are looking.'], going: 'Will you walk?',
    invitation: [{ id: 'go', label: "I'LL GO" }, { id: 'where', label: 'WHERE TO?' }, { id: 'no', label: 'NO' }],
    where: ['If I told you, you would walk toward the answer.', 'I am asking whether you will follow me.'],
    no: ['Good.', 'Not every road has to be yours.'],
    threshold: ['There is a threshold ahead.', 'You do not have to cross it.', 'If you cross it, you will return only when the road is over.', 'Will you enter?'],
    thresholdOptions: [{ id: 'cross', label: 'I CROSS THE THRESHOLD' }, { id: 'beyond', label: 'WHAT IS ON THE OTHER SIDE?' }, { id: 'return', label: 'I TURN BACK' }],
    beyond: ['On this side, you ask.', 'On the other, you will find out.'],
    returning: ['A wise decision.', 'Or a cowardly one.', 'Sometimes they are the same decision. You only know later.'],
    inside: ['Well.', 'Now it is easier.']
  }
});

export function createVrIntroSequence({ monkeyGuide, monkeyAnchor, playerRig, getHeadPosition = () => playerRig.position,
  glyphRing, progressFloor, platformFixturesRoot, locomotion, ringRadius, entryDirection, settings,
  onEndSession = () => {}, bypass = false }) {
  const copy = VR_INTRO_COPY[settings.locale === 'pl' ? 'pl' : 'en'];
  const canonicalMonkey = monkeyAnchor.position.clone();
  const canonicalMonkeyQuaternion = monkeyAnchor.quaternion.clone();
  const followingMonkeyQuaternion = canonicalMonkeyQuaternion.clone().multiply(
    new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI)
  );
  const direction = entryDirection.clone(); direction.y = 0;
  if (direction.lengthSq() < 1e-6) direction.set(0, 0, 1); else direction.normalize();
  let state; let queue = []; let elapsed = 0; let walkingPaused = false; let startRadius = 0; let turnElapsed = 0;
  const sectors = progressFloor.object.children.filter((child) => child.userData?.branchId);
  const captureMonkey = () => monkeyGuide.setDialogueOverride({ onMonkeyPress: () => true });
  const show = (lines, done) => { queue = [...lines]; elapsed = 0; monkeyGuide.showMessage(queue.shift() ?? ''); pendingDone = done; };
  let pendingDone = null;
  const options = (items, onSelect) => monkeyGuide.setDialogueOverride({ options: items, onSelect });
  function invitation() { state = VR_INTRO_STATE.INVITATION; monkeyGuide.showMessage(copy.going); options(copy.invitation, chooseInvitation); }
  function chooseInvitation(id) {
    if (id === 'where') { monkeyGuide.setDialogueOverride(null); show(copy.where, invitation); }
    else if (id === 'no') { state = VR_INTRO_STATE.ENDING; monkeyGuide.setDialogueOverride(null); show(copy.no, onEndSession); }
    else if (id === 'go') beginFollowing();
    return true;
  }
  function beginFollowing() { state = VR_INTRO_STATE.FOLLOWING; captureMonkey(); monkeyGuide.showMessage(''); turnElapsed = 0;
    walkingPaused = false; startRadius = Math.hypot(monkeyAnchor.position.x, monkeyAnchor.position.z); }
  function thresholdChoice() { state = VR_INTRO_STATE.THRESHOLD; show(copy.threshold, () => options(copy.thresholdOptions, chooseThreshold)); }
  function chooseThreshold(id) {
    if (id === 'beyond') { monkeyGuide.setDialogueOverride(null); show(copy.beyond, () => options(copy.thresholdOptions, chooseThreshold)); }
    else if (id === 'return') { state = VR_INTRO_STATE.ENDING; monkeyGuide.setDialogueOverride(null); show(copy.returning, onEndSession); }
    else if (id === 'cross') { state = VR_INTRO_STATE.CROSSING; captureMonkey(); monkeyGuide.showMessage(''); }
    return true;
  }
  function reset() {
    queue = []; pendingDone = null; elapsed = 0; walkingPaused = false; monkeyGuide.setDialogueOverride(null);
    monkeyAnchor.position.copy(canonicalMonkey); monkeyAnchor.quaternion.copy(canonicalMonkeyQuaternion); locomotion.reset();
    if (bypass || !settings.enabled) { state = VR_INTRO_STATE.BYPASSED; sectors.forEach((item) => { item.visible = true; });
      platformFixturesRoot.visible = true; glyphRing.visible = true; return; }
    locomotion.setWalkRadius(Infinity);
    state = VR_INTRO_STATE.VOID; sectors.forEach((item) => { item.visible = false; }); platformFixturesRoot.visible = false; glyphRing.visible = false;
    playerRig.position.x = direction.x * settings.playerStartRadius; playerRig.position.z = direction.z * settings.playerStartRadius;
    monkeyAnchor.position.x = direction.x * settings.monkeyStartRadius; monkeyAnchor.position.z = direction.z * settings.monkeyStartRadius;
    show(copy.opening, () => { state = VR_INTRO_STATE.WAIT_HOVER; monkeyGuide.setDialogueOverride({ onMonkeyHover() {
      if (state === VR_INTRO_STATE.WAIT_HOVER) { state = VR_INTRO_STATE.WAIT_TRIGGER; monkeyGuide.showMessage(copy.trigger); }
    }, onMonkeyPress() { if (state !== VR_INTRO_STATE.WAIT_TRIGGER) return true; state = VR_INTRO_STATE.VOID;
      monkeyGuide.setDialogueOverride(null); show(copy.seen, invitation); return true; } }); });
  }
  function update(delta) {
    if (queue.length || pendingDone) { elapsed += Math.max(0, delta); if (elapsed >= settings.lineDuration) { elapsed = 0;
      if (queue.length) monkeyGuide.showMessage(queue.shift()); else { const done = pendingDone; pendingDone = null; done?.(); } } }
    if (state === VR_INTRO_STATE.FOLLOWING) {
      turnElapsed += Math.max(0, delta);
      const turnProgress = Math.min(1, turnElapsed / Math.max(0.001, settings.guideTurnDuration ?? 1));
      monkeyAnchor.quaternion.slerpQuaternions(canonicalMonkeyQuaternion, followingMonkeyQuaternion, turnProgress);
      const p = playerRig.position; const distance = Math.hypot(p.x - monkeyAnchor.position.x, p.z - monkeyAnchor.position.z);
      if (!walkingPaused && distance > settings.pauseDistance) walkingPaused = true;
      else if (walkingPaused && distance < settings.resumeDistance) walkingPaused = false;
      const radius = Math.hypot(monkeyAnchor.position.x, monkeyAnchor.position.z);
      const stopRadius = ringRadius + settings.thresholdStopOutsideDistance;
      if (!walkingPaused && radius > stopRadius) { const step = Math.min(radius - stopRadius, settings.guideSpeed * Math.max(0, delta));
        monkeyAnchor.position.x -= direction.x * step; monkeyAnchor.position.z -= direction.z * step; }
      const progress = (startRadius - radius) / Math.max(0.001, startRadius - stopRadius);
      if (progress >= settings.revealProgress) glyphRing.visible = true;
      if (radius <= stopRadius + 1e-4) thresholdChoice();
    } else if (state === VR_INTRO_STATE.CROSSING || state === VR_INTRO_STATE.INSIDE_RING_READY) {
      const distanceToCanonical = monkeyAnchor.position.distanceTo(canonicalMonkey);
      if (distanceToCanonical > 1e-4) {
        const step = Math.min(distanceToCanonical, settings.guideSpeed * Math.max(0, delta));
        monkeyAnchor.position.lerp(canonicalMonkey, step / distanceToCanonical);
        if (step === distanceToCanonical) monkeyAnchor.quaternion.copy(canonicalMonkeyQuaternion);
      }
      const monkeyHasEntered = Math.hypot(monkeyAnchor.position.x, monkeyAnchor.position.z) <= ringRadius;
      const head = getHeadPosition();
      if (state === VR_INTRO_STATE.CROSSING && monkeyHasEntered && Math.hypot(head.x, head.z) <= ringRadius) {
        state = VR_INTRO_STATE.INSIDE_RING_READY; locomotion.setWalkRadius(ringRadius, { clamp: true });
        monkeyGuide.setDialogueOverride(null); show(copy.inside, null);
      }
    }
  }
  reset();
  return { update, reset, getState: () => state, isGuidePaused: () => walkingPaused, chooseInvitation, chooseThreshold };
}
