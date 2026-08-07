import * as THREE from '../../vendor/three.js';
import { experienceVrPages, resolveExperienceVrPage } from '../../content/experienceVrPages.js';
import { createVrTargetHalo } from '../createVrTargetHalo.js';
import { resolveVrPageProtoAstro } from '../protoAstro/resolveVrPageProtoAstro.js';

const COPY = Object.freeze({
  pl: Object.freeze({ progress: 'JAK MI IDZIE?', close: 'ZAMKNIJ', history: (count) => `Odkryte karty: ${count}. Wybierz znak.` }),
  en: Object.freeze({ progress: 'HOW AM I DOING?', close: 'CLOSE', history: (count) => `Discovered cards: ${count}. Select a sign.` })
});

export const VR_MONKEY_GUIDE_SCREEN = Object.freeze({ MENU: 'MENU', HISTORY: 'HISTORY', CARD: 'CARD' });
const degToRad = (degrees) => degrees * Math.PI / 180;

function roundedRect(context, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
}

function wrapText(context, text, maxWidth, maxLines) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && context.measureText(candidate).width > maxWidth) {
      lines.push(line);
      line = word;
      if (lines.length === maxLines) break;
    } else line = candidate;
  }
  if (line && lines.length < maxLines) lines.push(line);
  if (words.length && lines.length === maxLines) {
    while (context.measureText(`${lines.at(-1)}…`).width > maxWidth && lines.at(-1).includes(' ')) {
      lines[lines.length - 1] = lines.at(-1).replace(/\s+\S+$/, '');
    }
    lines[lines.length - 1] += '…';
  }
  return lines;
}

function paginateText(context, text, maxWidth, maxLines) {
  const words = String(text ?? '').split(/\s+/).filter(Boolean);
  const pages = [];
  let lines = [];
  let line = '';
  words.forEach((word) => {
    const candidate = line ? `${line} ${word}` : word;
    if (line && context.measureText(candidate).width > maxWidth) {
      lines.push(line);
      line = word;
      if (lines.length === maxLines) { pages.push(lines); lines = []; }
    } else line = candidate;
  });
  if (line) lines.push(line);
  if (lines.length) pages.push(lines);
  return pages.length ? pages : [[]];
}

function createTwoSidedCanvasPlane({ name, width, height, canvasWidth, canvasHeight }) {
  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const context = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  const group = new THREE.Group();
  group.name = name;
  const planes = [0, Math.PI].map((rotationY, index) => {
    const geometry = new THREE.PlaneGeometry(width, height);
    const material = new THREE.MeshBasicMaterial({
      map: texture, transparent: true, side: THREE.FrontSide, depthWrite: false
    });
    const plane = new THREE.Mesh(geometry, material);
    plane.name = `${name}:${index === 0 ? 'front' : 'back'}`;
    plane.rotation.y = rotationY;
    if (index) plane.position.z = -0.001;
    group.add(plane);
    return plane;
  });
  function dispose() {
    planes.forEach((plane) => { plane.geometry.dispose(); plane.material.dispose(); });
    texture.dispose();
    canvas.width = 0;
    canvas.height = 0;
  }
  return { group, planes, canvas, context, texture, dispose };
}

export function createVrMonkeyGuide({
  monkeyAnchor, controllers = [], progressionController, locale = 'en', settings = {},
  isOrdinaryRayAvailable = () => true
}) {
  const copy = COPY[locale === 'pl' ? 'pl' : 'en'];
  const root = new THREE.Group();
  root.name = 'VrMonkeyGuide';
  monkeyAnchor.add(root);

  // Capture the static model before guide meshes are attached, so its ray target never grows to include UI.
  const monkeyTargets = [];
  monkeyAnchor.traverse((object) => {
    if (object.isMesh && object.geometry && object.visible !== false) monkeyTargets.push(object);
  });
  const halo = createVrTargetHalo({ root: monkeyAnchor, settings: settings.halo });

  const attentionRoot = new THREE.Group();
  attentionRoot.name = 'VrMonkeyAttentionArcs';
  attentionRoot.position.set(settings.attention.position.x, settings.attention.position.y, settings.attention.position.z);
  root.add(attentionRoot);
  const arcMaterials = [];
  const arcs = settings.attention.radii.map((radius, index) => {
    const geometry = new THREE.TorusGeometry(radius, settings.attention.thickness, 5, 24, Math.PI);
    const material = new THREE.MeshBasicMaterial({
      color: settings.colors.accent, transparent: true, opacity: 0, depthWrite: false
    });
    const arc = new THREE.Mesh(geometry, material);
    arc.name = `VrMonkeyAttentionArc${index + 1}`;
    arc.position.y = index * settings.attention.verticalGap;
    arc.rotation.z = Math.PI;
    attentionRoot.add(arc);
    arcMaterials.push(material);
    return arc;
  });
  attentionRoot.visible = false;

  const messagePanel = createTwoSidedCanvasPlane({
    name: 'VrMonkeyMessagePanel', width: settings.message.width, height: settings.message.height,
    canvasWidth: settings.message.canvasWidth, canvasHeight: settings.message.canvasHeight
  });
  messagePanel.group.position.set(settings.message.position.x, settings.message.position.y, settings.message.position.z);
  messagePanel.group.visible = false;
  root.add(messagePanel.group);

  const dialoguePanel = createTwoSidedCanvasPlane({
    name: 'VrMonkeyDialoguePanel', width: settings.dialogue.width, height: settings.dialogue.height,
    canvasWidth: settings.dialogue.canvasWidth, canvasHeight: settings.dialogue.canvasHeight
  });
  dialoguePanel.group.position.set(settings.dialogue.position.x, settings.dialogue.position.y, settings.dialogue.position.z);
  dialoguePanel.group.rotation.set(
    degToRad(settings.dialogue.rotationDegrees.x),
    degToRad(settings.dialogue.rotationDegrees.y),
    degToRad(settings.dialogue.rotationDegrees.z)
  );
  dialoguePanel.group.visible = false;
  root.add(dialoguePanel.group);

  const raycaster = new THREE.Raycaster();
  const origin = new THREE.Vector3();
  const direction = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const hits = new Map(controllers.map((record) => [record, null]));
  let open = false;
  let attentionPending = false;
  let elapsed = 0;
  let hoveredOption = null;
  let message = '';
  let disposed = false;
  let interactiveRegions = [];
  let screen = VR_MONKEY_GUIDE_SCREEN.MENU;
  let historyPage = 0;
  let selectedPageId = null;
  let cardPage = 0;
  const pagesById = new Map(experienceVrPages.map((page) => [page.id, page]));
  const glyphImages = new Map();
  const glyphMaskCanvas = document.createElement('canvas');
  const glyphMaskContext = glyphMaskCanvas.getContext('2d');

  function progressCount() { return progressionController.getActivatedPageIds().length; }

  function drawMessage() {
    const { canvas, context, texture } = messagePanel;
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (!message) { texture.needsUpdate = true; return; }
    const selectedPage = pagesById.get(selectedPageId);
    if (screen === VR_MONKEY_GUIDE_SCREEN.CARD && selectedPage) {
      const resolved = resolveExperienceVrPage(selectedPage, locale);
      context.globalAlpha = settings.colors.panelOpacity;
      context.fillStyle = settings.colors.messagePanel ?? settings.colors.panel;
      roundedRect(context, 0, 0, canvas.width, canvas.height, settings.message.cornerRadius);
      context.fill();
      context.globalAlpha = 1;
      context.fillStyle = settings.colors.text;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.font = `${settings.message.fontWeight} ${settings.card.titleFontSize}px sans-serif`;
      context.fillText(resolved.title, canvas.width / 2, settings.message.padding);
      context.font = `${settings.card.bodyFontSize}px sans-serif`;
      const pages = paginateText(context, resolved.body, canvas.width - settings.message.padding * 2,
        settings.card.maxLinesPerPage);
      cardPage = Math.min(cardPage, pages.length - 1);
      pages[cardPage].forEach((line, index) => context.fillText(line, canvas.width / 2,
        settings.message.padding * 2 + settings.card.lineHeight * (index + 0.5)));
      texture.needsUpdate = true;
      return;
    }
    context.font = `${settings.message.fontWeight} ${settings.message.fontSize}px sans-serif`;
    const maxTextWidth = canvas.width - settings.message.padding * 2;
    const lines = wrapText(context, message, maxTextWidth, settings.message.maxLines);
    const measuredWidth = Math.max(...lines.map((line) => context.measureText(line).width), 1);
    const boxWidth = Math.min(canvas.width, measuredWidth + settings.message.padding * 2);
    const boxHeight = Math.min(canvas.height, lines.length * settings.message.lineHeight + settings.message.padding * 2);
    const x = (canvas.width - boxWidth) / 2;
    const y = canvas.height - boxHeight;
    context.globalAlpha = settings.colors.panelOpacity;
    context.fillStyle = settings.colors.messagePanel ?? settings.colors.panel;
    roundedRect(context, x, y, boxWidth, boxHeight, settings.message.cornerRadius);
    context.fill();
    context.globalAlpha = 1;
    context.fillStyle = settings.colors.text;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    lines.forEach((line, index) => context.fillText(line, canvas.width / 2,
      y + settings.message.padding + settings.message.lineHeight * (index + 0.5)));
    texture.needsUpdate = true;
  }

  function drawDialogue() {
    const { canvas, context, texture } = dialoguePanel;
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (screen === VR_MONKEY_GUIDE_SCREEN.HISTORY) { drawHistory(context, canvas); texture.needsUpdate = true; return; }
    if (screen === VR_MONKEY_GUIDE_SCREEN.CARD) { drawCardNavigation(context, canvas); texture.needsUpdate = true; return; }
    const options = progressCount() > 0
      ? [{ id: 'progress', label: copy.progress }, { id: 'close', label: copy.close }]
      : [{ id: 'close', label: copy.close }];
    const gap = settings.dialogue.gap;
    const padding = settings.dialogue.padding;
    const height = (canvas.height - padding * 2 - gap * (options.length - 1)) / options.length;
    interactiveRegions = options.map((option, index) => ({
      ...option, x: padding, y: padding + index * (height + gap), width: canvas.width - padding * 2, height
    }));
    context.font = `${settings.dialogue.fontWeight} ${settings.dialogue.fontSize}px sans-serif`;
    context.textAlign = 'left';
    context.textBaseline = 'middle';
    interactiveRegions.forEach((region) => {
      context.fillStyle = drawInteractiveRegion(context, region, hoveredOption === region.id);
      context.fillText(region.label, region.x + 48, region.y + region.height / 2);
    });
    texture.needsUpdate = true;
  }

  function addRegion(region) { interactiveRegions.push(region); return region; }
  function drawInteractiveRegion(context, region, hovered) {
    context.fillStyle = hovered ? settings.colors.dialogueButtonHoverBackground : settings.colors.dialogueButtonBackground;
    context.strokeStyle = settings.colors.dialogueButtonBorder;
    context.lineWidth = 4;
    roundedRect(context, region.x, region.y, region.width, region.height, settings.dialogue.optionCornerRadius);
    context.fill(); context.stroke();
    return hovered ? settings.colors.dialogueButtonHoverText : settings.colors.dialogueButtonText;
  }
  function drawButton(context, region, label) {
    context.fillStyle = drawInteractiveRegion(context, region, hoveredOption === region.id);
    context.font = `${settings.dialogue.fontWeight} ${settings.dialogue.fontSize}px sans-serif`;
    context.textAlign = 'center'; context.textBaseline = 'middle';
    context.fillText(label, region.x + region.width / 2, region.y + region.height / 2);
  }
  function historyEntries() {
    return progressionController.getActivatedPageIds().map((pageId) => {
      const page = pagesById.get(pageId);
      const protoAstro = resolveVrPageProtoAstro(page);
      return page && protoAstro ? { pageId, page, ...protoAstro } : null;
    }).filter(Boolean);
  }
  function requestGlyphImage(entry) {
    if (glyphImages.has(entry.assetUrl) || typeof Image === 'undefined') return glyphImages.get(entry.assetUrl);
    const image = new Image();
    glyphImages.set(entry.assetUrl, image);
    image.onload = () => { if (!disposed && screen === VR_MONKEY_GUIDE_SCREEN.HISTORY) drawDialogue(); };
    image.src = entry.assetUrl;
    return image;
  }
  function drawTintedGlyph(context, image, x, y, size, color) {
    if (glyphMaskCanvas.width !== size || glyphMaskCanvas.height !== size) {
      glyphMaskCanvas.width = size; glyphMaskCanvas.height = size;
    }
    glyphMaskContext.clearRect(0, 0, size, size);
    glyphMaskContext.drawImage(image, 0, 0, size, size);
    glyphMaskContext.globalCompositeOperation = 'source-in';
    glyphMaskContext.fillStyle = color;
    glyphMaskContext.fillRect(0, 0, size, size);
    glyphMaskContext.globalCompositeOperation = 'source-over';
    context.drawImage(glyphMaskCanvas, x, y, size, size);
  }
  function drawHistory(context, canvas) {
    interactiveRegions = [];
    const entries = historyEntries();
    const size = settings.dialogue.historyPageSize;
    const totalPages = Math.max(1, Math.ceil(entries.length / size));
    historyPage = Math.min(historyPage, totalPages - 1);
    const visible = entries.slice(historyPage * size, (historyPage + 1) * size);
    const navHeight = 100; const padding = settings.dialogue.padding; const columns = settings.dialogue.historyColumns;
    const cellWidth = (canvas.width - padding * 2) / columns;
    const rows = Math.max(1, Math.ceil(size / columns)); const cellHeight = (canvas.height - padding * 2 - navHeight) / rows;
    visible.forEach((entry, index) => {
      const column = index % columns; const row = Math.floor(index / columns);
      const region = addRegion({ id: `page:${entry.pageId}`, pageId: entry.pageId,
        x: padding + column * cellWidth + 8, y: padding + row * cellHeight + 8,
        width: cellWidth - 16, height: cellHeight - 16 });
      const contentColor = drawInteractiveRegion(context, region, hoveredOption === region.id);
      const image = requestGlyphImage(entry); const glyphSize = settings.dialogue.historyGlyphSize;
      const glyphX = region.x + 24; const glyphY = region.y + (region.height - glyphSize) / 2;
      if (image?.complete && image.naturalWidth && context.drawImage) drawTintedGlyph(context, image,
        glyphX, glyphY, glyphSize, contentColor);
      else { context.fillStyle = contentColor; context.font = `${settings.dialogue.fontWeight} ${glyphSize * 0.55}px sans-serif`;
        context.textAlign = 'left'; context.textBaseline = 'middle'; context.fillText(entry.descriptor.syllable,
          glyphX, region.y + region.height / 2); }
      context.fillStyle = contentColor;
      context.font = `${settings.dialogue.historyMarkerFontSize}px sans-serif`; context.textAlign = 'right';
      context.fillText(String(entry.page.order), region.x + region.width - 14, region.y + region.height - 18);
    });
    const back = addRegion({ id: 'back-menu', x: padding, y: canvas.height - padding - navHeight,
      width: settings.dialogue.navigationWidth, height: navHeight }); drawButton(context, back, '←');
    if (totalPages > 1 && historyPage > 0) { const previous = addRegion({ id: 'history-previous', x: canvas.width / 2 - 170,
      y: canvas.height - padding - navHeight, width: 140, height: navHeight }); drawButton(context, previous, '‹'); }
    if (totalPages > 1 && historyPage < totalPages - 1) { const next = addRegion({ id: 'history-next', x: canvas.width / 2 + 30,
      y: canvas.height - padding - navHeight, width: 140, height: navHeight }); drawButton(context, next, '›'); }
  }
  function cardPages() {
    const page = pagesById.get(selectedPageId); if (!page) return [[]];
    dialoguePanel.context.font = `${settings.card.bodyFontSize}px sans-serif`;
    return paginateText(dialoguePanel.context, resolveExperienceVrPage(page, locale).body,
      messagePanel.canvas.width - settings.message.padding * 2, settings.card.maxLinesPerPage);
  }
  function drawCardNavigation(context, canvas) {
    interactiveRegions = []; const padding = settings.dialogue.padding; const height = canvas.height - padding * 2;
    const back = addRegion({ id: 'back-history', x: padding, y: padding, width: settings.dialogue.navigationWidth, height });
    drawButton(context, back, '←'); const pages = cardPages();
    if (pages.length > 1 && cardPage > 0) { const previous = addRegion({ id: 'card-previous', x: canvas.width / 2 - 190,
      y: padding, width: 150, height }); drawButton(context, previous, '‹'); }
    if (pages.length > 1 && cardPage < pages.length - 1) { const next = addRegion({ id: 'card-next', x: canvas.width / 2 + 40,
      y: padding, width: 150, height }); drawButton(context, next, '›'); }
  }

  function showMessage(text) {
    message = String(text ?? '').trim();
    messagePanel.group.visible = Boolean(message);
    drawMessage();
  }
  function clearAttention() {
    attentionPending = false;
    attentionRoot.visible = false;
    arcMaterials.forEach((material) => { material.opacity = 0; });
  }
  function notifyAttention() {
    if (disposed) return;
    attentionPending = true;
    elapsed = 0;
    attentionRoot.visible = true;
  }
  function setOpen(nextOpen) {
    open = Boolean(settings.enabled && nextOpen);
    dialoguePanel.group.visible = open;
    hoveredOption = null;
    hits.forEach((_, record) => hits.set(record, null));
    if (open) clearAttention();
    else { screen = VR_MONKEY_GUIDE_SCREEN.MENU; selectedPageId = null; cardPage = 0; historyPage = 0; showMessage(''); }
    drawDialogue();
  }
  function close() { setOpen(false); }
  function openDialogue() { setOpen(true); }
  function activateOption(id) {
    if (id === 'progress' && progressCount() > 0) { screen = VR_MONKEY_GUIDE_SCREEN.HISTORY; historyPage = 0;
      showMessage(copy.history(progressCount())); drawDialogue(); return true; }
    if (id?.startsWith('page:')) { selectedPageId = id.slice(5); screen = VR_MONKEY_GUIDE_SCREEN.CARD; cardPage = 0;
      showMessage('card'); drawDialogue(); return true; }
    if (id === 'back-history') { screen = VR_MONKEY_GUIDE_SCREEN.HISTORY; showMessage(copy.history(progressCount())); drawDialogue(); return true; }
    if (id === 'back-menu') { screen = VR_MONKEY_GUIDE_SCREEN.MENU; showMessage(''); drawDialogue(); return true; }
    if (id === 'history-previous') { historyPage -= 1; drawDialogue(); return true; }
    if (id === 'history-next') { historyPage += 1; drawDialogue(); return true; }
    if (id === 'card-previous') { cardPage -= 1; drawMessage(); drawDialogue(); return true; }
    if (id === 'card-next') { cardPage += 1; drawMessage(); drawDialogue(); return true; }
    if (id === 'close') { close(); return true; }
    return false;
  }

  function updateHits() {
    let nextHoveredOption = null;
    let monkeyHovered = false;
    controllers.forEach((record) => {
      let hit = null;
      if (settings.enabled && isOrdinaryRayAvailable(record)) {
        record.controller.updateWorldMatrix(true, false);
        record.controller.getWorldPosition(origin);
        record.controller.getWorldQuaternion(quaternion);
        direction.set(0, 0, -1).applyQuaternion(quaternion).normalize();
        raycaster.set(origin, direction);
        raycaster.far = Math.min(record.currentRayLength ?? settings.rayMaxDistance, settings.rayMaxDistance);
        const monkeyHit = raycaster.intersectObjects(monkeyTargets, false)[0] ?? null;
        const panelHit = open ? raycaster.intersectObjects(dialoguePanel.planes, false)[0] ?? null : null;
        const nearest = [monkeyHit && { kind: 'monkey', intersection: monkeyHit },
          panelHit && { kind: 'panel', intersection: panelHit }]
          .filter(Boolean).sort((a, b) => a.intersection.distance - b.intersection.distance)[0] ?? null;
        if (nearest) {
          record.reportRayHit?.(nearest.intersection.distance);
          if (nearest.kind === 'monkey') monkeyHovered = true;
          else {
            const x = nearest.intersection.uv.x * dialoguePanel.canvas.width;
            const y = (1 - nearest.intersection.uv.y) * dialoguePanel.canvas.height;
            const region = interactiveRegions.find((candidate) => x >= candidate.x && x <= candidate.x + candidate.width
              && y >= candidate.y && y <= candidate.y + candidate.height) ?? null;
            nearest.region = region;
            if (region) nextHoveredOption = region.id;
          }
          hit = nearest;
        }
      }
      hits.set(record, hit);
    });
    halo.setVisible(monkeyHovered);
    if (hoveredOption !== nextHoveredOption) { hoveredOption = nextHoveredOption; drawDialogue(); }
  }

  function press(record) {
    const hit = hits.get(record);
    if (!hit) return false;
    if (hit.kind === 'monkey') { setOpen(!open); return true; }
    return hit.region ? activateOption(hit.region.id) : false;
  }
  const listeners = controllers.map((record) => {
    const listener = () => press(record);
    record.controller.addEventListener('selectstart', listener);
    return { record, listener };
  });

  function update(delta = 0) {
    if (disposed) return;
    elapsed += Math.max(0, delta);
    if (attentionPending) {
      const phase = (elapsed % settings.attention.cycleDuration) / settings.attention.cycleDuration * arcs.length;
      arcs.forEach((arc, index) => {
        const distance = Math.abs(phase - index);
        const wrappedDistance = Math.min(distance, arcs.length - distance);
        const pulse = Math.max(0, 1 - wrappedDistance);
        arc.material.opacity = settings.attention.opacityMin
          + (settings.attention.opacityMax - settings.attention.opacityMin) * pulse;
        const scale = 1 + settings.attention.scalePulse * pulse;
        arc.scale.setScalar(scale);
      });
    }
    updateHits();
    halo.update(delta);
  }
  function reset() {
    close();
    clearAttention();
    showMessage('');
    elapsed = 0;
    halo.setVisible(false);
  }
  function dispose() {
    if (disposed) return;
    disposed = true;
    listeners.forEach(({ record, listener }) => record.controller.removeEventListener('selectstart', listener));
    reset();
    halo.dispose();
    arcs.forEach((arc) => { arc.geometry.dispose(); arc.material.dispose(); });
    messagePanel.dispose();
    dialoguePanel.dispose();
    root.removeFromParent();
    hits.clear();
  }

  drawMessage();
  drawDialogue();
  return {
    object: root, messagePanel, dialoguePanel, attentionRoot, arcs, halo, hits,
    update, notifyAttention, showMessage, open: openDialogue, close, isOpen: () => open,
    hasCurrentHit: (record) => Boolean(hits.get(record)), reset, dispose, press,
    isAttentionPending: () => attentionPending,
    getScreen: () => screen, getHistoryEntries: historyEntries, getSelectedPageId: () => selectedPageId,
    getHistoryPage: () => historyPage, getCardPage: () => cardPage, getCardPageCount: () => cardPages().length
  };
}
