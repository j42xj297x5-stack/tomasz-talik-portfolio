const TAU = Math.PI * 2;

// A light, authored curve model derived from the Astro Grabber's dominant silhouette:
// grip, outer cage, calibration rings and the five energy guides. It deliberately
// contains no triangulated/mesh edges, so rotation cannot expose a broken polygon grid.
export const ASTRO_ATTRACTOR_PANEL_CURVES = Object.freeze([
  { id: 'grip-left', points: [[-.18, -.92, .02], [-.34, -.72, .06], [-.31, -.42, .08], [-.23, -.20, .03]] },
  { id: 'grip-right', points: [[.18, -.92, .02], [.34, -.72, .06], [.31, -.42, .08], [.23, -.20, .03]] },
  { id: 'cage-left', points: [[-.23, -.20, .03], [-.72, -.02, .12], [-.78, .54, .02], [-.38, .78, -.02]] },
  { id: 'cage-right', points: [[.23, -.20, .03], [.72, -.02, .12], [.78, .54, .02], [.38, .78, -.02]] },
  { id: 'crown', points: [[-.38, .78, -.02], [-.18, .98, .04], [.18, .98, .04], [.38, .78, -.02]] },
  { id: 'fuel-earth', points: [[-.20, -.15, .11], [-.50, .10, .26], [-.47, .54, .18], [-.22, .70, .08]] },
  { id: 'fuel-water', points: [[.20, -.15, .11], [.50, .10, .26], [.47, .54, .18], [.22, .70, .08]] },
  { id: 'fuel-fire', points: [[-.12, -.20, -.10], [-.24, .12, -.30], [-.20, .52, -.25], [-.08, .72, -.10]] },
  { id: 'fuel-tree', points: [[.12, -.20, -.10], [.24, .12, -.30], [.20, .52, -.25], [.08, .72, -.10]] },
  { id: 'fuel-metal', points: [[0, -.18, .20], [-.08, .12, .38], [.08, .48, .38], [0, .73, .18]] }
]);

export const ASTRO_ATTRACTOR_PANEL_RINGS = Object.freeze([
  { y: .34, radius: .48, depth: .03 }, { y: .38, radius: .37, depth: .02 }, { y: .42, radius: .27, depth: 0 }
]);

function rotate([x, y, z], yaw, pitch) {
  const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
  const rx = x * cy + z * sy, rz = -x * sy + z * cy;
  return [rx, y * cp - rz * sp, y * sp + rz * cp];
}

function project(point, cx, cy, scale, yaw, pitch) {
  const [x, y, z] = rotate(point, yaw, pitch);
  const perspective = 1 / Math.max(.72, 1 + z * .16);
  return [cx + x * scale * perspective, cy - y * scale * perspective];
}

export function drawVrAstroAttractorPreview(context, { cx, cy, scale, elapsed = 0, color = '#c8ac70', bright = false }) {
  const yaw = elapsed * .34, pitch = -.16;
  context.save(); context.strokeStyle = color; context.lineCap = 'round'; context.lineJoin = 'round';
  context.globalAlpha = bright ? .98 : .74; context.lineWidth = bright ? 3.2 : 2.35;
  context.shadowColor = color; context.shadowBlur = bright ? 18 : 8;
  ASTRO_ATTRACTOR_PANEL_CURVES.forEach(({ points }) => {
    const [start, controlA, controlB, end] = points.map((point) => project(point, cx, cy, scale, yaw, pitch));
    context.beginPath(); context.moveTo(...start); context.bezierCurveTo(...controlA, ...controlB, ...end); context.stroke();
  });
  ASTRO_ATTRACTOR_PANEL_RINGS.forEach(({ y, radius, depth }) => {
    context.beginPath();
    for (let step = 0; step <= 48; step += 1) {
      const angle = step / 48 * TAU;
      const point = project([Math.cos(angle) * radius, y + Math.sin(angle) * radius * .22, depth + Math.sin(angle) * radius], cx, cy, scale, yaw, pitch);
      if (step === 0) context.moveTo(...point); else context.lineTo(...point);
    }
    context.stroke();
  });
  const core = project([0, .38, .02], cx, cy, scale, yaw, pitch);
  const gradient = context.createRadialGradient(core[0] - 5, core[1] - 7, 2, core[0], core[1], scale * .22);
  gradient.addColorStop(0, '#fff8d4'); gradient.addColorStop(.32, color); gradient.addColorStop(1, 'rgba(200,172,112,0)');
  context.globalAlpha = bright ? .92 : .72; context.fillStyle = gradient; context.beginPath(); context.arc(core[0], core[1], scale * .22, 0, TAU); context.fill();
  context.globalAlpha = .82; context.lineWidth = 1.4;
  for (let layer = 0; layer < 3; layer += 1) {
    context.beginPath(); context.arc(core[0] + (layer - 1) * 4, core[1] + layer * 3, scale * (.13 + layer * .025), layer * .7, Math.PI + layer * .9); context.stroke();
  }
  context.restore();
}
